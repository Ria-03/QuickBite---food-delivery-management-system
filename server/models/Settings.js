const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
    // Role Permissions
    rolePermissions: {
        customer: {
            canPlaceOrders: { type: Boolean, default: true },
            canReviewRestaurants: { type: Boolean, default: true },
            canUseCoupons: { type: Boolean, default: true }
        },
        restaurant: {
            canManageMenu: { type: Boolean, default: true },
            canViewOrders: { type: Boolean, default: true },
            canUpdateStatus: { type: Boolean, default: true }
        },
        delivery: {
            canAcceptOrders: { type: Boolean, default: true },
            canUpdateLocation: { type: Boolean, default: true },
            canViewEarnings: { type: Boolean, default: true }
        }
    },

    // Commission Settings
    commission: {
        restaurantCommission: { type: Number, default: 15, min: 0, max: 100 }, // percentage
        deliveryCommission: { type: Number, default: 10, min: 0, max: 100 }, // percentage
        platformFee: { type: Number, default: 5, min: 0 }, // flat fee
        minimumOrderValue: { type: Number, default: 100, min: 0 }
    },

    // Payment Configuration
    payment: {
        enableCOD: { type: Boolean, default: true },
        enableOnlinePayment: { type: Boolean, default: true },
        paymentGateway: { type: String, default: 'razorpay', enum: ['stripe', 'razorpay', 'paypal'] },
        autoRefund: { type: Boolean, default: true },
        refundProcessingDays: { type: Number, default: 7, min: 1 }
    },

    // System Preferences
    system: {
        maintenanceMode: { type: Boolean, default: false },
        allowNewRegistrations: { type: Boolean, default: true },
        requireEmailVerification: { type: Boolean, default: true },
        maxDeliveryRadius: { type: Number, default: 10, min: 1 }, // km
        orderAutoCancel: { type: Number, default: 30, min: 5 }, // minutes
        supportEmail: { type: String, default: 'support@quickbite.com' },
        supportPhone: { type: String, default: '+91-1234567890' }
    }
}, { timestamps: true });

// Ensure only one settings document exists (singleton pattern)
settingsSchema.statics.getSettings = async function () {
    let settings = await this.findOne();
    if (!settings) {
        settings = await this.create({});
    }
    return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);
