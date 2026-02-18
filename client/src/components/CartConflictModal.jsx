import { useCart } from '../context/CartContext';
import { AlertTriangle, X } from 'lucide-react';

const CartConflictModal = () => {
    const { conflictState, resolveConflict } = useCart();

    if (!conflictState.isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
        }}>
            <div style={{
                background: 'white',
                borderRadius: '16px',
                padding: '2rem',
                width: '90%',
                maxWidth: '400px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                position: 'relative',
                textAlign: 'center'
            }}>
                <button
                    onClick={() => resolveConflict(false)}
                    style={{
                        position: 'absolute',
                        top: '1rem',
                        right: '1rem',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--gray)'
                    }}
                >
                    <X size={24} />
                </button>

                <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: '#FEF3C7',
                    color: '#D97706',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto 1.5rem'
                }}>
                    <AlertTriangle size={32} />
                </div>

                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem', color: '#1F2937' }}>
                    Start New Basket?
                </h3>

                <p style={{ color: '#6B7280', marginBottom: '2rem', lineHeight: 1.5 }}>
                    Your cart contains items from another restaurant. Would you like to clear your current cart and add this item?
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <button
                        onClick={() => resolveConflict(false)}
                        style={{
                            padding: '0.8rem',
                            borderRadius: '8px',
                            border: '1px solid #E5E7EB',
                            background: 'white',
                            color: '#374151',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: '1rem'
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={() => resolveConflict(true)}
                        style={{
                            padding: '0.8rem',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'var(--primary)',
                            color: 'white',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: '1rem'
                        }}
                    >
                        New Basket
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CartConflictModal;
