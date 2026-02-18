import { useState, useEffect } from 'react';
import CustomerLayout from '../components/CustomerLayout';
import { User, Mail, Phone, MapPin, Edit2, Save } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import axios from 'axios';

const Profile = () => {
    const { user } = useAuth();
    const { showToast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [coupons, setCoupons] = useState([]);

    // Fetch coupons
    useEffect(() => {
        const fetchCoupons = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                const { data } = await axios.get('http://localhost:5000/api/coupons', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setCoupons(data);
            } catch (err) {
                console.error("Failed to fetch coupons", err);
            }
        };
        fetchCoupons();
    }, []);

    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: user?.address || ''
    });

    const handleSave = () => {
        // Placeholder - in a real app, save to backend
        showToast('Profile updated successfully!', 'success');
        setIsEditing(false);
    };

    return (
        <CustomerLayout>
            <div style={{ padding: '3rem', maxWidth: '900px', margin: '0 auto' }}>
                <div style={{ marginBottom: '3rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>My Profile</h1>
                        <p style={{ color: 'var(--gray)', fontSize: '1.1rem', fontWeight: 600 }}>
                            Manage your account information
                        </p>
                    </div>
                    <button
                        className="btn btn-primary"
                        onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                        style={{
                            padding: '0.75rem 1.5rem',
                            fontWeight: 800,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        {isEditing ? (
                            <>
                                <Save size={18} />
                                Save Changes
                            </>
                        ) : (
                            <>
                                <Edit2 size={18} />
                                Edit Profile
                            </>
                        )}
                    </button>
                </div>

                <div className="card" style={{ padding: '3rem' }}>
                    {/* Profile Picture & Points */}
                    <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                        <div style={{
                            width: '120px',
                            height: '120px',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--primary) 0%, #d97706 100%)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 1rem',
                            fontSize: '3rem',
                            fontWeight: 900,
                            color: 'white'
                        }}>
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: '0.25rem' }}>
                            {user?.name || 'User'}
                        </h2>
                        <p style={{ color: 'var(--gray)', fontWeight: 600, textTransform: 'capitalize' }}>
                            {user?.role || 'Customer'}
                        </p>

                        {/* Points Badge */}
                        <div style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            background: '#fff7ed',
                            color: '#d97706',
                            padding: '0.5rem 1rem',
                            borderRadius: '2rem',
                            marginTop: '1rem',
                            fontWeight: 800,
                            border: '1px solid #ffedd5'
                        }}>
                            <span>💎</span>
                            <span>{user?.points || 0} Loyalty Points</span>
                        </div>
                    </div>

                    {/* Available Coupons */}
                    <div style={{ marginBottom: '3rem' }}>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '1rem' }}>Available Coupons</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                            {coupons.map(coupon => (
                                <div key={coupon._id} style={{
                                    border: '2px dashed var(--gray-light)',
                                    padding: '1rem',
                                    borderRadius: '10px',
                                    background: '#fafafa',
                                    position: 'relative'
                                }}>
                                    <div style={{ fontWeight: 900, color: 'var(--primary)', fontSize: '1.2rem', marginBottom: '0.25rem' }}>{coupon.code}</div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--gray)' }}>
                                        {coupon.discountType === 'percentage' ? `${coupon.discountValue}% OFF` : `₹${coupon.discountValue} FLAT OFF`}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#888', marginTop: '0.5rem' }}>
                                        Min Order: ₹{coupon.minPurchase}
                                    </div>
                                </div>
                            ))}
                            {coupons.length === 0 && <p style={{ color: 'var(--gray)', fontSize: '0.9rem' }}>No active coupons available.</p>}
                        </div>
                    </div>

                    {/* Profile Information */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                        {/* Name */}
                        <div>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginBottom: '0.75rem',
                                fontWeight: 800,
                                color: 'var(--secondary)',
                                fontSize: '0.95rem'
                            }}>
                                <User size={18} color="var(--primary)" />
                                Full Name
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                disabled={!isEditing}
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    borderRadius: '10px',
                                    border: '2px solid var(--gray-light)',
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    background: isEditing ? 'white' : 'var(--bg-main)',
                                    cursor: isEditing ? 'text' : 'not-allowed'
                                }}
                            />
                        </div>

                        {/* Email */}
                        <div>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginBottom: '0.75rem',
                                fontWeight: 800,
                                color: 'var(--secondary)',
                                fontSize: '0.95rem'
                            }}>
                                <Mail size={18} color="var(--primary)" />
                                Email Address
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                disabled={!isEditing}
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    borderRadius: '10px',
                                    border: '2px solid var(--gray-light)',
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    background: isEditing ? 'white' : 'var(--bg-main)',
                                    cursor: isEditing ? 'text' : 'not-allowed'
                                }}
                            />
                        </div>

                        {/* Phone */}
                        <div>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginBottom: '0.75rem',
                                fontWeight: 800,
                                color: 'var(--secondary)',
                                fontSize: '0.95rem'
                            }}>
                                <Phone size={18} color="var(--primary)" />
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                disabled={!isEditing}
                                placeholder="Enter your phone number"
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    borderRadius: '10px',
                                    border: '2px solid var(--gray-light)',
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    background: isEditing ? 'white' : 'var(--bg-main)',
                                    cursor: isEditing ? 'text' : 'not-allowed'
                                }}
                            />
                        </div>

                        {/* Address */}
                        <div>
                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                marginBottom: '0.75rem',
                                fontWeight: 800,
                                color: 'var(--secondary)',
                                fontSize: '0.95rem'
                            }}>
                                <MapPin size={18} color="var(--primary)" />
                                Delivery Address
                            </label>
                            <textarea
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                disabled={!isEditing}
                                placeholder="Enter your delivery address"
                                rows={3}
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    borderRadius: '10px',
                                    border: '2px solid var(--gray-light)',
                                    fontSize: '1rem',
                                    fontWeight: 600,
                                    background: isEditing ? 'white' : 'var(--bg-main)',
                                    cursor: isEditing ? 'text' : 'not-allowed',
                                    resize: 'vertical',
                                    fontFamily: 'inherit'
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </CustomerLayout>
    );
};

export default Profile;
