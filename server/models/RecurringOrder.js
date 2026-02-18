const mongoose = require('mongoose');

const recurringOrderSchema = new mongoose.Schema({
    user: {
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
            required: true
        },
        name: {
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        price: {
            type: Number,
            required: true
        }
    }],
    deliveryAddressId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Address',
        required: true
    },

    // Scheduling Configuration
    frequency: {
        type: String,
        enum: ['daily', 'weekly', 'biweekly', 'monthly'],
        required: true
    },
    dayOfWeek: {
        type: Number,
        min: 0,
        max: 6,
        // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        // Required for weekly/biweekly
        default: null
    },
    deliveryTime: {
        type: String,
        required: true,
        // Format: "HH:MM" (24-hour format)
        match: /^([01]\d|2[0-3]):([0-5]\d)$/
    },

    // Date Range
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        default: null // null means no end date (ongoing)
    },
    nextDelivery: {
        type: Date,
        required: true
    },

    // Status
    status: {
        type: String,
        enum: ['active', 'paused', 'cancelled', 'completed'],
        default: 'active'
    },

    // Payment
    paymentMethod: {
        type: String,
        enum: ['COD', 'ONLINE'],
        required: true
    },

    // Order Amounts
    totalAmount: {
        type: Number,
        required: true
    },
    discount: {
        type: Number,
        default: 0
    },
    deliveryFee: {
        type: Number,
        default: 40
    },
    finalAmount: {
        type: Number,
        required: true
    },

    // Statistics
    totalOrders: {
        type: Number,
        default: 0
    },
    completedOrders: {
        type: Number,
        default: 0
    },
    lastOrderDate: {
        type: Date,
        default: null
    }
}, { timestamps: true });

// Index for efficient queries
recurringOrderSchema.index({ user: 1, status: 1 });
recurringOrderSchema.index({ nextDelivery: 1, status: 1 });

// Method to calculate next delivery date
recurringOrderSchema.methods.calculateNextDelivery = function () {
    const moment = require('moment-timezone');
    const current = moment(this.nextDelivery || this.startDate);

    switch (this.frequency) {
        case 'daily':
            return current.add(1, 'days').toDate();
        case 'weekly':
            return current.add(1, 'weeks').toDate();
        case 'biweekly':
            return current.add(2, 'weeks').toDate();
        case 'monthly':
            return current.add(1, 'months').toDate();
        default:
            return current.toDate();
    }
};

// Method to check if recurring order should be processed
recurringOrderSchema.methods.shouldProcess = function () {
    const moment = require('moment-timezone');
    const now = moment();
    const scheduled = moment(this.nextDelivery);

    // Check if status is active
    if (this.status !== 'active') return false;

    // Check if end date has passed
    if (this.endDate && moment(this.endDate).isBefore(now)) {
        return false;
    }

    // Check if it's time to process (within 15-minute window)
    return scheduled.isSameOrBefore(now) && scheduled.isAfter(now.subtract(15, 'minutes'));
};

const RecurringOrder = mongoose.model('RecurringOrder', recurringOrderSchema);

module.exports = RecurringOrder;
