import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useAddress } from '../context/AddressContext';
import { ShoppingCart } from 'lucide-react';
import logo from '../assets/logo.svg';

const TopNavigation = ({ searchTerm, setSearchTerm }) => {
    const { user, logout } = useAuth();
    const { cartItems } = useCart();
    const { selectedAddress, addresses, selectAddress } = useAddress();
    const navigate = useNavigate();
    const [showAddressMenu, setShowAddressMenu] = useState(false);

    return (
        <div className="top-navbar">
            <div className="top-nav-container">
                <div className="nav-left">
                    <div className="logo" onClick={() => navigate('/customer/home')} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <img src={logo} alt="QuickBite Logo" style={{ height: '40px' }} />
                        <span>Quick<span>Bite</span></span>
                    </div>

                    <div
                        className="location-selector"
                        title="Change Location"
                        onClick={() => setShowAddressMenu(!showAddressMenu)}
                        style={{ position: 'relative', cursor: 'pointer' }}
                    >
                        <span style={{ fontSize: '1.2rem' }}>📍</span>
                        <span>
                            {selectedAddress
                                ? `${selectedAddress.city}, ${selectedAddress.zipCode}`
                                : 'Select Location'}
                        </span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--gray)' }}>▼</span>

                        {/* Address Dropdown */}
                        {showAddressMenu && (
                            <div style={{
                                position: 'absolute',
                                top: '100%',
                                left: 0,
                                background: 'white',
                                borderRadius: '12px',
                                boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                                padding: '1rem',
                                minWidth: '280px',
                                zIndex: 1000,
                                marginTop: '10px',
                                border: '1px solid var(--gray-light)'
                            }}>
                                <h4 style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', color: 'var(--gray)' }}>Choose Delivery Location</h4>
                                {addresses.length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '300px', overflowY: 'auto' }}>
                                        {addresses.map(addr => (
                                            <div
                                                key={addr._id}
                                                onClick={() => {
                                                    selectAddress(addr);
                                                    setShowAddressMenu(false);
                                                }}
                                                style={{
                                                    padding: '0.75rem',
                                                    borderRadius: '8px',
                                                    background: selectedAddress?._id === addr._id ? 'var(--primary-light)' : 'var(--gray-lighter)',
                                                    border: selectedAddress?._id === addr._id ? '1px solid var(--primary)' : '1px solid transparent',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseEnter={(e) => {
                                                    if (selectedAddress?._id !== addr._id) e.currentTarget.style.background = '#f0f0f0';
                                                }}
                                                onMouseLeave={(e) => {
                                                    if (selectedAddress?._id !== addr._id) e.currentTarget.style.background = 'var(--gray-lighter)';
                                                }}
                                            >
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
                                                    <span style={{ fontSize: '1rem' }}>
                                                        {addr.label === 'Home' ? '🏠' : addr.label === 'Work' ? '🏢' : '📍'}
                                                    </span>
                                                    <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{addr.label}</span>
                                                </div>
                                                <div style={{ fontSize: '0.8rem', color: 'var(--gray-dark)', lineHeight: 1.4 }}>
                                                    {addr.addressLine1}, {addr.city} {addr.zipCode}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{ padding: '1rem 0', textAlign: 'center', color: 'var(--gray)', fontSize: '0.9rem' }}>
                                        No addresses found.
                                    </div>
                                )}

                                <div style={{ marginTop: '1rem', paddingTop: '0.5rem', borderTop: '1px solid var(--gray-light)' }}>
                                    <button
                                        className="btn btn-primary"
                                        style={{ width: '100%', fontSize: '0.85rem' }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate('/addresses');
                                            setShowAddressMenu(false);
                                        }}
                                    >
                                        ➕ Add New Address
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="nav-center">
                    <div className="search-container">
                        <span className="search-icon">🔍</span>
                        <input
                            type="text"
                            placeholder="Find your favorite luxury dining..."
                            className="search-input"
                            value={searchTerm || ''}
                            onChange={(e) => setSearchTerm && setSearchTerm(e.target.value)}
                            disabled={!setSearchTerm}
                        />
                    </div>
                </div>

                <div className="nav-right">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>

                        <div
                            style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                            onClick={() => navigate('/checkout')}
                            title="View Cart"
                        >
                            <ShoppingCart size={24} color="var(--secondary)" />
                            {cartItems.length > 0 && (
                                <span style={{
                                    position: 'absolute',
                                    top: '-8px',
                                    right: '-10px',
                                    background: 'var(--primary)',
                                    color: 'white',
                                    borderRadius: '50%',
                                    padding: '2px 6px',
                                    fontSize: '0.7rem',
                                    fontWeight: 800,
                                    minWidth: '18px',
                                    textAlign: 'center',
                                    border: '2px solid white'
                                }}>
                                    {cartItems.length}
                                </span>
                            )}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-full)', background: 'var(--gray-light)' }}>
                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                                {user?.name?.charAt(0) || 'U'}
                            </div>
                            <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user?.name?.split(' ')[0]}</span>
                        </div>
                        <button className="btn" onClick={logout} style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                            Logout
                        </button>
                    </div>
                </div>
            </div>
            {/* Click overlay to close menu */}
            {showAddressMenu && (
                <div
                    style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 999 }}
                    onClick={() => setShowAddressMenu(false)}
                />
            )}
        </div>
    );
};

export default TopNavigation;
