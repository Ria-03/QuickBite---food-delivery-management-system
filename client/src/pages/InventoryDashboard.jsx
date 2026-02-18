import { useState, useEffect } from 'react';
import { Package, Plus, AlertTriangle, TrendingDown, DollarSign, Search, Filter } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import AddIngredientModal from '../components/AddIngredientModal';
import StockAdjustmentModal from '../components/StockAdjustmentModal';
import RecipeBuilderModal from '../components/RecipeBuilderModal';

const InventoryDashboard = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState('ingredients'); // ingredients, recipes, suppliers, reports
    const [ingredients, setIngredients] = useState([]);
    const [recipes, setRecipes] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showStockModal, setShowStockModal] = useState(false);
    const [selectedIngredient, setSelectedIngredient] = useState(null);
    const [showRecipeModal, setShowRecipeModal] = useState(false);
    const [editingRecipe, setEditingRecipe] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [lowStockFilter, setLowStockFilter] = useState(false);
    const [stockSummary, setStockSummary] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const [ingredientsRes, recipesRes, suppliersRes, summaryRes] = await Promise.all([
                axios.get('http://localhost:5000/api/inventory/ingredients', config),
                axios.get('http://localhost:5000/api/inventory/recipes', config),
                axios.get('http://localhost:5000/api/inventory/suppliers', config),
                axios.get('http://localhost:5000/api/inventory/reports/stock-summary', config)
            ]);

            setIngredients(ingredientsRes.data.ingredients || []);
            setSuppliers(suppliersRes.data.suppliers || []);
            setStockSummary(summaryRes.data.summary || null);
            // Recipes might need to be fetched separately if not already in the previous call, 
            // but the previous code had: setRecipes(recipesRes.data.recipes || []);
            // validation: line 36 was: axios.get('http://localhost:5000/api/inventory/recipes', config),
            // so we are good on fetching.
            setRecipes(recipesRes.data.recipes || []);
        } catch (error) {
            console.error('Error fetching inventory data:', error);
            showToast('Failed to load inventory data', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleStockAdjustment = (ingredient) => {
        setSelectedIngredient(ingredient);
        setShowStockModal(true);
    };

    const getStockStatusColor = (status) => {
        switch (status) {
            case 'out_of_stock': return '#dc2626';
            case 'low_stock': return '#f59e0b';
            case 'overstocked': return '#8b5cf6';
            default: return '#10b981';
        }
    };

    const getStockStatusLabel = (status) => {
        switch (status) {
            case 'out_of_stock': return 'Out of Stock';
            case 'low_stock': return 'Low Stock';
            case 'overstocked': return 'Overstocked';
            default: return 'In Stock';
        }
    };

    const filteredIngredients = ingredients.filter(ing => {
        const matchesSearch = ing.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === 'All' || ing.category === categoryFilter;
        const matchesLowStock = !lowStockFilter || ing.stockStatus === 'low_stock' || ing.stockStatus === 'out_of_stock';
        return matchesSearch && matchesCategory && matchesLowStock;
    });

    const categories = ['All', 'Vegetables', 'Fruits', 'Dairy', 'Meat', 'Seafood', 'Grains', 'Spices', 'Oils', 'Beverages', 'Other'];

    if (loading) {
        return (
            <div style={{ padding: '3rem', textAlign: 'center' }}>
                <div className="spinner" style={{ width: '50px', height: '50px', border: '5px solid var(--gray-light)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1.5rem' }}></div>
                <h2 style={{ color: 'var(--secondary)', fontWeight: 800 }}>Loading Inventory...</h2>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
            {/* Header */}
            <div style={{ marginBottom: '2.5rem' }}>
                <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>📦 Inventory Management</h1>
                <p style={{ color: 'var(--gray)', fontSize: '1.1rem', fontWeight: 600 }}>
                    Track ingredients, manage stock, and optimize costs
                </p>
            </div>

            {/* Summary Cards */}
            {stockSummary && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '2.5rem' }}>
                    <div className="card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                            <Package size={32} />
                            <div>
                                <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Total Ingredients</div>
                                <div style={{ fontSize: '2rem', fontWeight: 900 }}>{stockSummary.totalIngredients}</div>
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                            <AlertTriangle size={32} />
                            <div>
                                <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Low Stock Items</div>
                                <div style={{ fontSize: '2rem', fontWeight: 900 }}>{stockSummary.lowStockCount}</div>
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                            <TrendingDown size={32} />
                            <div>
                                <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Out of Stock</div>
                                <div style={{ fontSize: '2rem', fontWeight: 900 }}>{stockSummary.outOfStockCount}</div>
                            </div>
                        </div>
                    </div>

                    <div className="card" style={{ padding: '1.5rem', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                            <DollarSign size={32} />
                            <div>
                                <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>Total Value</div>
                                <div style={{ fontSize: '2rem', fontWeight: 900 }}>₹{stockSummary.totalValue.toLocaleString()}</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '2px solid var(--gray-light)' }}>
                {[
                    { id: 'ingredients', label: '📦 Ingredients', count: ingredients.length },
                    { id: 'recipes', label: '🍽️ Recipes', count: recipes.length },
                    { id: 'suppliers', label: '👥 Suppliers', count: suppliers.length },
                    { id: 'reports', label: '📊 Reports', count: null }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: '1rem 2rem',
                            background: 'none',
                            border: 'none',
                            borderBottom: `3px solid ${activeTab === tab.id ? 'var(--primary)' : 'transparent'}`,
                            color: activeTab === tab.id ? 'var(--primary)' : 'var(--gray)',
                            fontWeight: 700,
                            fontSize: '1rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        {tab.label} {tab.count !== null && `(${tab.count})`}
                    </button>
                ))}
            </div>

            {/* Ingredients Tab */}
            {activeTab === 'ingredients' && (
                <div>
                    {/* Filters and Actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', gap: '1rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', gap: '1rem', flex: 1 }}>
                            <div style={{ position: 'relative', flex: 1, maxWidth: '300px' }}>
                                <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray)' }} />
                                <input
                                    className="form-input"
                                    placeholder="Search ingredients..."
                                    style={{ paddingLeft: '40px', margin: 0 }}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <select
                                className="form-input"
                                style={{ margin: 0, width: 'auto' }}
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                            >
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={lowStockFilter}
                                    onChange={(e) => setLowStockFilter(e.target.checked)}
                                />
                                <span style={{ fontWeight: 600 }}>Low Stock Only</span>
                            </label>
                        </div>
                        <button
                            className="btn btn-primary"
                            onClick={() => setShowAddModal(true)}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Plus size={18} /> Add Ingredient
                        </button>
                    </div>

                    {/* Ingredients Table */}
                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'var(--bg-main)', borderBottom: '2px solid var(--gray-light)' }}>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 800 }}>Ingredient</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 800 }}>Category</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 800 }}>Current Stock</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 800 }}>Min/Max</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 800 }}>Cost/Unit</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 800 }}>Status</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 800 }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredIngredients.length > 0 ? filteredIngredients.map(ingredient => (
                                    <tr key={ingredient._id} style={{ borderBottom: '1px solid var(--gray-light)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 700, fontSize: '1rem' }}>{ingredient.name}</div>
                                            {ingredient.supplier && (
                                                <div style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>
                                                    Supplier: {ingredient.supplier.name}
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '1rem' }}>{ingredient.category}</td>
                                        <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 700, fontSize: '1.1rem' }}>
                                            {ingredient.currentStock} {ingredient.unit}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center', color: 'var(--gray)', fontSize: '0.9rem' }}>
                                            {ingredient.minStock} / {ingredient.maxStock} {ingredient.unit}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 700 }}>
                                            ₹{ingredient.costPerUnit}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <span style={{
                                                padding: '0.5rem 1rem',
                                                borderRadius: '8px',
                                                fontSize: '0.85rem',
                                                fontWeight: 700,
                                                background: `${getStockStatusColor(ingredient.stockStatus)}20`,
                                                color: getStockStatusColor(ingredient.stockStatus)
                                            }}>
                                                {getStockStatusLabel(ingredient.stockStatus)}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <button
                                                className="btn btn-primary"
                                                onClick={() => handleStockAdjustment(ingredient)}
                                                style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                                            >
                                                Adjust Stock
                                            </button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="7" style={{ padding: '3rem', textAlign: 'center' }}>
                                            <Package size={48} style={{ margin: '0 auto 1rem', display: 'block', color: 'var(--gray-light)' }} />
                                            <h3 style={{ marginBottom: '0.5rem' }}>No Ingredients Found</h3>
                                            <p style={{ color: 'var(--gray)' }}>Add your first ingredient to get started</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Recipes Tab */}
            {activeTab === 'recipes' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '2rem' }}>
                        <button
                            className="btn btn-primary"
                            onClick={() => {
                                setEditingRecipe(null);
                                setShowRecipeModal(true);
                            }}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Plus size={18} /> Create Recipe
                        </button>
                    </div>

                    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: 'var(--bg-main)', borderBottom: '2px solid var(--gray-light)' }}>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 800 }}>Menu Item</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 800 }}>Ingredients</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 800 }}>Prep Time</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 800 }}>Total Cost</th>
                                    <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 800 }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {recipes.length > 0 ? recipes.map(recipe => (
                                    <tr key={recipe._id} style={{ borderBottom: '1px solid var(--gray-light)' }}>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{recipe.menuItemName}</div>
                                            {recipe.menuItem?.category && (
                                                <div style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>{recipe.menuItem.category}</div>
                                            )}
                                        </td>
                                        <td style={{ padding: '1rem' }}>
                                            <div style={{ fontSize: '0.9rem', color: 'var(--gray)' }}>
                                                {recipe.ingredients.length} ingredients
                                            </div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--secondary)', marginTop: '4px' }}>
                                                {recipe.ingredients.slice(0, 3).map(i => i.ingredient?.name).join(', ')}
                                                {recipe.ingredients.length > 3 && '...'}
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 600 }}>
                                            {recipe.preparationTime} mins
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center', fontWeight: 800, color: 'var(--primary)' }}>
                                            ₹{recipe.totalCost ? recipe.totalCost.toLocaleString() : '0'}
                                        </td>
                                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                                                <button
                                                    className="btn btn-secondary"
                                                    onClick={() => {
                                                        setEditingRecipe(recipe);
                                                        setShowRecipeModal(true);
                                                    }}
                                                    style={{ padding: '0.5rem', borderRadius: '8px' }}
                                                >
                                                    View / Edit
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '3rem', textAlign: 'center' }}>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--gray)' }}>No recipes created yet.</div>
                                            <p>Link your menu items to ingredients to track costs.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Suppliers Tab */}
            {activeTab === 'suppliers' && (
                <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                    <h3>Supplier Management Coming Soon</h3>
                    <p style={{ color: 'var(--gray)' }}>Manage your suppliers and purchase orders</p>
                </div>
            )}

            {/* Reports Tab */}
            {activeTab === 'reports' && (
                <div className="card" style={{ padding: '2rem', textAlign: 'center' }}>
                    <h3>Reports Coming Soon</h3>
                    <p style={{ color: 'var(--gray)' }}>View stock reports, wastage analysis, and cost breakdowns</p>
                </div>
            )}

            {/* Modals */}
            {showAddModal && (
                <AddIngredientModal
                    onClose={() => setShowAddModal(false)}
                    onSuccess={() => {
                        setShowAddModal(false);
                        fetchData();
                    }}
                    suppliers={suppliers}
                />
            )}

            {showStockModal && selectedIngredient && (
                <StockAdjustmentModal
                    ingredient={selectedIngredient}
                    onClose={() => {
                        setShowStockModal(false);
                        setSelectedIngredient(null);
                    }}
                    onSuccess={() => {
                        setShowStockModal(false);
                        setSelectedIngredient(null);
                        fetchData();
                    }}
                    suppliers={suppliers}
                />
            )}

            {showRecipeModal && (
                <RecipeBuilderModal
                    onClose={() => {
                        setShowRecipeModal(false);
                        setEditingRecipe(null);
                    }}
                    onSuccess={() => {
                        setShowRecipeModal(false);
                        setEditingRecipe(null);
                        fetchData();
                        showToast(editingRecipe ? 'Recipe updated!' : 'Recipe created!', 'success');
                    }}
                    initialData={editingRecipe}
                    ingredients={ingredients}
                />
            )}
        </div>
    );
};

export default InventoryDashboard;
