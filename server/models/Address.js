const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    label: {
        type: String,
        enum: ['Home', 'Work', 'Other'],
        default: 'Home'
    },
    addressLine1: {
        type: String,
        required: [true, 'Address line 1 is required'],
        trim: true
    },
    addressLine2: {
        type: String,
        trim: true
    },
    city: {
        type: String,
        required: [true, 'City is required'],
        trim: true
    },
    state: {
        type: String,
        required: [true, 'State is required'],
        trim: true
    },
    zipCode: {
        type: String,
        required: [true, 'Zip code is required'],
        match: [/^\d{6}$/, 'Please enter a valid 6-digit zip code']
    },
    country: {
        type: String,
        default: 'India',
        trim: true
    },
    landmark: {
        type: String,
        trim: true
    },
    phoneNumber: {
        type: String,
        required: [true, 'Phone number is required'],
        match: [/^\d{10}$/, 'Please enter a valid 10-digit phone number']
    },
    isDefault: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Index for faster queries
addressSchema.index({ user: 1, isDefault: 1 });

// Ensure only one default address per user
addressSchema.pre('save', async function () {
    if (this.isDefault) {
        // Unset other default addresses for this user
        await this.constructor.updateMany(
            { user: this.user, _id: { $ne: this._id } },
            { isDefault: false }
        );
    }
});

const Address = mongoose.model('Address', addressSchema);

module.exports = Address;
