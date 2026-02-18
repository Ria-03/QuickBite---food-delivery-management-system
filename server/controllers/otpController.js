const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendOtpEmail } = require('../utils/emailService');

// Generate JWT token
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: '7d'
    });
};

// Generate 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// @desc    Send OTP to user's email
// @route   POST /api/otp/send
// @access  Public
const sendOtp = async (req, res) => {
    try {
        const { email } = req.body;

        // Validate email
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(404).json({ message: 'User not found with this email' });
        }

        const now = new Date();

        // Check if user is currently blocked
        if (user.otpRateLimit?.blockedUntil) {
            if (user.otpRateLimit.blockedUntil > now) {
                // User is still blocked
                const blockedUntilTime = user.otpRateLimit.blockedUntil.toLocaleString('en-IN', {
                    timeZone: 'Asia/Kolkata',
                    dateStyle: 'medium',
                    timeStyle: 'short'
                });
                return res.status(429).json({
                    message: `You are temporarily blocked due to excessive OTP requests. Please try again at ${blockedUntilTime}.`
                });
            } else {
                // Block period has expired - auto-unblock
                user.otpRateLimit.blockedUntil = null;
                user.otpRateLimit.requestCount = 0;
                user.otpRateLimit.firstRequestAt = null;
            }
        }

        // Check if 24-hour window has expired
        if (user.otpRateLimit?.firstRequestAt) {
            const hoursSinceFirstRequest = (now - user.otpRateLimit.firstRequestAt) / (1000 * 60 * 60);

            if (hoursSinceFirstRequest >= 24) {
                // Reset counter - new 24-hour window
                user.otpRateLimit.requestCount = 0;
                user.otpRateLimit.firstRequestAt = now;
            }
        } else {
            // First OTP request - initialize window
            user.otpRateLimit = {
                requestCount: 0,
                firstRequestAt: now,
                blockedUntil: null
            };
        }

        // Check rate limit
        if (user.otpRateLimit.requestCount >= 10) {
            // Block user for 24 hours
            const blockedUntil = new Date(now.getTime() + 24 * 60 * 60 * 1000);
            user.otpRateLimit.blockedUntil = blockedUntil;
            await user.save();

            const blockedUntilTime = blockedUntil.toLocaleString('en-IN', {
                timeZone: 'Asia/Kolkata',
                dateStyle: 'medium',
                timeStyle: 'short'
            });

            return res.status(429).json({
                message: `Too many OTP requests. You are blocked until ${blockedUntilTime}.`
            });
        }

        // Generate OTP
        const otp = generateOTP();

        // Hash OTP before storing
        const salt = await bcrypt.genSalt(10);
        const hashedOtp = await bcrypt.hash(otp, salt);

        // Set OTP expiration (5 minutes from now)
        const expiresAt = new Date(now.getTime() + 5 * 60 * 1000);

        // Update user with OTP data
        user.otp = {
            code: hashedOtp,
            expiresAt: expiresAt,
            createdAt: now
        };

        // Increment request count
        user.otpRateLimit.requestCount += 1;

        await user.save();

        // Send OTP via email
        const emailSent = await sendOtpEmail(email, otp, user.name);

        if (!emailSent) {
            return res.status(500).json({ message: 'Failed to send OTP email. Please try again.' });
        }

        res.status(200).json({
            message: 'OTP sent successfully to your email',
            expiresIn: '5 minutes',
            remainingAttempts: 10 - user.otpRateLimit.requestCount
        });

    } catch (error) {
        console.error('Send OTP Error:', error);
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
};

// @desc    Verify OTP and authenticate user
// @route   POST /api/otp/verify
// @access  Public
const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;

        // Validate input
        if (!email || !otp) {
            return res.status(400).json({ message: 'Email and OTP code are required' });
        }

        // Validate OTP format (6 digits)
        if (!/^\d{6}$/.test(otp)) {
            return res.status(400).json({ message: 'Invalid OTP format. OTP must be 6 digits.' });
        }

        // Find user by email
        const user = await User.findOne({ email: email.toLowerCase() });

        if (!user) {
            return res.status(404).json({ message: 'User not found with this email' });
        }

        // Check if OTP exists
        if (!user.otp || !user.otp.code) {
            return res.status(401).json({ message: 'No OTP found. Please request a new OTP.' });
        }

        // Check if OTP has expired
        const now = new Date();
        if (user.otp.expiresAt < now) {
            // Clear expired OTP
            user.otp = {
                code: null,
                expiresAt: null,
                createdAt: null
            };
            await user.save();

            return res.status(401).json({ message: 'OTP has expired. Please request a new one.' });
        }

        // Verify OTP
        const isValidOtp = await bcrypt.compare(otp, user.otp.code);

        if (!isValidOtp) {
            return res.status(401).json({ message: 'Invalid OTP code' });
        }

        // OTP verified successfully - clear OTP data
        user.otp = {
            code: null,
            expiresAt: null,
            createdAt: null
        };
        await user.save();

        // Fetch restaurant ID if user is a restaurant owner
        let restaurantId = user.restaurantId;
        if (user.role === 'restaurant') {
            const Restaurant = require('../models/Restaurant');
            const restaurant = await Restaurant.findOne({ owner: user._id });
            if (restaurant) {
                restaurantId = restaurant._id;
            }
        }

        // Generate JWT token
        const token = generateToken(user._id, user.role);

        res.status(200).json({
            message: 'OTP verified successfully',
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                restaurantId: restaurantId
            },
            token: token
        });

    } catch (error) {
        console.error('Verify OTP Error:', error);
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
};

module.exports = {
    sendOtp,
    verifyOtp
};
