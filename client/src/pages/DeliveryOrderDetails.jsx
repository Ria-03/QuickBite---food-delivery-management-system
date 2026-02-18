import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
    MapPin,
    Navigation,
    ArrowLeft,
    CheckCircle,
    Phone,
    Map
} from 'lucide-react';
import io from 'socket.io-client';
import SwipeButton from '../components/SwipeButton';
import DeliveryMap from '../components/DeliveryMap';
import DeliveryLayout from '../components/DeliveryLayout';

const socket = io('http://localhost:5000');

const DeliveryOrderDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, token } = useAuth();
    const { showToast } = useToast();

    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

    const authToken = token || localStorage.getItem('token');

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const config = { headers: { Authorization: `Bearer ${authToken}` } };
                const { data } = await axios.get(`http://localhost:5000/api/orders/${id}`, config);
                setOrder(data);
                setLoading(false);
            } catch (error) {
                console.error(error);
                showToast('Failed to load order details', 'error');
                navigate('/delivery/dashboard');
            }
        };
        fetchOrder();

        // Socket logic
        if (socket.connected && user?._id) {
            socket.emit('join_room', `delivery_${user._id}`);
        }

        socket.on('order_status_update', (updatedOrder) => {
            if (updatedOrder._id === id) {
                setOrder(updatedOrder);
                showToast(`Order status updated: ${updatedOrder.status.replace('_', ' ').toUpperCase()}`, 'info');
                if (updatedOrder.status === 'delivered') {
                    setTimeout(() => navigate('/delivery/dashboard'), 2000);
                }
            }
        });

        return () => {
            socket.off('order_status_update');
        };
    }, [id, authToken, navigate, showToast, user?._id]);

    const updateStatus = async (newStatus) => {
        try {
            const config = { headers: { Authorization: `Bearer ${authToken}` } };
            await axios.put(`http://localhost:5000/api/orders/${id}/status`, { status: newStatus }, config);
            showToast(`Status updated: ${newStatus.replace('_', ' ').toUpperCase()}`, 'success');

            setOrder(prev => ({ ...prev, status: newStatus }));

            if (newStatus === 'delivered') {
                setTimeout(() => navigate('/delivery/dashboard'), 2000);
            }
        } catch (error) {
            showToast('Update failed', 'error');
        }
    };

    if (loading) return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
            <div className="spinner" style={{ width: '40px', height: '40px', borderTopColor: 'var(--primary)', borderRadius: '50%', border: '4px solid var(--gray-light)', animation: 'spin 1s linear infinite' }}></div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    if (!order) return null;

    return (
        <DeliveryLayout>
            <div className="animate-fade-in">
                <header className="fade-up" style={{ marginBottom: '2rem' }}>
                    <button
                        onClick={() => navigate('/delivery/dashboard')}
                        style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--gray)', cursor: 'pointer', marginBottom: '1rem', fontWeight: 600, fontSize: '0.9rem', transition: 'color 0.2s' }}
                        onMouseOver={(e) => e.target.style.color = 'var(--primary)'}
                        onMouseOut={(e) => e.target.style.color = 'var(--gray)'}
                    >
                        <ArrowLeft size={18} /> Back to Dashboard
                    </button>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--secondary)', letterSpacing: '-0.5px' }}>Order #{order._id.slice(-6).toUpperCase()}</h1>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
                                <span className={`badge ${order.status === 'picked_up' ? 'badge-info' : 'badge-warning'}`} style={{ fontSize: '0.85rem' }}>
                                    {order.status.replace('_', ' ').toUpperCase()}
                                </span>
                                <span style={{ color: 'var(--gray)', fontWeight: 500, fontSize: '0.9rem' }}>{new Date(order.createdAt).toLocaleString()}</span>
                            </div>
                        </div>
                        <div className="card glass-card" style={{ padding: '0.75rem 1.5rem', border: '1px solid rgba(255,255,255,0.5)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                            <p style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Estimated Earning</p>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--primary)', margin: 0 }}>₹{(order.totalAmount * 0.1).toFixed(0)}</h2>
                        </div>
                    </div>
                </header>

                <div className="fade-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '2rem', animationDelay: '0.1s' }}>
                    {/* Left Column: Details */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {/* Restaurant Card */}
                        <div className="card hover-glow" style={{ borderLeft: '4px solid var(--primary)', padding: '1.5rem' }}>
                            <div style={{ display: 'flex', gap: '1.5rem' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <MapPin size={24} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ margin: 0, color: 'var(--secondary)', fontSize: '1.1rem', fontWeight: 700 }}>{order.restaurant?.name}</h3>
                                    <p style={{ color: 'var(--gray)', margin: '4px 0 1rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                        {order.restaurant?.address?.street}, {order.restaurant?.address?.city}, {order.restaurant?.address?.zipCode}
                                    </p>
                                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${order.restaurant?.address?.street}, ${order.restaurant?.address?.city}`)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-outline"
                                            style={{ padding: '8px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', color: 'inherit', borderRadius: '8px' }}
                                        >
                                            <Map size={16} /> Navigate
                                        </a>
                                        <a
                                            href={order.restaurant?.phone ? `tel:${order.restaurant.phone}` : '#'}
                                            className="btn btn-outline"
                                            onClick={(e) => {
                                                if (!order.restaurant?.phone) {
                                                    e.preventDefault();
                                                    showToast('Phone number not available', 'info');
                                                }
                                            }}
                                            style={{ padding: '8px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', color: 'inherit', opacity: order.restaurant?.phone ? 1 : 0.5, cursor: order.restaurant?.phone ? 'pointer' : 'not-allowed', borderRadius: '8px' }}
                                        >
                                            <Phone size={16} /> Call
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Customer Card */}
                        <div className="card hover-glow" style={{ borderLeft: '4px solid var(--success)', padding: '1.5rem' }}>
                            <div style={{ display: 'flex', gap: '1.5rem' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <Navigation size={24} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ margin: 0, color: 'var(--secondary)', fontSize: '1.1rem', fontWeight: 700 }}>{order.customer?.name}</h3>
                                    <p style={{ color: 'var(--gray)', margin: '4px 0 1rem', fontSize: '0.9rem', lineHeight: '1.5' }}>
                                        {order.customer?.address?.street}, {order.customer?.address?.city}, {order.customer?.address?.zipCode}
                                    </p>
                                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                        <a
                                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${order.customer?.address?.street}, ${order.customer?.address?.city}`)}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="btn btn-outline"
                                            style={{ padding: '8px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', color: 'inherit', borderRadius: '8px' }}
                                        >
                                            <Map size={16} /> Navigate
                                        </a>
                                        <a
                                            href={order.customer?.phone ? `tel:${order.customer.phone}` : '#'}
                                            className="btn btn-outline"
                                            onClick={(e) => {
                                                if (!order.customer?.phone) {
                                                    e.preventDefault();
                                                    showToast('Phone number not available', 'info');
                                                }
                                            }}
                                            style={{ padding: '8px 14px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', color: 'inherit', opacity: order.customer?.phone ? 1 : 0.5, cursor: order.customer?.phone ? 'pointer' : 'not-allowed', borderRadius: '8px' }}
                                        >
                                            <Phone size={16} /> Call
                                        </a>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Order Items */}
                        <div className="card" style={{ padding: '1.5rem' }}>
                            <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem', color: 'var(--secondary)', fontWeight: 700 }}>Order Manifesto</h3>
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {order.items.map((item, idx) => (
                                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.8rem 0', borderBottom: '1px solid var(--gray-light)' }}>
                                        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                            <div style={{ width: '28px', height: '28px', background: 'var(--bg-secondary)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', color: 'var(--secondary)' }}>
                                                {item.quantity}x
                                            </div>
                                            <span style={{ fontWeight: 600, color: 'var(--secondary)', fontSize: '0.95rem' }}>{item.name}</span>
                                        </div>
                                        <span style={{ color: 'var(--gray)', fontWeight: 600 }}>₹{item.price * item.quantity}</span>
                                    </div>
                                ))}
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '2px dashed var(--gray-light)' }}>
                                <span style={{ fontWeight: 800, color: 'var(--gray)', fontSize: '0.9rem' }}>TOTAL VALUE</span>
                                <span style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--secondary)' }}>₹{order.totalAmount}</span>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Actions */}
                    <div>
                        <div className="card glass-card" style={{ position: 'sticky', top: '2rem', padding: '2rem', border: '1px solid rgba(255,255,255,0.6)', boxShadow: '0 8px 30px rgba(0,0,0,0.05)' }}>
                            <h3 style={{ marginBottom: '1.5rem', textAlign: 'center', fontWeight: 800, color: 'var(--secondary)' }}>Workflow Actions</h3>

                            {order.status !== 'picked_up' && order.status !== 'delivered' && (
                                <div style={{ marginTop: '1rem' }}>
                                    <SwipeButton
                                        text="Swipe to Pickup"
                                        onConfirm={() => updateStatus('picked_up')}
                                        color="var(--primary)"
                                    />
                                </div>
                            )}

                            {order.status === 'picked_up' && (
                                <div style={{ marginTop: '1rem' }}>
                                    <SwipeButton
                                        text="Swipe to Deliver"
                                        onConfirm={() => updateStatus('delivered')}
                                        color="var(--success)"
                                    />
                                </div>
                            )}

                            {order.status === 'delivered' && (
                                <div style={{ padding: '2rem 1.5rem', background: '#ecfdf5', borderRadius: '12px', textAlign: 'center', border: '1px dashed #059669' }}>
                                    <CheckCircle size={48} style={{ color: 'var(--success)', marginBottom: '1rem' }} />
                                    <h4 style={{ color: '#065f46', margin: '0 0 0.5rem', fontSize: '1.2rem', fontWeight: 700 }}>Mission Complete!</h4>
                                    <p style={{ color: '#047857', fontSize: '0.9rem' }}>Great job. Payment has been credited.</p>
                                </div>
                            )}

                            {/* Live Route Map */}
                            {order.status !== 'delivered' && order.restaurant?.location?.coordinates && order.customer?.location?.coordinates && (
                                <div style={{ marginTop: '2rem', height: '300px', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--gray-light)', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.05)' }}>
                                    <DeliveryMap
                                        pickupLocation={[order.restaurant.location.coordinates[1], order.restaurant.location.coordinates[0]]}
                                        dropLocation={[order.customer.location.coordinates[1], order.customer.location.coordinates[0]]}
                                    />
                                </div>
                            )}

                            <div style={{ marginTop: '2rem', background: 'rgba(255,255,255,0.5)', padding: '1rem', borderRadius: '8px' }}>
                                <h4 style={{ fontSize: '0.75rem', color: 'var(--gray)', marginBottom: '0.75rem', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Instructions</h4>
                                <ul style={{ fontSize: '0.85rem', color: '#64748b', paddingLeft: '1.2rem', lineHeight: '1.6', margin: 0 }}>
                                    <li>Verify all items before leaving the restaurant.</li>
                                    <li>Ensure food is kept warm/cold as appropriate.</li>
                                    <li>Contact customer if address is unclear.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </DeliveryLayout>
    );
};

export default DeliveryOrderDetails;
