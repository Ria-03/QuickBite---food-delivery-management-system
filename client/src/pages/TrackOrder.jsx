import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import CustomerLayout from '../components/CustomerLayout';
import { Package, ChevronRight, Clock } from 'lucide-react';

const TrackOrder = () => {
    const navigate = useNavigate();
    const [activeOrders, setActiveOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchActiveOrders();
    }, []);

    const fetchActiveOrders = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get('http://localhost:5000/api/orders/my', {
                headers: { Authorization: `Bearer ${token}` }
            });
            // Filter only active orders
            const active = data.filter(o => ['placed', 'accepted', 'preparing', 'ready', 'picked_up'].includes(o.status));

            // If exactly one active order, redirect immediately
            if (active.length === 1) {
                navigate(`/order/${active[0]._id}`);
                return;
            }

            setActiveOrders(active);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching orders:', error);
            setLoading(false);
        }
    };

    if (loading) return (
        <CustomerLayout>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
                <div className="spinner"></div>
            </div>
        </CustomerLayout>
    );

    return (
        <CustomerLayout>
            <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
                <h1 style={{ marginBottom: '2rem', fontSize: '2rem', fontWeight: 800 }}>Track Your Orders</h1>

                {activeOrders.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                        <div style={{
                            width: '80px', height: '80px', background: 'var(--gray-light)',
                            borderRadius: '50%', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', margin: '0 auto 1.5rem', color: 'var(--gray)'
                        }}>
                            <Package size={40} />
                        </div>
                        <h3 style={{ marginBottom: '0.5rem' }}>No Active Orders</h3>
                        <p style={{ color: 'var(--gray)', marginBottom: '2rem' }}>You don't have any orders in progress right now.</p>
                        <button className="btn btn-primary" onClick={() => navigate('/')}>
                            Order Something Delicious
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                        <p style={{ color: 'var(--gray)', marginBottom: '1rem' }}>Select an order to track:</p>
                        {activeOrders.map(order => (
                            <div
                                key={order._id}
                                className="card"
                                onClick={() => navigate(`/order/${order._id}`)}
                                style={{
                                    padding: '1.5rem',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    transition: 'transform 0.2s',
                                    border: '1px solid var(--gray-light)'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                            >
                                <div>
                                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                                        <h3 style={{ margin: 0 }}>{order.restaurant.name}</h3>
                                        <span className={`status-badge ${order.status}`}>{order.status.replace('_', ' ')}</span>
                                    </div>
                                    <p style={{ color: 'var(--gray)', margin: 0, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <Clock size={14} />
                                        Ordered at {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                    <p style={{ marginTop: '0.5rem', fontWeight: 600 }}>
                                        {order.items.length} items • ₹{order.finalAmount}
                                    </p>
                                </div>
                                <div style={{
                                    width: '40px', height: '40px', borderRadius: '50%',
                                    background: 'var(--primary-light)', color: 'var(--primary)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    <ChevronRight size={24} />
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </CustomerLayout>
    );
};

export default TrackOrder;
