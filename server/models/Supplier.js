const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema({
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    contactPerson: {
        type: String,
        default: ''
    },
    phone: {
        type: String,
        required: true
    },
    email: {
        type: String,
        default: ''
    },
    address: {
        street: String,
        city: String,
        state: String,
        zipCode: String,
        country: { type: String, default: 'India' }
    },
    ingredientsSupplied: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ingredient'
    }],
    paymentTerms: {
        type: String,
        enum: ['cash', 'credit_7', 'credit_15', 'credit_30', 'advance'],
        default: 'cash'
    },
    creditLimit: {
        type: Number,
        default: 0
    },
    currentCredit: {
        type: Number,
        default: 0
    },
    deliverySchedule: {
        type: String,
        default: ''
    },
    rating: {
        type: Number,
        min: 0,
        max: 5,
        default: 0
    },
    notes: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    },
    // Statistics
    totalOrders: {
        type: Number,
        default: 0
    },
    totalSpent: {
        type: Number,
        default: 0
    },
    lastOrderDate: {
        type: Date,
        default: null
    }
}, { timestamps: true });

// Method to check if credit limit is exceeded
supplierSchema.methods.canExtendCredit = function (amount) {
    if (this.paymentTerms === 'cash' || this.paymentTerms === 'advance') {
        return false;
    }
    return (this.currentCredit + amount) <= this.creditLimit;
};

// Index for faster queries
supplierSchema.index({ restaurant: 1, name: 1 });
supplierSchema.index({ restaurant: 1, isActive: 1 });

module.exports = mongoose.model('Supplier', supplierSchema);
