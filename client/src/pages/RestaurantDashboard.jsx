import { useState, useEffect } from 'react';
import axios from 'axios';
import {
    LayoutDashboard,
    ShoppingBag,
    Utensils,
    BarChart3,
    Settings,
    Plus,
    TrendingUp,
    Clock,
    CheckCircle2,
    DollarSign,
    MoreVertical,
    ChevronRight,
    Search,
    Trophy,
    UtensilsCrossed,
    Inbox,
    Radio,
    Edit2,
    Trash2,
    Package,
    LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');

const RestaurantDashboard = () => {
    const { user, logout } = useAuth();
    const { showToast } = useToast();
    const [restaurant, setRestaurant] = useState(null);
    const [menu, setMenu] = useState([]);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isSetup, setIsSetup] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [searchQuery, setSearchQuery] = useState('');
    const [profileForm, setProfileForm] = useState({ name: '', description: '', cuisine: '', address: '' });
    const [showAddItemModal, setShowAddItemModal] = useState(false);
    const [newItem, setNewItem] = useState({ name: '', description: '', price: '', category: 'Main', image: '' });
    const [expandedOrders, setExpandedOrders] = useState({});
    const [dateRange, setDateRange] = useState('7'); // days
    const [showEditItemModal, setShowEditItemModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [settingsForm, setSettingsForm] = useState({
        name: '',
        description: '',
        cuisine: '',
        address: '',
        phone: '',
        email: '',
        operatingHours: {
            monday: { open: '09:00', close: '22:00', closed: false },
            tuesday: { open: '09:00', close: '22:00', closed: false },
            wednesday: { open: '09:00', close: '22:00', closed: false },
            thursday: { open: '09:00', close: '22:00', closed: false },
            friday: { open: '09:00', close: '22:00', closed: false },
            saturday: { open: '09:00', close: '23:00', closed: false },
            sunday: { open: '10:00', close: '21:00', closed: false }
        },
        bankAccount: '',
        ifscCode: '',
        notifications: {
            orderAlerts: true,
            emailNotifications: true,
            smsAlerts: false
        }
    });
    const [categoryFilter, setCategoryFilter] = useState('All');
    const [menuSearch, setMenuSearch] = useState('');
    const [sortBy, setSortBy] = useState('name'); // name, price, category, popularity
    const [selectedItems, setSelectedItems] = useState([]);

    useEffect(() => {
        fetchRestaurantData();
    }, []);

    useEffect(() => {
        if (restaurant?._id) {
            console.log(`🔌 Joining Restaurant Room: restaurant_${restaurant._id}`);
            socket.emit('join_room', `restaurant_${restaurant._id}`);

            const handleNewOrder = (order) => {
                console.log('🔔 New Order Received:', order);
                showToast(`New Order Received! #${order._id.slice(-6).toUpperCase()}`, 'success');
                fetchRestaurantData();
            };

            const handleStatusUpdate = (updatedOrder) => {
                console.log('🔔 Order Status Update:', updatedOrder);
                fetchRestaurantData();
            };

            socket.on('new_order', handleNewOrder);
            socket.on('order_status_update', handleStatusUpdate);

            return () => {
                socket.off('new_order', handleNewOrder);
                socket.off('order_status_update', handleStatusUpdate);
            };
        }
    }, [restaurant?._id]);

    const fetchRestaurantData = async () => {
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const { data } = await axios.get('http://localhost:5000/api/restaurants/my/profile', config);

            if (data) {
                setRestaurant(data);
                setIsSetup(true);
                setProfileForm({
                    name: data.name || '',
                    description: data.description || '',
                    cuisine: Array.isArray(data.cuisine) ? data.cuisine.join(', ') : (data.cuisine || ''),
                    address: data.address || '',
                    phone: data.phone || ''
                });
                const menuRes = await axios.get(`http://localhost:5000/api/restaurants/${data._id}/menu`);
                setMenu(menuRes.data);
                const ordersRes = await axios.get(`http://localhost:5000/api/orders/restaurant/${data._id}`, config);
                setOrders(ordersRes.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
            }
        } catch (err) {
            if (err.response?.status === 404) {
                setIsSetup(false);
            } else {
                showToast('Failed to fetch dashboard data', 'error');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRestaurant = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/restaurants', {
                ...profileForm,
                cuisine: profileForm.cuisine.split(',').map(c => c.trim())
            }, { headers: { Authorization: `Bearer ${token}` } });
            showToast('Restaurant profile created successfully!', 'success');
            fetchRestaurantData();
        } catch (err) {
            showToast('Failed to create profile', 'error');
        }
    };

    const handleUpdateProfile = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/restaurants/${restaurant._id}`, {
                ...profileForm,
                cuisine: profileForm.cuisine.split(',').map(c => c.trim())
            }, { headers: { Authorization: `Bearer ${token}` } });
            showToast('Profile updated successfully!', 'success');
            fetchRestaurantData();
        } catch (err) {
            console.error(err);
            showToast('Failed to update profile', 'error');
        }
    };

    const handleAddItem = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post(`http://localhost:5000/api/restaurants/${restaurant._id}/menu`, newItem, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showToast('Menu item added successfully!', 'success');
            setShowAddItemModal(false);
            setNewItem({ name: '', description: '', price: '', category: 'Main', image: '' });
            fetchRestaurantData();
        } catch (err) {
            showToast('Failed to add menu item', 'error');
        }
    };

    const handleArchiveAll = async () => {
        if (!window.confirm('Are you sure you want to archive all delivered orders? This action cannot be undone.')) {
            return;
        }
        try {
            const token = localStorage.getItem('token');
            const deliveredOrders = orders.filter(o => o.status === 'delivered');
            await Promise.all(
                deliveredOrders.map(order =>
                    axios.delete(`http://localhost:5000/api/orders/${order._id}`, {
                        headers: { Authorization: `Bearer ${token}` }
                    })
                )
            );
            showToast(`Archived ${deliveredOrders.length} orders successfully!`, 'success');
            fetchRestaurantData();
        } catch (err) {
            showToast('Failed to archive orders', 'error');
        }
    };

    const handleExportCSV = () => {
        const headers = ['Order ID', 'Customer', 'Email', 'Items', 'Total Amount', 'Status', 'Date'];
        const rows = orders.map(order => [
            `#${order._id.slice(-6).toUpperCase()}`,
            order.customer?.name || 'N/A',
            order.customer?.email || 'N/A',
            order.items.map(item => `${item.quantity}x ${item.name}`).join('; '),
            `₹${order.totalAmount}`,
            order.status.toUpperCase(),
            new Date(order.createdAt).toLocaleDateString()
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `orders_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showToast('CSV exported successfully!', 'success');
    };

    const toggleOrderExpand = (orderId) => {
        setExpandedOrders(prev => ({
            ...prev,
            [orderId]: !prev[orderId]
        }));
    };

    const handleEditItem = (item) => {
        setEditingItem(item);
        setNewItem({
            name: item.name,
            description: item.description,
            price: item.price,
            category: item.category,
            image: item.image || ''
        });
        setShowEditItemModal(true);
    };

    const handleUpdateItem = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/restaurants/${restaurant._id}/menu/${editingItem._id}`, newItem, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showToast('Menu item updated successfully!', 'success');
            setShowEditItemModal(false);
            setEditingItem(null);
            setNewItem({ name: '', description: '', price: '', category: 'Main', image: '' });
            fetchRestaurantData();
        } catch (err) {
            showToast('Failed to update menu item', 'error');
        }
    };

    const handleDeleteItem = async (itemId) => {
        if (!window.confirm('Are you sure you want to delete this menu item? This action cannot be undone.')) {
            return;
        }
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/restaurants/${restaurant._id}/menu/${itemId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            showToast('Menu item deleted successfully!', 'success');
            fetchRestaurantData();
        } catch (err) {
            showToast('Failed to delete menu item', 'error');
        }
    };

    // Menu filtering and sorting functions
    const getFilteredAndSortedMenu = () => {
        let filtered = menu;

        // Apply category filter
        if (categoryFilter !== 'All') {
            filtered = filtered.filter(item => item.category === categoryFilter);
        }

        // Apply search filter
        if (menuSearch) {
            filtered = filtered.filter(item =>
                item.name.toLowerCase().includes(menuSearch.toLowerCase()) ||
                item.description.toLowerCase().includes(menuSearch.toLowerCase())
            );
        }

        // Apply sorting
        const sorted = [...filtered].sort((a, b) => {
            switch (sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'price':
                    return a.price - b.price;
                case 'category':
                    return a.category.localeCompare(b.category);
                case 'popularity':
                    const aOrders = getItemStats(a._id).orders;
                    const bOrders = getItemStats(b._id).orders;
                    return bOrders - aOrders;
                default:
                    return 0;
            }
        });

        return sorted;
    };

    const getItemStats = (itemId) => {
        const itemOrders = orders.filter(order =>
            order.items.some(item => item.menuItem === itemId || item.menuItem?._id === itemId)
        );
        const totalOrders = itemOrders.reduce((sum, order) => {
            const orderItem = order.items.find(item => item.menuItem === itemId || item.menuItem?._id === itemId);
            return sum + (orderItem?.quantity || 0);
        }, 0);
        const revenue = itemOrders.reduce((sum, order) => {
            const orderItem = order.items.find(item => item.menuItem === itemId || item.menuItem?._id === itemId);
            return sum + (orderItem ? orderItem.price * orderItem.quantity : 0);
        }, 0);
        return { orders: totalOrders, revenue };
    };

    const toggleItemSelection = (itemId) => {
        setSelectedItems(prev =>
            prev.includes(itemId)
                ? prev.filter(id => id !== itemId)
                : [...prev, itemId]
        );
    };

    const handleBulkDelete = async () => {
        if (selectedItems.length === 0) {
            showToast('No items selected', 'error');
            return;
        }
        if (!window.confirm(`Delete ${selectedItems.length} selected items? This cannot be undone.`)) {
            return;
        }
        try {
            const token = localStorage.getItem('token');
            await Promise.all(selectedItems.map(itemId =>
                axios.delete(`http://localhost:5000/api/restaurants/${restaurant._id}/menu/${itemId}`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
            ));
            showToast(`${selectedItems.length} items deleted successfully!`, 'success');
            setSelectedItems([]);
            fetchRestaurantData();
        } catch (err) {
            showToast('Failed to delete items', 'error');
        }
    };

    // Calculate revenue trend data for chart
    const getRevenueTrend = () => {
        const days = parseInt(dateRange);
        const trend = [];
        const now = new Date();

        for (let i = days - 1; i >= 0; i--) {
            const date = new Date(now);
            date.setDate(date.getDate() - i);
            const dayOrders = orders.filter(o => {
                const orderDate = new Date(o.createdAt);
                return orderDate.toDateString() === date.toDateString();
            });
            const revenue = dayOrders.reduce((sum, o) => sum + o.totalAmount, 0);
            trend.push({ date, revenue, orders: dayOrders.length });
        }
        return trend;
    };

    // Calculate top selling items
    const getTopSellingItems = () => {
        const itemSales = {};
        orders.forEach(order => {
            order.items.forEach(item => {
                const key = item.menuItem || item.name;
                if (!itemSales[key]) {
                    itemSales[key] = { name: item.name, count: 0, revenue: 0 };
                }
                itemSales[key].count += item.quantity;
                itemSales[key].revenue += item.price * item.quantity;
            });
        });
        return Object.values(itemSales)
            .sort((a, b) => b.count - b.count)
            .slice(0, 4);
    };

    // Calculate success rate
    const getSuccessRate = () => {
        if (orders.length === 0) return '0%';
        const delivered = orders.filter(o => o.status === 'delivered').length;
        const cancelled = orders.filter(o => o.status === 'cancelled').length;
        const total = orders.length;
        const rate = ((delivered / (delivered + cancelled || 1)) * 100).toFixed(1);
        return `${rate}%`;
    };

    // Generate SVG path for revenue chart
    const generateChartPath = () => {
        const trend = getRevenueTrend();
        if (trend.length === 0) return 'M0,80 L400,80';

        const maxRevenue = Math.max(...trend.map(t => t.revenue), 1);
        const width = 400;
        const height = 100;
        const step = width / (trend.length - 1 || 1);

        const points = trend.map((t, i) => {
            const x = i * step;
            const y = height - (t.revenue / maxRevenue) * 70 - 10;
            return `${x},${y}`;
        });

        return `M${points.join(' L')}`;
    };

    // Handle KPI card clicks
    const handleKPIClick = (type) => {
        switch (type) {
            case 'orders':
                setActiveTab('orders');
                break;
            case 'revenue':
                showToast(`Total Revenue: ₹${stats.revenue.toLocaleString()}`, 'info');
                break;
            case 'pending':
                setActiveTab('orders');
                setSearchQuery('placed');
                break;
            case 'success':
                showToast(`Success Rate: ${getSuccessRate()}`, 'success');
                break;
        }
    };

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/orders/${orderId}/status`,
                { status: newStatus },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            showToast(`Order #${orderId.slice(-6).toUpperCase()} updated to ${newStatus}`, 'success');
            fetchRestaurantData(); // Refresh data
        } catch (err) {
            showToast('Failed to update status', 'error');
        }
    };

    if (loading) return (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-main)' }}>
            <div style={{ textAlign: 'center' }}>
                <div className="spinner" style={{ width: '50px', height: '50px', border: '5px solid var(--gray-light)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1.5rem' }}></div>
                <h2 style={{ color: 'var(--secondary)', fontWeight: 800 }}>Loading Partner Portal...</h2>
            </div>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    if (!isSetup) {
        return (
            <div style={{ minHeight: '100vh', background: 'var(--bg-main)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                <div className="card" style={{ maxWidth: '500px', width: '100%', padding: '3rem' }}>
                    <div className="logo" style={{ fontSize: '2rem', justifyContent: 'center', marginBottom: '1.5rem' }}>Quick<span>Bite</span></div>
                    <h2 style={{ textAlign: 'center', marginBottom: '0.5rem' }}>Partner Onboarding</h2>
                    <p style={{ textAlign: 'center', color: 'var(--gray)', marginBottom: '2.5rem', fontWeight: 600 }}>Set up your culinary presence on QuickBite.</p>

                    <form onSubmit={handleCreateRestaurant} style={{ display: 'grid', gap: '1.5rem' }}>
                        <div className="form-group">
                            <label className="form-label">Restaurant Name</label>
                            <input className="form-input" value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} placeholder="e.g., The Golden Whisk" required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Cuisine (comma separated)</label>
                            <input className="form-input" value={profileForm.cuisine} onChange={e => setProfileForm({ ...profileForm, cuisine: e.target.value })} placeholder="e.g., Italian, Pizza, Pasta" required />
                        </div>
                        <div className="form-group">
                            <label className="form-label">Address</label>
                            <input className="form-input" value={profileForm.address} onChange={e => setProfileForm({ ...profileForm, address: e.target.value })} placeholder="123 Gourmet St, Foodville" required />
                        </div>
                        <button className="btn btn-primary" style={{ height: '56px', fontSize: '1.1rem' }}>Launch Restaurant 🚀</button>
                    </form>
                </div>
            </div>
        );
    }

    const stats = {
        totalOrders: orders.length,
        revenue: orders.filter(o => o.status === 'delivered').reduce((acc, curr) => acc + curr.totalAmount, 0),
        pending: orders.filter(o => ['placed', 'accepted', 'preparing'].includes(o.status)).length,
        delivered: orders.filter(o => o.status === 'delivered').length
    };

    return (
        <div className="dashboard-container" style={{ margin: '-2.5rem -2rem', height: '100vh', display: 'flex' }}>
            {/* Enterprise Sidebar */}
            <aside className="q-sidebar" style={{ width: '280px', flexShrink: 0 }}>
                <div style={{ padding: '2.5rem 1.5rem', marginBottom: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="logo" style={{ fontSize: '1.8rem', letterSpacing: '-1px', color: 'white' }}>Quick<span style={{ color: 'var(--primary)' }}>Bite</span></div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                        <div className="shimmer" style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></div>
                        <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.8)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px' }}>Terminal Online</p>
                    </div>
                </div>

                <div style={{ padding: '0 1rem' }}>
                    {[
                        { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
                        { id: 'orders', label: 'Orders', icon: ShoppingBag },
                        { id: 'menu', label: 'Menu Builder', icon: Utensils },
                        { id: 'inventory', label: 'Inventory', icon: Package, link: '/restaurant/inventory' },
                        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
                        { id: 'settings', label: 'Settings', icon: Settings }
                    ].map(tab => (
                        <div
                            key={tab.id}
                            className={`q-sidebar-item ${activeTab === tab.id ? 'active' : ''}`}
                            onClick={() => {
                                if (tab.link) {
                                    window.location.href = tab.link;
                                } else {
                                    setActiveTab(tab.id);
                                }
                            }}
                            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', background: 'transparent' }}
                        >
                            <tab.icon size={20} /> {tab.label}
                        </div>
                    ))}
                </div>



                {/* Logout Button */}
                <div style={{ padding: '0 1rem 1rem' }}>
                    <div
                        className="q-sidebar-item"
                        onClick={() => {
                            logout();
                            showToast('Logged out successfully', 'success');
                            window.location.href = '/login';
                        }}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '12px 16px',
                            cursor: 'pointer',
                            borderRadius: '8px',
                            transition: '0.2s',
                            background: 'rgba(239, 68, 68, 0.1)',
                            color: '#ef4444'
                        }}
                    >
                        <LogOut size={20} /> Logout
                    </div>
                </div>
            </aside>

            {/* Content Area */}
            <main style={{ flex: 1, overflowY: 'auto', background: 'var(--bg-main)', padding: '2.5rem 3.5rem' }}>
                <header className="fade-up" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem' }}>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: 'var(--secondary)', letterSpacing: '-1px' }}>Partner Terminal</h1>
                        <p style={{ color: 'var(--gray)', fontWeight: 600, fontSize: '1.1rem' }}>Welcome, <span style={{ color: 'var(--secondary)' }}>{user?.name}</span>. Your culinary empire is scaling.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <div style={{ position: 'relative' }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--gray)' }} />
                            <input
                                className="form-input"
                                placeholder="Search orders..."
                                style={{ paddingLeft: '40px', width: '250px', margin: 0 }}
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button className="btn btn-primary" onClick={() => setShowAddItemModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Plus size={18} /> New Item
                        </button>
                    </div>
                </header>

                {activeTab === 'dashboard' && (
                    <div style={{ display: 'grid', gap: '2rem' }}>
                        {/* KPI Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
                            {[
                                { label: 'Today\'s Orders', val: stats.totalOrders, icon: ShoppingBag, color: '#3b82f6', grad: 'linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)' },
                                { label: 'Gross Revenue', val: `₹${stats.revenue.toLocaleString()}`, icon: DollarSign, color: '#10b981', grad: 'linear-gradient(135deg, #10b981 0%, #059669 100%)' },
                                { label: 'Pending Action', val: stats.pending, icon: Clock, color: '#f59e0b', grad: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' },
                                { label: 'Success Rate', val: getSuccessRate(), icon: TrendingUp, color: '#8b5cf6', grad: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)' }
                            ].map((kpi, idx) => (
                                <div
                                    key={idx}
                                    className="card fade-up hover-glow glass-card"
                                    onClick={() => handleKPIClick(['orders', 'revenue', 'pending', 'success'][idx])}
                                    style={{
                                        padding: '1.5rem',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1.25rem',
                                        animationDelay: `${idx * 0.1}s`,
                                        overflow: 'hidden',
                                        position: 'relative',
                                        cursor: 'pointer',
                                        transition: '0.3s'
                                    }}
                                >
                                    <div style={{ position: 'absolute', top: '-10px', right: '-10px', width: '60px', height: '60px', background: kpi.grad, opacity: 0.1, borderRadius: '50%' }}></div>
                                    <div style={{ width: '54px', height: '54px', borderRadius: '16px', background: kpi.grad, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 16px -4px rgba(0,0,0,0.1)' }}>
                                        <kpi.icon size={26} />
                                    </div>
                                    <div style={{ zIndex: 1 }}>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--gray)', fontWeight: 800, textTransform: 'uppercase', marginBottom: '4px', letterSpacing: '0.5px' }}>{kpi.label}</p>
                                        <div style={{ fontSize: '1.6rem', fontWeight: 900, color: 'var(--secondary)' }}>{kpi.val}</div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Middle Section: Chart and Top Products */}
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
                            <div className="card" style={{ padding: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                                    <h3 style={{ margin: 0 }}>Revenue Trend</h3>
                                    <select className="form-input" value={dateRange} onChange={(e) => setDateRange(e.target.value)} style={{ width: 'auto', fontSize: '0.8rem', margin: 0 }}>
                                        <option value="7">Last 7 Days</option>
                                        <option value="30">Last 30 Days</option>
                                        <option value="90">Last 90 Days</option>
                                    </select>
                                </div>
                                <svg viewBox="0 0 400 100" style={{ width: '100%', height: '150px' }}>
                                    <defs>
                                        <linearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
                                            <stop offset="0%" style={{ stopColor: 'var(--primary)', stopOpacity: 0.2 }} />
                                            <stop offset="100%" style={{ stopColor: 'var(--primary)', stopOpacity: 0 }} />
                                        </linearGradient>
                                    </defs>
                                    <path d={generateChartPath()} fill="transparent" stroke="var(--primary)" strokeWidth="3" />
                                    <path d={`${generateChartPath()} L400,100 L0,100 Z`} fill="url(#grad)" />
                                    {getRevenueTrend().map((point, i) => {
                                        const x = (i / (getRevenueTrend().length - 1 || 1)) * 400;
                                        const maxRev = Math.max(...getRevenueTrend().map(t => t.revenue), 1);
                                        const y = 100 - (point.revenue / maxRev) * 70 - 10;
                                        return <circle key={i} cx={x} cy={y} r="4" fill="var(--primary)" style={{ cursor: 'pointer' }} title={`₹${point.revenue}`} />;
                                    })}
                                </svg>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', color: 'var(--gray)', fontSize: '0.75rem', fontWeight: 700 }}>
                                    <span>MON</span><span>TUE</span><span>WED</span><span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span>
                                </div>
                            </div>

                            <div className="card fade-up glass-card" style={{ padding: '2rem', animationDelay: '0.3s' }}>
                                <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <TrendingUp size={20} color="var(--primary)" /> Top Selling Masterpieces
                                </h3>
                                <div style={{ display: 'grid', gap: '1.25rem' }}>
                                    {getTopSellingItems().length > 0 ? getTopSellingItems().map((item, idx) => (
                                        <div key={idx} className="hover-glow" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '10px', borderRadius: '12px', transition: '0.3s', cursor: 'pointer' }}>
                                            <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: idx === 0 ? 'linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)' : 'var(--gray-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.05)' }}>
                                                {idx === 0 ? <Trophy size={20} color="white" /> : <UtensilsCrossed size={20} color="var(--gray)" />}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <p style={{ margin: 0, fontWeight: 800, fontSize: '0.95rem' }}>{item.name}</p>
                                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--gray)', fontWeight: 600 }}>{item.count} orders • ₹{item.revenue.toLocaleString()}</p>
                                            </div>
                                            <ChevronRight size={16} color="var(--gray-light)" />
                                        </div>
                                    )) : (
                                        <div style={{ textAlign: 'center', padding: '2rem 1rem', opacity: 0.6 }}>
                                            <Utensils size={40} style={{ margin: '0 auto 1rem', display: 'block', color: 'var(--gray-light)' }} />
                                            <p style={{ fontSize: '0.85rem', fontWeight: 700 }}>Your menu is waiting for its first star!</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Bottom Section: Recent Orders */}
                        <div className="card fade-up glass-card" style={{ padding: 0, animationDelay: '0.4s', border: 'none', boxShadow: 'var(--premium-shadow)' }}>
                            <div style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--gray-light)' }}>
                                <h3 style={{ margin: 0, fontWeight: 900 }}>Live Transaction Feed</h3>
                                <button className="btn" onClick={handleExportCSV} style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 800, background: 'rgba(255,126,6,0.1)', padding: '8px 16px', borderRadius: '8px' }}>Export History</button>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                {orders.length > 0 ? (
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ textAlign: 'left', background: '#f8fafc' }}>
                                                <th style={{ padding: '1.25rem 2rem', fontSize: '0.7rem', color: 'var(--gray)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Partner/Customer</th>
                                                <th style={{ padding: '1.25rem 2rem', fontSize: '0.7rem', color: 'var(--gray)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Investment</th>
                                                <th style={{ padding: '1.25rem 2rem', fontSize: '0.7rem', color: 'var(--gray)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Status</th>
                                                <th style={{ padding: '1.25rem 2rem', fontSize: '0.7rem', color: 'var(--gray)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Workflow</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orders.slice(0, 8).map(order => (
                                                <tr key={order._id} className="hover-glow" style={{ borderBottom: '1px solid var(--gray-light)', transition: '0.2s' }}>
                                                    <td style={{ padding: '1.5rem 2rem' }}>
                                                        <div style={{ fontWeight: 900, fontSize: '1rem', color: 'var(--secondary)' }}>{order.customer?.name}</div>
                                                        <div style={{ fontSize: '0.7rem', color: 'var(--gray)', fontWeight: 700 }}>REF: {order._id.slice(-8).toUpperCase()}</div>
                                                    </td>
                                                    <td style={{ padding: '1.5rem 2rem', fontWeight: 900, color: 'var(--primary)', fontSize: '1.1rem' }}>₹{order.totalAmount}</td>
                                                    <td style={{ padding: '1.5rem 2rem' }}>
                                                        <span style={{
                                                            padding: '6px 14px',
                                                            borderRadius: '8px',
                                                            fontSize: '0.65rem',
                                                            fontWeight: 900,
                                                            background: order.status === 'delivered' ? '#ecfdf5' :
                                                                order.status === 'cancelled' ? '#fef2f2' : '#fff7ed',
                                                            color: order.status === 'delivered' ? '#065f46' :
                                                                order.status === 'cancelled' ? '#991b1b' : '#9a3412',
                                                            textTransform: 'uppercase',
                                                            display: 'inline-block'
                                                        }}>
                                                            {order.status.replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td style={{ padding: '1.5rem 2rem' }}>
                                                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                                                            {order.status === 'placed' && (
                                                                <button
                                                                    className="btn btn-primary shimmer"
                                                                    style={{ padding: '6px 16px', fontSize: '0.75rem', fontWeight: 800 }}
                                                                    onClick={() => updateOrderStatus(order._id, 'accepted')}
                                                                >APPROVE</button>
                                                            )}
                                                            {order.status === 'accepted' && (
                                                                <button
                                                                    className="btn btn-primary"
                                                                    style={{ padding: '6px 16px', fontSize: '0.75rem', fontWeight: 800, background: '#8b5cf6' }}
                                                                    onClick={() => updateOrderStatus(order._id, 'preparing')}
                                                                >START PREP</button>
                                                            )}
                                                            {order.status === 'preparing' && (
                                                                <button
                                                                    className="btn btn-primary"
                                                                    style={{ padding: '6px 16px', fontSize: '0.75rem', fontWeight: 800, background: '#10b981' }}
                                                                    onClick={() => updateOrderStatus(order._id, 'ready')}
                                                                >MARK READY</button>
                                                            )}
                                                            <button className="btn btn-secondary" style={{ padding: '8px', borderRadius: '8px' }}><MoreVertical size={16} /></button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
                                        <Radio size={48} style={{ margin: '0 auto 1.5rem', display: 'block', color: 'var(--gray-light)' }} />
                                        <h3 style={{ color: 'var(--secondary)', marginBottom: '0.5rem' }}>Awaiting Connections</h3>
                                        <p style={{ color: 'var(--gray)', fontWeight: 600 }}>Your live order feed will appear here as soon as a customer places an order.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'orders' && (
                    <div className="fade-up">
                        <div className="card glass-card" style={{ padding: 0, border: 'none', boxShadow: 'var(--premium-shadow)' }}>
                            <div style={{ padding: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--gray-light)' }}>
                                <div>
                                    <h2 style={{ margin: 0, fontWeight: 900 }}>Master Order Registry</h2>
                                    <p style={{ color: 'var(--gray)', fontSize: '0.9rem', fontWeight: 600, marginTop: '4px' }}>Real-time synchronization with QuickBite logistics.</p>
                                </div>
                                <div style={{ display: 'flex', gap: '1rem' }}>
                                    <button className="btn btn-secondary" onClick={handleArchiveAll} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>Archive All</button>
                                    <button className="btn btn-primary" onClick={handleExportCSV} style={{ padding: '8px 16px', fontSize: '0.85rem' }}>Export CSV</button>
                                </div>
                            </div>
                            <div style={{ overflowX: 'auto' }}>
                                {orders.length > 0 ? (
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ textAlign: 'left', background: '#f8fafc' }}>
                                                <th style={{ padding: '1.25rem 2rem', fontSize: '0.7rem', color: 'var(--gray)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Order ID</th>
                                                <th style={{ padding: '1.25rem 2rem', fontSize: '0.7rem', color: 'var(--gray)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Customer</th>
                                                <th style={{ padding: '1.25rem 2rem', fontSize: '0.7rem', color: 'var(--gray)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Culinary Details</th>
                                                <th style={{ padding: '1.25rem 2rem', fontSize: '0.7rem', color: 'var(--gray)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Total Amount</th>
                                                <th style={{ padding: '1.25rem 2rem', fontSize: '0.7rem', color: 'var(--gray)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Deployment Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orders.map(order => (
                                                <tr key={order._id} className="hover-glow" style={{ borderBottom: '1px solid var(--gray-light)', transition: '0.2s' }}>
                                                    <td style={{ padding: '1.5rem 2rem' }}>
                                                        <div style={{ fontWeight: 800, color: 'var(--gray)', fontFamily: 'monospace' }}>#{order._id.slice(-6).toUpperCase()}</div>
                                                        <div style={{ fontSize: '0.65rem', opacity: 0.5, fontWeight: 700 }}>{new Date(order.createdAt).toLocaleTimeString()}</div>
                                                    </td>
                                                    <td style={{ padding: '1.5rem 2rem' }}>
                                                        <div style={{ fontWeight: 900, color: 'var(--secondary)' }}>{order.customer?.name}</div>
                                                        <div style={{ fontSize: '0.7rem', color: 'var(--gray)', fontWeight: 700 }}>{order.customer?.email}</div>
                                                    </td>
                                                    <td style={{ padding: '1.5rem 2rem' }}>
                                                        <div style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                                                            {order.items.map((item, idx) => (
                                                                <div key={idx} style={{ display: 'flex', gap: '6px', marginBottom: '4px' }}>
                                                                    <span style={{ color: 'var(--primary)', fontWeight: 800 }}>{item.quantity}×</span>
                                                                    <span>{item.name}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </td>
                                                    <td style={{ padding: '1.5rem 2rem', fontWeight: 900, color: 'var(--secondary)', fontSize: '1.1rem' }}>₹{order.totalAmount.toLocaleString()}</td>
                                                    <td style={{ padding: '1.5rem 2rem' }}>
                                                        <div style={{ position: 'relative' }}>
                                                            <select
                                                                value={order.status}
                                                                onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                                                                style={{
                                                                    padding: '8px 12px',
                                                                    borderRadius: '8px',
                                                                    fontSize: '0.75rem',
                                                                    fontWeight: 900,
                                                                    border: 'none',
                                                                    cursor: 'pointer',
                                                                    appearance: 'none',
                                                                    width: '140px',
                                                                    textAlign: 'center',
                                                                    background: order.status === 'delivered' ? '#ecfdf5' :
                                                                        order.status === 'cancelled' ? '#fef2f2' :
                                                                            ['placed', 'accepted'].includes(order.status) ? '#fff7ed' : '#f5f3ff',
                                                                    color: order.status === 'delivered' ? '#065f46' :
                                                                        order.status === 'cancelled' ? '#991b1b' :
                                                                            ['placed', 'accepted'].includes(order.status) ? '#9a3412' : '#5b21b6',
                                                                    textTransform: 'uppercase'
                                                                }}
                                                            >
                                                                <option value="placed">Pending Approval</option>
                                                                <option value="accepted">Accepted</option>
                                                                <option value="preparing">Preparing</option>
                                                                <option value="ready">Ready for Pickup</option>
                                                                <option value="delivered">Delivered</option>
                                                                <option value="cancelled">Cancelled</option>
                                                            </select>
                                                            <div style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', fontSize: '0.6rem' }}>▼</div>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                ) : (
                                    <div style={{ textAlign: 'center', padding: '8rem 2rem' }}>
                                        <Inbox size={64} style={{ margin: '0 auto 1.5rem', display: 'block', color: 'var(--gray-light)' }} />
                                        <h2 style={{ color: 'var(--secondary)', marginBottom: '0.5rem', fontWeight: 900 }}>No Orders Recorded</h2>
                                        <p style={{ color: 'var(--gray)', fontWeight: 600, maxWidth: '400px', margin: '0 auto' }}>Once your culinary masterpieces start reaching customers, the deployment logs will populate here.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Menu Builder Tab */}
                {activeTab === 'menu' && (
                    <div className="fade-up">
                        <div style={{ marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '1.5rem' }}>Menu Builder</h2>

                            {/* Category Filter Tabs */}
                            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                                {['All', 'Main', 'Appetizer', 'Dessert', 'Beverage'].map(cat => (
                                    <button
                                        key={cat}
                                        onClick={() => setCategoryFilter(cat)}
                                        className={categoryFilter === cat ? 'btn btn-primary' : 'btn btn-secondary'}
                                        style={{ padding: '8px 20px', fontSize: '0.9rem' }}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>

                            {/* Search and Controls Bar */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '1rem', marginBottom: '1.5rem' }}>
                                <input
                                    type="text"
                                    placeholder="Search menu items..."
                                    value={menuSearch}
                                    onChange={(e) => setMenuSearch(e.target.value)}
                                    className="form-input"
                                    style={{ margin: 0 }}
                                />
                                <select
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value)}
                                    className="form-input"
                                    style={{ margin: 0, width: 'auto' }}
                                >
                                    <option value="name">Sort by Name</option>
                                    <option value="price">Sort by Price</option>
                                    <option value="category">Sort by Category</option>
                                    <option value="popularity">Sort by Popularity</option>
                                </select>
                                {selectedItems.length > 0 && (
                                    <button
                                        onClick={handleBulkDelete}
                                        className="btn"
                                        style={{ background: 'var(--danger)', color: 'white', padding: '8px 16px' }}
                                    >
                                        Delete Selected ({selectedItems.length})
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Menu Items Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '2rem' }}>
                            {getFilteredAndSortedMenu().map(item => {
                                const stats = getItemStats(item._id);
                                return (
                                    <div key={item._id} className="card" style={{ padding: '2rem', display: 'flex', flexDirection: 'column', position: 'relative' }}>
                                        {/* Selection Checkbox */}
                                        <input
                                            type="checkbox"
                                            checked={selectedItems.includes(item._id)}
                                            onChange={() => toggleItemSelection(item._id)}
                                            style={{ position: 'absolute', top: '1rem', left: '1rem', width: '18px', height: '18px', cursor: 'pointer' }}
                                        />

                                        {/* Category Badge */}
                                        <div style={{ position: 'absolute', top: '1rem', right: '1rem', background: '#fef3c7', color: '#92400e', padding: '4px 8px', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 900 }}>
                                            {item.category.toUpperCase()}
                                        </div>

                                        <h4 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '0.5rem', marginTop: '0.5rem' }}>{item.name}</h4>
                                        <p style={{ color: 'var(--gray)', fontSize: '0.9rem', flex: 1, fontWeight: 600 }}>{item.description}</p>

                                        {/* Item Statistics */}
                                        {stats.orders > 0 && (
                                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', padding: '0.75rem', background: 'var(--bg-main)', borderRadius: '8px', fontSize: '0.85rem' }}>
                                                <div>
                                                    <div style={{ color: 'var(--gray)', fontWeight: 600, fontSize: '0.75rem' }}>Orders</div>
                                                    <div style={{ fontWeight: 900, color: 'var(--primary)' }}>{stats.orders}</div>
                                                </div>
                                                <div>
                                                    <div style={{ color: 'var(--gray)', fontWeight: 600, fontSize: '0.75rem' }}>Revenue</div>
                                                    <div style={{ fontWeight: 900, color: 'var(--success)' }}>₹{stats.revenue.toLocaleString()}</div>
                                                </div>
                                            </div>
                                        )}

                                        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--primary)' }}>₹{item.price}</span>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button className="btn btn-secondary" onClick={() => handleEditItem(item)} style={{ padding: '8px' }}>
                                                    <Edit2 size={16} />
                                                </button>
                                                <button className="btn btn-secondary" onClick={() => handleDeleteItem(item._id)} style={{ padding: '8px', color: 'var(--danger)' }}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Add New Item Card */}
                            <div className="card" onClick={() => setShowAddItemModal(true)} style={{ border: '3px dashed var(--gray-light)', background: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem', cursor: 'pointer', gap: '1rem', transition: '0.2s' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'} onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--gray-light)'}>
                                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--gray-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Plus size={32} color="var(--gray)" />
                                </div>
                                <span style={{ fontWeight: 800, color: 'var(--gray)' }}>Add New Culinary Masterpiece</span>
                            </div>
                        </div>

                        {/* Empty State */}
                        {getFilteredAndSortedMenu().length === 0 && (
                            <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
                                <Package size={64} style={{ margin: '0 auto 1.5rem', display: 'block', color: 'var(--gray-light)' }} />
                                <h3 style={{ color: 'var(--secondary)', marginBottom: '0.5rem' }}>No Items Found</h3>
                                <p style={{ color: 'var(--gray)', fontWeight: 600 }}>
                                    {menuSearch || categoryFilter !== 'All'
                                        ? 'Try adjusting your filters or search terms.'
                                        : 'Start building your menu by adding your first item!'}
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Analytics Tab */}
                {activeTab === 'analytics' && (
                    <div className="fade-up">
                        <div style={{ marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>Analytics & Insights</h2>
                            <p style={{ color: 'var(--gray)', fontWeight: 600 }}>Deep dive into your restaurant's performance metrics</p>
                        </div>

                        {/* Time Range Selector */}
                        <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
                            {['7', '30', '90'].map(days => (
                                <button
                                    key={days}
                                    onClick={() => setDateRange(days)}
                                    className={dateRange === days ? 'btn btn-primary' : 'btn btn-secondary'}
                                    style={{ padding: '8px 20px', fontSize: '0.9rem' }}
                                >
                                    Last {days} Days
                                </button>
                            ))}
                        </div>

                        {/* Key Metrics Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                            {[
                                {
                                    label: 'Total Revenue',
                                    value: `₹${getRevenueTrend().reduce((sum, t) => sum + t.revenue, 0).toLocaleString()}`,
                                    icon: DollarSign,
                                    color: '#10b981',
                                    change: '+12.5%'
                                },
                                {
                                    label: 'Total Orders',
                                    value: getRevenueTrend().reduce((sum, t) => sum + t.orders, 0),
                                    icon: ShoppingBag,
                                    color: '#3b82f6',
                                    change: '+8.2%'
                                },
                                {
                                    label: 'Avg Order Value',
                                    value: `₹${(getRevenueTrend().reduce((sum, t) => sum + t.revenue, 0) / Math.max(getRevenueTrend().reduce((sum, t) => sum + t.orders, 0), 1)).toFixed(0)}`,
                                    icon: TrendingUp,
                                    color: '#8b5cf6',
                                    change: '+4.1%'
                                },
                                {
                                    label: 'Success Rate',
                                    value: getSuccessRate(),
                                    icon: CheckCircle2,
                                    color: '#f59e0b',
                                    change: '+2.3%'
                                }
                            ].map((metric, idx) => (
                                <div key={idx} className="card" style={{ padding: '1.5rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                                        <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: `${metric.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <metric.icon size={24} color={metric.color} />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--gray)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>{metric.label}</p>
                                            <div style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--secondary)' }}>{metric.value}</div>
                                        </div>
                                    </div>
                                    <div style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 700 }}>
                                        <TrendingUp size={14} style={{ display: 'inline', marginRight: '4px' }} />
                                        {metric.change} from previous period
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Charts Section */}
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                            {/* Revenue Trend Chart */}
                            <div className="card" style={{ padding: '2rem' }}>
                                <h3 style={{ marginBottom: '1.5rem', fontWeight: 900 }}>Revenue Trend</h3>
                                <svg viewBox="0 0 600 200" style={{ width: '100%', height: '200px' }}>
                                    <defs>
                                        <linearGradient id="analyticsGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                                            <stop offset="0%" style={{ stopColor: 'var(--primary)', stopOpacity: 0.3 }} />
                                            <stop offset="100%" style={{ stopColor: 'var(--primary)', stopOpacity: 0 }} />
                                        </linearGradient>
                                    </defs>
                                    {(() => {
                                        const trend = getRevenueTrend();
                                        if (trend.length === 0) return <text x="300" y="100" textAnchor="middle" fill="var(--gray)">No data available</text>;

                                        const maxRevenue = Math.max(...trend.map(t => t.revenue), 1);
                                        const width = 600;
                                        const height = 200;
                                        const step = width / (trend.length - 1 || 1);

                                        const points = trend.map((t, i) => {
                                            const x = i * step;
                                            const y = height - (t.revenue / maxRevenue) * 140 - 20;
                                            return `${x},${y}`;
                                        });

                                        const pathD = `M${points.join(' L')}`;
                                        const areaD = `${pathD} L${width},${height} L0,${height} Z`;

                                        return (
                                            <>
                                                <path d={areaD} fill="url(#analyticsGrad)" />
                                                <path d={pathD} fill="transparent" stroke="var(--primary)" strokeWidth="3" />
                                                {trend.map((point, i) => {
                                                    const x = i * step;
                                                    const y = height - (point.revenue / maxRevenue) * 140 - 20;
                                                    return (
                                                        <g key={i}>
                                                            <circle cx={x} cy={y} r="5" fill="var(--primary)" style={{ cursor: 'pointer' }} />
                                                            <title>₹{point.revenue} ({point.orders} orders)</title>
                                                        </g>
                                                    );
                                                })}
                                            </>
                                        );
                                    })()}
                                </svg>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem', color: 'var(--gray)', fontSize: '0.7rem', fontWeight: 700 }}>
                                    {getRevenueTrend().map((t, i) => (
                                        <span key={i}>{new Date(t.date).toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase()}</span>
                                    ))}
                                </div>
                            </div>

                            {/* Order Status Distribution */}
                            <div className="card" style={{ padding: '2rem' }}>
                                <h3 style={{ marginBottom: '1.5rem', fontWeight: 900 }}>Order Status</h3>
                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    {[
                                        { status: 'delivered', label: 'Delivered', color: '#10b981' },
                                        { status: 'preparing', label: 'Preparing', color: '#8b5cf6' },
                                        { status: 'placed', label: 'Pending', color: '#f59e0b' },
                                        { status: 'cancelled', label: 'Cancelled', color: '#ef4444' }
                                    ].map(item => {
                                        const count = orders.filter(o => o.status === item.status).length;
                                        const percentage = orders.length > 0 ? ((count / orders.length) * 100).toFixed(1) : 0;
                                        return (
                                            <div key={item.status}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                                                    <span style={{ fontSize: '0.85rem', fontWeight: 700 }}>{item.label}</span>
                                                    <span style={{ fontSize: '0.85rem', fontWeight: 900, color: item.color }}>{count} ({percentage}%)</span>
                                                </div>
                                                <div style={{ height: '8px', background: 'var(--gray-light)', borderRadius: '4px', overflow: 'hidden' }}>
                                                    <div style={{ width: `${percentage}%`, height: '100%', background: item.color, transition: '0.3s' }}></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Top Performing Items */}
                        <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                            <h3 style={{ marginBottom: '1.5rem', fontWeight: 900 }}>Top Performing Menu Items</h3>
                            {getTopSellingItems().length > 0 ? (
                                <div style={{ overflowX: 'auto' }}>
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--gray-light)' }}>
                                                <th style={{ padding: '1rem', fontSize: '0.75rem', color: 'var(--gray)', fontWeight: 900, textTransform: 'uppercase' }}>Rank</th>
                                                <th style={{ padding: '1rem', fontSize: '0.75rem', color: 'var(--gray)', fontWeight: 900, textTransform: 'uppercase' }}>Item Name</th>
                                                <th style={{ padding: '1rem', fontSize: '0.75rem', color: 'var(--gray)', fontWeight: 900, textTransform: 'uppercase' }}>Orders</th>
                                                <th style={{ padding: '1rem', fontSize: '0.75rem', color: 'var(--gray)', fontWeight: 900, textTransform: 'uppercase' }}>Revenue</th>
                                                <th style={{ padding: '1rem', fontSize: '0.75rem', color: 'var(--gray)', fontWeight: 900, textTransform: 'uppercase' }}>Performance</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {getTopSellingItems().map((item, idx) => {
                                                const maxRevenue = Math.max(...getTopSellingItems().map(i => i.revenue));
                                                const performance = ((item.revenue / maxRevenue) * 100).toFixed(0);
                                                return (
                                                    <tr key={idx} style={{ borderBottom: '1px solid var(--gray-light)' }}>
                                                        <td style={{ padding: '1.25rem 1rem' }}>
                                                            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: idx === 0 ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : 'var(--gray-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, color: idx === 0 ? 'white' : 'var(--gray)' }}>
                                                                {idx + 1}
                                                            </div>
                                                        </td>
                                                        <td style={{ padding: '1.25rem 1rem', fontWeight: 800, fontSize: '0.95rem' }}>{item.name}</td>
                                                        <td style={{ padding: '1.25rem 1rem', fontWeight: 700, color: 'var(--primary)' }}>{item.count}</td>
                                                        <td style={{ padding: '1.25rem 1rem', fontWeight: 900, fontSize: '1.05rem' }}>₹{item.revenue.toLocaleString()}</td>
                                                        <td style={{ padding: '1.25rem 1rem' }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                                <div style={{ flex: 1, height: '8px', background: 'var(--gray-light)', borderRadius: '4px', overflow: 'hidden' }}>
                                                                    <div style={{ width: `${performance}%`, height: '100%', background: 'linear-gradient(90deg, var(--primary), #f59e0b)', transition: '0.3s' }}></div>
                                                                </div>
                                                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--gray)', minWidth: '40px' }}>{performance}%</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray)' }}>
                                    <Utensils size={48} style={{ margin: '0 auto 1rem', display: 'block', opacity: 0.3 }} />
                                    <p style={{ fontWeight: 600 }}>No sales data available yet</p>
                                </div>
                            )}
                        </div>

                        {/* Additional Insights */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                            {/* Peak Hours */}
                            <div className="card" style={{ padding: '1.5rem' }}>
                                <h4 style={{ marginBottom: '1rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Clock size={20} color="var(--primary)" /> Peak Hours
                                </h4>
                                <div style={{ display: 'grid', gap: '0.75rem' }}>
                                    {(() => {
                                        const hourCounts = {};
                                        orders.forEach(order => {
                                            const hour = new Date(order.createdAt).getHours();
                                            hourCounts[hour] = (hourCounts[hour] || 0) + 1;
                                        });
                                        const sortedHours = Object.entries(hourCounts)
                                            .sort((a, b) => b[1] - a[1])
                                            .slice(0, 5);

                                        if (sortedHours.length === 0) {
                                            return <p style={{ color: 'var(--gray)', fontSize: '0.9rem' }}>No data available</p>;
                                        }

                                        return sortedHours.map(([hour, count]) => (
                                            <div key={hour} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontWeight: 700 }}>{hour}:00 - {parseInt(hour) + 1}:00</span>
                                                <span style={{ fontWeight: 900, color: 'var(--primary)' }}>{count} orders</span>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>

                            {/* Category Performance */}
                            <div className="card" style={{ padding: '1.5rem' }}>
                                <h4 style={{ marginBottom: '1rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <BarChart3 size={20} color="var(--primary)" /> Category Performance
                                </h4>
                                <div style={{ display: 'grid', gap: '0.75rem' }}>
                                    {(() => {
                                        const categoryStats = {};
                                        menu.forEach(item => {
                                            const stats = getItemStats(item._id);
                                            if (!categoryStats[item.category]) {
                                                categoryStats[item.category] = { orders: 0, revenue: 0 };
                                            }
                                            categoryStats[item.category].orders += stats.orders;
                                            categoryStats[item.category].revenue += stats.revenue;
                                        });

                                        const sortedCategories = Object.entries(categoryStats)
                                            .sort((a, b) => b[1].revenue - a[1].revenue);

                                        if (sortedCategories.length === 0) {
                                            return <p style={{ color: 'var(--gray)', fontSize: '0.9rem' }}>No data available</p>;
                                        }

                                        return sortedCategories.map(([category, stats]) => (
                                            <div key={category} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontWeight: 700 }}>{category}</span>
                                                <span style={{ fontWeight: 900, color: 'var(--success)' }}>₹{stats.revenue.toLocaleString()}</span>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Settings Tab */}
                {activeTab === 'settings' && (
                    <div className="fade-up">
                        <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '2rem' }}>Restaurant Settings</h2>

                        {/* Restaurant Profile */}
                        <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                            <h3 style={{ marginBottom: '1.5rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Utensils size={24} color="var(--primary)" /> Restaurant Profile
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.9rem' }}>Restaurant Name</label>
                                    <input
                                        type="text"
                                        value={profileForm.name}
                                        onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                                        className="form-input"
                                        style={{ margin: 0 }}
                                        placeholder="Your Restaurant Name"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.9rem' }}>Phone Number</label>
                                    <input
                                        type="tel"
                                        value={profileForm.phone || ''}
                                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                                        className="form-input"
                                        style={{ margin: 0 }}
                                        placeholder="+91 98765 43210"
                                    />
                                </div>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.9rem' }}>Description</label>
                                    <textarea
                                        className="form-input"
                                        rows={3}
                                        style={{ margin: 0, resize: 'vertical' }}
                                        placeholder="Tell customers about your restaurant..."
                                        value={profileForm.description}
                                        onChange={(e) => setProfileForm({ ...profileForm, description: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.9rem' }}>Cuisine Type</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        style={{ margin: 0 }}
                                        placeholder="Italian, Chinese, etc."
                                        value={profileForm.cuisine}
                                        onChange={(e) => setProfileForm({ ...profileForm, cuisine: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.9rem' }}>Address</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        style={{ margin: 0 }}
                                        placeholder="123 Food Street, City"
                                        value={profileForm.address}
                                        onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                                    />
                                </div>
                            </div>
                            <button onClick={handleUpdateProfile} className="btn btn-primary" style={{ marginTop: '1.5rem' }}>Save Profile Changes</button>
                        </div>

                        {/* Operating Hours */}
                        <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                            <h3 style={{ marginBottom: '1.5rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Clock size={24} color="var(--primary)" /> Operating Hours
                            </h3>
                            <div style={{ display: 'grid', gap: '1rem' }}>
                                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                                    <div key={day} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr 100px', gap: '1rem', alignItems: 'center', padding: '1rem', background: 'var(--bg-main)', borderRadius: '8px' }}>
                                        <span style={{ fontWeight: 800 }}>{day}</span>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', color: 'var(--gray)' }}>Opens</label>
                                            <input type="time" className="form-input" style={{ margin: 0 }} defaultValue="09:00" />
                                        </div>
                                        <div>
                                            <label style={{ display: 'block', fontSize: '0.75rem', marginBottom: '0.25rem', color: 'var(--gray)' }}>Closes</label>
                                            <input type="time" className="form-input" style={{ margin: 0 }} defaultValue="22:00" />
                                        </div>
                                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                                            <input type="checkbox" />
                                            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Closed</span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                            <button className="btn btn-primary" style={{ marginTop: '1.5rem' }}>Update Hours</button>
                        </div>

                        {/* Payment & Banking */}
                        <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                            <h3 style={{ marginBottom: '1.5rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <DollarSign size={24} color="var(--primary)" /> Payment & Banking Details
                            </h3>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.9rem' }}>Bank Account Number</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        style={{ margin: 0 }}
                                        placeholder="XXXX XXXX XXXX 1234"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.9rem' }}>IFSC Code</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        style={{ margin: 0 }}
                                        placeholder="SBIN0001234"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.9rem' }}>Account Holder Name</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        style={{ margin: 0 }}
                                        placeholder="Restaurant Owner Name"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.9rem' }}>GST Number (Optional)</label>
                                    <input
                                        type="text"
                                        className="form-input"
                                        style={{ margin: 0 }}
                                        placeholder="22AAAAA0000A1Z5"
                                    />
                                </div>
                            </div>
                            <button className="btn btn-primary" style={{ marginTop: '1.5rem' }}>Save Banking Details</button>
                        </div>

                        {/* Notification Preferences */}
                        <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
                            <h3 style={{ marginBottom: '1.5rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <CheckCircle2 size={24} color="var(--primary)" /> Notification Preferences
                            </h3>
                            <div style={{ display: 'grid', gap: '1.5rem' }}>
                                {[
                                    { label: 'New Order Alerts', desc: 'Get instant notifications when new orders arrive', checked: true },
                                    { label: 'Email Notifications', desc: 'Receive daily summaries and important updates via email', checked: true },
                                    { label: 'SMS Alerts', desc: 'Get text messages for critical order updates', checked: false },
                                    { label: 'Push Notifications', desc: 'Browser notifications for real-time updates', checked: true }
                                ].map((pref, idx) => (
                                    <label key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem', padding: '1rem', background: 'var(--bg-main)', borderRadius: '8px', cursor: 'pointer' }}>
                                        <input type="checkbox" defaultChecked={pref.checked} style={{ marginTop: '4px' }} />
                                        <div>
                                            <div style={{ fontWeight: 800, marginBottom: '0.25rem' }}>{pref.label}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--gray)', fontWeight: 600 }}>{pref.desc}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                            <button className="btn btn-primary" style={{ marginTop: '1.5rem' }}>Save Preferences</button>
                        </div>

                        {/* Account Security */}
                        <div className="card" style={{ padding: '2rem' }}>
                            <h3 style={{ marginBottom: '1.5rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Settings size={24} color="var(--primary)" /> Account Security
                            </h3>
                            <div style={{ display: 'grid', gap: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.9rem' }}>Current Password</label>
                                    <input
                                        type="password"
                                        className="form-input"
                                        style={{ margin: 0 }}
                                        placeholder="Enter current password"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.9rem' }}>New Password</label>
                                    <input
                                        type="password"
                                        className="form-input"
                                        style={{ margin: 0 }}
                                        placeholder="Enter new password"
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.9rem' }}>Confirm New Password</label>
                                    <input
                                        type="password"
                                        className="form-input"
                                        style={{ margin: 0 }}
                                        placeholder="Confirm new password"
                                    />
                                </div>
                            </div>
                            <button className="btn btn-primary" style={{ marginTop: '1.5rem' }}>Change Password</button>
                        </div>
                    </div>
                )}
            </main>

            {/* Add Item Modal */}
            {showAddItemModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setShowAddItemModal(false)}>
                    <div className="card" onClick={(e) => e.stopPropagation()} style={{ width: '90%', maxWidth: '600px', padding: '2.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ margin: 0, fontWeight: 900 }}>Add New Menu Item</h2>
                            <button onClick={() => setShowAddItemModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--gray)' }}>×</button>
                        </div>
                        <form onSubmit={handleAddItem}>
                            <div style={{ display: 'grid', gap: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.9rem' }}>Item Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={newItem.name}
                                        onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                        placeholder="e.g., Truffle Risotto"
                                        style={{ width: '100%', padding: '12px', border: '2px solid var(--gray-light)', borderRadius: '8px', fontSize: '1rem' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.9rem' }}>Description *</label>
                                    <textarea
                                        required
                                        value={newItem.description}
                                        onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                        placeholder="Describe your culinary masterpiece..."
                                        rows={3}
                                        style={{ width: '100%', padding: '12px', border: '2px solid var(--gray-light)', borderRadius: '8px', fontSize: '1rem', resize: 'vertical' }}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.9rem' }}>Price (₹) *</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            value={newItem.price}
                                            onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                                            placeholder="450"
                                            style={{ width: '100%', padding: '12px', border: '2px solid var(--gray-light)', borderRadius: '8px', fontSize: '1rem' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.9rem' }}>Category *</label>
                                        <select
                                            required
                                            value={newItem.category}
                                            onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                                            style={{ width: '100%', padding: '12px', border: '2px solid var(--gray-light)', borderRadius: '8px', fontSize: '1rem' }}
                                        >
                                            <option value="Main">Main Course</option>
                                            <option value="Appetizer">Appetizer</option>
                                            <option value="Dessert">Dessert</option>
                                            <option value="Beverage">Beverage</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.9rem' }}>Image URL (Optional)</label>
                                    <input
                                        type="url"
                                        value={newItem.image}
                                        onChange={(e) => setNewItem({ ...newItem, image: e.target.value })}
                                        placeholder="https://images.unsplash.com/..."
                                        style={{ width: '100%', padding: '12px', border: '2px solid var(--gray-light)', borderRadius: '8px', fontSize: '1rem' }}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button type="button" onClick={() => setShowAddItemModal(false)} className="btn btn-secondary" style={{ flex: 1, padding: '12px' }}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '12px' }}>Add Item</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Item Modal */}
            {showEditItemModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }} onClick={() => setShowEditItemModal(false)}>
                    <div className="card" onClick={(e) => e.stopPropagation()} style={{ width: '90%', maxWidth: '600px', padding: '2.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                            <h2 style={{ margin: 0, fontWeight: 900 }}>Edit Menu Item</h2>
                            <button onClick={() => setShowEditItemModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: 'var(--gray)' }}>\u00d7</button>
                        </div>
                        <form onSubmit={handleUpdateItem}>
                            <div style={{ display: 'grid', gap: '1.5rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.9rem' }}>Item Name *</label>
                                    <input
                                        type="text"
                                        required
                                        value={newItem.name}
                                        onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                                        placeholder="e.g., Truffle Risotto"
                                        style={{ width: '100%', padding: '12px', border: '2px solid var(--gray-light)', borderRadius: '8px', fontSize: '1rem' }}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.9rem' }}>Description *</label>
                                    <textarea
                                        required
                                        value={newItem.description}
                                        onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                                        placeholder="Describe your culinary masterpiece..."
                                        rows={3}
                                        style={{ width: '100%', padding: '12px', border: '2px solid var(--gray-light)', borderRadius: '8px', fontSize: '1rem', resize: 'vertical' }}
                                    />
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.9rem' }}>Price (\u20b9) *</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            value={newItem.price}
                                            onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                                            placeholder="450"
                                            style={{ width: '100%', padding: '12px', border: '2px solid var(--gray-light)', borderRadius: '8px', fontSize: '1rem' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.9rem' }}>Category *</label>
                                        <select
                                            required
                                            value={newItem.category}
                                            onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                                            style={{ width: '100%', padding: '12px', border: '2px solid var(--gray-light)', borderRadius: '8px', fontSize: '1rem' }}
                                        >
                                            <option value="Main">Main Course</option>
                                            <option value="Appetizer">Appetizer</option>
                                            <option value="Dessert">Dessert</option>
                                            <option value="Beverage">Beverage</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.9rem' }}>Image URL (Optional)</label>
                                    <input
                                        type="url"
                                        value={newItem.image}
                                        onChange={(e) => setNewItem({ ...newItem, image: e.target.value })}
                                        placeholder="https://images.unsplash.com/..."
                                        style={{ width: '100%', padding: '12px', border: '2px solid var(--gray-light)', borderRadius: '8px', fontSize: '1rem' }}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                                <button type="button" onClick={() => setShowEditItemModal(false)} className="btn btn-secondary" style={{ flex: 1, padding: '12px' }}>Cancel</button>
                                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '12px' }}>Update Item</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RestaurantDashboard;
