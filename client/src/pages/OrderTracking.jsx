import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { useToast } from '../context/ToastContext';
import CustomerLayout from '../components/CustomerLayout';
import { ClipboardList, Store, ChefHat, Package, Bike, CheckCircle } from 'lucide-react';

const socket = io('http://localhost:5000');

const OrderTracking = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchOrderDetails();

        socket.emit('join_room', id);
        socket.on('order_status_update', (updatedOrder) => {
            if (updatedOrder._id === id) {
                setOrder(updatedOrder);
                showToast(`Order Status: ${updatedOrder.status.replace('_', ' ').toUpperCase()}`, 'info');
            }
        });

        return () => {
            socket.off('order_status_update');
        };
    }, [id]);

    const fetchOrderDetails = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await axios.get(`http://localhost:5000/api/orders/${id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setOrder(data);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching order:', error);
            showToast('Failed to load tracking details.', 'error');
            setLoading(false);
        }
    };

    const statusSteps = [
        { key: 'placed', label: 'Order Placed', icon: <ClipboardList size={24} /> },
        { key: 'accepted', label: 'Accepted', icon: <Store size={24} /> },
        { key: 'preparing', label: 'Preparing', icon: <ChefHat size={24} /> },
        { key: 'ready', label: 'Ready for Pickup', icon: <Package size={24} /> },
        { key: 'picked_up', label: 'On the Way', icon: <Bike size={24} /> },
        { key: 'delivered', label: 'Delivered', icon: <CheckCircle size={24} /> }
    ];

    const currentStepIndex = statusSteps.findIndex(s => s.key === order?.status);

    if (loading) return (
        <CustomerLayout>
            <div className="container" style={{ padding: '10rem', textAlign: 'center' }}>
                <h2>Locating your order...</h2>
            </div>
        </CustomerLayout>
    );

    if (!order) return (
        <CustomerLayout>
            <div className="container" style={{ padding: '10rem', textAlign: 'center' }}>
                <h2>Order not found</h2>
                <button className="btn btn-primary" onClick={() => navigate('/')}>Back Home</button>
            </div>
        </CustomerLayout>
    );

    return (
        <CustomerLayout>
            <div style={{ background: 'var(--bg-main)', minHeight: '100vh', paddingBottom: '5rem' }}>
                <div className="top-navbar">
                    <div className="top-nav-container">
                        <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                            Quick<span>Bite</span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Live Tracking</div>
                        <button className="btn" onClick={() => navigate('/')} style={{ background: 'transparent', border: 'none', color: 'var(--gray)' }}>← Home</button>
                    </div>
                </div>

                <div className="container" style={{ maxWidth: '900px' }}>
                    {/* Status Header */}
                    <div className="card" style={{ padding: '2.5rem', marginBottom: '2rem', textAlign: 'center', borderTop: '6px solid var(--primary)' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '1.5px' }}>
                            Estimated Delivery: 25-35 mins
                        </span>
                        <h1 style={{ fontSize: '2.5rem', margin: '1rem 0', fontWeight: 900 }}>
                            {order.status === 'delivered' ? 'Enjoy your meal! 🍱' : 'Walking to your door...'}
                        </h1>
                        <p style={{ color: 'var(--gray)', fontWeight: 600 }}>Order ID: #{order._id.slice(-8).toUpperCase()}</p>
                    </div>

                    {/* Timeline Section */}
                    <div className="card" style={{ padding: '3rem', marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
                            {/* Progress Line */}
                            <div style={{
                                position: 'absolute',
                                top: '25px',
                                left: '5%',
                                right: '5%',
                                height: '4px',
                                background: 'var(--gray-light)',
                                zIndex: 0
                            }}>
                                <div style={{
                                    height: '100%',
                                    background: 'var(--primary)',
                                    width: `${(currentStepIndex / (statusSteps.length - 1)) * 100}%`,
                                    transition: 'width 1s ease-in-out'
                                }}></div>
                            </div>

                            {statusSteps.map((step, index) => {
                                const isCompleted = index <= currentStepIndex;
                                const isCurrent = index === currentStepIndex;

                                return (
                                    <div key={step.key} style={{ zIndex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '80px' }}>
                                        <div style={{
                                            width: '50px',
                                            height: '50px',
                                            borderRadius: '50%',
                                            background: isCompleted ? 'var(--primary)' : '#fff',
                                            border: `3px solid ${isCompleted ? 'var(--primary)' : 'var(--gray-light)'}`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '1.5rem',
                                            boxShadow: isCurrent ? '0 0 0 6px var(--primary-light)' : 'none',
                                            transition: 'all 0.3s'
                                        }}>
                                            {step.icon}
                                        </div>
                                        <span style={{
                                            fontSize: '0.75rem',
                                            fontWeight: 800,
                                            color: isCompleted ? 'var(--secondary)' : 'var(--gray)',
                                            textTransform: 'uppercase'
                                        }}>
                                            {step.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
                        {/* Order Details */}
                        <div className="card" style={{ padding: '2rem' }}>
                            <h3 style={{ marginBottom: '1.5rem' }}>Order Details</h3>
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {order.items.map((item, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600 }}>
                                        <span>{item.quantity}x {item.name}</span>
                                        <span>₹{item.price * item.quantity}</span>
                                    </div>
                                ))}
                                <div style={{ borderTop: '1px solid var(--gray-light)', paddingTop: '1rem', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.1rem' }}>
                                    <span>Total Paid</span>
                                    <span style={{ color: 'var(--primary)' }}>₹{order.totalAmount}</span>
                                </div>
                            </div>
                        </div>

                        {/* Delivery Partner Details */}
                        <div className="card" style={{ padding: '2rem' }}>
                            <h3 style={{ marginBottom: '1.5rem' }}>Delivery Info</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--gray-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>
                                    👨‍🚀
                                </div>
                                <div>
                                    <h4 style={{ margin: 0 }}>{order.deliveryPartner?.name || 'Assigning Partner...'}</h4>
                                    <p style={{ margin: '4px 0 0', color: 'var(--gray)', fontSize: '0.9rem', fontWeight: 600 }}>Your delivery superhero</p>
                                </div>
                            </div>
                            {order.deliveryPartner && (
                                <button className="btn btn-secondary" style={{ width: '100%', marginTop: '1.5rem' }}>📞 Contact Partner</button>
                            )}
                            {!order.deliveryPartner && (
                                <div style={{ marginTop: '1.5rem', padding: '1rem', background: 'var(--gray-light)', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: 'var(--gray)', fontWeight: 600 }}>
                                    ✨ We're selecting the best delivery partner for your luxury meal.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </CustomerLayout>
    );
};

export default OrderTracking;
