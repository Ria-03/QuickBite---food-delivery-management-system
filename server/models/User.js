const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    role: {
        type: String,
        enum: ['customer', 'restaurant', 'delivery', 'admin'],
        default: 'customer'
    },
    phone: {
        type: String,
        default: ''
    },
    points: {
        type: Number,
        default: 0
    },
    address: {
        street: String,
        city: String,
        zip: String
    },
    // Role specific references
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant'
    },
    favorites: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant'
    }],
    isBlocked: {
        type: Boolean,
        default: false
    },
    // OTP Authentication fields
    otp: {
        code: { type: String },
        expiresAt: { type: Date },
        createdAt: { type: Date }
    },
    otpRateLimit: {
        requestCount: { type: Number, default: 0 },
        firstRequestAt: { type: Date },
        blockedUntil: { type: Date }
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    resetPasswordToken: String,
    resetPasswordExpire: Date
});

const User = mongoose.model('User', userSchema);

module.exports = User;
