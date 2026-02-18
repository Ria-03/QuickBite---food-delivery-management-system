import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, Map, User, List, LogOut, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const DeliveryLayout = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { logout } = useAuth();

    const isActive = (path) => location.pathname === path;

    const navItems = [
        { path: '/delivery/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
        { path: '/delivery/map', icon: Map, label: 'Live Map' },
        { path: '/delivery/profile', icon: User, label: 'Profile' }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-main)' }}>

            {/* Desktop Sidebar (Hidden on Mobile) */}
            <aside className="d-none d-md-block q-sidebar" style={{ width: '280px', flexShrink: 0, position: 'fixed', height: '100vh', zIndex: 100, background: '#1e293b', boxShadow: '4px 0 24px rgba(0,0,0,0.1)' }}>
                <div style={{ padding: '2.5rem 1.5rem', marginBottom: '1rem' }}>
                    <div className="logo" style={{ fontSize: '1.8rem', letterSpacing: '-0.5px', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        Quick<span style={{ color: 'var(--primary)' }}>Bite</span>
                        <span style={{
                            fontSize: '0.65rem', color: '#94a3b8', background: 'rgba(255,255,255,0.1)',
                            padding: '2px 8px', borderRadius: '12px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 700
                        }}>Rider</span>
                    </div>
                </div>

                <div style={{ padding: '0 1rem' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem', paddingLeft: '1rem' }}>Menu</div>
                    {navItems.map(item => (
                        <div
                            key={item.path}
                            className={`q-sidebar-item ${isActive(item.path) ? 'active' : ''}`}
                            onClick={() => navigate(item.path)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 1rem',
                                cursor: 'pointer', marginBottom: '0.5rem', borderRadius: '12px',
                                transition: 'all 0.2s ease',
                                background: isActive(item.path) ? 'var(--primary)' : 'transparent',
                                color: isActive(item.path) ? 'white' : '#94a3b8',
                                fontWeight: isActive(item.path) ? 600 : 500
                            }}
                        >
                            <item.icon size={20} strokeWidth={isActive(item.path) ? 2.5 : 2} /> {item.label}
                        </div>
                    ))}
                </div>

                <div style={{ marginTop: 'auto', padding: '1rem' }}>
                    <div
                        className="q-sidebar-item"
                        onClick={() => { logout(); navigate('/delivery/login'); }}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                            cursor: 'pointer', background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
                            borderRadius: '12px', transition: 'all 0.2s ease', fontWeight: 600
                        }}
                    >
                        <LogOut size={20} /> Logout
                    </div>
                    <div style={{ textAlign: 'center', marginTop: '1.5rem', color: '#475569', fontSize: '0.75rem' }}>
                        &copy; 2026 QuickBite Logistics
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main style={{
                flex: 1,
                marginLeft: '0', // Mobile default
                padding: '1rem',
                paddingBottom: '90px', // Space for bottom nav
                transition: 'margin-left 0.3s ease'
            }} className="desktop-padding">
                <style>{`
                    @media (min-width: 768px) {
                        .desktop-padding {
                            margin-left: 280px !important;
                            padding: 3rem 4rem !important;
                            padding-bottom: 3rem !important;
                        }
                        .d-none { display: none !important; }
                        .d-md-block { display: block !important; }
                        .d-md-none { display: none !important; }
                    }
                    @media (max-width: 767px) {
                        .d-md-block { display: none !important; }
                    }
                `}</style>
                {children}
            </main>

            {/* Mobile Bottom Navigation */}
            <nav style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                background: 'rgba(255, 255, 255, 0.9)',
                backdropFilter: 'blur(12px)',
                borderTop: '1px solid rgba(0,0,0,0.05)',
                display: 'flex',
                justifyContent: 'space-around',
                padding: '12px 0 20px', // Extra padding for safe area
                zIndex: 1000,
                boxShadow: '0 -4px 20px rgba(0,0,0,0.03)'
            }} className="d-md-none">
                {navItems.map(item => (
                    <div
                        key={item.path}
                        onClick={() => navigate(item.path)}
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                            color: isActive(item.path) ? 'var(--primary)' : '#94a3b8',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <div style={{
                            padding: '6px', borderRadius: '10px',
                            background: isActive(item.path) ? 'rgba(var(--primary-rgb), 0.1)' : 'transparent'
                        }}>
                            <item.icon size={22} strokeWidth={isActive(item.path) ? 2.5 : 2} />
                        </div>
                        <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>{item.label}</span>
                    </div>
                ))}
                <div
                    onClick={() => { logout(); navigate('/delivery/login'); }}
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '4px',
                        cursor: 'pointer',
                        color: '#94a3b8'
                    }}
                >
                    <div style={{ padding: '6px' }}>
                        <LogOut size={22} />
                    </div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>Logout</span>
                </div>
            </nav>
        </div>
    );
};

export default DeliveryLayout;
