import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerLayout from '../components/CustomerLayout';
import { Package, MapPin, Repeat } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const History = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/orders/my', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                // Filter for History: Delivered or Cancelled
                const historyOrders = response.data.filter(order =>
                    ['delivered', 'cancelled'].includes(order.status)
                );
                setOrders(historyOrders);
            } catch (error) {
                console.error('Error fetching orders:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchOrders();
        }
    }, [user]);

    const getStatusColor = (status) => {
        const colors = {
            'delivered': '#4CAF50',
            'cancelled': '#f44336'
        };
        return colors[status] || '#666';
    };

    if (loading) {
        return (
            <CustomerLayout>
                <div style={{ padding: '3rem', textAlign: 'center' }}>
                    <div className="spinner" style={{ width: '50px', height: '50px', border: '5px solid var(--gray-light)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1.5rem' }}></div>
                    <h2 style={{ color: 'var(--secondary)', fontWeight: 800 }}>Loading History...</h2>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            </CustomerLayout>
        );
    }

    return (
        <CustomerLayout>
            <div style={{ padding: '3rem', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ marginBottom: '3rem' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>Order History</h1>
                    <p style={{ color: 'var(--gray)', fontSize: '1.1rem', fontWeight: 600 }}>
                        View your past orders
                    </p>
                </div>

                {orders.length === 0 ? (
                    <div className="card" style={{ padding: '5rem 2rem', textAlign: 'center' }}>
                        <Package size={64} style={{ margin: '0 auto 1.5rem', display: 'block', color: 'var(--gray-light)' }} />
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>No Past Orders</h3>
                        <p style={{ color: 'var(--gray)', fontWeight: 600, marginBottom: '2rem' }}>
                            Your completed orders will appear here.
                        </p>
                        <button
                            className="btn btn-primary"
                            onClick={() => navigate('/home')}
                            style={{ padding: '1rem 2rem', fontSize: '1rem', fontWeight: 800 }}
                        >
                            Browse Restaurants
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {orders.map(order => (
                            <div key={order._id} className="card" style={{ padding: '2rem', background: '#f9fafb' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.3rem', fontWeight: 900, marginBottom: '0.5rem', color: 'var(--gray)' }}>
                                            Order #{order._id.slice(-6).toUpperCase()}
                                        </h3>
                                        <p style={{ color: 'var(--gray)', fontWeight: 600 }}>
                                            {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                                day: 'numeric', month: 'short', year: 'numeric'
                                            })} • {order.restaurant?.name || 'Restaurant'}
                                        </p>
                                    </div>
                                    <div style={{
                                        padding: '0.5rem 1rem',
                                        borderRadius: '8px',
                                        background: `${getStatusColor(order.status)}20`,
                                        color: getStatusColor(order.status),
                                        fontWeight: 800,
                                        fontSize: '0.9rem',
                                        textTransform: 'uppercase'
                                    }}>
                                        {order.status}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Package size={18} color="var(--gray)" />
                                        <span style={{ fontWeight: 600, color: 'var(--secondary)' }}>
                                            {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ').slice(0, 50)}
                                            {order.items.length > 2 ? '...' : ''}
                                        </span>
                                    </div>
                                </div>

                                <div style={{
                                    borderTop: '1px solid var(--gray-light)',
                                    paddingTop: '1.5rem',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <div>
                                        <span style={{ color: 'var(--gray)', fontWeight: 600, marginRight: '0.5rem' }}>Total:</span>
                                        <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--secondary)' }}>
                                            ₹{order.finalAmount || order.totalAmount}
                                        </span>
                                    </div>
                                    <button
                                        className="btn"
                                        style={{
                                            padding: '0.75rem 1.5rem',
                                            fontWeight: 700,
                                            background: 'var(--white)',
                                            border: '1px solid var(--primary)',
                                            color: 'var(--primary)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}
                                        onClick={() => navigate(`/restaurant/${order.restaurant._id}`)}
                                    >
                                        <Repeat size={16} /> Reorder
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </CustomerLayout>
    );
};

export default History;
