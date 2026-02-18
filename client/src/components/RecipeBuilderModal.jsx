import { useState, useEffect } from 'react';
import axios from 'axios';
import { X, Plus, Trash2, Save, Calculator } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const RecipeBuilderModal = ({ onClose, onSuccess, initialData = null, ingredients = [] }) => {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [menuItems, setMenuItems] = useState([]);

    const [formData, setFormData] = useState({
        menuItem: '',
        menuItemName: '',
        ingredients: [
            { ingredient: '', quantity: '', unit: 'kg' } // Default row
        ],
        preparationTime: 15,
        servingSize: 1,
        instructions: ''
    });

    useEffect(() => {
        fetchMenuItems();
        if (initialData) {
            setFormData({
                menuItem: initialData.menuItem?._id || initialData.menuItem,
                menuItemName: initialData.menuItemName,
                ingredients: initialData.ingredients.map(i => ({
                    ingredient: i.ingredient._id || i.ingredient,
                    quantity: i.quantity,
                    unit: i.unit
                })),
                preparationTime: initialData.preparationTime || 15,
                servingSize: initialData.servingSize || 1,
                instructions: initialData.instructions || ''
            });
        }
    }, [initialData]);

    const fetchMenuItems = async () => {
        try {
            const token = localStorage.getItem('token');
            const user = JSON.parse(localStorage.getItem('user'));
            // Backend endpoint to get menu items. Assuming it's part of restaurant endpoints.
            // We need the restaurant ID. The user object usually has it or we can fetch it.
            // Let's rely on the backend route that gets menus for the current restaurant context if possible,
            // or fetch the restaurant first. Since InventoryDashboard does it, we could pass it down, 
            // but fetching here is safer for standalone usage.
            // However, the standard route is /api/restaurants/:id/menu. 
            // We can assume the user is a restaurant owner.

            // Better approach: fetch profile to get ID, then menu. 
            // Or use the public menu route if available, but that might be public.
            // Let's use the same endpoint InventoryDashboard likely uses or just pass it in.
            // To be self-contained, I'll fetch the restaurant profile first.

            const profileRes = await axios.get('http://localhost:5000/api/restaurants/my/profile', {
                headers: { Authorization: `Bearer ${token}` }
            });
            const restaurantId = profileRes.data._id;

            const menuRes = await axios.get(`http://localhost:5000/api/restaurants/${restaurantId}/menu`);
            setMenuItems(menuRes.data);
        } catch (error) {
            console.error('Error fetching menu items:', error);
            showToast('Failed to load menu items', 'error');
        }
    };

    const handleIngredientChange = (index, field, value) => {
        const newIngredients = [...formData.ingredients];
        newIngredients[index][field] = value;

        // Auto-set unit if ingredient changes
        if (field === 'ingredient') {
            const selectedIng = ingredients.find(ing => ing._id === value);
            if (selectedIng) {
                newIngredients[index].unit = selectedIng.unit;
            }
        }

        setFormData({ ...formData, ingredients: newIngredients });
    };

    const addIngredientRow = () => {
        setFormData({
            ...formData,
            ingredients: [...formData.ingredients, { ingredient: '', quantity: '', unit: 'kg' }]
        });
    };

    const removeIngredientRow = (index) => {
        const newIngredients = formData.ingredients.filter((_, i) => i !== index);
        setFormData({ ...formData, ingredients: newIngredients });
    };

    const calculateTotalCost = () => {
        return formData.ingredients.reduce((total, item) => {
            const ing = ingredients.find(i => i._id === item.ingredient);
            if (ing && item.quantity) {
                return total + (ing.costPerUnit * parseFloat(item.quantity));
            }
            return total;
        }, 0);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            // Find menu item name
            const selectedMenu = menuItems.find(m => m._id === formData.menuItem);
            const payload = {
                ...formData,
                menuItemName: selectedMenu ? selectedMenu.name : formData.menuItemName,
                // Filter out empty rows
                ingredients: formData.ingredients.filter(i => i.ingredient && i.quantity > 0)
            };

            if (initialData) {
                await axios.put(`http://localhost:5000/api/inventory/recipes/${initialData._id}`, payload, config);
                showToast('Recipe updated successfully', 'success');
            } else {
                await axios.post('http://localhost:5000/api/inventory/recipes', payload, config);
                showToast('Recipe created successfully', 'success');
            }
            onSuccess();
        } catch (error) {
            console.error('Error saving recipe:', error);
            const msg = error.response?.data?.message || 'Failed to save recipe';
            showToast(msg, 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            backdropFilter: 'blur(5px)'
        }}>
            <div className="card" style={{ width: '90%', maxWidth: '800px', maxHeight: '90vh', overflowY: 'auto', padding: '2rem', animation: 'fadeIn 0.3s' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <h2 style={{ margin: 0, fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Calculator size={28} color="var(--primary)" />
                        {initialData ? 'Edit Recipe' : 'Recipe Builder'}
                    </h2>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--gray)' }}>
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                        <div className="form-group">
                            <label className="form-label">Menu Item</label>
                            <select
                                className="form-input"
                                value={formData.menuItem}
                                onChange={(e) => setFormData({ ...formData, menuItem: e.target.value })}
                                required
                                disabled={!!initialData} // Lock menu item on edit usually keeps things simpler
                            >
                                <option value="">Select a dish...</option>
                                {menuItems.map(item => (
                                    <option key={item._id} value={item._id}>{item.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="form-group">
                            <label className="form-label">Preparation Time (mins)</label>
                            <input
                                type="number"
                                className="form-input"
                                value={formData.preparationTime}
                                onChange={(e) => setFormData({ ...formData, preparationTime: e.target.value })}
                                min="1"
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Ingredients</h3>
                            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--success)', background: 'rgba(16, 185, 129, 0.1)', padding: '0.5rem 1rem', borderRadius: '8px' }}>
                                Total Cost: ₹{calculateTotalCost().toLocaleString()}
                            </div>
                        </div>

                        <div style={{ background: 'var(--bg-main)', borderRadius: '12px', padding: '1rem' }}>
                            {formData.ingredients.map((row, index) => (
                                <div key={index} style={{ display: 'grid', gridTemplateColumns: '3fr 1fr 1fr 0.5fr', gap: '1rem', alignItems: 'end', marginBottom: '1rem' }}>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Ingredient</label>
                                        <select
                                            className="form-input"
                                            value={row.ingredient}
                                            onChange={(e) => handleIngredientChange(index, 'ingredient', e.target.value)}
                                            style={{ margin: 0 }}
                                            required
                                        >
                                            <option value="">Select ingredient...</option>
                                            {ingredients.map(ing => (
                                                <option key={ing._id} value={ing._id}>
                                                    {ing.name} ({ing.unit}) - ₹{ing.costPerUnit}/{ing.unit}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Quantity</label>
                                        <input
                                            type="number"
                                            className="form-input"
                                            value={row.quantity}
                                            onChange={(e) => handleIngredientChange(index, 'quantity', e.target.value)}
                                            step="0.01"
                                            min="0"
                                            placeholder="0.00"
                                            style={{ margin: 0 }}
                                            required
                                        />
                                    </div>
                                    <div className="form-group" style={{ margin: 0 }}>
                                        <label className="form-label" style={{ fontSize: '0.8rem' }}>Unit</label>
                                        <input
                                            className="form-input"
                                            value={row.unit}
                                            readOnly
                                            style={{ margin: 0, background: 'var(--gray-light)', cursor: 'not-allowed' }}
                                        />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => removeIngredientRow(index)}
                                        style={{
                                            background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                                            border: 'none', borderRadius: '8px',
                                            height: '46px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer', transition: '0.2s'
                                        }}
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}

                            <button
                                type="button"
                                onClick={addIngredientRow}
                                style={{
                                    width: '100%', padding: '0.75rem',
                                    border: '2px dashed var(--gray-light)', borderRadius: '8px',
                                    background: 'none', color: 'var(--gray)',
                                    fontWeight: 600, cursor: 'pointer',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                                }}
                            >
                                <Plus size={18} /> Add Ingredient Line
                            </button>
                        </div>
                    </div>

                    <div className="form-group">
                        <label className="form-label">Instructions / Notes</label>
                        <textarea
                            className="form-input"
                            value={formData.instructions}
                            onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                            rows="3"
                            placeholder="e.g. Mix flour and water..."
                        ></textarea>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'end', gap: '1rem', marginTop: '2rem' }}>
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-secondary"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                        >
                            <Save size={18} />
                            {loading ? 'Saving...' : 'Save Recipe'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RecipeBuilderModal;
