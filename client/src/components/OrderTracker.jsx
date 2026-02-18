import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import axios from 'axios';
import io from 'socket.io-client';

const socket = io('http://localhost:5000');

const OrderTracker = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        fetchActiveOrders();
        socket.on('order_status_update', (updatedOrder) => {
            setOrders(prev => prev.map(o => o._id === updatedOrder._id ? updatedOrder : o));
        });
        socket.on('new_order', () => fetchActiveOrders());
        return () => {
            socket.off('order_status_update');
            socket.off('new_order');
        };
    }, []);

    const fetchActiveOrders = async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const { data } = await axios.get('http://localhost:5000/api/orders/my', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrders(Array.isArray(data) ? data.filter(o => !['delivered', 'cancelled'].includes(o.status)) : []);
            setLoading(false);
        } catch (err) {
            if (err.response?.status === 401) {
                // Silently clear stale auth data if backend says unauthorized
                // This stops the infinite loop of failing requests
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            } else {
                console.error('OrderTracker Sync Error:', err.message);
            }
            setLoading(false);
        }
    };

    const getStatusStep = (status) => {
        const steps = ['placed', 'accepted', 'preparing', 'ready', 'picked_up', 'delivered'];
        return steps.indexOf(status);
    };

    if (loading || orders.length === 0) return null;

    return (
        <div style={{ marginBottom: '3rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0 }}>Active Orders</h3>
                <div className="shimmer" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px #4ade80', marginLeft: 'auto' }}></div>
                <span style={{ fontSize: '0.75rem', color: 'var(--success)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Live Updates</span>
            </div>
            <div style={{ display: 'grid', gap: '1.5rem' }}>
                {orders.map(order => (
                    <div key={order._id} className="card" style={{ padding: '1.5rem', background: '#fff', borderLeft: '6px solid var(--primary)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <div>
                                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '1px' }}>
                                    Active Order • #{order._id.slice(-6).toUpperCase()}
                                </span>
                                <h4 style={{ fontSize: '1.25rem', marginTop: '4px' }}>{order.restaurant?.name || 'QuickBite Partner'}</h4>
                            </div>
                            <button
                                className="btn btn-primary"
                                style={{ padding: '0.5rem 1rem', fontSize: '0.8rem' }}
                                onClick={() => navigate(`/order/${order._id}`)}
                            >
                                Track Order <ArrowRight size={16} />
                            </button>
                        </div>

                        {/* Visual Progressbar */}
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '0.5rem' }}>
                            {[1, 2, 3, 4, 5].map((step) => {
                                const currentStep = getStatusStep(order.status);
                                const isActive = currentStep >= step - 1;
                                return (
                                    <div key={step} style={{
                                        flex: 1,
                                        height: '4px',
                                        borderRadius: '2px',
                                        background: isActive ? 'var(--primary)' : 'var(--gray-light)',
                                        transition: 'all 0.5s ease'
                                    }}></div>
                                );
                            })}
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--gray)', fontWeight: 600 }}>
                            <span>PLACED</span>
                            <span>READY</span>
                            <span>ON THE WAY</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default OrderTracker;
