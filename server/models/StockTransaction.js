const mongoose = require('mongoose');

const stockTransactionSchema = new mongoose.Schema({
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    ingredient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Ingredient',
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['purchase', 'usage', 'wastage', 'adjustment', 'return'],
        default: 'purchase'
    },
    quantity: {
        type: Number,
        required: true
    },
    unit: {
        type: String,
        required: true
    },
    costPerUnit: {
        type: Number,
        default: 0
    },
    totalCost: {
        type: Number,
        default: 0
    },
    reason: {
        type: String,
        default: ''
    },
    notes: {
        type: String,
        default: ''
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
        default: null
    },
    invoiceNumber: {
        type: String,
        default: ''
    },
    // Stock levels at time of transaction
    stockBefore: {
        type: Number,
        default: 0
    },
    stockAfter: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Pre-save hook to calculate total cost
stockTransactionSchema.pre('save', function (next) {
    if (this.costPerUnit && this.quantity) {
        this.totalCost = this.costPerUnit * Math.abs(this.quantity);
    }
    next();
});

// Index for faster queries
stockTransactionSchema.index({ restaurant: 1, createdAt: -1 });
stockTransactionSchema.index({ ingredient: 1, createdAt: -1 });
stockTransactionSchema.index({ restaurant: 1, type: 1 });

module.exports = mongoose.model('StockTransaction', stockTransactionSchema);
