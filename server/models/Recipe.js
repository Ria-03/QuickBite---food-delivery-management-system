const mongoose = require('mongoose');

const recipeSchema = new mongoose.Schema({
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    menuItem: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MenuItem',
        required: true
    },
    menuItemName: {
        type: String,
        required: true
    },
    ingredients: [{
        ingredient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Ingredient',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 0
        },
        unit: {
            type: String,
            required: true
        }
    }],
    preparationTime: {
        type: Number, // in minutes
        default: 15
    },
    servingSize: {
        type: Number,
        default: 1
    },
    instructions: {
        type: String,
        default: ''
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Method to calculate total ingredient cost
recipeSchema.methods.calculateCost = async function () {
    await this.populate('ingredients.ingredient');

    let totalCost = 0;
    for (const item of this.ingredients) {
        if (item.ingredient && item.ingredient.costPerUnit) {
            totalCost += item.ingredient.costPerUnit * item.quantity;
        }
    }

    return totalCost;
};

// Method to check if all ingredients are available
recipeSchema.methods.checkAvailability = async function (servings = 1) {
    await this.populate('ingredients.ingredient');

    const unavailableIngredients = [];
    const lowStockIngredients = [];

    for (const item of this.ingredients) {
        if (!item.ingredient) continue;

        const requiredQuantity = item.quantity * servings;

        if (item.ingredient.currentStock < requiredQuantity) {
            unavailableIngredients.push({
                name: item.ingredient.name,
                required: requiredQuantity,
                available: item.ingredient.currentStock,
                unit: item.unit
            });
        } else if (item.ingredient.currentStock - requiredQuantity <= item.ingredient.minStock) {
            lowStockIngredients.push({
                name: item.ingredient.name,
                remaining: item.ingredient.currentStock - requiredQuantity,
                minStock: item.ingredient.minStock,
                unit: item.unit
            });
        }
    }

    return {
        available: unavailableIngredients.length === 0,
        unavailableIngredients,
        lowStockIngredients
    };
};

// Method to deduct ingredients for this recipe
recipeSchema.methods.deductIngredients = async function (servings = 1) {
    await this.populate('ingredients.ingredient');

    const Ingredient = mongoose.model('Ingredient');
    const StockTransaction = mongoose.model('StockTransaction');

    const deductions = [];

    for (const item of this.ingredients) {
        if (!item.ingredient) continue;

        const requiredQuantity = item.quantity * servings;

        // Deduct stock
        await Ingredient.findByIdAndUpdate(
            item.ingredient._id,
            { $inc: { currentStock: -requiredQuantity } }
        );

        // Create transaction record
        await StockTransaction.create({
            ingredient: item.ingredient._id,
            restaurant: this.restaurant,
            type: 'usage',
            quantity: requiredQuantity,
            reason: `Used in ${this.menuItemName}`,
            performedBy: null // System action
        });

        deductions.push({
            ingredient: item.ingredient.name,
            quantity: requiredQuantity,
            unit: item.unit
        });
    }

    return deductions;
};

// Index for faster queries
recipeSchema.index({ restaurant: 1, menuItem: 1 }, { unique: true });
recipeSchema.index({ restaurant: 1, isActive: 1 });

module.exports = mongoose.model('Recipe', recipeSchema);
