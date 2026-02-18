import { useState } from 'react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';

const AddressCard = ({ address, onEdit, onDelete, onSetDefault }) => {
    const { showToast } = useToast();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSettingDefault, setIsSettingDefault] = useState(false);

    const getIcon = (label) => {
        switch (label) {
            case 'Home': return '🏠';
            case 'Work': return '🏢';
            case 'Other': return '📍';
            default: return '📍';
        }
    };

    const handleSetDefault = async () => {
        if (address.isDefault) return;

        setIsSettingDefault(true);
        try {
            const token = localStorage.getItem('token');
            await axios.put(
                `http://localhost:5000/api/addresses/${address._id}/set-default`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            showToast('Default address updated', 'success');
            onSetDefault();
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to set default', 'error');
        } finally {
            setIsSettingDefault(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this address?')) return;

        setIsDeleting(true);
        try {
            const token = localStorage.getItem('token');
            await axios.delete(
                `http://localhost:5000/api/addresses/${address._id}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            showToast('Address deleted successfully', 'success');
            onDelete();
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to delete address', 'error');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div style={{
            background: 'white',
            border: `2px solid ${address.isDefault ? 'var(--success)' : 'var(--gray-light)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '1.5rem',
            position: 'relative',
            transition: 'all 0.2s'
        }}>
            {/* Default Badge */}
            {address.isDefault && (
                <div style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    background: 'var(--success)',
                    color: 'white',
                    padding: '4px 12px',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    fontWeight: 700
                }}>
                    DEFAULT
                </div>
            )}

            {/* Label with Icon */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '1.5rem' }}>{getIcon(address.label)}</span>
                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{address.label}</h4>
            </div>

            {/* Address Details */}
            <div style={{ marginBottom: '1rem', color: 'var(--gray-dark)', lineHeight: 1.6 }}>
                <p style={{ margin: '0 0 4px 0' }}>{address.addressLine1}</p>
                {address.addressLine2 && <p style={{ margin: '0 0 4px 0' }}>{address.addressLine2}</p>}
                {address.landmark && <p style={{ margin: '0 0 4px 0', fontSize: '0.9rem', color: 'var(--gray)' }}>Near: {address.landmark}</p>}
                <p style={{ margin: '0 0 4px 0' }}>{address.city}, {address.state} {address.zipCode}</p>
                <p style={{ margin: '0 0 4px 0', fontSize: '0.9rem' }}>📞 {address.phoneNumber}</p>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {!address.isDefault && (
                    <button
                        onClick={handleSetDefault}
                        disabled={isSettingDefault}
                        style={{
                            padding: '0.5rem 1rem',
                            background: 'var(--success)',
                            color: 'white',
                            border: 'none',
                            borderRadius: 'var(--radius-sm)',
                            fontSize: '0.85rem',
                            fontWeight: 600,
                            cursor: isSettingDefault ? 'not-allowed' : 'pointer',
                            opacity: isSettingDefault ? 0.7 : 1
                        }}
                    >
                        {isSettingDefault ? '⏳ Setting...' : '✓ Set as Default'}
                    </button>
                )}
                <button
                    onClick={() => onEdit(address)}
                    style={{
                        padding: '0.5rem 1rem',
                        background: 'var(--primary)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                    }}
                >
                    ✏️ Edit
                </button>
                <button
                    onClick={handleDelete}
                    disabled={isDeleting}
                    style={{
                        padding: '0.5rem 1rem',
                        background: 'var(--danger)',
                        color: 'white',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                        cursor: isDeleting ? 'not-allowed' : 'pointer',
                        opacity: isDeleting ? 0.7 : 1
                    }}
                >
                    {isDeleting ? '⏳ Deleting...' : '🗑️ Delete'}
                </button>
            </div>
        </div>
    );
};

export default AddressCard;
