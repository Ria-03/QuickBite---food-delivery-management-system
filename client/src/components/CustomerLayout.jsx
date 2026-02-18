import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ShoppingBag, Heart, User, Clock, MapPin } from 'lucide-react';
import { useCart } from '../context/CartContext';

const CustomerLayout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { cartItems } = useCart();

    const navItems = [
        { id: 'home', label: 'Home', icon: Home, path: '/customer/home' },
        { id: 'orders', label: 'My Orders', icon: ShoppingBag, path: '/orders' },
        { id: 'track', label: 'Track Order', icon: MapPin, path: '/track-order' },
        { id: 'history', label: 'History', icon: Clock, path: '/history' },
        { id: 'favorites', label: 'Favorites', icon: Heart, path: '/favorites' },
        { id: 'profile', label: 'Profile', icon: User, path: '/profile' }
    ];

    const isActive = (path) => {
        if (path === '/customer/home') return location.pathname === '/customer/home';
        return location.pathname.startsWith(path);
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-main)' }}>
            {/* Sidebar */}
            <aside style={{
                width: '280px',
                background: 'var(--white)',
                borderRight: '1px solid var(--gray-light)',
                position: 'fixed',
                height: '100vh',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 100
            }}>
                {/* Logo */}
                <div style={{
                    padding: '2rem 1.5rem',
                    borderBottom: '1px solid var(--gray-light)'
                }}>
                    <div
                        className="logo"
                        onClick={() => navigate('/customer/home')}
                        style={{
                            fontSize: '1.8rem',
                            cursor: 'pointer',
                            letterSpacing: '-1px'
                        }}
                    >
                        Quick<span style={{ color: 'var(--primary)' }}>Bite</span>
                    </div>
                    <p style={{
                        fontSize: '0.75rem',
                        color: 'var(--gray)',
                        marginTop: '0.5rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                    }}>
                        Customer Portal
                    </p>
                </div>

                {/* Navigation */}
                <nav style={{
                    flex: 1,
                    padding: '1.5rem 1rem',
                    overflowY: 'auto'
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {navItems.map(item => {
                            const Icon = item.icon;
                            const active = isActive(item.path);

                            return (
                                <div
                                    key={item.id}
                                    onClick={() => navigate(item.path)}
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        padding: '12px 16px',
                                        borderRadius: '10px',
                                        cursor: 'pointer',
                                        background: active ? 'linear-gradient(135deg, var(--primary) 0%, #d97706 100%)' : 'transparent',
                                        color: active ? 'white' : 'var(--secondary)',
                                        fontWeight: active ? 800 : 600,
                                        fontSize: '0.95rem',
                                        transition: 'all 0.2s',
                                        boxShadow: active ? '0 4px 12px rgba(255,126,6,0.3)' : 'none'
                                    }}
                                    onMouseEnter={(e) => {
                                        if (!active) {
                                            e.currentTarget.style.background = 'var(--gray-light)';
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (!active) {
                                            e.currentTarget.style.background = 'transparent';
                                        }
                                    }}
                                >
                                    <Icon size={20} />
                                    <span>{item.label}</span>
                                </div>
                            );
                        })}
                    </div>
                </nav>

            </aside>

            {/* Main Content */}
            <main style={{
                marginLeft: '280px',
                flex: 1,
                minHeight: '100vh'
            }}>
                {children}
            </main>
        </div>
    );
};

export default CustomerLayout;
