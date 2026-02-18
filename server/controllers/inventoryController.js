const Ingredient = require('../models/Ingredient');
const Recipe = require('../models/Recipe');
const StockTransaction = require('../models/StockTransaction');
const Supplier = require('../models/Supplier');
const Restaurant = require('../models/Restaurant');

// ==================== INGREDIENT ENDPOINTS ====================

// @desc    Get all ingredients for restaurant
// @route   GET /api/inventory/ingredients
// @access  Private (Restaurant)
const getIngredients = async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ owner: req.user._id });
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        const { category, lowStock, search } = req.query;
        let query = { restaurant: restaurant._id, isActive: true };

        if (category && category !== 'All') {
            query.category = category;
        }

        let ingredients = await Ingredient.find(query)
            .populate('supplier', 'name phone')
            .sort({ name: 1 });

        // Filter by low stock
        if (lowStock === 'true') {
            ingredients = ingredients.filter(ing => ing.isLowStock());
        }

        // Search filter
        if (search) {
            ingredients = ingredients.filter(ing =>
                ing.name.toLowerCase().includes(search.toLowerCase())
            );
        }

        res.json({ ingredients });
    } catch (error) {
        console.error('Error fetching ingredients:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get single ingredient
// @route   GET /api/inventory/ingredients/:id
// @access  Private (Restaurant)
const getIngredient = async (req, res) => {
    try {
        const ingredient = await Ingredient.findById(req.params.id)
            .populate('supplier', 'name phone email');

        if (!ingredient) {
            return res.status(404).json({ message: 'Ingredient not found' });
        }

        // Get recent transactions
        const transactions = await StockTransaction.find({ ingredient: ingredient._id })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('performedBy', 'name');

        res.json({ ingredient, transactions });
    } catch (error) {
        console.error('Error fetching ingredient:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Add new ingredient
// @route   POST /api/inventory/ingredients
// @access  Private (Restaurant)
const addIngredient = async (req, res) => {
    try {
        console.log('Adding ingredient. User:', req.user._id);
        const restaurant = await Restaurant.findOne({ owner: req.user._id });

        if (!restaurant) {
            console.log('Restaurant not found for user:', req.user._id);
            return res.status(404).json({ message: 'Restaurant not found. Please complete restaurant onboarding first.' });
        }

        console.log('Found restaurant:', restaurant._id);

        const { name, unit, currentStock, minStock, maxStock, costPerUnit, supplier, category, description } = req.body;

        // Check if ingredient already exists
        const existingIngredient = await Ingredient.findOne({
            restaurant: restaurant._id,
            name: { $regex: new RegExp(`^${name}$`, 'i') }
        });

        if (existingIngredient) {
            return res.status(400).json({ message: 'Ingredient already exists' });
        }

        const ingredientData = {
            restaurant: restaurant._id,
            name,
            unit,
            currentStock: currentStock || 0,
            minStock: minStock || 10,
            maxStock: maxStock || 100,
            costPerUnit: costPerUnit || 0,
            supplier: supplier || null,
            category: category || 'Other',
            description: description || '',
            lastRestocked: currentStock > 0 ? new Date() : null
        };

        console.log('Creating ingredient with data:', ingredientData);

        const ingredient = await Ingredient.create(ingredientData);

        // Create initial stock transaction if stock > 0
        if (currentStock > 0) {
            console.log('Creating initial stock transaction');
            await StockTransaction.create({
                restaurant: restaurant._id,
                ingredient: ingredient._id,
                type: 'purchase',
                quantity: currentStock,
                unit,
                costPerUnit: costPerUnit || 0,
                reason: 'Initial stock',
                performedBy: req.user._id,
                stockBefore: 0,
                stockAfter: currentStock
            });
        }

        res.status(201).json({ ingredient, message: 'Ingredient added successfully' });
    } catch (error) {
        console.error('Error adding ingredient:', error);
        res.status(500).json({ message: 'Server error: ' + error.message });
    }
};

// @desc    Update ingredient
// @route   PUT /api/inventory/ingredients/:id
// @access  Private (Restaurant)
const updateIngredient = async (req, res) => {
    try {
        const ingredient = await Ingredient.findById(req.params.id);
        if (!ingredient) {
            return res.status(404).json({ message: 'Ingredient not found' });
        }

        const { name, unit, minStock, maxStock, costPerUnit, supplier, category, description } = req.body;

        if (name) ingredient.name = name;
        if (unit) ingredient.unit = unit;
        if (minStock !== undefined) ingredient.minStock = minStock;
        if (maxStock !== undefined) ingredient.maxStock = maxStock;
        if (costPerUnit !== undefined) ingredient.costPerUnit = costPerUnit;
        if (supplier !== undefined) ingredient.supplier = supplier;
        if (category) ingredient.category = category;
        if (description !== undefined) ingredient.description = description;

        await ingredient.save();

        res.json({ ingredient, message: 'Ingredient updated successfully' });
    } catch (error) {
        console.error('Error updating ingredient:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete ingredient
// @route   DELETE /api/inventory/ingredients/:id
// @access  Private (Restaurant)
const deleteIngredient = async (req, res) => {
    try {
        const ingredient = await Ingredient.findById(req.params.id);
        if (!ingredient) {
            return res.status(404).json({ message: 'Ingredient not found' });
        }

        // Check if ingredient is used in any recipes
        const recipesUsingIngredient = await Recipe.find({
            'ingredients.ingredient': ingredient._id
        });

        if (recipesUsingIngredient.length > 0) {
            return res.status(400).json({
                message: 'Cannot delete ingredient. It is used in recipes.',
                recipes: recipesUsingIngredient.map(r => r.menuItemName)
            });
        }

        // Soft delete
        ingredient.isActive = false;
        await ingredient.save();

        res.json({ message: 'Ingredient deleted successfully' });
    } catch (error) {
        console.error('Error deleting ingredient:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Adjust stock (add or deduct)
// @route   POST /api/inventory/ingredients/:id/stock
// @access  Private (Restaurant)
const adjustStock = async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ owner: req.user._id });
        const ingredient = await Ingredient.findById(req.params.id);

        if (!ingredient) {
            return res.status(404).json({ message: 'Ingredient not found' });
        }

        const { type, quantity, reason, notes, supplier, invoiceNumber, costPerUnit } = req.body;

        if (!type || !quantity) {
            return res.status(400).json({ message: 'Type and quantity are required' });
        }

        const stockBefore = ingredient.currentStock;
        let stockAfter = stockBefore;

        // Adjust stock based on type
        if (type === 'purchase' || type === 'adjustment') {
            stockAfter = stockBefore + quantity;
            ingredient.currentStock += quantity;
            ingredient.lastRestocked = new Date();
        } else if (type === 'wastage' || type === 'usage' || type === 'return') {
            if (stockBefore < quantity) {
                return res.status(400).json({ message: 'Insufficient stock' });
            }
            stockAfter = stockBefore - quantity;
            ingredient.currentStock -= quantity;
        }

        await ingredient.save();

        // Create transaction record
        const transaction = await StockTransaction.create({
            restaurant: restaurant._id,
            ingredient: ingredient._id,
            type,
            quantity: type === 'purchase' || type === 'adjustment' ? quantity : -quantity,
            unit: ingredient.unit,
            costPerUnit: costPerUnit || ingredient.costPerUnit,
            reason: reason || '',
            notes: notes || '',
            performedBy: req.user._id,
            supplier: supplier || null,
            invoiceNumber: invoiceNumber || '',
            stockBefore,
            stockAfter
        });

        res.json({
            ingredient,
            transaction,
            message: `Stock ${type} recorded successfully`
        });
    } catch (error) {
        console.error('Error adjusting stock:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get low stock ingredients
// @route   GET /api/inventory/ingredients/low-stock
// @access  Private (Restaurant)
const getLowStockIngredients = async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ owner: req.user._id });
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        const ingredients = await Ingredient.find({
            restaurant: restaurant._id,
            isActive: true
        }).populate('supplier', 'name phone');

        const lowStockItems = ingredients.filter(ing => ing.isLowStock());

        res.json({ lowStockItems, count: lowStockItems.length });
    } catch (error) {
        console.error('Error fetching low stock ingredients:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ==================== RECIPE ENDPOINTS ====================

// @desc    Get all recipes for restaurant
// @route   GET /api/inventory/recipes
// @access  Private (Restaurant)
const getRecipes = async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ owner: req.user._id });
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        const recipes = await Recipe.find({ restaurant: restaurant._id, isActive: true })
            .populate('menuItem')
            .populate('ingredients.ingredient', 'name unit currentStock costPerUnit')
            .sort({ menuItemName: 1 });

        // Calculate cost for each recipe
        const recipesWithCost = await Promise.all(
            recipes.map(async (recipe) => {
                const cost = await recipe.calculateCost();
                return {
                    ...recipe.toObject(),
                    totalCost: cost
                };
            })
        );

        res.json({ recipes: recipesWithCost });
    } catch (error) {
        console.error('Error fetching recipes:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get recipe by menu item
// @route   GET /api/inventory/recipes/menu-item/:menuItemId
// @access  Private (Restaurant)
const getRecipeByMenuItem = async (req, res) => {
    try {
        const recipe = await Recipe.findOne({
            menuItem: req.params.menuItemId,
            isActive: true
        }).populate('ingredients.ingredient', 'name unit currentStock costPerUnit minStock');

        if (!recipe) {
            return res.status(404).json({ message: 'Recipe not found for this menu item' });
        }

        const cost = await recipe.calculateCost();
        const availability = await recipe.checkAvailability();

        res.json({
            recipe,
            totalCost: cost,
            availability
        });
    } catch (error) {
        console.error('Error fetching recipe:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Create recipe
// @route   POST /api/inventory/recipes
// @access  Private (Restaurant)
const createRecipe = async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ owner: req.user._id });
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        const { menuItem, menuItemName, ingredients, preparationTime, servingSize, instructions } = req.body;

        // Check if recipe already exists for this menu item
        const existingRecipe = await Recipe.findOne({ menuItem, restaurant: restaurant._id });
        if (existingRecipe) {
            return res.status(400).json({ message: 'Recipe already exists for this menu item' });
        }

        const recipe = await Recipe.create({
            restaurant: restaurant._id,
            menuItem,
            menuItemName,
            ingredients,
            preparationTime: preparationTime || 15,
            servingSize: servingSize || 1,
            instructions: instructions || ''
        });

        await recipe.populate('ingredients.ingredient', 'name unit costPerUnit');

        const cost = await recipe.calculateCost();

        res.status(201).json({
            recipe,
            totalCost: cost,
            message: 'Recipe created successfully'
        });
    } catch (error) {
        console.error('Error creating recipe:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update recipe
// @route   PUT /api/inventory/recipes/:id
// @access  Private (Restaurant)
const updateRecipe = async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id);
        if (!recipe) {
            return res.status(404).json({ message: 'Recipe not found' });
        }

        const { ingredients, preparationTime, servingSize, instructions } = req.body;

        if (ingredients) recipe.ingredients = ingredients;
        if (preparationTime !== undefined) recipe.preparationTime = preparationTime;
        if (servingSize !== undefined) recipe.servingSize = servingSize;
        if (instructions !== undefined) recipe.instructions = instructions;

        await recipe.save();
        await recipe.populate('ingredients.ingredient', 'name unit costPerUnit');

        const cost = await recipe.calculateCost();

        res.json({
            recipe,
            totalCost: cost,
            message: 'Recipe updated successfully'
        });
    } catch (error) {
        console.error('Error updating recipe:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete recipe
// @route   DELETE /api/inventory/recipes/:id
// @access  Private (Restaurant)
const deleteRecipe = async (req, res) => {
    try {
        const recipe = await Recipe.findById(req.params.id);
        if (!recipe) {
            return res.status(404).json({ message: 'Recipe not found' });
        }

        recipe.isActive = false;
        await recipe.save();

        res.json({ message: 'Recipe deleted successfully' });
    } catch (error) {
        console.error('Error deleting recipe:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ==================== STOCK TRANSACTION ENDPOINTS ====================

// @desc    Get stock transactions
// @route   GET /api/inventory/transactions
// @access  Private (Restaurant)
const getTransactions = async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ owner: req.user._id });
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        const { type, startDate, endDate, ingredientId } = req.query;
        let query = { restaurant: restaurant._id };

        if (type) query.type = type;
        if (ingredientId) query.ingredient = ingredientId;
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const transactions = await StockTransaction.find(query)
            .populate('ingredient', 'name unit')
            .populate('performedBy', 'name')
            .populate('supplier', 'name')
            .sort({ createdAt: -1 })
            .limit(100);

        res.json({ transactions });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ==================== SUPPLIER ENDPOINTS ====================

// @desc    Get all suppliers
// @route   GET /api/inventory/suppliers
// @access  Private (Restaurant)
const getSuppliers = async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ owner: req.user._id });
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        const suppliers = await Supplier.find({
            restaurant: restaurant._id,
            isActive: true
        }).populate('ingredientsSupplied', 'name unit')
            .sort({ name: 1 });

        res.json({ suppliers });
    } catch (error) {
        console.error('Error fetching suppliers:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Add supplier
// @route   POST /api/inventory/suppliers
// @access  Private (Restaurant)
const addSupplier = async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ owner: req.user._id });
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        const supplier = await Supplier.create({
            restaurant: restaurant._id,
            ...req.body
        });

        res.status(201).json({ supplier, message: 'Supplier added successfully' });
    } catch (error) {
        console.error('Error adding supplier:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Update supplier
// @route   PUT /api/inventory/suppliers/:id
// @access  Private (Restaurant)
const updateSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found' });
        }

        res.json({ supplier, message: 'Supplier updated successfully' });
    } catch (error) {
        console.error('Error updating supplier:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Delete supplier
// @route   DELETE /api/inventory/suppliers/:id
// @access  Private (Restaurant)
const deleteSupplier = async (req, res) => {
    try {
        const supplier = await Supplier.findById(req.params.id);
        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found' });
        }

        supplier.isActive = false;
        await supplier.save();

        res.json({ message: 'Supplier deleted successfully' });
    } catch (error) {
        console.error('Error deleting supplier:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// ==================== REPORTS ENDPOINTS ====================

// @desc    Get stock summary report
// @route   GET /api/inventory/reports/stock-summary
// @access  Private (Restaurant)
const getStockSummary = async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ owner: req.user._id });
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        const ingredients = await Ingredient.find({
            restaurant: restaurant._id,
            isActive: true
        });

        const summary = {
            totalIngredients: ingredients.length,
            lowStockCount: ingredients.filter(ing => ing.isLowStock()).length,
            outOfStockCount: ingredients.filter(ing => ing.currentStock === 0).length,
            totalValue: ingredients.reduce((sum, ing) => sum + (ing.currentStock * ing.costPerUnit), 0),
            byCategory: {}
        };

        // Group by category
        ingredients.forEach(ing => {
            if (!summary.byCategory[ing.category]) {
                summary.byCategory[ing.category] = {
                    count: 0,
                    value: 0,
                    lowStock: 0
                };
            }
            summary.byCategory[ing.category].count++;
            summary.byCategory[ing.category].value += ing.currentStock * ing.costPerUnit;
            if (ing.isLowStock()) summary.byCategory[ing.category].lowStock++;
        });

        res.json({ summary });
    } catch (error) {
        console.error('Error generating stock summary:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get wastage report
// @route   GET /api/inventory/reports/wastage
// @access  Private (Restaurant)
const getWastageReport = async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ owner: req.user._id });
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        const { startDate, endDate } = req.query;
        let query = {
            restaurant: restaurant._id,
            type: 'wastage'
        };

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        const wastageTransactions = await StockTransaction.find(query)
            .populate('ingredient', 'name unit category')
            .sort({ createdAt: -1 });

        const totalWastageCost = wastageTransactions.reduce((sum, t) => sum + t.totalCost, 0);

        res.json({
            wastageTransactions,
            totalWastageCost,
            count: wastageTransactions.length
        });
    } catch (error) {
        console.error('Error generating wastage report:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get cost analysis report
// @route   GET /api/inventory/reports/cost-analysis
// @access  Private (Restaurant)
const getCostAnalysis = async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ owner: req.user._id });
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        const recipes = await Recipe.find({ restaurant: restaurant._id, isActive: true })
            .populate('menuItem', 'name price')
            .populate('ingredients.ingredient', 'name costPerUnit');

        const analysis = await Promise.all(
            recipes.map(async (recipe) => {
                const ingredientCost = await recipe.calculateCost();
                const sellingPrice = recipe.menuItem?.price || 0;
                const profitMargin = sellingPrice - ingredientCost;
                const profitPercentage = sellingPrice > 0 ? ((profitMargin / sellingPrice) * 100).toFixed(2) : 0;

                return {
                    menuItem: recipe.menuItemName,
                    ingredientCost: ingredientCost.toFixed(2),
                    sellingPrice: sellingPrice.toFixed(2),
                    profitMargin: profitMargin.toFixed(2),
                    profitPercentage: `${profitPercentage}%`
                };
            })
        );

        res.json({ analysis });
    } catch (error) {
        console.error('Error generating cost analysis:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    // Ingredients
    getIngredients,
    getIngredient,
    addIngredient,
    updateIngredient,
    deleteIngredient,
    adjustStock,
    getLowStockIngredients,
    // Recipes
    getRecipes,
    getRecipeByMenuItem,
    createRecipe,
    updateRecipe,
    deleteRecipe,
    // Transactions
    getTransactions,
    // Suppliers
    getSuppliers,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    // Reports
    getStockSummary,
    getWastageReport,
    getCostAnalysis
};
