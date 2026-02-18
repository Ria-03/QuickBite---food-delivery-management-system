const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
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
} = require('../controllers/inventoryController');

// ==================== INGREDIENT ROUTES ====================
router.get('/ingredients', protect, getIngredients);
router.get('/ingredients/low-stock', protect, getLowStockIngredients);
router.get('/ingredients/:id', protect, getIngredient);
router.post('/ingredients', protect, addIngredient);
router.put('/ingredients/:id', protect, updateIngredient);
router.delete('/ingredients/:id', protect, deleteIngredient);
router.post('/ingredients/:id/stock', protect, adjustStock);

// ==================== RECIPE ROUTES ====================
router.get('/recipes', protect, getRecipes);
router.get('/recipes/menu-item/:menuItemId', protect, getRecipeByMenuItem);
router.post('/recipes', protect, createRecipe);
router.put('/recipes/:id', protect, updateRecipe);
router.delete('/recipes/:id', protect, deleteRecipe);

// ==================== TRANSACTION ROUTES ====================
router.get('/transactions', protect, getTransactions);

// ==================== SUPPLIER ROUTES ====================
router.get('/suppliers', protect, getSuppliers);
router.post('/suppliers', protect, addSupplier);
router.put('/suppliers/:id', protect, updateSupplier);
router.delete('/suppliers/:id', protect, deleteSupplier);

// ==================== REPORT ROUTES ====================
router.get('/reports/stock-summary', protect, getStockSummary);
router.get('/reports/wastage', protect, getWastageReport);
router.get('/reports/cost-analysis', protect, getCostAnalysis);

module.exports = router;
