const crypto = require('crypto');
const razorpay = require('../config/razorpayConfig');
const Order = require('../models/Order');
const Payment = require('../models/Payment');

// @desc    Create Razorpay order
// @route   POST /api/payment/create-order
// @access  Private
const createRazorpayOrder = async (req, res) => {
    try {
        const { orderId } = req.body;

        // Fetch order from database to validate amount
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Verify the order belongs to the logged-in user
        if (order.customer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized access to order' });
        }

        // Check if order already has a Razorpay order ID
        if (order.razorpayOrderId) {
            return res.status(400).json({
                message: 'Payment already initiated for this order',
                razorpayOrderId: order.razorpayOrderId
            });
        }

        // Amount should be in paise (multiply by 100)
        const amountInPaise = Math.round(order.finalAmount * 100);

        // Create Razorpay order
        const razorpayOrder = await razorpay.orders.create({
            amount: amountInPaise,
            currency: 'INR',
            receipt: `order_${orderId}`,
            notes: {
                orderId: orderId.toString(),
                customerId: req.user._id.toString()
            }
        });

        // Update order with Razorpay order ID
        order.razorpayOrderId = razorpayOrder.id;
        order.paymentMethod = 'ONLINE';
        await order.save();

        // Create payment record
        await Payment.create({
            orderId: order._id,
            razorpayOrderId: razorpayOrder.id,
            amount: order.finalAmount,
            currency: 'INR',
            status: 'created',
            email: req.user.email,
            contact: req.user.phone || ''
        });

        // Return order details to frontend
        res.status(200).json({
            razorpayOrderId: razorpayOrder.id,
            amount: amountInPaise,
            currency: 'INR',
            keyId: process.env.RAZORPAY_KEY_ID,
            orderId: order._id,
            name: 'QuickBite',
            description: 'Food Order Payment',
            prefill: {
                name: req.user.name,
                email: req.user.email,
                contact: req.user.phone || ''
            }
        });

    } catch (error) {
        console.error('❌ Error creating Razorpay order:', error);
        res.status(500).json({
            message: 'Failed to create payment order',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Verify Razorpay payment
// @route   POST /api/payment/verify
// @access  Private
const verifyPayment = async (req, res) => {
    try {
        const {
            razorpayOrderId,
            razorpayPaymentId,
            razorpaySignature,
            orderId
        } = req.body;

        // Validate required fields
        if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature || !orderId) {
            return res.status(400).json({ message: 'Missing required payment details' });
        }

        // Fetch order
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Verify the order belongs to the logged-in user
        if (order.customer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized access to order' });
        }

        // Verify signature
        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
            .update(`${razorpayOrderId}|${razorpayPaymentId}`)
            .digest('hex');

        if (generatedSignature !== razorpaySignature) {
            // Invalid signature - possible fraud attempt
            console.error('⚠️ Invalid payment signature detected');

            // Update payment record
            await Payment.findOneAndUpdate(
                { razorpayOrderId },
                {
                    status: 'failed',
                    errorCode: 'SIGNATURE_MISMATCH',
                    errorDescription: 'Payment signature verification failed'
                }
            );

            return res.status(400).json({
                success: false,
                message: 'Payment verification failed. Please contact support.'
            });
        }

        // Signature is valid - update order
        order.paymentStatus = 'paid';
        order.razorpayPaymentId = razorpayPaymentId;
        order.razorpaySignature = razorpaySignature;
        await order.save();

        // Update payment record
        const payment = await Payment.findOneAndUpdate(
            { razorpayOrderId },
            {
                razorpayPaymentId,
                razorpaySignature,
                status: 'captured'
            },
            { new: true }
        );

        // Emit socket event for real-time update
        const io = req.app.get('socketio');
        if (io) {
            io.to(`restaurant_${order.restaurant}`).emit('new_order', order);
            io.to(`order_${order._id}`).emit('payment_success', order);
        }

        // Send success response
        res.status(200).json({
            success: true,
            message: 'Payment verified successfully',
            order: {
                _id: order._id,
                paymentStatus: order.paymentStatus,
                razorpayPaymentId: order.razorpayPaymentId
            }
        });

    } catch (error) {
        console.error('❌ Error verifying payment:', error);
        res.status(500).json({
            success: false,
            message: 'Payment verification failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Handle payment failure
// @route   POST /api/payment/failure
// @access  Private
const handlePaymentFailure = async (req, res) => {
    try {
        const { orderId, error } = req.body;

        if (!orderId) {
            return res.status(400).json({ message: 'Order ID is required' });
        }

        // Fetch order
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Verify the order belongs to the logged-in user
        if (order.customer.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Unauthorized access to order' });
        }

        // Update order payment status
        order.paymentStatus = 'failed';
        await order.save();

        // Update payment record if exists
        if (order.razorpayOrderId) {
            await Payment.findOneAndUpdate(
                { razorpayOrderId: order.razorpayOrderId },
                {
                    status: 'failed',
                    errorCode: error?.code || 'PAYMENT_CANCELLED',
                    errorDescription: error?.description || 'Payment was cancelled by user'
                }
            );
        }

        console.log(`⚠️ Payment failed for order ${orderId}:`, error?.description || 'User cancelled');

        res.status(200).json({
            success: false,
            message: 'Payment failed. You can retry payment or choose Cash on Delivery.'
        });

    } catch (error) {
        console.error('❌ Error handling payment failure:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process payment failure',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Get payment details
// @route   GET /api/payment/:orderId
// @access  Private
const getPaymentDetails = async (req, res) => {
    try {
        const { orderId } = req.params;

        const payment = await Payment.findOne({ orderId }).populate('orderId', 'finalAmount paymentStatus');

        if (!payment) {
            return res.status(404).json({ message: 'Payment details not found' });
        }

        res.status(200).json(payment);

    } catch (error) {
        console.error('❌ Error fetching payment details:', error);
        res.status(500).json({
            message: 'Failed to fetch payment details',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    createRazorpayOrder,
    verifyPayment,
    handlePaymentFailure,
    getPaymentDetails
};
