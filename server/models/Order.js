const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    items: [{
        menuItem: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'MenuItem',
            required: true
        },
        name: String,
        price: Number,
        quantity: {
            type: Number,
            required: true,
            default: 1
        }
    }],
    totalAmount: {
        type: Number,
        required: true
    },
    discount: {
        type: Number,
        default: 0
    },
    finalAmount: {
        type: Number,
        required: true
    },
    couponApplied: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon'
    },
    status: {
        type: String,
        enum: ['placed', 'accepted', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled'],
        default: 'placed'
    },
    deliveryPartner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    deliveryAddressId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address',
        default: null
    },
    deliveryAddress: {
        street: String,
        city: String,
        state: String,
        zip: String,
        country: String
    },
    paymentMethod: {
        type: String,
        enum: ['COD', 'ONLINE'],
        default: 'COD'
    },
    paymentStatus: {
        type: String,
        enum: ['pending', 'paid', 'failed', 'refunded'],
        default: 'pending'
    },
    razorpayOrderId: {
        type: String,
        default: null
    },
    razorpayPaymentId: {
        type: String,
        default: null
    },
    razorpaySignature: {
        type: String,
        default: null
    },
    // Scheduling fields
    orderType: {
        type: String,
        enum: ['immediate', 'scheduled', 'recurring'],
        default: 'immediate'
    },
    scheduledFor: {
        type: Date,
        default: null
    },
    recurringOrderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'RecurringOrder',
        default: null
    },
    isScheduled: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
