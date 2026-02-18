import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomerLayout from '../components/CustomerLayout';
import { Calendar, Clock, Package, Edit, Trash2, Pause, Play, X } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const ScheduledOrders = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [scheduledOrders, setScheduledOrders] = useState([]);
    const [recurringOrders, setRecurringOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('scheduled'); // 'scheduled' or 'recurring'

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        fetchOrders();
    }, [user, navigate]);

    const fetchOrders = async () => {
        try {
            const token = localStorage.getItem('token');

            // Fetch scheduled orders
            const scheduledRes = await axios.get('http://localhost:5000/api/scheduling/scheduled-orders', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setScheduledOrders(scheduledRes.data.orders || []);

            // Fetch recurring orders
            const recurringRes = await axios.get('http://localhost:5000/api/scheduling/recurring-orders', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRecurringOrders(recurringRes.data.recurringOrders || []);
        } catch (error) {
            console.error('Error fetching orders:', error);
            showToast('Failed to load orders', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelScheduled = async (orderId) => {
        if (!window.confirm('Are you sure you want to cancel this scheduled order?')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/scheduling/scheduled-orders/${orderId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showToast('Scheduled order cancelled', 'success');
            fetchOrders();
        } catch (error) {
            showToast('Failed to cancel order', 'error');
        }
    };

    const handleToggleRecurring = async (recurringId, currentStatus) => {
        const newStatus = currentStatus === 'active' ? 'paused' : 'active';

        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/scheduling/recurring-orders/${recurringId}`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            showToast(`Recurring order ${newStatus === 'active' ? 'resumed' : 'paused'}`, 'success');
            fetchOrders();
        } catch (error) {
            showToast('Failed to update recurring order', 'error');
        }
    };

    const handleCancelRecurring = async (recurringId) => {
        if (!window.confirm('Are you sure you want to cancel this recurring order? This will stop all future deliveries.')) return;

        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/scheduling/recurring-orders/${recurringId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showToast('Recurring order cancelled', 'success');
            fetchOrders();
        } catch (error) {
            showToast('Failed to cancel recurring order', 'error');
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleString('en-IN', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getFrequencyLabel = (frequency) => {
        const labels = {
            daily: 'Daily',
            weekly: 'Weekly',
            biweekly: 'Bi-weekly',
            monthly: 'Monthly'
        };
        return labels[frequency] || frequency;
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
                {/* Header */}
                <div style={{ marginBottom: '3rem' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>📅 Scheduled Orders</h1>
                    <p style={{ color: 'var(--gray)', fontSize: '1.1rem', fontWeight: 600 }}>
                        Manage your scheduled and recurring orders
                    </p>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem', borderBottom: '2px solid var(--gray-light)' }}>
                    <button
                        onClick={() => setActiveTab('scheduled')}
                        style={{
                            padding: '1rem 2rem',
                            background: 'none',
                            border: 'none',
                            borderBottom: `3px solid ${activeTab === 'scheduled' ? 'var(--primary)' : 'transparent'}`,
                            color: activeTab === 'scheduled' ? 'var(--primary)' : 'var(--gray)',
                            fontWeight: 700,
                            fontSize: '1rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        📅 One-Time Orders ({scheduledOrders.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('recurring')}
                        style={{
                            padding: '1rem 2rem',
                            background: 'none',
                            border: 'none',
                            borderBottom: `3px solid ${activeTab === 'recurring' ? 'var(--primary)' : 'transparent'}`,
                            color: activeTab === 'recurring' ? 'var(--primary)' : 'var(--gray)',
                            fontWeight: 700,
                            fontSize: '1rem',
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                        }}
                    >
                        🔄 Recurring Orders ({recurringOrders.length})
                    </button>
                </div>

                {/* Scheduled Orders Tab */}
                {activeTab === 'scheduled' && (
                    <div>
                        {scheduledOrders.length === 0 ? (
                            <div className="card" style={{ padding: '5rem 2rem', textAlign: 'center' }}>
                                <Calendar size={64} style={{ margin: '0 auto 1.5rem', display: 'block', color: 'var(--gray-light)' }} />
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>No Scheduled Orders</h3>
                                <p style={{ color: 'var(--gray)', fontWeight: 600, marginBottom: '2rem' }}>
                                    Schedule your next order for a future date and time
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
                                {scheduledOrders.map(order => (
                                    <div key={order._id} className="card" style={{ padding: '2rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                            <div>
                                                <h3 style={{ fontSize: '1.3rem', fontWeight: 900, marginBottom: '0.5rem' }}>
                                                    {order.restaurant?.name || 'Restaurant'}
                                                </h3>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--gray)', fontWeight: 600 }}>
                                                    <Clock size={16} />
                                                    <span>{formatDate(order.scheduledFor)}</span>
                                                </div>
                                            </div>
                                            <div style={{
                                                padding: '0.5rem 1rem',
                                                borderRadius: '8px',
                                                background: '#fef3c7',
                                                color: '#92400e',
                                                fontWeight: 800,
                                                fontSize: '0.9rem'
                                            }}>
                                                SCHEDULED
                                            </div>
                                        </div>

                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                                <Package size={18} color="var(--gray)" />
                                                <span style={{ fontWeight: 600 }}>
                                                    {order.items.length} item{order.items.length > 1 ? 's' : ''}
                                                </span>
                                            </div>
                                            <div style={{ color: 'var(--gray)', fontSize: '0.9rem' }}>
                                                {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
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
                                                <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--secondary)' }}>
                                                    ₹{order.finalAmount || order.totalAmount}
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => handleCancelScheduled(order._id)}
                                                style={{
                                                    padding: '0.75rem 1.5rem',
                                                    background: '#fee2e2',
                                                    color: '#dc2626',
                                                    border: 'none',
                                                    borderRadius: 'var(--radius-md)',
                                                    fontWeight: 700,
                                                    cursor: 'pointer',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.5rem'
                                                }}
                                            >
                                                <X size={16} /> Cancel
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Recurring Orders Tab */}
                {activeTab === 'recurring' && (
                    <div>
                        {recurringOrders.length === 0 ? (
                            <div className="card" style={{ padding: '5rem 2rem', textAlign: 'center' }}>
                                <Package size={64} style={{ margin: '0 auto 1.5rem', display: 'block', color: 'var(--gray-light)' }} />
                                <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>No Recurring Orders</h3>
                                <p style={{ color: 'var(--gray)', fontWeight: 600, marginBottom: '2rem' }}>
                                    Set up a recurring order for weekly meal plans
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
                                {recurringOrders.map(order => (
                                    <div key={order._id} className="card" style={{ padding: '2rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                            <div>
                                                <h3 style={{ fontSize: '1.3rem', fontWeight: 900, marginBottom: '0.5rem' }}>
                                                    🔄 {getFrequencyLabel(order.frequency)} Meal Plan
                                                </h3>
                                                <div style={{ color: 'var(--gray)', fontWeight: 600 }}>
                                                    {order.restaurant?.name || 'Restaurant'}
                                                </div>
                                            </div>
                                            <div style={{
                                                padding: '0.5rem 1rem',
                                                borderRadius: '8px',
                                                background: order.status === 'active' ? '#d1fae5' : '#fee2e2',
                                                color: order.status === 'active' ? '#065f46' : '#dc2626',
                                                fontWeight: 800,
                                                fontSize: '0.9rem',
                                                textTransform: 'uppercase'
                                            }}>
                                                {order.status}
                                            </div>
                                        </div>

                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <div style={{ marginBottom: '0.75rem' }}>
                                                <strong>Items:</strong> {order.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}
                                            </div>
                                            <div style={{ marginBottom: '0.75rem' }}>
                                                <strong>Next Delivery:</strong> {formatDate(order.nextDelivery)}
                                            </div>
                                            <div>
                                                <strong>Orders Completed:</strong> {order.completedOrders}/{order.totalOrders || '∞'}
                                            </div>
                                        </div>

                                        <div style={{
                                            borderTop: '1px solid var(--gray-light)',
                                            paddingTop: '1.5rem',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                            flexWrap: 'wrap',
                                            gap: '1rem'
                                        }}>
                                            <div>
                                                <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--secondary)' }}>
                                                    ₹{order.finalAmount || order.totalAmount}
                                                </span>
                                                <span style={{ color: 'var(--gray)', fontSize: '0.9rem', marginLeft: '0.5rem' }}>
                                                    per order
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                                <button
                                                    onClick={() => handleToggleRecurring(order._id, order.status)}
                                                    style={{
                                                        padding: '0.75rem 1.5rem',
                                                        background: order.status === 'active' ? '#fef3c7' : '#d1fae5',
                                                        color: order.status === 'active' ? '#92400e' : '#065f46',
                                                        border: 'none',
                                                        borderRadius: 'var(--radius-md)',
                                                        fontWeight: 700,
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.5rem'
                                                    }}
                                                >
                                                    {order.status === 'active' ? <><Pause size={16} /> Pause</> : <><Play size={16} /> Resume</>}
                                                </button>
                                                <button
                                                    onClick={() => handleCancelRecurring(order._id)}
                                                    style={{
                                                        padding: '0.75rem 1.5rem',
                                                        background: '#fee2e2',
                                                        color: '#dc2626',
                                                        border: 'none',
                                                        borderRadius: 'var(--radius-md)',
                                                        fontWeight: 700,
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.5rem'
                                                    }}
                                                >
                                                    <Trash2 size={16} /> Cancel
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </CustomerLayout>
    );
};

export default ScheduledOrders;
