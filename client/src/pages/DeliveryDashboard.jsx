import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import io from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
    MapPin,
    Navigation,
    Clock,
    Wallet,
    Calendar,
    Bike,
    Inbox,
    TrendingUp,
    CheckCircle
} from 'lucide-react';
import DeliveryLayout from '../components/DeliveryLayout';
import SwipeButton from '../components/SwipeButton';

// Initialize Socket outside component to prevent re-connections
const socket = io('http://localhost:5000');

const DeliveryDashboard = () => {
    const { user, token, logout } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();

    const [availableOrders, setAvailableOrders] = useState([]);
    const [myDeliveries, setMyDeliveries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview'); // overview, available, history
    const [isOnline, setIsOnline] = useState(() => localStorage.getItem('riderStatus') !== 'offline');

    const toggleStatus = () => {
        const newStatus = !isOnline;
        setIsOnline(newStatus);
        localStorage.setItem('riderStatus', newStatus ? 'online' : 'offline');
        showToast(newStatus ? 'You are now ONLINE 🟢' : 'You are now OFFLINE 🔴', newStatus ? 'success' : 'info');
    };

    const authToken = token || localStorage.getItem('token');

    // Initial Fetch
    useEffect(() => {
        fetchData();

        const joinRooms = () => {
            if (user?._id) {
                console.log(`🔌 Joining Delivery Rooms: delivery_${user._id} & delivery_pool`);
                socket.emit('join_room', `delivery_${user._id}`);
                socket.emit('join_room', 'delivery_pool');
            }
        };

        // If already connected, join immediately
        if (socket.connected) {
            joinRooms();
        }

        // Socket Listeners
        socket.on('connect', () => {
            console.log('🔌 Delivery Dashboard Connected to Socket');
            joinRooms();
        });

        // 1. Listen for NEW AVAILABLE REQUESTS (Broadcasted to all)
        socket.on('delivery_new_request', (order) => {
            setAvailableOrders(prev => {
                if (prev.find(o => o._id === order._id)) return prev;
                showToast('New Delivery Request Available! 🛵', 'info');
                return [order, ...prev];
            });
        });

        // 2. Listen for STATUS UPDATES
        socket.on('order_status_update', (updatedOrder) => {
            console.log('🔔 Status Update:', updatedOrder.status);

            // A. Update "Available Orders" list
            if (['accepted', 'preparing', 'ready'].includes(updatedOrder.status) && !updatedOrder.deliveryPartner) {
                setAvailableOrders(prev => {
                    if (!prev.find(o => o._id === updatedOrder._id)) {
                        return [updatedOrder, ...prev];
                    }
                    return prev.map(o => o._id === updatedOrder._id ? updatedOrder : o);
                });
            } else {
                setAvailableOrders(prev => prev.filter(o => o._id !== updatedOrder._id));
            }

            // B. Update "My Deliveries" list
            if (updatedOrder.deliveryPartner === user?._id) {
                setMyDeliveries(prev => {
                    if (prev.find(o => o._id === updatedOrder._id)) {
                        return prev.map(o => o._id === updatedOrder._id ? updatedOrder : o);
                    }
                    return [updatedOrder, ...prev];
                });

                if (updatedOrder.status === 'ready') {
                    showToast(`Order #${updatedOrder._id.slice(-4)} is READY for pickup!`, 'success');
                }
            }
        });

        const interval = setInterval(fetchData, 60000);

        return () => {
            socket.off('connect');
            socket.off('new_order');
            socket.off('order_status_update');
            clearInterval(interval);
        };
    }, [authToken, user?._id]);

    const fetchData = async () => {
        try {
            const config = { headers: { Authorization: `Bearer ${authToken}` } };
            const [availRes, myRes] = await Promise.all([
                axios.get('http://localhost:5000/api/orders/delivery/available', config),
                axios.get('http://localhost:5000/api/orders/delivery/my', config)
            ]);
            setAvailableOrders(availRes.data);
            setMyDeliveries(myRes.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            if (error.response?.status === 401) {
                logout();
                navigate('/delivery/login');
            }
            if (loading) setLoading(false);
        }
    };

    const acceptOrder = async (order) => {
        try {
            const config = { headers: { Authorization: `Bearer ${authToken}` } };
            const statusToSent = order.status === 'placed' ? 'accepted' : order.status;
            await axios.put(`http://localhost:5000/api/orders/${order._id}/status`, { status: statusToSent }, config);
            showToast('Order Accepted! 🛵', 'success');
            setActiveTab('overview');
        } catch (error) {
            showToast(error.response?.data?.message || 'Failed to accept order', 'error');
        }
    };

    const getEarningsStats = () => {
        const delivered = myDeliveries.filter(o => o.status === 'delivered');
        const total = delivered.reduce((acc, o) => acc + (o.totalAmount * 0.1), 0);

        const today = new Date().toDateString();
        const todayEarnings = delivered
            .filter(o => new Date(o.createdAt).toDateString() === today)
            .reduce((acc, o) => acc + (o.totalAmount * 0.1), 0);

        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
        const weekEarnings = delivered
            .filter(o => new Date(o.createdAt) >= oneWeekAgo)
            .reduce((acc, o) => acc + (o.totalAmount * 0.1), 0);

        return { total, today: todayEarnings, week: weekEarnings, count: delivered.length };
    };

    const getChartData = () => {
        const days = 7;
        const data = [];
        const now = new Date();

        for (let i = days - 1; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const dayStr = d.toDateString();

            const dayTotal = myDeliveries
                .filter(o => o.status === 'delivered' && new Date(o.createdAt).toDateString() === dayStr)
                .reduce((acc, o) => acc + (o.totalAmount * 0.1), 0);

            data.push({
                day: d.toLocaleDateString('en-US', { weekday: 'short' }),
                amount: dayTotal
            });
        }
        return data;
    };

    if (loading) return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
            <div className="spinner" style={{ width: '40px', height: '40px', borderTopColor: 'var(--primary)', borderRadius: '50%', border: '4px solid var(--gray-light)', animation: 'spin 1s linear infinite' }}></div>
        </div>
    );

    const stats = getEarningsStats();
    const activeTasks = myDeliveries.filter(o => o.status !== 'delivered');
    const chartData = getChartData();
    const maxChartVal = Math.max(...chartData.map(d => d.amount), 100);

    return (
        <DeliveryLayout>
            <div className="animate-fade-in">
                {/* Header Section */}
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2.5rem' }}>
                    <div>
                        <h1 className="animate-slide-up" style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--secondary)', letterSpacing: '-0.5px', marginBottom: '0.25rem' }}>
                            Delivery Console <span style={{ fontSize: '1.5rem' }}>🛵</span>
                        </h1>
                        <p className="animate-slide-up delay-100" style={{ color: 'var(--gray)', fontWeight: 500 }}>
                            Welcome back, <span style={{ color: 'var(--primary)', fontWeight: 600 }}>{user?.name?.split(' ')[0]}</span>
                        </p>
                    </div>

                    <div className="card animate-slide-up delay-100" style={{
                        padding: '0.75rem 1.25rem', display: 'flex', gap: '1.5rem', alignItems: 'center',
                        background: 'rgba(255, 255, 255, 0.8)', backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255,255,255,0.3)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)'
                    }}>
                        <div>
                            <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--gray)', fontWeight: 700, letterSpacing: '0.5px' }}>Today</p>
                            <h2 style={{ margin: 0, color: 'var(--primary)', fontSize: '1.25rem', fontWeight: 700 }}>₹{stats.today.toFixed(0)}</h2>
                        </div>
                        <div style={{ width: '1px', height: '24px', background: 'var(--gray-light)' }}></div>
                        <div>
                            <p style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--gray)', fontWeight: 700, letterSpacing: '0.5px' }}>Done</p>
                            <h2 style={{ margin: 0, color: 'var(--success)', fontSize: '1.25rem', fontWeight: 700 }}>{stats.count}</h2>
                        </div>
                    </div>
                </header>

                {/* Status & Tabs */}
                <div style={{ marginBottom: '2rem' }} className="animate-slide-up delay-200">
                    <div className="d-md-none card" style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: isOnline ? 'var(--success)' : 'var(--gray)', boxShadow: isOnline ? '0 0 10px var(--success)' : 'none' }}></div>
                            <span style={{ fontWeight: 600, color: 'var(--secondary)' }}>{isOnline ? 'Online' : 'Offline'}</span>
                        </div>
                        <button
                            className={`btn ${isOnline ? 'btn-outline' : 'btn-primary'}`}
                            onClick={toggleStatus}
                            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem', borderRadius: '8px' }}
                        >
                            {isOnline ? 'Go Offline' : 'Go Online'}
                        </button>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '4px' }}>
                        {[
                            { id: 'overview', label: `My Tasks (${activeTasks.length})` },
                            { id: 'available', label: `New Requests (${availableOrders.length})` },
                            { id: 'history', label: 'Earnings' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                className={`btn ${activeTab === tab.id ? 'btn-primary' : 'btn-outline'}`}
                                onClick={() => setActiveTab(tab.id)}
                                style={{
                                    padding: '0.6rem 1.25rem',
                                    borderRadius: '20px',
                                    fontSize: '0.9rem',
                                    border: activeTab === tab.id ? 'none' : '1px solid var(--gray-light)',
                                    background: activeTab === tab.id ? 'var(--primary)' : 'transparent',
                                    color: activeTab === tab.id ? 'white' : 'var(--gray)'
                                }}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Content Area */}
                <div className="animate-slide-up delay-300">
                    {/* MY TASKS TAB */}
                    {activeTab === 'overview' && (
                        <div>
                            {activeTasks.length === 0 ? (
                                <div className="card glass-card" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
                                    <div style={{ background: 'var(--bg-secondary)', width: '80px', height: '80px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
                                        <Bike size={40} style={{ color: 'var(--gray)' }} />
                                    </div>
                                    <h3 style={{ color: 'var(--secondary)', marginBottom: '0.5rem' }}>No Active Deliveries</h3>
                                    <p style={{ color: 'var(--gray)', marginBottom: '1.5rem', maxWidth: '300px', margin: '0 auto 1.5rem' }}>You're all caught up! Check the "New Requests" tab to accept more orders.</p>
                                    <button className="btn btn-primary" onClick={() => setActiveTab('available')}>Find Orders</button>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                                    {activeTasks.map((order, idx) => (
                                        <div key={order._id} className="card hover-glow animate-slide-up" style={{ animationDelay: `${idx * 0.1}s`, cursor: 'pointer', border: '1px solid var(--gray-light)' }} onClick={() => navigate(`/delivery/orders/${order._id}`)}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--gray-light)' }}>
                                                <span style={{ fontWeight: 700, color: 'var(--secondary)' }}>#{order._id.slice(-6).toUpperCase()}</span>
                                                <span className={`badge badge-warning`}>{order.status.replace('_', ' ').toUpperCase()}</span>
                                            </div>

                                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                                                <div style={{ background: 'var(--bg-secondary)', padding: '8px', borderRadius: '8px', height: 'fit-content' }}>
                                                    <MapPin size={18} color="var(--primary)" />
                                                </div>
                                                <div>
                                                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray)', textTransform: 'uppercase' }}>Pickup</p>
                                                    <p style={{ fontWeight: 600, color: 'var(--secondary)', margin: '2px 0' }}>{order.restaurant?.name}</p>
                                                    <p style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>{order.restaurant?.address?.city}</p>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                                                <div style={{ background: 'rgba(34, 197, 94, 0.1)', padding: '8px', borderRadius: '8px', height: 'fit-content' }}>
                                                    <Navigation size={18} color="var(--success)" />
                                                </div>
                                                <div>
                                                    <p style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gray)', textTransform: 'uppercase' }}>Drop</p>
                                                    <p style={{ fontWeight: 600, color: 'var(--secondary)', margin: '2px 0' }}>{order.customer?.name}</p>
                                                    <p style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>{order.customer?.address?.street}</p>
                                                </div>
                                            </div>

                                            <button className="btn btn-primary" style={{ width: '100%', borderRadius: '10px' }}>View Details</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* NEW REQUESTS TAB */}
                    {activeTab === 'available' && (
                        <div>
                            <div style={{ display: 'grid', gap: '1.5rem', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
                                {availableOrders.length === 0 ? (
                                    <div className="card" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', borderStyle: 'dashed', borderColor: 'var(--gray-light)' }}>
                                        <Search size={32} style={{ color: 'var(--gray)', marginBottom: '1rem', opacity: 0.5 }} />
                                        <p style={{ color: 'var(--gray)' }}>No new orders found in your area right now.</p>
                                    </div>
                                ) : (
                                    availableOrders.map((order, idx) => (
                                        <div key={order._id} className="card hover-glow animate-slide-up" style={{ animationDelay: `${idx * 0.1}s`, border: '1px solid var(--gray-light)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                                <h3 style={{ margin: 0, color: 'var(--secondary)', fontSize: '1.1rem' }}>{order.restaurant?.name}</h3>
                                                <span style={{ fontWeight: 800, color: 'var(--success)', background: 'rgba(34, 197, 94, 0.1)', padding: '2px 8px', borderRadius: '6px' }}>
                                                    +₹{(order.totalAmount * 0.1).toFixed(0)}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.75rem', color: 'var(--gray)', fontSize: '0.9rem', marginBottom: '1.5rem', alignItems: 'center' }}>
                                                <span className="badge badge-info is-light" style={{ fontSize: '0.75rem' }}>{order.restaurant?.address?.city}</span>
                                                <span style={{ width: '4px', height: '4px', background: 'var(--gray)', borderRadius: '50%' }}></span>
                                                <span>{order.items.length} items</span>
                                            </div>
                                            <SwipeButton
                                                text="Swipe to Accept"
                                                onConfirm={() => acceptOrder(order)}
                                                color="var(--success)"
                                            />
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* EARNINGS TAB */}
                    {activeTab === 'history' && (
                        <div style={{ display: 'grid', gap: '2rem' }}>
                            {/* Metrics */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
                                {[
                                    { title: 'Total Balance', value: stats.total, icon: Wallet, color: '#10b981', bg: 'rgba(16, 185, 129, 0.1)' },
                                    { title: 'Today', value: stats.today, icon: Clock, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
                                    { title: 'This Week', value: stats.week, icon: Calendar, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)' },
                                    { title: 'Completed', value: stats.count, icon: TrendingUp, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.1)', isCount: true }
                                ].map((metric, idx) => (
                                    <div key={idx} className="card glass-card hover-glow" style={{ padding: '1.5rem', border: '1px solid rgba(255,255,255,0.5)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: metric.bg, color: metric.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <metric.icon size={20} />
                                            </div>
                                            <p style={{ fontWeight: 700, color: 'var(--gray)', fontSize: '0.75rem', textTransform: 'uppercase' }}>{metric.title}</p>
                                        </div>
                                        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--secondary)', margin: 0 }}>
                                            {metric.isCount ? metric.value : `₹${metric.value.toFixed(2)}`}
                                        </h2>
                                    </div>
                                ))}
                            </div>

                            {/* Chart */}
                            <div className="card glass-card" style={{ padding: '2rem', border: '1px solid rgba(255,255,255,0.5)' }}>
                                <h3 style={{ marginBottom: '2rem', fontSize: '1.1rem', color: 'var(--secondary)' }}>Weekly Revenue</h3>
                                <div style={{ height: '200px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '0.5rem' }}>
                                    {chartData.map((data, idx) => {
                                        const height = (data.amount / maxChartVal) * 100;
                                        return (
                                            <div key={idx} style={{ flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }}>
                                                <div
                                                    style={{
                                                        height: `${height}%`,
                                                        background: 'linear-gradient(to top, var(--primary) 0%, #a855f7 100%)',
                                                        borderRadius: '8px 8px 2px 2px',
                                                        opacity: 0.9,
                                                        transition: 'height 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                                                        minHeight: '4px',
                                                        position: 'relative',
                                                        width: '60%',
                                                        margin: '0 auto'
                                                    }}
                                                    title={`₹${data.amount}`}
                                                ></div>
                                                <p style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--gray)', fontWeight: 600 }}>{data.day}</p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Transactions Table */}
                            <div className="card glass-card" style={{ padding: 0, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.5)' }}>
                                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--gray-light)', background: 'rgba(248, 250, 252, 0.5)' }}>
                                    <h3 style={{ margin: 0, fontSize: '1rem' }}>Transaction Ledger</h3>
                                </div>
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr>
                                                <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.7rem', color: 'var(--gray)', fontWeight: 700, textTransform: 'uppercase' }}>Order ID</th>
                                                <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.7rem', color: 'var(--gray)', fontWeight: 700, textTransform: 'uppercase' }}>Time</th>
                                                <th style={{ padding: '1rem 1.5rem', textAlign: 'left', fontSize: '0.7rem', color: 'var(--gray)', fontWeight: 700, textTransform: 'uppercase' }}>Status</th>
                                                <th style={{ padding: '1rem 1.5rem', textAlign: 'right', fontSize: '0.7rem', color: 'var(--gray)', fontWeight: 700, textTransform: 'uppercase' }}>Earnings</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {myDeliveries.filter(o => o.status === 'delivered').map(order => (
                                                <tr key={order._id} className="hover-glow" style={{ borderBottom: '1px solid var(--gray-light)', transition: 'background 0.2s' }}>
                                                    <td style={{ padding: '1rem 1.5rem', fontWeight: 600, color: 'var(--secondary)' }}>#{order._id.slice(-6).toUpperCase()}</td>
                                                    <td style={{ padding: '1rem 1.5rem', color: 'var(--gray)', fontSize: '0.9rem' }}>{new Date(order.createdAt).toLocaleDateString()}</td>
                                                    <td style={{ padding: '1rem 1.5rem' }}>
                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color: 'var(--success)' }}>
                                                            <CheckCircle size={14} /> PAID
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right', fontWeight: 700, color: 'var(--success)' }}>+ ₹{(order.totalAmount * 0.1).toFixed(2)}</td>
                                                </tr>
                                            ))}
                                            {myDeliveries.filter(o => o.status === 'delivered').length === 0 && (
                                                <tr>
                                                    <td colSpan="4" style={{ padding: '3rem', textAlign: 'center', color: 'var(--gray)' }}>
                                                        <Inbox size={24} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
                                                        <p style={{ fontSize: '0.9rem' }}>No completed transactions yet.</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </DeliveryLayout>
    );
};

export default DeliveryDashboard;
