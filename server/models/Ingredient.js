const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
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
    unit: {
        type: String,
        required: true,
        enum: ['kg', 'g', 'l', 'ml', 'pcs', 'dozen', 'pack'],
        default: 'kg'
    },
    currentStock: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    minStock: {
        type: Number,
        required: true,
        default: 10,
        min: 0
    },
    maxStock: {
        type: Number,
        required: true,
        default: 100,
        min: 0
    },
    costPerUnit: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    },
    supplier: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Supplier',
        default: null
    },
    category: {
        type: String,
        enum: ['Vegetables', 'Fruits', 'Dairy', 'Meat', 'Seafood', 'Grains', 'Spices', 'Oils', 'Beverages', 'Other'],
        default: 'Other'
    },
    description: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastRestocked: {
        type: Date,
        default: null
    }
}, { timestamps: true });

// Method to check if stock is low
ingredientSchema.methods.isLowStock = function () {
    return this.currentStock <= this.minStock;
};

// Method to add stock
ingredientSchema.methods.addStock = function (quantity) {
    this.currentStock += quantity;
    this.lastRestocked = new Date();
    return this.save();
};

// Method to deduct stock
ingredientSchema.methods.deductStock = function (quantity) {
    if (this.currentStock < quantity) {
        throw new Error(`Insufficient stock for ${this.name}. Available: ${this.currentStock} ${this.unit}, Required: ${quantity} ${this.unit}`);
    }
    this.currentStock -= quantity;
    return this.save();
};

// Virtual for stock status
ingredientSchema.virtual('stockStatus').get(function () {
    if (this.currentStock === 0) return 'out_of_stock';
    if (this.currentStock <= this.minStock) return 'low_stock';
    if (this.currentStock >= this.maxStock) return 'overstocked';
    return 'in_stock';
});

// Ensure virtuals are included in JSON
ingredientSchema.set('toJSON', { virtuals: true });
ingredientSchema.set('toObject', { virtuals: true });

// Index for faster queries
ingredientSchema.index({ restaurant: 1, name: 1 });
ingredientSchema.index({ restaurant: 1, currentStock: 1 });

module.exports = mongoose.model('Ingredient', ingredientSchema);
