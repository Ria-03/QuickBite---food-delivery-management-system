import { useState } from 'react';
import { X } from 'lucide-react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';

const StockAdjustmentModal = ({ ingredient, onClose, onSuccess, suppliers }) => {
    const { showToast } = useToast();
    const [formData, setFormData] = useState({
        type: 'purchase',
        quantity: 0,
        reason: '',
        notes: '',
        supplier: '',
        invoiceNumber: '',
        costPerUnit: ingredient.costPerUnit
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

        if (formData.quantity <= 0) {
            showToast('Please enter a valid quantity', 'error');
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            await axios.post(
                `http://localhost:5000/api/inventory/ingredients/${ingredient._id}/stock`,
                formData,
                config
            );

            showToast('Stock adjusted successfully!', 'success');
            onSuccess();
        } catch (error) {
            console.error('Error adjusting stock:', error);
            showToast(error.response?.data?.message || 'Failed to adjust stock', 'error');
        } finally {
            setLoading(false);
        }
    };

    const getTypeLabel = (type) => {
        switch (type) {
            case 'purchase': return '📦 Purchase (Add Stock)';
            case 'wastage': return '🗑️ Wastage (Reduce Stock)';
            case 'adjustment': return '⚖️ Adjustment (Add Stock)';
            case 'usage': return '🍽️ Usage (Reduce Stock)';
            case 'return': return '↩️ Return (Reduce Stock)';
            default: return type;
        }
    };

    const newStock = formData.type === 'purchase' || formData.type === 'adjustment'
        ? ingredient.currentStock + parseFloat(formData.quantity || 0)
        : ingredient.currentStock - parseFloat(formData.quantity || 0);

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
                    <div>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '0.25rem' }}>
                            📊 Adjust Stock
                        </h2>
                        <p style={{ color: 'var(--gray)', fontSize: '0.95rem', fontWeight: 600 }}>
                            {ingredient.name}
                        </p>
                    </div>
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

                {/* Current Stock Info */}
                <div style={{
                    background: 'var(--bg-main)',
                    padding: '1.5rem',
                    borderRadius: '12px',
                    marginBottom: '2rem',
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr 1fr',
                    gap: '1rem',
                    textAlign: 'center'
                }}>
                    <div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--gray)', marginBottom: '0.25rem' }}>
                            Current Stock
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>
                            {ingredient.currentStock} {ingredient.unit}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--gray)', marginBottom: '0.25rem' }}>
                            Min Stock
                        </div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#f59e0b' }}>
                            {ingredient.minStock} {ingredient.unit}
                        </div>
                    </div>
                    <div>
                        <div style={{ fontSize: '0.85rem', color: 'var(--gray)', marginBottom: '0.25rem' }}>
                            New Stock
                        </div>
                        <div style={{
                            fontSize: '1.5rem',
                            fontWeight: 900,
                            color: newStock < ingredient.minStock ? '#dc2626' : '#10b981'
                        }}>
                            {newStock.toFixed(2)} {ingredient.unit}
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        {/* Transaction Type */}
                        <div>
                            <label className="form-label">Transaction Type *</label>
                            <select
                                name="type"
                                className="form-input"
                                value={formData.type}
                                onChange={handleChange}
                                required
                            >
                                <option value="purchase">{getTypeLabel('purchase')}</option>
                                <option value="wastage">{getTypeLabel('wastage')}</option>
                                <option value="adjustment">{getTypeLabel('adjustment')}</option>
                                <option value="usage">{getTypeLabel('usage')}</option>
                                <option value="return">{getTypeLabel('return')}</option>
                            </select>
                        </div>

                        {/* Quantity */}
                        <div>
                            <label className="form-label">Quantity ({ingredient.unit}) *</label>
                            <input
                                type="number"
                                name="quantity"
                                className="form-input"
                                min="0.01"
                                step="0.01"
                                placeholder="Enter quantity"
                                value={formData.quantity}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* Cost per Unit (for purchases) */}
                        {formData.type === 'purchase' && (
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
                                <div style={{ fontSize: '0.85rem', color: 'var(--gray)', marginTop: '0.5rem' }}>
                                    Total Cost: ₹{(formData.quantity * formData.costPerUnit).toFixed(2)}
                                </div>
                            </div>
                        )}

                        {/* Supplier and Invoice (for purchases) */}
                        {formData.type === 'purchase' && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label className="form-label">Supplier</label>
                                    <select
                                        name="supplier"
                                        className="form-input"
                                        value={formData.supplier}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select Supplier</option>
                                        {suppliers.map(supplier => (
                                            <option key={supplier._id} value={supplier._id}>
                                                {supplier.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label">Invoice Number</label>
                                    <input
                                        type="text"
                                        name="invoiceNumber"
                                        className="form-input"
                                        placeholder="INV-001"
                                        value={formData.invoiceNumber}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Reason */}
                        <div>
                            <label className="form-label">Reason *</label>
                            <input
                                type="text"
                                name="reason"
                                className="form-input"
                                placeholder="e.g., Weekly stock purchase, Expired items"
                                value={formData.reason}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        {/* Notes */}
                        <div>
                            <label className="form-label">Notes (Optional)</label>
                            <textarea
                                name="notes"
                                className="form-input"
                                rows="3"
                                placeholder="Additional details..."
                                value={formData.notes}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Warning for low stock */}
                    {newStock < ingredient.minStock && (
                        <div style={{
                            background: '#fef3c7',
                            border: '2px solid #f59e0b',
                            borderRadius: '8px',
                            padding: '1rem',
                            marginTop: '1.5rem',
                            display: 'flex',
                            gap: '0.75rem',
                            alignItems: 'flex-start'
                        }}>
                            <span style={{ fontSize: '1.25rem' }}>⚠️</span>
                            <div>
                                <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Low Stock Warning</div>
                                <div style={{ fontSize: '0.9rem', color: '#92400e' }}>
                                    New stock level will be below minimum threshold
                                </div>
                            </div>
                        </div>
                    )}

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
                            {loading ? 'Adjusting...' : 'Adjust Stock'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StockAdjustmentModal;
