import { useState, useEffect } from 'react';
import axios from 'axios';
import { TrendingUp, TrendingDown, Users, Store, ShoppingBag, DollarSign, Activity, BarChart3, Settings, LogOut, Search, Filter, X, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

const AdminDashboard = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({ users: 0, restaurants: 0, orders: 0, revenue: 0 });
    const [trends, setTrends] = useState([]);
    const [revenue, setRevenue] = useState([]);
    const [restaurants, setRestaurants] = useState([]);
    const [users, setUsers] = useState([]);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [userRoleTab, setUserRoleTab] = useState('customer');
    const [selectedUser, setSelectedUser] = useState(null);
    const [showUserModal, setShowUserModal] = useState(false);

    // Restaurant management states
    const [restaurantStatusFilter, setRestaurantStatusFilter] = useState('all');
    const [restaurantSearchQuery, setRestaurantSearchQuery] = useState('');
    const [restaurantSortBy, setRestaurantSortBy] = useState('date');
    const [selectedRestaurant, setSelectedRestaurant] = useState(null);
    const [showRestaurantModal, setShowRestaurantModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [restaurantToReject, setRestaurantToReject] = useState(null);

    // Order management states
    const [orders, setOrders] = useState([]);
    const [orderStatusFilter, setOrderStatusFilter] = useState('all');
    const [orderSearchQuery, setOrderSearchQuery] = useState('');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showOrderModal, setShowOrderModal] = useState(false);

    // Settings management states
    const [settings, setSettings] = useState(null);
    const [settingsLoading, setSettingsLoading] = useState(false);
    const [settingsSaved, setSettingsSaved] = useState(false);

    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAdminAccess = () => {
             const storedUser = localStorage.getItem('user');
             if (storedUser) {
                 const user = JSON.parse(storedUser);
                 if (user.role !== 'admin') {
                     navigate('/');
                 }
             } else {
                 navigate('/admin/login');
             }
        };
        
        checkAdminAccess();
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const [statsRes, trendsRes, revenueRes, restRes, usersRes, ordersRes] = await Promise.all([
                axios.get('http://localhost:5000/api/admin/stats', config),
                axios.get('http://localhost:5000/api/admin/trends', config),
                axios.get('http://localhost:5000/api/admin/revenue', config),
                axios.get('http://localhost:5000/api/admin/restaurants', config),
                axios.get('http://localhost:5000/api/admin/users', config),
                axios.get('http://localhost:5000/api/admin/orders', config)
            ]);

            setStats(statsRes.data);
            setTrends(trendsRes.data);
            setRevenue(revenueRes.data);
            setRestaurants(restRes.data);
            setUsers(usersRes.data);
            setOrders(ordersRes.data);
            setLoading(false);
        } catch (error) {
            console.error(error);
            setLoading(false);
        }
    };

    // Restaurant Management Functions
    const fetchRestaurantDetails = async (id) => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get(`http://localhost:5000/api/admin/restaurants/${id}`, config);
            setSelectedRestaurant(res.data);
            setShowRestaurantModal(true);
        } catch (error) {
            alert('Error fetching restaurant details');
        }
    };

    const handleApproveRestaurant = async (id) => {
        if (!window.confirm('Are you sure you want to approve this restaurant?')) return;
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.put(`http://localhost:5000/api/admin/restaurants/${id}`, {
                approvalStatus: 'approved',
                isApproved: true
            }, config);
            fetchData();
            setShowRestaurantModal(false);
            alert('Restaurant approved successfully!');
        } catch (error) {
            alert('Error approving restaurant');
        }
    };

    const openRejectModal = (restaurant) => {
        setRestaurantToReject(restaurant);
        setRejectionReason('');
        setShowRejectModal(true);
    };

    const handleRejectRestaurant = async () => {
        if (!rejectionReason.trim()) {
            alert('Please provide a reason for rejection');
            return;
        }
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.put(`http://localhost:5000/api/admin/restaurants/${restaurantToReject._id}`, {
                approvalStatus: 'rejected',
                isApproved: false,
                rejectionReason: rejectionReason.trim()
            }, config);
            fetchData();
            setShowRejectModal(false);
            setShowRestaurantModal(false);
            setRestaurantToReject(null);
            setRejectionReason('');
            alert('Restaurant rejected successfully');
        } catch (error) {
            alert('Error rejecting restaurant');
        }
    };

    // Filter, search, and sort restaurants
    const getFilteredRestaurants = () => {
        let filtered = [...restaurants];

        // Apply status filter
        if (restaurantStatusFilter !== 'all') {
            filtered = filtered.filter(r => {
                if (restaurantStatusFilter === 'pending') return r.approvalStatus === 'pending' || (!r.approvalStatus && !r.isApproved);
                if (restaurantStatusFilter === 'approved') return r.approvalStatus === 'approved' || r.isApproved;
                if (restaurantStatusFilter === 'rejected') return r.approvalStatus === 'rejected';
                return true;
            });
        }

        // Apply search filter
        if (restaurantSearchQuery.trim()) {
            const query = restaurantSearchQuery.toLowerCase();
            filtered = filtered.filter(r =>
                r.name?.toLowerCase().includes(query) ||
                r.owner?.name?.toLowerCase().includes(query) ||
                r.address?.city?.toLowerCase().includes(query)
            );
        }

        // Apply sorting
        filtered.sort((a, b) => {
            if (restaurantSortBy === 'name') {
                return (a.name || '').localeCompare(b.name || '');
            } else if (restaurantSortBy === 'rating') {
                return (b.rating || 0) - (a.rating || 0);
            } else { // date
                return new Date(b.createdAt) - new Date(a.createdAt);
            }
        });

        return filtered;
    };

    const filteredUsers = users.filter(user => user.role === userRoleTab);
    const filteredRestaurants = getFilteredRestaurants();

    const getStatusBadge = (restaurant) => {
        const status = restaurant.approvalStatus || (restaurant.isApproved ? 'approved' : 'pending');
        const badges = {
            pending: { color: '#fb923c', bg: 'rgba(251, 146, 60, 0.1)', label: 'PENDING', icon: Clock },
            approved: { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)', label: 'APPROVED', icon: CheckCircle },
            rejected: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', label: 'REJECTED', icon: XCircle }
        };
        return badges[status] || badges.pending;
    };

    // Order Management Functions
    const getFilteredOrders = () => {
        let filtered = [...orders];

        // Apply status filter
        if (orderStatusFilter !== 'all') {
            filtered = filtered.filter(order => order.status === orderStatusFilter);
        }

        // Apply search filter
        if (orderSearchQuery.trim()) {
            const query = orderSearchQuery.toLowerCase();
            filtered = filtered.filter(order =>
                order._id?.toLowerCase().includes(query) ||
                order.customer?.name?.toLowerCase().includes(query) ||
                order.restaurant?.name?.toLowerCase().includes(query)
            );
        }

        return filtered;
    };

    const filteredOrders = getFilteredOrders();

    const getOrderStatusBadge = (status) => {
        const badges = {
            placed: { color: '#fb923c', bg: 'rgba(251, 146, 60, 0.1)', label: 'PLACED', icon: Clock },
            accepted: { color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)', label: 'ACCEPTED', icon: CheckCircle },
            preparing: { color: '#a855f7', bg: 'rgba(168, 85, 247, 0.1)', label: 'PREPARING', icon: Activity },
            ready: { color: '#06b6d4', bg: 'rgba(6, 182, 212, 0.1)', label: 'READY', icon: CheckCircle },
            picked_up: { color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)', label: 'PICKED UP', icon: ShoppingBag },
            delivered: { color: '#22c55e', bg: 'rgba(34, 197, 94, 0.1)', label: 'DELIVERED', icon: CheckCircle },
            cancelled: { color: '#ef4444', bg: 'rgba(239, 68, 68, 0.1)', label: 'CANCELLED', icon: XCircle }
        };
        return badges[status] || badges.placed;
    };

    const viewOrderDetails = (order) => {
        setSelectedOrder(order);
        setShowOrderModal(true);
    };

    const getRelativeTime = (date) => {
        const now = new Date();
        const orderDate = new Date(date);
        const diffMs = now - orderDate;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    };

    // Settings Management Functions
    const fetchSettings = async () => {
        try {
            setSettingsLoading(true);
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.get('http://localhost:5000/api/settings', config);
            setSettings(response.data);
            setSettingsLoading(false);
        } catch (error) {
            console.error(error);
            setSettingsLoading(false);
        }
    };

    const saveSettings = async () => {
        try {
            setSettingsLoading(true);
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.put('http://localhost:5000/api/settings', settings, config);
            setSettingsSaved(true);
            setTimeout(() => setSettingsSaved(false), 3000);
            setSettingsLoading(false);
        } catch (error) {
            alert(error.response?.data?.message || 'Error saving settings');
            setSettingsLoading(false);
        }
    };

    const updateSettingField = (section, field, value) => {
        setSettings(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: value
            }
        }));
    };

    // Load settings when settings tab is active
    useEffect(() => {
        if (activeTab === 'settings' && !settings) {
            fetchSettings();
        }
    }, [activeTab]);

    // User Management Functions
    const toggleBlockUser = async (userId) => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.put(`http://localhost:5000/api/admin/users/${userId}/block`, {}, config);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Error updating user');
        }
    };

    const deleteUser = async (userId) => {
        if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) return;
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            await axios.delete(`http://localhost:5000/api/admin/users/${userId}`, config);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Error deleting user');
        }
    };

    const viewUserDetails = async (userId) => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const res = await axios.get(`http://localhost:5000/api/admin/users/${userId}`, config);
            setSelectedUser(res.data);
            setShowUserModal(true);
        } catch (error) {
            alert('Error fetching user details');
        }
    };

    // Recharts Bar Chart Component
    const OrdersChart = ({ data }) => {
        if (!data || data.length === 0) return <p style={{ textAlign: 'center', color: 'var(--gray)' }}>No data available</p>;

        const formattedData = data.map(item => ({
            date: new Date(item._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
            count: item.count
        }));

        return (
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                        <XAxis
                            dataKey="date"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--gray)', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--gray)', fontSize: 12 }}
                        />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--gray-light)', borderRadius: '8px', color: 'var(--secondary)' }}
                            itemStyle={{ color: 'var(--primary)' }}
                            cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        />
                        <Bar
                            dataKey="count"
                            fill="url(#colorCount)"
                            radius={[4, 4, 0, 0]}
                            barSize={40}
                        />
                        <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="var(--primary)" stopOpacity={0.3} />
                            </linearGradient>
                        </defs>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        );
    };

    // Recharts Area Chart Component
    const RevenueChart = ({ data }) => {
        if (!data || data.length === 0) return <p style={{ textAlign: 'center', color: 'var(--gray)' }}>No data available</p>;

        const formattedData = data.map((item, index) => ({
            name: item._id ? new Date(item._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : `Day ${index + 1}`,
            total: item.total
        }));

        return (
            <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={formattedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--success)" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--gray)', fontSize: 12 }}
                            dy={10}
                            minTickGap={30}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--gray)', fontSize: 12 }}
                        />
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                        <Tooltip
                            contentStyle={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--gray-light)', borderRadius: '8px', color: 'var(--secondary)' }}
                            itemStyle={{ color: 'var(--success)' }}
                            cursor={{ stroke: 'var(--success)', strokeWidth: 1, strokeDasharray: '3 3' }}
                            formatter={(value) => [`₹${value.toLocaleString()}`, 'Revenue']}
                        />
                        <Area
                            type="monotone"
                            dataKey="total"
                            stroke="var(--success)"
                            fillOpacity={1}
                            fill="url(#colorTotal)"
                            strokeWidth={3}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        );
    };

    if (loading) return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
            <div className="spinner" style={{ width: '40px', height: '40px', borderTopColor: 'var(--primary)', borderRadius: '50%', border: '4px solid var(--gray-light)', animation: 'spin 1s linear infinite' }}></div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <div className="dashboard-container" style={{ margin: '-2rem', display: 'flex', minHeight: '100vh', background: 'var(--bg-main)' }}>
            {/* Premium Sidebar */}
            <aside className="q-sidebar" style={{ width: '280px', flexShrink: 0, position: 'fixed', height: '100vh', background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)', borderRight: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ padding: '2.5rem 1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="logo" style={{ fontSize: '1.8rem', letterSpacing: '-1px', color: 'white' }}>Quick<span style={{ color: 'var(--primary)' }}>Bite</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                        <div className="shimmer" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#4ade80', boxShadow: '0 0 8px #4ade80' }}></div>
                        <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.5)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px' }}>Super Admin</p>
                    </div>
                </div>

                <div style={{ padding: '0 1rem' }}>
                    <div className={`q-sidebar-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', cursor: 'pointer', borderRadius: '8px', marginBottom: '4px' }}>
                        <Activity size={20} /> Dashboard
                    </div>
                    <div className={`q-sidebar-item ${activeTab === 'restaurants' ? 'active' : ''}`} onClick={() => setActiveTab('restaurants')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', cursor: 'pointer', borderRadius: '8px', marginBottom: '4px' }}>
                        <Store size={20} /> Restaurants
                    </div>
                    <div className={`q-sidebar-item ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', cursor: 'pointer', borderRadius: '8px', marginBottom: '4px' }}>
                        <Users size={20} /> Users
                    </div>
                    <div className={`q-sidebar-item ${activeTab === 'orders' ? 'active' : ''}`} onClick={() => setActiveTab('orders')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', cursor: 'pointer', borderRadius: '8px', marginBottom: '4px' }}>
                        <ShoppingBag size={20} /> Orders
                    </div>
                    <div className={`q-sidebar-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', cursor: 'pointer', borderRadius: '8px', marginBottom: '4px' }}>
                        <Settings size={20} /> Settings
                    </div>
                </div>

                <div style={{ marginTop: 'auto', padding: '1rem' }}>
                    <div className="q-sidebar-item" onClick={() => { logout(); navigate('/login'); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', cursor: 'pointer', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', borderRadius: '8px' }}>
                        <LogOut size={20} /> Logout
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main style={{ marginLeft: '280px', flex: 1, padding: '2.5rem 3.5rem', background: 'var(--bg-main)', minHeight: '100vh' }}>
                <header className="fade-up" style={{ marginBottom: '2.5rem' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--secondary)', marginBottom: '0.5rem' }}>System Overview</h1>
                    <p style={{ color: 'var(--gray)', fontSize: '1.1rem', fontWeight: 500 }}>Real-time platform analytics and management</p>
                </header>

                {activeTab === 'dashboard' && (
                    <>
                        {/* KPI Cards */}
                        <div className="fade-up" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem', animationDelay: '0.1s' }}>
                            <div className="card glass-card hover-glow" style={{ padding: '1.5rem', border: 'none', boxShadow: 'var(--premium-shadow)', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: '10px', right: '10px', width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Users size={24} style={{ color: 'var(--primary)' }} />
                                </div>
                                <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Total Users</p>
                                <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--secondary)', margin: '0.5rem 0' }}>{stats.users.toLocaleString()}</h2>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '0.75rem' }}>
                                    <TrendingUp size={16} style={{ color: 'var(--success)' }} />
                                    <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 700 }}>+12.5%</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>vs last month</span>
                                </div>
                            </div>

                            <div className="card glass-card hover-glow" style={{ padding: '1.5rem', border: 'none', boxShadow: 'var(--premium-shadow)', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: '10px', right: '10px', width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(168, 85, 247, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Store size={24} style={{ color: '#a855f7' }} />
                                </div>
                                <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Active Restaurants</p>
                                <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--secondary)', margin: '0.5rem 0' }}>{stats.restaurants.toLocaleString()}</h2>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '0.75rem' }}>
                                    <TrendingUp size={16} style={{ color: 'var(--success)' }} />
                                    <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 700 }}>+8.2%</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>vs last month</span>
                                </div>
                            </div>

                            <div className="card glass-card hover-glow" style={{ padding: '1.5rem', border: 'none', boxShadow: 'var(--premium-shadow)', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: '10px', right: '10px', width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(251, 146, 60, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <ShoppingBag size={24} style={{ color: '#fb923c' }} />
                                </div>
                                <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Total Orders</p>
                                <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--secondary)', margin: '0.5rem 0' }}>{stats.orders.toLocaleString()}</h2>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '0.75rem' }}>
                                    <TrendingUp size={16} style={{ color: 'var(--success)' }} />
                                    <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 700 }}>+24.1%</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>vs last month</span>
                                </div>
                            </div>

                            <div className="card glass-card hover-glow" style={{ padding: '1.5rem', border: 'none', boxShadow: 'var(--premium-shadow)', position: 'relative', overflow: 'hidden' }}>
                                <div style={{ position: 'absolute', top: '10px', right: '10px', width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <DollarSign size={24} style={{ color: 'var(--success)' }} />
                                </div>
                                <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Total Revenue</p>
                                <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--secondary)', margin: '0.5rem 0' }}>₹{stats.revenue.toLocaleString()}</h2>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '0.75rem' }}>
                                    <TrendingUp size={16} style={{ color: 'var(--success)' }} />
                                    <span style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 700 }}>+18.7%</span>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>vs last month</span>
                                </div>
                            </div>
                        </div>

                        {/* Charts */}
                        <div className="fade-up" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2.5rem', animationDelay: '0.2s' }}>
                            <div className="card glass-card" style={{ padding: '2rem', border: 'none', boxShadow: 'var(--premium-shadow)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--secondary)', marginBottom: '0.25rem' }}>Order Trends</h3>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>Last 7 days performance</p>
                                    </div>
                                    <BarChart3 size={24} style={{ color: 'var(--primary)' }} />
                                </div>
                                <OrdersChart data={trends} />
                            </div>

                            <div className="card glass-card" style={{ padding: '2rem', border: 'none', boxShadow: 'var(--premium-shadow)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--secondary)', marginBottom: '0.25rem' }}>Revenue Growth</h3>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>Last 30 days revenue</p>
                                    </div>
                                    <TrendingUp size={24} style={{ color: 'var(--success)' }} />
                                </div>
                                <RevenueChart data={revenue} />
                            </div>
                        </div>

                        {/* Pending Approvals */}
                        <div className="fade-up card glass-card" style={{ padding: '2rem', border: 'none', boxShadow: 'var(--premium-shadow)', animationDelay: '0.3s' }}>
                            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--secondary)', marginBottom: '1.5rem' }}>Pending Restaurant Approvals</h3>
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {restaurants.filter(r => !r.isApproved).map(rest => (
                                    <div key={rest._id} className="hover-glow" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-light)' }}>
                                        <div>
                                            <h4 style={{ marginBottom: '0.25rem', fontSize: '1.1rem', fontWeight: 700 }}>{rest.name}</h4>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>Owner: {rest.owner?.name} • {rest.address?.city}</p>
                                        </div>
                                        <button className="btn btn-primary" style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem' }} onClick={() => approveRestaurant(rest._id, true)}>
                                            Approve
                                        </button>
                                    </div>
                                ))}
                                {restaurants.filter(r => !r.isApproved).length === 0 && (
                                    <p style={{ color: 'var(--gray)', textAlign: 'center', padding: '2rem' }}>No pending approvals</p>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'restaurants' && (
                    <div className="fade-up">
                        {/* Header with Stats */}
                        <div style={{ marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--secondary)', marginBottom: '0.5rem' }}>Restaurant Management</h2>
                            <p style={{ color: 'var(--gray)', fontSize: '1rem' }}>Manage and approve restaurant applications</p>
                        </div>

                        {/* Status Filter Tabs */}
                        <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', borderBottom: '2px solid var(--gray-light)', paddingBottom: '0' }}>
                            {[
                                { key: 'all', label: 'All Restaurants', icon: Store },
                                { key: 'pending', label: 'Pending Approval', icon: Clock },
                                { key: 'approved', label: 'Approved', icon: CheckCircle },
                                { key: 'rejected', label: 'Rejected', icon: XCircle }
                            ].map(tab => {
                                const Icon = tab.icon;
                                const count = tab.key === 'all' ? restaurants.length :
                                    restaurants.filter(r => {
                                        if (tab.key === 'pending') return r.approvalStatus === 'pending' || (!r.approvalStatus && !r.isApproved);
                                        if (tab.key === 'approved') return r.approvalStatus === 'approved' || r.isApproved;
                                        if (tab.key === 'rejected') return r.approvalStatus === 'rejected';
                                        return true;
                                    }).length;

                                return (
                                    <button
                                        key={tab.key}
                                        onClick={() => setRestaurantStatusFilter(tab.key)}
                                        style={{
                                            padding: '1rem 1.5rem',
                                            background: 'none',
                                            border: 'none',
                                            borderBottom: restaurantStatusFilter === tab.key ? '3px solid var(--primary)' : '3px solid transparent',
                                            color: restaurantStatusFilter === tab.key ? 'var(--primary)' : 'var(--gray)',
                                            fontWeight: restaurantStatusFilter === tab.key ? 800 : 600,
                                            fontSize: '0.95rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s ease',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.5rem'
                                        }}
                                    >
                                        <Icon size={18} />
                                        {tab.label}
                                        <span style={{
                                            background: restaurantStatusFilter === tab.key ? 'var(--primary-light)' : 'var(--gray-light)',
                                            color: restaurantStatusFilter === tab.key ? 'var(--primary)' : 'var(--gray)',
                                            padding: '0.2rem 0.6rem',
                                            borderRadius: '12px',
                                            fontSize: '0.75rem',
                                            fontWeight: 700
                                        }}>
                                            {count}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Search and Sort Controls */}
                        <div className="card glass-card" style={{ padding: '1.5rem', marginBottom: '1.5rem', border: 'none', boxShadow: 'var(--premium-shadow)' }}>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                {/* Search Bar */}
                                <div style={{ flex: 1, minWidth: '250px', position: 'relative' }}>
                                    <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray)' }} />
                                    <input
                                        type="text"
                                        placeholder="Search by restaurant name, owner, or city..."
                                        value={restaurantSearchQuery}
                                        onChange={(e) => setRestaurantSearchQuery(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                                            border: '1px solid var(--gray-light)',
                                            borderRadius: 'var(--radius-md)',
                                            fontSize: '0.9rem',
                                            background: 'var(--bg-main)',
                                            color: 'var(--secondary)'
                                        }}
                                    />
                                </div>

                                {/* Sort Dropdown */}
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Filter size={18} style={{ color: 'var(--gray)' }} />
                                    <select
                                        value={restaurantSortBy}
                                        onChange={(e) => setRestaurantSortBy(e.target.value)}
                                        style={{
                                            padding: '0.75rem 1rem',
                                            border: '1px solid var(--gray-light)',
                                            borderRadius: 'var(--radius-md)',
                                            fontSize: '0.9rem',
                                            background: 'var(--bg-main)',
                                            color: 'var(--secondary)',
                                            cursor: 'pointer',
                                            fontWeight: 600
                                        }}
                                    >
                                        <option value="date">Sort by: Newest First</option>
                                        <option value="name">Sort by: Name (A-Z)</option>
                                        <option value="rating">Sort by: Highest Rating</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Restaurant Cards/Table */}
                        <div className="card glass-card" style={{ padding: '2rem', border: 'none', boxShadow: 'var(--premium-shadow)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--secondary)' }}>
                                    {restaurantStatusFilter === 'all' && 'All Restaurants'}
                                    {restaurantStatusFilter === 'pending' && 'Pending Approval'}
                                    {restaurantStatusFilter === 'approved' && 'Approved Restaurants'}
                                    {restaurantStatusFilter === 'rejected' && 'Rejected Restaurants'}
                                </h3>
                                <span style={{ color: 'var(--gray)', fontSize: '0.9rem' }}>
                                    Total: <strong>{filteredRestaurants.length}</strong>
                                </span>
                            </div>

                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--gray-light)' }}>
                                            <th style={{ padding: '1rem', fontWeight: 800, color: 'var(--gray)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Restaurant</th>
                                            <th style={{ padding: '1rem', fontWeight: 800, color: 'var(--gray)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Owner</th>
                                            <th style={{ padding: '1rem', fontWeight: 800, color: 'var(--gray)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Location</th>
                                            <th style={{ padding: '1rem', fontWeight: 800, color: 'var(--gray)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Cuisine</th>
                                            <th style={{ padding: '1rem', fontWeight: 800, color: 'var(--gray)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Rating</th>
                                            <th style={{ padding: '1rem', fontWeight: 800, color: 'var(--gray)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Status</th>
                                            <th style={{ padding: '1rem', fontWeight: 800, color: 'var(--gray)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredRestaurants.map(rest => {
                                            const badge = getStatusBadge(rest);
                                            const StatusIcon = badge.icon;
                                            return (
                                                <tr key={rest._id} style={{ borderBottom: '1px solid var(--gray-light)', transition: 'background 0.2s' }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--gray-light)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}>
                                                    <td style={{ padding: '1rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                            <img src={rest.image} alt={rest.name} style={{ width: '48px', height: '48px', borderRadius: '8px', objectFit: 'cover' }} />
                                                            <div>
                                                                <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--secondary)' }}>{rest.name}</div>
                                                                <div style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>
                                                                    {rest.menuItemCount || 0} menu items
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--secondary)' }}>{rest.owner?.name || 'N/A'}</div>
                                                        <div style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>{rest.owner?.email || ''}</div>
                                                    </td>
                                                    <td style={{ padding: '1rem', color: 'var(--gray)', fontSize: '0.9rem' }}>{rest.address?.city || 'N/A'}</td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                                                            {rest.cuisine?.slice(0, 2).map((c, i) => (
                                                                <span key={i} style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '4px', fontWeight: 600 }}>
                                                                    {c}
                                                                </span>
                                                            ))}
                                                            {rest.cuisine?.length > 2 && (
                                                                <span style={{ fontSize: '0.7rem', padding: '0.2rem 0.5rem', color: 'var(--gray)' }}>
                                                                    +{rest.cuisine.length - 2}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                                            <span style={{ color: '#fbbf24', fontSize: '1rem' }}>★</span>
                                                            <span style={{ fontWeight: 700, color: 'var(--secondary)' }}>{rest.rating?.toFixed(1) || '0.0'}</span>
                                                            <span style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>({rest.numReviews || 0})</span>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <span style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '0.4rem',
                                                            fontSize: '0.75rem',
                                                            padding: '0.4rem 0.8rem',
                                                            background: badge.bg,
                                                            color: badge.color,
                                                            borderRadius: '6px',
                                                            fontWeight: 700
                                                        }}>
                                                            <StatusIcon size={14} />
                                                            {badge.label}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                            <button
                                                                className="btn"
                                                                style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', border: '1px solid var(--primary)', color: 'var(--primary)' }}
                                                                onClick={() => fetchRestaurantDetails(rest._id)}
                                                            >
                                                                View Details
                                                            </button>
                                                            {(rest.approvalStatus === 'pending' || (!rest.approvalStatus && !rest.isApproved)) && (
                                                                <>
                                                                    <button
                                                                        className="btn"
                                                                        style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', background: 'var(--success)', color: 'white', border: 'none' }}
                                                                        onClick={() => handleApproveRestaurant(rest._id)}
                                                                    >
                                                                        Approve
                                                                    </button>
                                                                    <button
                                                                        className="btn"
                                                                        style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', background: 'var(--danger)', color: 'white', border: 'none' }}
                                                                        onClick={() => openRejectModal(rest)}
                                                                    >
                                                                        Reject
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {filteredRestaurants.length === 0 && (
                                            <tr>
                                                <td colSpan="7" style={{ padding: '3rem', textAlign: 'center', color: 'var(--gray)' }}>
                                                    <AlertCircle size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
                                                    <p style={{ fontSize: '1.1rem', fontWeight: 600 }}>No restaurants found</p>
                                                    <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Try adjusting your filters or search query</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Restaurant Detail Modal */}
                        {showRestaurantModal && selectedRestaurant && (
                            <div style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'rgba(0,0,0,0.6)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 9999,
                                backdropFilter: 'blur(4px)',
                                padding: '2rem',
                                overflowY: 'auto'
                            }} onClick={() => setShowRestaurantModal(false)}>
                                <div className="card glass-card" style={{
                                    maxWidth: '700px',
                                    width: '100%',
                                    padding: '2.5rem',
                                    maxHeight: '90vh',
                                    overflowY: 'auto',
                                    position: 'relative',
                                    margin: 'auto'
                                }} onClick={(e) => e.stopPropagation()}>
                                    <button
                                        onClick={() => setShowRestaurantModal(false)}
                                        style={{
                                            position: 'absolute',
                                            top: '1rem',
                                            right: '1rem',
                                            background: 'var(--gray-light)',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: '32px',
                                            height: '32px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--danger)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'var(--gray-light)'}
                                    >
                                        <X size={18} />
                                    </button>

                                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.8rem', fontWeight: 900, color: 'var(--secondary)' }}>Restaurant Details</h3>

                                    {/* Restaurant Image */}
                                    <img src={selectedRestaurant.image} alt={selectedRestaurant.name} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }} />

                                    <div style={{ display: 'grid', gap: '1.25rem' }}>
                                        <div>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--gray)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 800 }}>Restaurant Name</p>
                                            <p style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--secondary)' }}>{selectedRestaurant.name}</p>
                                        </div>

                                        <div>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--gray)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 800 }}>Description</p>
                                            <p style={{ fontWeight: 500, color: 'var(--secondary)' }}>{selectedRestaurant.description || 'No description provided'}</p>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--gray)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 800 }}>Owner Name</p>
                                                <p style={{ fontWeight: 600 }}>{selectedRestaurant.owner?.name}</p>
                                            </div>
                                            <div>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--gray)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 800 }}>Owner Email</p>
                                                <p style={{ fontWeight: 600 }}>{selectedRestaurant.owner?.email}</p>
                                            </div>
                                        </div>

                                        {selectedRestaurant.owner?.phone && (
                                            <div>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--gray)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 800 }}>Owner Phone</p>
                                                <p style={{ fontWeight: 600 }}>{selectedRestaurant.owner.phone}</p>
                                            </div>
                                        )}

                                        <div>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--gray)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 800 }}>Address</p>
                                            <p style={{ fontWeight: 600 }}>
                                                {selectedRestaurant.address?.street && `${selectedRestaurant.address.street}, `}
                                                {selectedRestaurant.address?.city && `${selectedRestaurant.address.city} `}
                                                {selectedRestaurant.address?.zip}
                                            </p>
                                        </div>

                                        <div>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--gray)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 800 }}>Cuisine Types</p>
                                            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                                {selectedRestaurant.cuisine?.map((c, i) => (
                                                    <span key={i} style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '6px', fontWeight: 600 }}>
                                                        {c}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                            <div>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--gray)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 800 }}>Rating</p>
                                                <p style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--secondary)' }}>
                                                    ★ {selectedRestaurant.rating?.toFixed(1) || '0.0'} ({selectedRestaurant.numReviews || 0} reviews)
                                                </p>
                                            </div>
                                            <div>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--gray)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 800 }}>Menu Items</p>
                                                <p style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--secondary)' }}>{selectedRestaurant.menuItemCount || 0}</p>
                                            </div>
                                            <div>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--gray)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 800 }}>Total Orders</p>
                                                <p style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--secondary)' }}>{selectedRestaurant.recentOrdersCount || 0}</p>
                                            </div>
                                        </div>

                                        {selectedRestaurant.totalRevenue !== undefined && (
                                            <div>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--gray)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 800 }}>Total Revenue</p>
                                                <p style={{ fontWeight: 700, fontSize: '1.3rem', color: 'var(--success)' }}>₹{selectedRestaurant.totalRevenue.toLocaleString()}</p>
                                            </div>
                                        )}

                                        <div>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--gray)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 800 }}>Status</p>
                                            {(() => {
                                                const badge = getStatusBadge(selectedRestaurant);
                                                const StatusIcon = badge.icon;
                                                return (
                                                    <span style={{
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '0.5rem',
                                                        fontSize: '0.9rem',
                                                        padding: '0.5rem 1rem',
                                                        background: badge.bg,
                                                        color: badge.color,
                                                        borderRadius: '8px',
                                                        fontWeight: 700
                                                    }}>
                                                        <StatusIcon size={18} />
                                                        {badge.label}
                                                    </span>
                                                );
                                            })()}
                                        </div>

                                        {selectedRestaurant.rejectionReason && (
                                            <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid rgba(239, 68, 68, 0.3)' }}>
                                                <p style={{ fontSize: '0.75rem', color: '#ef4444', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 800 }}>Rejection Reason</p>
                                                <p style={{ fontWeight: 600, color: '#dc2626' }}>{selectedRestaurant.rejectionReason}</p>
                                            </div>
                                        )}

                                        <div>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--gray)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 800 }}>Registered On</p>
                                            <p style={{ fontWeight: 600 }}>{new Date(selectedRestaurant.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    {(selectedRestaurant.approvalStatus === 'pending' || (!selectedRestaurant.approvalStatus && !selectedRestaurant.isApproved)) && (
                                        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                            <button
                                                className="btn btn-primary"
                                                style={{ flex: 1, padding: '0.75rem', fontSize: '1rem', background: 'var(--success)', border: 'none' }}
                                                onClick={() => handleApproveRestaurant(selectedRestaurant._id)}
                                            >
                                                <CheckCircle size={18} style={{ marginRight: '0.5rem' }} />
                                                Approve Restaurant
                                            </button>
                                            <button
                                                className="btn"
                                                style={{ flex: 1, padding: '0.75rem', fontSize: '1rem', background: 'var(--danger)', color: 'white', border: 'none' }}
                                                onClick={() => {
                                                    setShowRestaurantModal(false);
                                                    openRejectModal(selectedRestaurant);
                                                }}
                                            >
                                                <XCircle size={18} style={{ marginRight: '0.5rem' }} />
                                                Reject Restaurant
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Rejection Modal */}
                        {showRejectModal && restaurantToReject && (
                            <div style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'rgba(0,0,0,0.6)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 9999,
                                backdropFilter: 'blur(4px)',
                                padding: '2rem',
                                overflowY: 'auto'
                            }} onClick={() => setShowRejectModal(false)}>
                                <div className="card glass-card" style={{
                                    maxWidth: '500px',
                                    width: '100%',
                                    padding: '2rem',
                                    margin: 'auto'
                                }} onClick={(e) => e.stopPropagation()}>
                                    <h3 style={{ marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 800, color: 'var(--danger)' }}>
                                        <XCircle size={24} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                                        Reject Restaurant
                                    </h3>
                                    <p style={{ marginBottom: '1.5rem', color: 'var(--gray)' }}>
                                        You are about to reject <strong>{restaurantToReject.name}</strong>. Please provide a reason for rejection.
                                    </p>

                                    <div style={{ marginBottom: '1.5rem' }}>
                                        <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--secondary)', marginBottom: '0.5rem' }}>
                                            Rejection Reason *
                                        </label>
                                        <textarea
                                            value={rejectionReason}
                                            onChange={(e) => setRejectionReason(e.target.value)}
                                            placeholder="Enter the reason for rejecting this restaurant..."
                                            rows="4"
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                border: '1px solid var(--gray-light)',
                                                borderRadius: 'var(--radius-md)',
                                                fontSize: '0.9rem',
                                                background: 'var(--bg-main)',
                                                color: 'var(--secondary)',
                                                resize: 'vertical',
                                                fontFamily: 'inherit'
                                            }}
                                        />
                                    </div>

                                    <div style={{ display: 'flex', gap: '1rem' }}>
                                        <button
                                            className="btn"
                                            style={{ flex: 1, padding: '0.75rem', border: '1px solid var(--gray-light)' }}
                                            onClick={() => setShowRejectModal(false)}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            className="btn"
                                            style={{ flex: 1, padding: '0.75rem', background: 'var(--danger)', color: 'white', border: 'none' }}
                                            onClick={handleRejectRestaurant}
                                        >
                                            Confirm Rejection
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'users' && (
                    <div className="fade-up">
                        {/* Role Tabs */}
                        <div style={{ marginBottom: '2rem', display: 'flex', gap: '1rem', borderBottom: '2px solid var(--gray-light)', paddingBottom: '0' }}>
                            {[
                                { key: 'customer', label: 'Customers', icon: '👥' },
                                { key: 'restaurant', label: 'Restaurant Owners', icon: '🏪' },
                                { key: 'delivery', label: 'Delivery Partners', icon: '🚴' }
                            ].map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setUserRoleTab(tab.key)}
                                    style={{
                                        padding: '1rem 1.5rem',
                                        background: 'none',
                                        border: 'none',
                                        borderBottom: userRoleTab === tab.key ? '3px solid var(--primary)' : '3px solid transparent',
                                        color: userRoleTab === tab.key ? 'var(--primary)' : 'var(--gray)',
                                        fontWeight: userRoleTab === tab.key ? 800 : 600,
                                        fontSize: '0.95rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    <span>{tab.icon}</span>
                                    {tab.label}
                                    <span style={{
                                        background: userRoleTab === tab.key ? 'var(--primary-light)' : 'var(--gray-light)',
                                        color: userRoleTab === tab.key ? 'var(--primary)' : 'var(--gray)',
                                        padding: '0.2rem 0.6rem',
                                        borderRadius: '12px',
                                        fontSize: '0.75rem',
                                        fontWeight: 700
                                    }}>
                                        {users.filter(u => u.role === tab.key).length}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* User Table */}
                        <div className="card glass-card" style={{ padding: '2rem', border: 'none', boxShadow: 'var(--premium-shadow)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--secondary)' }}>
                                    {userRoleTab === 'customer' && 'Customer Accounts'}
                                    {userRoleTab === 'restaurant' && 'Restaurant Owner Accounts'}
                                    {userRoleTab === 'delivery' && 'Delivery Partner Accounts'}
                                </h3>
                                <span style={{ color: 'var(--gray)', fontSize: '0.9rem' }}>
                                    Total: <strong>{filteredUsers.length}</strong>
                                </span>
                            </div>

                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--gray-light)' }}>
                                            <th style={{ padding: '1rem', fontWeight: 800, color: 'var(--gray)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Name</th>
                                            <th style={{ padding: '1rem', fontWeight: 800, color: 'var(--gray)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Email</th>
                                            <th style={{ padding: '1rem', fontWeight: 800, color: 'var(--gray)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Phone</th>
                                            <th style={{ padding: '1rem', fontWeight: 800, color: 'var(--gray)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Status</th>
                                            <th style={{ padding: '1rem', fontWeight: 800, color: 'var(--gray)', fontSize: '0.85rem', textTransform: 'uppercase' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredUsers.map(user => (
                                            <tr key={user._id} style={{ borderBottom: '1px solid var(--gray-light)' }}>
                                                <td style={{ padding: '1rem', fontWeight: 600 }}>{user.name}</td>
                                                <td style={{ padding: '1rem', color: 'var(--gray)', fontSize: '0.9rem' }}>{user.email}</td>
                                                <td style={{ padding: '1rem', color: 'var(--gray)', fontSize: '0.9rem' }}>{user.phone || 'N/A'}</td>
                                                <td style={{ padding: '1rem' }}>
                                                    <span className={`badge badge-${user.isBlocked ? 'danger' : 'success'}`} style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem' }}>
                                                        {user.isBlocked ? 'BLOCKED' : 'ACTIVE'}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '1rem' }}>
                                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                        <button
                                                            className="btn"
                                                            style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', border: '1px solid var(--gray-light)' }}
                                                            onClick={() => viewUserDetails(user._id)}
                                                        >
                                                            View
                                                        </button>
                                                        <button
                                                            className="btn"
                                                            style={{
                                                                fontSize: '0.75rem',
                                                                padding: '0.4rem 0.8rem',
                                                                background: user.isBlocked ? 'var(--success)' : 'var(--warning)',
                                                                color: 'white',
                                                                border: 'none'
                                                            }}
                                                            onClick={() => toggleBlockUser(user._id)}
                                                        >
                                                            {user.isBlocked ? 'Unblock' : 'Block'}
                                                        </button>
                                                        <button
                                                            className="btn"
                                                            style={{ fontSize: '0.75rem', padding: '0.4rem 0.8rem', background: 'var(--danger)', color: 'white', border: 'none' }}
                                                            onClick={() => deleteUser(user._id)}
                                                        >
                                                            Delete
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredUsers.length === 0 && (
                                            <tr>
                                                <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--gray)' }}>
                                                    No {userRoleTab} users found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* User Details Modal */}
                        {showUserModal && selectedUser && (
                            <div style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                background: 'rgba(0,0,0,0.5)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                zIndex: 1000
                            }} onClick={() => setShowUserModal(false)}>
                                <div className="card" style={{
                                    maxWidth: '500px',
                                    width: '90%',
                                    padding: '2rem',
                                    maxHeight: '80vh',
                                    overflowY: 'auto'
                                }} onClick={(e) => e.stopPropagation()}>
                                    <h3 style={{ marginBottom: '1.5rem', fontSize: '1.5rem', fontWeight: 800 }}>User Details</h3>

                                    <div style={{ display: 'grid', gap: '1rem' }}>
                                        <div>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--gray)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Name</p>
                                            <p style={{ fontWeight: 600 }}>{selectedUser.name}</p>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--gray)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Email</p>
                                            <p style={{ fontWeight: 600 }}>{selectedUser.email}</p>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--gray)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Phone</p>
                                            <p style={{ fontWeight: 600 }}>{selectedUser.phone || 'Not provided'}</p>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--gray)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Role</p>
                                            <span className="badge badge-primary" style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem', textTransform: 'capitalize' }}>
                                                {selectedUser.role}
                                            </span>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--gray)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Status</p>
                                            <span className={`badge badge-${selectedUser.isBlocked ? 'danger' : 'success'}`} style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}>
                                                {selectedUser.isBlocked ? 'Blocked' : 'Active'}
                                            </span>
                                        </div>
                                        {selectedUser.address && (
                                            <div>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--gray)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Address</p>
                                                <p style={{ fontWeight: 600 }}>
                                                    {selectedUser.address.street && `${selectedUser.address.street}, `}
                                                    {selectedUser.address.city && `${selectedUser.address.city} `}
                                                    {selectedUser.address.zip}
                                                </p>
                                            </div>
                                        )}
                                        <div>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--gray)', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Member Since</p>
                                            <p style={{ fontWeight: 600 }}>{new Date(selectedUser.createdAt).toLocaleDateString()}</p>
                                        </div>
                                    </div>

                                    <button
                                        className="btn btn-primary"
                                        style={{ marginTop: '1.5rem', width: '100%' }}
                                        onClick={() => setShowUserModal(false)}
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'orders' && (
                    <div className="fade-up">
                        {/* Header */}
                        <div style={{ marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--secondary)', marginBottom: '0.5rem' }}>Order Monitoring</h2>
                            <p style={{ color: 'var(--gray)', fontSize: '1rem' }}>Real-time order tracking and management</p>
                        </div>

                        {/* Status Filter Tabs */}
                        <div style={{ marginBottom: '2rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            {[
                                { key: 'all', label: 'All Orders', count: orders.length },
                                { key: 'placed', label: 'Placed', count: orders.filter(o => o.status === 'placed').length },
                                { key: 'preparing', label: 'Preparing', count: orders.filter(o => o.status === 'preparing').length },
                                { key: 'picked_up', label: 'Out for Delivery', count: orders.filter(o => o.status === 'picked_up').length },
                                { key: 'delivered', label: 'Delivered', count: orders.filter(o => o.status === 'delivered').length },
                                { key: 'cancelled', label: 'Cancelled', count: orders.filter(o => o.status === 'cancelled').length }
                            ].map(tab => (
                                <button
                                    key={tab.key}
                                    onClick={() => setOrderStatusFilter(tab.key)}
                                    className={orderStatusFilter === tab.key ? 'active' : ''}
                                    style={{
                                        padding: '0.75rem 1.25rem',
                                        background: orderStatusFilter === tab.key ? 'var(--primary)' : 'var(--bg-card)',
                                        color: orderStatusFilter === tab.key ? 'white' : 'var(--secondary)',
                                        border: orderStatusFilter === tab.key ? 'none' : '1px solid var(--gray-light)',
                                        borderRadius: 'var(--radius-md)',
                                        fontWeight: 700,
                                        fontSize: '0.9rem',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    {tab.label}
                                    <span style={{
                                        background: orderStatusFilter === tab.key ? 'rgba(255,255,255,0.2)' : 'var(--gray-light)',
                                        padding: '0.2rem 0.6rem',
                                        borderRadius: '12px',
                                        fontSize: '0.75rem',
                                        fontWeight: 800
                                    }}>
                                        {tab.count}
                                    </span>
                                </button>
                            ))}
                        </div>

                        {/* Search Bar */}
                        <div style={{ marginBottom: '2rem', position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray)' }} />
                            <input
                                type="text"
                                placeholder="Search by Order ID, Customer, or Restaurant..."
                                value={orderSearchQuery}
                                onChange={(e) => setOrderSearchQuery(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '0.875rem 1rem 0.875rem 3rem',
                                    border: '1px solid var(--gray-light)',
                                    borderRadius: 'var(--radius-md)',
                                    fontSize: '0.95rem',
                                    background: 'var(--bg-card)',
                                    color: 'var(--secondary)'
                                }}
                            />
                        </div>

                        {/* Orders Table */}
                        <div className="card glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: 'var(--bg-main)', borderBottom: '2px solid var(--gray-light)' }}>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Order ID</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Restaurant</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Customer</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Delivery Partner</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Amount</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</th>
                                            <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Time</th>
                                            <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: 800, color: 'var(--gray)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredOrders.length > 0 ? filteredOrders.map((order, idx) => {
                                            const statusBadge = getOrderStatusBadge(order.status);
                                            const StatusIcon = statusBadge.icon;
                                            return (
                                                <tr key={order._id} style={{ borderBottom: '1px solid var(--gray-light)', transition: 'background 0.2s', background: idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)' }}
                                                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-main)'}
                                                    onMouseLeave={(e) => e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(0,0,0,0.02)'}
                                                >
                                                    <td style={{ padding: '1rem', fontSize: '0.85rem', fontWeight: 600, color: 'var(--secondary)', fontFamily: 'monospace' }}>
                                                        #{order._id.slice(-8).toUpperCase()}
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                            <img src={order.restaurant?.image || 'https://via.placeholder.com/40'} alt={order.restaurant?.name} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover' }} />
                                                            <div>
                                                                <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--secondary)', marginBottom: '0.15rem' }}>{order.restaurant?.name || 'N/A'}</p>
                                                                <p style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>{order.restaurant?.address?.city || 'N/A'}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <div>
                                                            <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--secondary)', marginBottom: '0.15rem' }}>{order.customer?.name || 'N/A'}</p>
                                                            <p style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>{order.customer?.phone || 'N/A'}</p>
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        {order.deliveryPartner ? (
                                                            <div>
                                                                <p style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--secondary)', marginBottom: '0.15rem' }}>{order.deliveryPartner.name}</p>
                                                                <p style={{ fontSize: '0.75rem', color: 'var(--gray)' }}>{order.deliveryPartner.phone}</p>
                                                            </div>
                                                        ) : (
                                                            <span style={{ fontSize: '0.85rem', color: 'var(--gray)', fontStyle: 'italic' }}>Unassigned</span>
                                                        )}
                                                    </td>
                                                    <td style={{ padding: '1rem', fontWeight: 700, fontSize: '0.95rem', color: 'var(--secondary)' }}>
                                                        ₹{order.finalAmount?.toFixed(2) || order.totalAmount?.toFixed(2) || '0.00'}
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <span style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            gap: '0.4rem',
                                                            padding: '0.4rem 0.8rem',
                                                            background: statusBadge.bg,
                                                            color: statusBadge.color,
                                                            borderRadius: '6px',
                                                            fontSize: '0.75rem',
                                                            fontWeight: 800,
                                                            letterSpacing: '0.5px'
                                                        }}>
                                                            <StatusIcon size={14} />
                                                            {statusBadge.label}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--gray)' }}>
                                                        {getRelativeTime(order.createdAt)}
                                                    </td>
                                                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                        <button
                                                            className="btn btn-primary"
                                                            style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                                                            onClick={() => viewOrderDetails(order)}
                                                        >
                                                            View Details
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        }) : (
                                            <tr>
                                                <td colSpan="8" style={{ padding: '3rem', textAlign: 'center' }}>
                                                    <ShoppingBag size={48} style={{ color: 'var(--gray-light)', margin: '0 auto 1rem' }} />
                                                    <p style={{ color: 'var(--gray)', fontSize: '1.1rem', fontWeight: 600 }}>No orders found</p>
                                                    <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', color: 'var(--gray)' }}>Try adjusting your filters or search query</p>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'settings' && (
                    <div className="fade-up">
                        {/* Header with Save Button */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
                            <div>
                                <h2 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--secondary)', marginBottom: '0.5rem' }}>System Settings</h2>
                                <p style={{ color: 'var(--gray)', fontSize: '1rem' }}>Configure platform permissions, commissions, and preferences</p>
                            </div>
                            <button
                                className="btn btn-primary"
                                onClick={saveSettings}
                                disabled={settingsLoading || !settings}
                                style={{
                                    padding: '0.875rem 2rem',
                                    fontSize: '1rem',
                                    fontWeight: 700,
                                    opacity: settingsLoading ? 0.6 : 1,
                                    cursor: settingsLoading ? 'not-allowed' : 'pointer',
                                    background: settingsSaved ? 'var(--success)' : 'var(--primary)'
                                }}
                            >
                                {settingsLoading ? 'Saving...' : settingsSaved ? '✓ Saved!' : 'Save Changes'}
                            </button>
                        </div>

                        {settingsLoading && !settings ? (
                            <div style={{ textAlign: 'center', padding: '4rem' }}>
                                <p style={{ color: 'var(--gray)', fontSize: '1.1rem' }}>Loading settings...</p>
                            </div>
                        ) : settings ? (
                            <div style={{ display: 'grid', gap: '2rem' }}>
                                {/* Role Permissions Section */}
                                <div className="card glass-card" style={{ padding: '2rem' }}>
                                    <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--secondary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <Users size={24} style={{ color: 'var(--primary)' }} />
                                        Role Permissions
                                    </h3>

                                    <div style={{ display: 'grid', gap: '2rem' }}>
                                        {/* Customer Permissions */}
                                        <div>
                                            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gray)', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '1px' }}>Customer Permissions</h4>
                                            <div style={{ display: 'grid', gap: '1rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
                                                    <div>
                                                        <p style={{ fontWeight: 700, color: 'var(--secondary)', marginBottom: '0.25rem' }}>Can Place Orders</p>
                                                        <p style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>Allow customers to place new orders</p>
                                                    </div>
                                                    <label className="toggle-switch">
                                                        <input
                                                            type="checkbox"
                                                            checked={settings.rolePermissions?.customer?.canPlaceOrders || false}
                                                            onChange={(e) => updateSettingField('rolePermissions', 'customer', { ...settings.rolePermissions.customer, canPlaceOrders: e.target.checked })}
                                                        />
                                                        <span className="toggle-slider"></span>
                                                    </label>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
                                                    <div>
                                                        <p style={{ fontWeight: 700, color: 'var(--secondary)', marginBottom: '0.25rem' }}>Can Review Restaurants</p>
                                                        <p style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>Allow customers to leave reviews and ratings</p>
                                                    </div>
                                                    <label className="toggle-switch">
                                                        <input
                                                            type="checkbox"
                                                            checked={settings.rolePermissions?.customer?.canReviewRestaurants || false}
                                                            onChange={(e) => updateSettingField('rolePermissions', 'customer', { ...settings.rolePermissions.customer, canReviewRestaurants: e.target.checked })}
                                                        />
                                                        <span className="toggle-slider"></span>
                                                    </label>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
                                                    <div>
                                                        <p style={{ fontWeight: 700, color: 'var(--secondary)', marginBottom: '0.25rem' }}>Can Use Coupons</p>
                                                        <p style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>Allow customers to apply discount coupons</p>
                                                    </div>
                                                    <label className="toggle-switch">
                                                        <input
                                                            type="checkbox"
                                                            checked={settings.rolePermissions?.customer?.canUseCoupons || false}
                                                            onChange={(e) => updateSettingField('rolePermissions', 'customer', { ...settings.rolePermissions.customer, canUseCoupons: e.target.checked })}
                                                        />
                                                        <span className="toggle-slider"></span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Restaurant Permissions */}
                                        <div>
                                            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gray)', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '1px' }}>Restaurant Permissions</h4>
                                            <div style={{ display: 'grid', gap: '1rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
                                                    <div>
                                                        <p style={{ fontWeight: 700, color: 'var(--secondary)', marginBottom: '0.25rem' }}>Can Manage Menu</p>
                                                        <p style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>Allow restaurants to add/edit menu items</p>
                                                    </div>
                                                    <label className="toggle-switch">
                                                        <input
                                                            type="checkbox"
                                                            checked={settings.rolePermissions?.restaurant?.canManageMenu || false}
                                                            onChange={(e) => updateSettingField('rolePermissions', 'restaurant', { ...settings.rolePermissions.restaurant, canManageMenu: e.target.checked })}
                                                        />
                                                        <span className="toggle-slider"></span>
                                                    </label>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
                                                    <div>
                                                        <p style={{ fontWeight: 700, color: 'var(--secondary)', marginBottom: '0.25rem' }}>Can View Orders</p>
                                                        <p style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>Allow restaurants to view incoming orders</p>
                                                    </div>
                                                    <label className="toggle-switch">
                                                        <input
                                                            type="checkbox"
                                                            checked={settings.rolePermissions?.restaurant?.canViewOrders || false}
                                                            onChange={(e) => updateSettingField('rolePermissions', 'restaurant', { ...settings.rolePermissions.restaurant, canViewOrders: e.target.checked })}
                                                        />
                                                        <span className="toggle-slider"></span>
                                                    </label>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
                                                    <div>
                                                        <p style={{ fontWeight: 700, color: 'var(--secondary)', marginBottom: '0.25rem' }}>Can Update Status</p>
                                                        <p style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>Allow restaurants to update order status</p>
                                                    </div>
                                                    <label className="toggle-switch">
                                                        <input
                                                            type="checkbox"
                                                            checked={settings.rolePermissions?.restaurant?.canUpdateStatus || false}
                                                            onChange={(e) => updateSettingField('rolePermissions', 'restaurant', { ...settings.rolePermissions.restaurant, canUpdateStatus: e.target.checked })}
                                                        />
                                                        <span className="toggle-slider"></span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Delivery Partner Permissions */}
                                        <div>
                                            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--gray)', textTransform: 'uppercase', marginBottom: '1rem', letterSpacing: '1px' }}>Delivery Partner Permissions</h4>
                                            <div style={{ display: 'grid', gap: '1rem' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
                                                    <div>
                                                        <p style={{ fontWeight: 700, color: 'var(--secondary)', marginBottom: '0.25rem' }}>Can Accept Orders</p>
                                                        <p style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>Allow delivery partners to accept delivery requests</p>
                                                    </div>
                                                    <label className="toggle-switch">
                                                        <input
                                                            type="checkbox"
                                                            checked={settings.rolePermissions?.delivery?.canAcceptOrders || false}
                                                            onChange={(e) => updateSettingField('rolePermissions', 'delivery', { ...settings.rolePermissions.delivery, canAcceptOrders: e.target.checked })}
                                                        />
                                                        <span className="toggle-slider"></span>
                                                    </label>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
                                                    <div>
                                                        <p style={{ fontWeight: 700, color: 'var(--secondary)', marginBottom: '0.25rem' }}>Can Update Location</p>
                                                        <p style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>Allow delivery partners to share live location</p>
                                                    </div>
                                                    <label className="toggle-switch">
                                                        <input
                                                            type="checkbox"
                                                            checked={settings.rolePermissions?.delivery?.canUpdateLocation || false}
                                                            onChange={(e) => updateSettingField('rolePermissions', 'delivery', { ...settings.rolePermissions.delivery, canUpdateLocation: e.target.checked })}
                                                        />
                                                        <span className="toggle-slider"></span>
                                                    </label>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
                                                    <div>
                                                        <p style={{ fontWeight: 700, color: 'var(--secondary)', marginBottom: '0.25rem' }}>Can View Earnings</p>
                                                        <p style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>Allow delivery partners to view their earnings</p>
                                                    </div>
                                                    <label className="toggle-switch">
                                                        <input
                                                            type="checkbox"
                                                            checked={settings.rolePermissions?.delivery?.canViewEarnings || false}
                                                            onChange={(e) => updateSettingField('rolePermissions', 'delivery', { ...settings.rolePermissions.delivery, canViewEarnings: e.target.checked })}
                                                        />
                                                        <span className="toggle-slider"></span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Commission Settings Section */}
                                <div className="card glass-card" style={{ padding: '2rem' }}>
                                    <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--secondary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <DollarSign size={24} style={{ color: 'var(--primary)' }} />
                                        Commission Settings
                                    </h3>

                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                                        <div>
                                            <label style={{ display: 'block', fontWeight: 700, color: 'var(--secondary)', marginBottom: '0.5rem' }}>Restaurant Commission (%)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={settings.commission?.restaurantCommission || 0}
                                                onChange={(e) => updateSettingField('commission', 'restaurantCommission', parseFloat(e.target.value))}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.875rem 1rem',
                                                    border: '1px solid var(--gray-light)',
                                                    borderRadius: 'var(--radius-md)',
                                                    fontSize: '1rem',
                                                    background: 'var(--bg-card)',
                                                    color: 'var(--secondary)',
                                                    fontWeight: 600
                                                }}
                                            />
                                            <p style={{ fontSize: '0.8rem', color: 'var(--gray)', marginTop: '0.5rem' }}>Platform commission from restaurants</p>
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', fontWeight: 700, color: 'var(--secondary)', marginBottom: '0.5rem' }}>Delivery Commission (%)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={settings.commission?.deliveryCommission || 0}
                                                onChange={(e) => updateSettingField('commission', 'deliveryCommission', parseFloat(e.target.value))}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.875rem 1rem',
                                                    border: '1px solid var(--gray-light)',
                                                    borderRadius: 'var(--radius-md)',
                                                    fontSize: '1rem',
                                                    background: 'var(--bg-card)',
                                                    color: 'var(--secondary)',
                                                    fontWeight: 600
                                                }}
                                            />
                                            <p style={{ fontSize: '0.8rem', color: 'var(--gray)', marginTop: '0.5rem' }}>Platform commission from delivery</p>
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', fontWeight: 700, color: 'var(--secondary)', marginBottom: '0.5rem' }}>Platform Fee (₹)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={settings.commission?.platformFee || 0}
                                                onChange={(e) => updateSettingField('commission', 'platformFee', parseFloat(e.target.value))}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.875rem 1rem',
                                                    border: '1px solid var(--gray-light)',
                                                    borderRadius: 'var(--radius-md)',
                                                    fontSize: '1rem',
                                                    background: 'var(--bg-card)',
                                                    color: 'var(--secondary)',
                                                    fontWeight: 600
                                                }}
                                            />
                                            <p style={{ fontSize: '0.8rem', color: 'var(--gray)', marginTop: '0.5rem' }}>Flat fee per order</p>
                                        </div>

                                        <div>
                                            <label style={{ display: 'block', fontWeight: 700, color: 'var(--secondary)', marginBottom: '0.5rem' }}>Minimum Order Value (₹)</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={settings.commission?.minimumOrderValue || 0}
                                                onChange={(e) => updateSettingField('commission', 'minimumOrderValue', parseFloat(e.target.value))}
                                                style={{
                                                    width: '100%',
                                                    padding: '0.875rem 1rem',
                                                    border: '1px solid var(--gray-light)',
                                                    borderRadius: 'var(--radius-md)',
                                                    fontSize: '1rem',
                                                    background: 'var(--bg-card)',
                                                    color: 'var(--secondary)',
                                                    fontWeight: 600
                                                }}
                                            />
                                            <p style={{ fontSize: '0.8rem', color: 'var(--gray)', marginTop: '0.5rem' }}>Minimum amount to place order</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Payment Configuration Section */}
                                <div className="card glass-card" style={{ padding: '2rem' }}>
                                    <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--secondary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <DollarSign size={24} style={{ color: 'var(--primary)' }} />
                                        Payment Configuration
                                    </h3>

                                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                                            <div style={{ padding: '1rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div>
                                                        <p style={{ fontWeight: 700, color: 'var(--secondary)', marginBottom: '0.25rem' }}>Enable Cash on Delivery</p>
                                                        <p style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>Allow COD payment method</p>
                                                    </div>
                                                    <label className="toggle-switch">
                                                        <input
                                                            type="checkbox"
                                                            checked={settings.payment?.enableCOD || false}
                                                            onChange={(e) => updateSettingField('payment', 'enableCOD', e.target.checked)}
                                                        />
                                                        <span className="toggle-slider"></span>
                                                    </label>
                                                </div>
                                            </div>

                                            <div style={{ padding: '1rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div>
                                                        <p style={{ fontWeight: 700, color: 'var(--secondary)', marginBottom: '0.25rem' }}>Enable Online Payment</p>
                                                        <p style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>Allow card/UPI/wallet payments</p>
                                                    </div>
                                                    <label className="toggle-switch">
                                                        <input
                                                            type="checkbox"
                                                            checked={settings.payment?.enableOnlinePayment || false}
                                                            onChange={(e) => updateSettingField('payment', 'enableOnlinePayment', e.target.checked)}
                                                        />
                                                        <span className="toggle-slider"></span>
                                                    </label>
                                                </div>
                                            </div>

                                            <div style={{ padding: '1rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div>
                                                        <p style={{ fontWeight: 700, color: 'var(--secondary)', marginBottom: '0.25rem' }}>Auto Refund</p>
                                                        <p style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>Automatically process refunds</p>
                                                    </div>
                                                    <label className="toggle-switch">
                                                        <input
                                                            type="checkbox"
                                                            checked={settings.payment?.autoRefund || false}
                                                            onChange={(e) => updateSettingField('payment', 'autoRefund', e.target.checked)}
                                                        />
                                                        <span className="toggle-slider"></span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                                            <div>
                                                <label style={{ display: 'block', fontWeight: 700, color: 'var(--secondary)', marginBottom: '0.5rem' }}>Payment Gateway</label>
                                                <select
                                                    value={settings.payment?.paymentGateway || 'razorpay'}
                                                    onChange={(e) => updateSettingField('payment', 'paymentGateway', e.target.value)}
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.875rem 1rem',
                                                        border: '1px solid var(--gray-light)',
                                                        borderRadius: 'var(--radius-md)',
                                                        fontSize: '1rem',
                                                        background: 'var(--bg-card)',
                                                        color: 'var(--secondary)',
                                                        fontWeight: 600
                                                    }}
                                                >
                                                    <option value="stripe">Stripe</option>
                                                    <option value="razorpay">Razorpay</option>
                                                    <option value="paypal">PayPal</option>
                                                </select>
                                            </div>

                                            <div>
                                                <label style={{ display: 'block', fontWeight: 700, color: 'var(--secondary)', marginBottom: '0.5rem' }}>Refund Processing Days</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={settings.payment?.refundProcessingDays || 7}
                                                    onChange={(e) => updateSettingField('payment', 'refundProcessingDays', parseInt(e.target.value))}
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.875rem 1rem',
                                                        border: '1px solid var(--gray-light)',
                                                        borderRadius: 'var(--radius-md)',
                                                        fontSize: '1rem',
                                                        background: 'var(--bg-card)',
                                                        color: 'var(--secondary)',
                                                        fontWeight: 600
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* System Preferences Section */}
                                <div className="card glass-card" style={{ padding: '2rem' }}>
                                    <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--secondary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                        <Settings size={24} style={{ color: 'var(--primary)' }} />
                                        System Preferences
                                    </h3>

                                    <div style={{ display: 'grid', gap: '1.5rem' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                                            <div style={{ padding: '1rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div>
                                                        <p style={{ fontWeight: 700, color: 'var(--secondary)', marginBottom: '0.25rem' }}>Maintenance Mode</p>
                                                        <p style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>Temporarily disable the platform</p>
                                                    </div>
                                                    <label className="toggle-switch">
                                                        <input
                                                            type="checkbox"
                                                            checked={settings.system?.maintenanceMode || false}
                                                            onChange={(e) => updateSettingField('system', 'maintenanceMode', e.target.checked)}
                                                        />
                                                        <span className="toggle-slider"></span>
                                                    </label>
                                                </div>
                                            </div>

                                            <div style={{ padding: '1rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div>
                                                        <p style={{ fontWeight: 700, color: 'var(--secondary)', marginBottom: '0.25rem' }}>Allow New Registrations</p>
                                                        <p style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>Enable new user signups</p>
                                                    </div>
                                                    <label className="toggle-switch">
                                                        <input
                                                            type="checkbox"
                                                            checked={settings.system?.allowNewRegistrations || false}
                                                            onChange={(e) => updateSettingField('system', 'allowNewRegistrations', e.target.checked)}
                                                        />
                                                        <span className="toggle-slider"></span>
                                                    </label>
                                                </div>
                                            </div>

                                            <div style={{ padding: '1rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)' }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <div>
                                                        <p style={{ fontWeight: 700, color: 'var(--secondary)', marginBottom: '0.25rem' }}>Require Email Verification</p>
                                                        <p style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>Verify email on signup</p>
                                                    </div>
                                                    <label className="toggle-switch">
                                                        <input
                                                            type="checkbox"
                                                            checked={settings.system?.requireEmailVerification || false}
                                                            onChange={(e) => updateSettingField('system', 'requireEmailVerification', e.target.checked)}
                                                        />
                                                        <span className="toggle-slider"></span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>

                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                                            <div>
                                                <label style={{ display: 'block', fontWeight: 700, color: 'var(--secondary)', marginBottom: '0.5rem' }}>Max Delivery Radius (km)</label>
                                                <input
                                                    type="number"
                                                    min="1"
                                                    value={settings.system?.maxDeliveryRadius || 10}
                                                    onChange={(e) => updateSettingField('system', 'maxDeliveryRadius', parseInt(e.target.value))}
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.875rem 1rem',
                                                        border: '1px solid var(--gray-light)',
                                                        borderRadius: 'var(--radius-md)',
                                                        fontSize: '1rem',
                                                        background: 'var(--bg-card)',
                                                        color: 'var(--secondary)',
                                                        fontWeight: 600
                                                    }}
                                                />
                                            </div>

                                            <div>
                                                <label style={{ display: 'block', fontWeight: 700, color: 'var(--secondary)', marginBottom: '0.5rem' }}>Order Auto-Cancel (minutes)</label>
                                                <input
                                                    type="number"
                                                    min="5"
                                                    value={settings.system?.orderAutoCancel || 30}
                                                    onChange={(e) => updateSettingField('system', 'orderAutoCancel', parseInt(e.target.value))}
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.875rem 1rem',
                                                        border: '1px solid var(--gray-light)',
                                                        borderRadius: 'var(--radius-md)',
                                                        fontSize: '1rem',
                                                        background: 'var(--bg-card)',
                                                        color: 'var(--secondary)',
                                                        fontWeight: 600
                                                    }}
                                                />
                                            </div>

                                            <div>
                                                <label style={{ display: 'block', fontWeight: 700, color: 'var(--secondary)', marginBottom: '0.5rem' }}>Support Email</label>
                                                <input
                                                    type="email"
                                                    value={settings.system?.supportEmail || ''}
                                                    onChange={(e) => updateSettingField('system', 'supportEmail', e.target.value)}
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.875rem 1rem',
                                                        border: '1px solid var(--gray-light)',
                                                        borderRadius: 'var(--radius-md)',
                                                        fontSize: '1rem',
                                                        background: 'var(--bg-card)',
                                                        color: 'var(--secondary)',
                                                        fontWeight: 600
                                                    }}
                                                />
                                            </div>

                                            <div>
                                                <label style={{ display: 'block', fontWeight: 700, color: 'var(--secondary)', marginBottom: '0.5rem' }}>Support Phone</label>
                                                <input
                                                    type="tel"
                                                    value={settings.system?.supportPhone || ''}
                                                    onChange={(e) => updateSettingField('system', 'supportPhone', e.target.value)}
                                                    style={{
                                                        width: '100%',
                                                        padding: '0.875rem 1rem',
                                                        border: '1px solid var(--gray-light)',
                                                        borderRadius: 'var(--radius-md)',
                                                        fontSize: '1rem',
                                                        background: 'var(--bg-card)',
                                                        color: 'var(--secondary)',
                                                        fontWeight: 600
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : null}
                    </div>
                )}
            </main>

            {/* Restaurant Detail Modal - Rendered at root level for proper positioning */}
            {showRestaurantModal && selectedRestaurant && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    backdropFilter: 'blur(4px)',
                    padding: '2rem',
                    overflowY: 'auto'
                }} onClick={() => setShowRestaurantModal(false)}>
                    <div className="card glass-card" style={{
                        maxWidth: '700px',
                        width: '100%',
                        padding: '2.5rem',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        position: 'relative',
                        margin: 'auto'
                    }} onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setShowRestaurantModal(false)}
                            style={{
                                position: 'absolute',
                                top: '1rem',
                                right: '1rem',
                                background: 'var(--gray-light)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--danger)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--gray-light)'}
                        >
                            <X size={18} />
                        </button>

                        <h3 style={{ marginBottom: '1.5rem', fontSize: '1.8rem', fontWeight: 900, color: 'var(--secondary)' }}>Restaurant Details</h3>

                        {/* Restaurant Image */}
                        <img src={selectedRestaurant.image} alt={selectedRestaurant.name} style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }} />

                        <div style={{ display: 'grid', gap: '1.25rem' }}>
                            <div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--gray)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 800 }}>Restaurant Name</p>
                                <p style={{ fontWeight: 700, fontSize: '1.2rem', color: 'var(--secondary)' }}>{selectedRestaurant.name}</p>
                            </div>

                            <div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--gray)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 800 }}>Description</p>
                                <p style={{ fontWeight: 500, color: 'var(--secondary)' }}>{selectedRestaurant.description || 'No description provided'}</p>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--gray)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 800 }}>Owner Name</p>
                                    <p style={{ fontWeight: 600 }}>{selectedRestaurant.owner?.name}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--gray)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 800 }}>Owner Email</p>
                                    <p style={{ fontWeight: 600 }}>{selectedRestaurant.owner?.email}</p>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--gray)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 800 }}>Phone</p>
                                    <p style={{ fontWeight: 600 }}>{selectedRestaurant.owner?.phone || 'N/A'}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--gray)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 800 }}>Menu Items</p>
                                    <p style={{ fontWeight: 600 }}>{selectedRestaurant.menuItemCount || 0}</p>
                                </div>
                            </div>

                            <div>
                                <p style={{ fontSize: '0.75rem', color: 'var(--gray)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 800 }}>Address</p>
                                <p style={{ fontWeight: 600 }}>
                                    {selectedRestaurant.address?.street}, {selectedRestaurant.address?.city}, {selectedRestaurant.address?.state} {selectedRestaurant.address?.zipCode}
                                </p>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--gray)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 800 }}>Rating</p>
                                    <p style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--primary)' }}>⭐ {selectedRestaurant.rating || 0}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--gray)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 800 }}>Reviews</p>
                                    <p style={{ fontWeight: 600 }}>{selectedRestaurant.numReviews || 0}</p>
                                </div>
                                <div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--gray)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 800 }}>Status</p>
                                    <p style={{ fontWeight: 600 }}>{selectedRestaurant.isOpen ? '🟢 Open' : '🔴 Closed'}</p>
                                </div>
                            </div>

                            {selectedRestaurant.cuisine && selectedRestaurant.cuisine.length > 0 && (
                                <div>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--gray)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 800 }}>Cuisine Types</p>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {selectedRestaurant.cuisine.map((c, idx) => (
                                            <span key={idx} style={{ padding: '0.4rem 0.8rem', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 600 }}>
                                                {c}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedRestaurant.rejectionReason && (
                                <div style={{ padding: '1rem', background: 'rgba(239, 68, 68, 0.1)', borderRadius: 'var(--radius-md)', border: '1px solid var(--danger)' }}>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--danger)', textTransform: 'uppercase', marginBottom: '0.5rem', fontWeight: 800 }}>Rejection Reason</p>
                                    <p style={{ fontWeight: 500, color: 'var(--danger)' }}>{selectedRestaurant.rejectionReason}</p>
                                </div>
                            )}
                        </div>

                        {/* Action Buttons */}
                        {(selectedRestaurant.approvalStatus === 'pending' || (!selectedRestaurant.approvalStatus && !selectedRestaurant.isApproved)) && (
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button
                                    className="btn"
                                    style={{ flex: 1, padding: '0.75rem', fontSize: '1rem', background: 'var(--success)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    onClick={() => handleApproveRestaurant(selectedRestaurant._id)}
                                >
                                    <CheckCircle size={18} style={{ marginRight: '0.5rem' }} />
                                    Approve Restaurant
                                </button>
                                <button
                                    className="btn"
                                    style={{ flex: 1, padding: '0.75rem', fontSize: '1rem', background: 'var(--danger)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                                    onClick={() => {
                                        setShowRestaurantModal(false);
                                        openRejectModal(selectedRestaurant);
                                    }}
                                >
                                    <XCircle size={18} style={{ marginRight: '0.5rem' }} />
                                    Reject Restaurant
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Rejection Modal - Rendered at root level for proper positioning */}
            {showRejectModal && restaurantToReject && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    backdropFilter: 'blur(4px)',
                    padding: '2rem',
                    overflowY: 'auto'
                }} onClick={() => setShowRejectModal(false)}>
                    <div className="card glass-card" style={{
                        maxWidth: '500px',
                        width: '100%',
                        padding: '2rem',
                        margin: 'auto'
                    }} onClick={(e) => e.stopPropagation()}>
                        <h3 style={{ marginBottom: '1rem', fontSize: '1.5rem', fontWeight: 800, color: 'var(--danger)' }}>
                            <XCircle size={24} style={{ marginRight: '0.5rem', verticalAlign: 'middle' }} />
                            Reject Restaurant
                        </h3>
                        <p style={{ marginBottom: '1.5rem', color: 'var(--gray)' }}>
                            You are about to reject <strong>{restaurantToReject.name}</strong>. Please provide a reason for rejection.
                        </p>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, color: 'var(--secondary)', marginBottom: '0.5rem' }}>
                                Rejection Reason *
                            </label>
                            <textarea
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                placeholder="Enter the reason for rejecting this restaurant..."
                                rows="4"
                                style={{
                                    width: '100%',
                                    padding: '0.75rem',
                                    border: '1px solid var(--gray-light)',
                                    borderRadius: 'var(--radius-md)',
                                    fontSize: '0.9rem',
                                    background: 'var(--bg-main)',
                                    color: 'var(--secondary)',
                                    resize: 'vertical',
                                    fontFamily: 'inherit'
                                }}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                className="btn"
                                style={{ flex: 1, padding: '0.75rem', border: '1px solid var(--gray-light)' }}
                                onClick={() => setShowRejectModal(false)}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn"
                                style={{ flex: 1, padding: '0.75rem', background: 'var(--danger)', color: 'white', border: 'none' }}
                                onClick={handleRejectRestaurant}
                            >
                                Confirm Rejection
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Order Detail Modal - Rendered at root level for proper positioning */}
            {showOrderModal && selectedOrder && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(0,0,0,0.6)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 9999,
                    backdropFilter: 'blur(4px)',
                    padding: '2rem',
                    overflowY: 'auto'
                }} onClick={() => setShowOrderModal(false)}>
                    <div className="card glass-card" style={{
                        maxWidth: '800px',
                        width: '100%',
                        padding: '2.5rem',
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        position: 'relative',
                        margin: 'auto'
                    }} onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setShowOrderModal(false)}
                            style={{
                                position: 'absolute',
                                top: '1rem',
                                right: '1rem',
                                background: 'var(--gray-light)',
                                border: 'none',
                                borderRadius: '50%',
                                width: '32px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = 'var(--danger)'}
                            onMouseLeave={(e) => e.currentTarget.style.background = 'var(--gray-light)'}
                        >
                            <X size={18} />
                        </button>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                            <div>
                                <h3 style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--secondary)', marginBottom: '0.5rem' }}>Order Details</h3>
                                <p style={{ fontSize: '0.9rem', color: 'var(--gray)', fontFamily: 'monospace' }}>#{selectedOrder._id.slice(-8).toUpperCase()}</p>
                            </div>
                            {(() => {
                                const statusBadge = getOrderStatusBadge(selectedOrder.status);
                                const StatusIcon = statusBadge.icon;
                                return (
                                    <span style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '0.6rem 1rem',
                                        background: statusBadge.bg,
                                        color: statusBadge.color,
                                        borderRadius: '8px',
                                        fontSize: '0.85rem',
                                        fontWeight: 800,
                                        letterSpacing: '0.5px'
                                    }}>
                                        <StatusIcon size={16} />
                                        {statusBadge.label}
                                    </span>
                                );
                            })()}
                        </div>

                        <div style={{ display: 'grid', gap: '2rem' }}>
                            {/* Customer Information */}
                            <div>
                                <h4 style={{ fontSize: '0.75rem', color: 'var(--gray)', textTransform: 'uppercase', marginBottom: '1rem', fontWeight: 800, letterSpacing: '1px' }}>Customer Information</h4>
                                <div style={{ background: 'var(--bg-main)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--gray)', marginBottom: '0.25rem' }}>Name</p>
                                            <p style={{ fontWeight: 700, color: 'var(--secondary)' }}>{selectedOrder.customer?.name || 'N/A'}</p>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--gray)', marginBottom: '0.25rem' }}>Phone</p>
                                            <p style={{ fontWeight: 700, color: 'var(--secondary)' }}>{selectedOrder.customer?.phone || 'N/A'}</p>
                                        </div>
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--gray)', marginBottom: '0.25rem' }}>Email</p>
                                            <p style={{ fontWeight: 600, color: 'var(--secondary)' }}>{selectedOrder.customer?.email || 'N/A'}</p>
                                        </div>
                                        {selectedOrder.deliveryAddress && (
                                            <div style={{ gridColumn: '1 / -1' }}>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--gray)', marginBottom: '0.25rem' }}>Delivery Address</p>
                                                <p style={{ fontWeight: 600, color: 'var(--secondary)' }}>
                                                    {selectedOrder.deliveryAddress.street}, {selectedOrder.deliveryAddress.city}, {selectedOrder.deliveryAddress.state} {selectedOrder.deliveryAddress.zip}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Restaurant Information */}
                            <div>
                                <h4 style={{ fontSize: '0.75rem', color: 'var(--gray)', textTransform: 'uppercase', marginBottom: '1rem', fontWeight: 800, letterSpacing: '1px' }}>Restaurant</h4>
                                <div style={{ background: 'var(--bg-main)', padding: '1.25rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <img src={selectedOrder.restaurant?.image || 'https://via.placeholder.com/60'} alt={selectedOrder.restaurant?.name} style={{ width: '60px', height: '60px', borderRadius: '8px', objectFit: 'cover' }} />
                                    <div>
                                        <p style={{ fontWeight: 700, fontSize: '1.1rem', color: 'var(--secondary)', marginBottom: '0.25rem' }}>{selectedOrder.restaurant?.name || 'N/A'}</p>
                                        <p style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>{selectedOrder.restaurant?.address?.city || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Delivery Partner */}
                            <div>
                                <h4 style={{ fontSize: '0.75rem', color: 'var(--gray)', textTransform: 'uppercase', marginBottom: '1rem', fontWeight: 800, letterSpacing: '1px' }}>Delivery Partner</h4>
                                <div style={{ background: 'var(--bg-main)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
                                    {selectedOrder.deliveryPartner ? (
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                            <div>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--gray)', marginBottom: '0.25rem' }}>Name</p>
                                                <p style={{ fontWeight: 700, color: 'var(--secondary)' }}>{selectedOrder.deliveryPartner.name}</p>
                                            </div>
                                            <div>
                                                <p style={{ fontSize: '0.75rem', color: 'var(--gray)', marginBottom: '0.25rem' }}>Phone</p>
                                                <p style={{ fontWeight: 700, color: 'var(--secondary)' }}>{selectedOrder.deliveryPartner.phone}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <p style={{ color: 'var(--gray)', fontStyle: 'italic' }}>No delivery partner assigned yet</p>
                                    )}
                                </div>
                            </div>

                            {/* Order Items */}
                            <div>
                                <h4 style={{ fontSize: '0.75rem', color: 'var(--gray)', textTransform: 'uppercase', marginBottom: '1rem', fontWeight: 800, letterSpacing: '1px' }}>Order Items</h4>
                                <div style={{ background: 'var(--bg-main)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
                                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                                        <div style={{ display: 'grid', gap: '0.75rem' }}>
                                            {selectedOrder.items.map((item, idx) => (
                                                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: idx < selectedOrder.items.length - 1 ? '1px solid var(--gray-light)' : 'none' }}>
                                                    <div>
                                                        <p style={{ fontWeight: 700, color: 'var(--secondary)', marginBottom: '0.25rem' }}>{item.name}</p>
                                                        <p style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>Quantity: {item.quantity}</p>
                                                    </div>
                                                    <p style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--secondary)' }}>₹{(item.price * item.quantity).toFixed(2)}</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p style={{ color: 'var(--gray)', fontStyle: 'italic' }}>No items in this order</p>
                                    )}
                                </div>
                            </div>

                            {/* Payment Summary */}
                            <div>
                                <h4 style={{ fontSize: '0.75rem', color: 'var(--gray)', textTransform: 'uppercase', marginBottom: '1rem', fontWeight: 800, letterSpacing: '1px' }}>Payment Summary</h4>
                                <div style={{ background: 'var(--bg-main)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
                                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                            <p style={{ color: 'var(--gray)' }}>Subtotal</p>
                                            <p style={{ fontWeight: 600, color: 'var(--secondary)' }}>₹{selectedOrder.totalAmount?.toFixed(2) || '0.00'}</p>
                                        </div>
                                        {selectedOrder.discount > 0 && (
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <p style={{ color: 'var(--success)' }}>Discount</p>
                                                <p style={{ fontWeight: 600, color: 'var(--success)' }}>-₹{selectedOrder.discount?.toFixed(2)}</p>
                                            </div>
                                        )}
                                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '2px solid var(--gray-light)' }}>
                                            <p style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--secondary)' }}>Total</p>
                                            <p style={{ fontWeight: 800, fontSize: '1.1rem', color: 'var(--primary)' }}>₹{selectedOrder.finalAmount?.toFixed(2) || selectedOrder.totalAmount?.toFixed(2) || '0.00'}</p>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                                            <p style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>Payment Status</p>
                                            <span style={{
                                                padding: '0.3rem 0.7rem',
                                                background: selectedOrder.paymentStatus === 'paid' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(251, 146, 60, 0.1)',
                                                color: selectedOrder.paymentStatus === 'paid' ? '#22c55e' : '#fb923c',
                                                borderRadius: '6px',
                                                fontSize: '0.75rem',
                                                fontWeight: 800,
                                                textTransform: 'uppercase'
                                            }}>
                                                {selectedOrder.paymentStatus || 'PENDING'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Timestamps */}
                            <div>
                                <h4 style={{ fontSize: '0.75rem', color: 'var(--gray)', textTransform: 'uppercase', marginBottom: '1rem', fontWeight: 800, letterSpacing: '1px' }}>Timeline</h4>
                                <div style={{ background: 'var(--bg-main)', padding: '1.25rem', borderRadius: 'var(--radius-md)' }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                        <div>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--gray)', marginBottom: '0.25rem' }}>Order Placed</p>
                                            <p style={{ fontWeight: 600, color: 'var(--secondary)' }}>{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--gray)', marginBottom: '0.25rem' }}>Last Updated</p>
                                            <p style={{ fontWeight: 600, color: 'var(--secondary)' }}>{new Date(selectedOrder.updatedAt).toLocaleString()}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
