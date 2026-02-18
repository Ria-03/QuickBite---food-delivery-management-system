import { useState } from 'react';
import { X } from 'lucide-react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';

const AddIngredientModal = ({ onClose, onSuccess, suppliers }) => {
    const { showToast } = useToast();
    const [formData, setFormData] = useState({
        name: '',
        unit: 'kg',
        currentStock: 0,
        minStock: 10,
        maxStock: 100,
        costPerUnit: 0,
        supplier: '',
        category: 'Other',
        description: ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            showToast('Please enter ingredient name', 'error');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            await axios.post('http://localhost:5000/api/inventory/ingredients', formData, config);

            showToast('Ingredient added successfully!', 'success');
            onSuccess();
        } catch (error) {
            console.error('Error adding ingredient:', error);
            showToast(error.response?.data?.message || 'Failed to add ingredient', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
        }}>
            <div className="card" style={{
                maxWidth: '600px',
                width: '100%',
                maxHeight: '90vh',
                overflow: 'auto',
                position: 'relative'
            }}>
                {/* Header */}
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '2rem',
                    paddingBottom: '1rem',
                    borderBottom: '2px solid var(--gray-light)'
                }}>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 900 }}>➕ Add New Ingredient</h2>
                    <button
                        onClick={onClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            padding: '0.5rem',
                            color: 'var(--gray)'
                        }}
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        {/* Ingredient Name */}
                        <div>
                            <label className="form-label">Ingredient Name *</label>
                            <input
                                type="text"
                                name="name"
                                className="form-input"
                                placeholder="e.g., Tomatoes, Chicken Breast"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* Category and Unit */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label className="form-label">Category</label>
                                <select
                                    name="category"
                                    className="form-input"
                                    value={formData.category}
                                    onChange={handleChange}
                                >
                                    <option value="Vegetables">Vegetables</option>
                                    <option value="Fruits">Fruits</option>
                                    <option value="Dairy">Dairy</option>
                                    <option value="Meat">Meat</option>
                                    <option value="Seafood">Seafood</option>
                                    <option value="Grains">Grains</option>
                                    <option value="Spices">Spices</option>
                                    <option value="Oils">Oils</option>
                                    <option value="Beverages">Beverages</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="form-label">Unit</label>
                                <select
                                    name="unit"
                                    className="form-input"
                                    value={formData.unit}
                                    onChange={handleChange}
                                >
                                    <option value="kg">Kilogram (kg)</option>
                                    <option value="g">Gram (g)</option>
                                    <option value="l">Liter (l)</option>
                                    <option value="ml">Milliliter (ml)</option>
                                    <option value="pcs">Pieces (pcs)</option>
                                    <option value="dozen">Dozen</option>
                                    <option value="pack">Pack</option>
                                </select>
                            </div>
                        </div>

                        {/* Stock Levels */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label className="form-label">Current Stock</label>
                                <input
                                    type="number"
                                    name="currentStock"
                                    className="form-input"
                                    min="0"
                                    step="0.01"
                                    value={formData.currentStock}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label className="form-label">Min Stock</label>
                                <input
                                    type="number"
                                    name="minStock"
                                    className="form-input"
                                    min="0"
                                    step="0.01"
                                    value={formData.minStock}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label className="form-label">Max Stock</label>
                                <input
                                    type="number"
                                    name="maxStock"
                                    className="form-input"
                                    min="0"
                                    step="0.01"
                                    value={formData.maxStock}
                                    onChange={handleChange}
                                />
                            </div>
                        </div>

                        {/* Cost and Supplier */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div>
                                <label className="form-label">Cost per Unit (₹)</label>
                                <input
                                    type="number"
                                    name="costPerUnit"
                                    className="form-input"
                                    min="0"
                                    step="0.01"
                                    value={formData.costPerUnit}
                                    onChange={handleChange}
                                />
                            </div>
                            <div>
                                <label className="form-label">Supplier (Optional)</label>
                                <select
                                    name="supplier"
                                    className="form-input"
                                    value={formData.supplier}
                                    onChange={handleChange}
                                >
                                    <option value="">No Supplier</option>
                                    {suppliers.map(supplier => (
                                        <option key={supplier._id} value={supplier._id}>
                                            {supplier.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="form-label">Description (Optional)</label>
                            <textarea
                                name="description"
                                className="form-input"
                                rows="3"
                                placeholder="Additional notes about this ingredient..."
                                value={formData.description}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Actions */}
                    <div style={{
                        display: 'flex',
                        gap: '1rem',
                        marginTop: '2rem',
                        paddingTop: '1.5rem',
                        borderTop: '2px solid var(--gray-light)'
                    }}>
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn"
                            style={{ flex: 1, background: 'var(--gray-light)', color: 'var(--text)' }}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ flex: 1 }}
                            disabled={loading}
                        >
                            {loading ? 'Adding...' : 'Add Ingredient'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddIngredientModal;
