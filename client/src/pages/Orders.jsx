import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerLayout from '../components/CustomerLayout';
import { Package, Clock, MapPin, CheckCircle } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Orders = () => {
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
                // Filter for Active Orders: Not Delivered or Cancelled
                const activeOrders = response.data.filter(order =>
                    !['delivered', 'cancelled'].includes(order.status)
                );
                setOrders(activeOrders);
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
            'pending': '#ff7e06',
            'confirmed': '#4CAF50',
            'preparing': '#2196F3',
            'out_for_delivery': '#9C27B0',
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
                    <h2 style={{ color: 'var(--secondary)', fontWeight: 800 }}>Loading Orders...</h2>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            </CustomerLayout>
        );
    }

    return (
        <CustomerLayout>
            <div style={{ padding: '3rem', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ marginBottom: '3rem' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>My Orders</h1>
                    <p style={{ color: 'var(--gray)', fontSize: '1.1rem', fontWeight: 600 }}>
                        Track and manage your orders
                    </p>
                </div>

                {orders.length === 0 ? (
                    <div className="card" style={{ padding: '5rem 2rem', textAlign: 'center' }}>
                        <Package size={64} style={{ margin: '0 auto 1.5rem', display: 'block', color: 'var(--gray-light)' }} />
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>No Orders Yet</h3>
                        <p style={{ color: 'var(--gray)', fontWeight: 600, marginBottom: '2rem' }}>
                            Start ordering from your favorite restaurants!
                        </p>
                        <button
                            className="btn btn-primary"
                            onClick={() => window.location.href = '/home'}
                            style={{ padding: '1rem 2rem', fontSize: '1rem', fontWeight: 800 }}
                        >
                            Browse Restaurants
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {orders.map(order => (
                            <div key={order._id} className="card hover-glow" style={{ padding: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.3rem', fontWeight: 900, marginBottom: '0.5rem' }}>
                                            Order #{order._id.slice(-6).toUpperCase()}
                                        </h3>
                                        <p style={{ color: 'var(--gray)', fontWeight: 600 }}>
                                            {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                    <div style={{
                                        padding: '0.5rem 1rem',
                                        borderRadius: '8px',
                                        background: `${getStatusColor(order.status)}20`,
                                        color: getStatusColor(order.status),
                                        fontWeight: 800,
                                        fontSize: '0.9rem',
                                        textTransform: 'capitalize'
                                    }}>
                                        {order.status.replace('_', ' ')}
                                    </div>
                                </div>

                                <div style={{ display: 'flex', gap: '2rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Package size={18} color="var(--primary)" />
                                        <span style={{ fontWeight: 600 }}>{order.items?.length || 0} items</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <MapPin size={18} color="var(--primary)" />
                                        <span style={{ fontWeight: 600 }}>{order.deliveryAddress?.street || 'N/A'}</span>
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
                                        <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary)' }}>
                                            ₹{order.totalAmount || 0}
                                        </span>
                                    </div>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => navigate(`/order/${order._id}`)}
                                        style={{ padding: '0.75rem 1.5rem', fontWeight: 800 }}
                                    >
                                        Track Order
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

export default Orders;
