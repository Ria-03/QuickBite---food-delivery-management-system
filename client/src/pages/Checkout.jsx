import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Trash2 } from 'lucide-react';
import CustomerLayout from '../components/CustomerLayout';
import ScheduleOrderModal from '../components/ScheduleOrderModal';

const Checkout = () => {
    const { cartItems, totalAmount, updateQuantity, removeFromCart, placeOrder, isProcessing, applyCoupon, coupon, discountAmount, removeCoupon } = useCart();
    const { user } = useAuth();
    const { showToast } = useToast();
    const navigate = useNavigate();
    const [couponCode, setCouponCode] = useState('');
    const [isApplying, setIsApplying] = useState(false);
    const [availableCoupons, setAvailableCoupons] = useState([]);
    const [paymentMethod, setPaymentMethod] = useState('COD'); // COD or ONLINE
    const [isCreatingOrder, setIsCreatingOrder] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [scheduledFor, setScheduledFor] = useState(null);

    useEffect(() => {
        const fetchCoupons = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                const { data } = await axios.get('http://localhost:5000/api/coupons', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setAvailableCoupons(data);
            } catch (error) {
                console.error('Error fetching coupons:', error);
            }
        };

        const fetchAddresses = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) return;
                const { data } = await axios.get('http://localhost:5000/api/addresses', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setAddresses(data.addresses);
                // Auto-select default address
                const defaultAddr = data.addresses.find(addr => addr.isDefault);
                if (defaultAddr) {
                    setSelectedAddress(defaultAddr);
                } else if (data.addresses.length > 0) {
                    setSelectedAddress(data.addresses[0]);
                }
            } catch (error) {
                console.error('Error fetching addresses:', error);
            } finally {
                setIsLoadingAddresses(false);
            }
        };

        fetchCoupons();
        fetchAddresses();
    }, []);

    const deliveryFee = 40;
    const grandTotal = totalAmount + deliveryFee - discountAmount;

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        setIsApplying(true);
        const res = await applyCoupon(couponCode);
        setIsApplying(false);
        if (res.success) {
            showToast(`Coupon Applied! Saved ₹${res.discount}`, 'success');
        } else {
            showToast(res.message, 'error');
        }
    };

    // Handle Razorpay payment
    const handlePayNow = async () => {
        try {
            setIsCreatingOrder(true);

            // First, place the order in database
            const orderRes = await placeOrder();
            if (!orderRes.success) {
                showToast(orderRes.message, 'error');
                setIsCreatingOrder(false);
                return;
            }

            const orderId = orderRes.order._id;

            // Create Razorpay order
            const token = localStorage.getItem('token');
            const { data } = await axios.post(
                'http://localhost:5000/api/payment/create-order',
                { orderId },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setIsCreatingOrder(false);

            // Open Razorpay Checkout
            const options = {
                key: data.keyId,
                amount: data.amount,
                currency: data.currency,
                name: data.name,
                description: data.description,
                order_id: data.razorpayOrderId,
                handler: async function (response) {
                    // Payment successful - verify on backend
                    await verifyPayment(response, orderId);
                },
                prefill: {
                    name: data.prefill.name,
                    email: data.prefill.email,
                    contact: data.prefill.contact
                },
                theme: {
                    color: '#FF7E06'
                },
                modal: {
                    ondismiss: async function () {
                        // User closed the modal - payment failed
                        await handlePaymentFailure(orderId, {
                            code: 'PAYMENT_CANCELLED',
                            description: 'Payment was cancelled by user'
                        });
                    }
                }
            };

            const razorpay = new window.Razorpay(options);
            razorpay.open();

        } catch (error) {
            console.error('Error initiating payment:', error);
            showToast(error.response?.data?.message || 'Failed to initiate payment', 'error');
            setIsCreatingOrder(false);
        }
    };

    // Verify payment on backend
    const verifyPayment = async (response, orderId) => {
        try {
            setIsVerifying(true);
            const token = localStorage.getItem('token');

            const { data } = await axios.post(
                'http://localhost:5000/api/payment/verify',
                {
                    razorpayOrderId: response.razorpay_order_id,
                    razorpayPaymentId: response.razorpay_payment_id,
                    razorpaySignature: response.razorpay_signature,
                    orderId
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setIsVerifying(false);

            if (data.success) {
                showToast('Payment Successful! 🎉 Your order is confirmed.', 'success');
                navigate('/');
            } else {
                showToast('Payment verification failed. Please contact support.', 'error');
            }

        } catch (error) {
            console.error('Error verifying payment:', error);
            showToast('Payment verification failed', 'error');
            setIsVerifying(false);
        }
    };

    // Handle payment failure
    const handlePaymentFailure = async (orderId, error) => {
        try {
            const token = localStorage.getItem('token');
            await axios.post(
                'http://localhost:5000/api/payment/failure',
                { orderId, error },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            showToast('Payment was cancelled. You can retry or choose Cash on Delivery.', 'error');
        } catch (err) {
            console.error('Error handling payment failure:', err);
        }
    };

    // Handle COD order placement
    const handlePlaceOrder = async () => {
        if (paymentMethod === 'ONLINE') {
            // Use Razorpay payment
            await handlePayNow();
        } else {
            // Cash on Delivery
            const res = await placeOrder();
            if (res.success) {
                showToast('Order Placed Successfully! 🎉', 'success');
                navigate('/');
            } else {
                showToast(res.message, 'error');
            }
        }
    };

    if (cartItems.length === 0) {
        return (
            <CustomerLayout>
                <div className="container" style={{ textAlign: 'center', paddingTop: '10rem' }}>
                    <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Your basket is empty</h2>
                    <p style={{ color: 'var(--gray)', marginBottom: '2rem' }}>Add some delicious items to start your luxury meal.</p>
                    <button className="btn btn-primary" onClick={() => navigate('/')}>Browse Restaurants</button>
                </div>
            </CustomerLayout>
        );
    }

    return (
        <CustomerLayout>
            <div style={{ background: 'var(--bg-main)', minHeight: '100vh', paddingBottom: '5rem' }}>
                <div className="top-navbar" style={{ marginBottom: '3rem' }}>
                    <div className="top-nav-container">
                        <div className="logo" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
                            Quick<span>Bite</span>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Checkout</div>
                        <button className="btn" onClick={() => navigate(-1)} style={{ background: 'transparent', border: 'none', color: 'var(--gray)' }}>← Back</button>
                    </div>
                </div>

                <div className="container" style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '3rem' }}>
                    {/* Left Section: Items */}
                    <div>
                        <h2 style={{ fontSize: '1.75rem', marginBottom: '2rem', fontWeight: 800 }}>Confirm Your Items</h2>
                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                            {cartItems.map(item => (
                                <div key={item._id} className="card" style={{ display: 'flex', alignItems: 'center', padding: '1.25rem', gap: '1.5rem' }}>
                                    <div style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-md)', overflow: 'hidden', background: '#f5f5f5' }}>
                                        <img src={item.image || `https://placehold.co/100x100?text=${item.name}`} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h4 style={{ fontSize: '1.2rem', margin: 0 }}>{item.name}</h4>
                                        <p style={{ color: 'var(--primary)', fontWeight: 700, margin: '4px 0 0' }}>₹{item.price}</p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'var(--gray-light)', padding: '0.4rem 0.8rem', borderRadius: 'var(--radius-full)' }}>
                                        <button
                                            onClick={() => updateQuantity(item._id, -1)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800, padding: '0 4px' }}
                                        >-</button>
                                        <span style={{ fontWeight: 800, minWidth: '20px', textAlign: 'center' }}>{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item._id, 1)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 800, padding: '0 4px' }}
                                        >+</button>
                                    </div>
                                    <button
                                        onClick={() => removeFromCart(item._id)}
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ff4444', fontSize: '1.2rem' }}
                                        title="Remove Item"
                                    ><Trash2 size={18} /></button>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right Section: Summary */}
                    <aside>
                        <div className="card" style={{ position: 'sticky', top: '2rem', padding: '2.5rem', borderTop: '6px solid var(--primary)' }}>
                            <h3 style={{ fontSize: '1.5rem', marginBottom: '1.5rem', fontWeight: 800 }}>Order Summary</h3>

                            {/* Coupon Input */}
                            <div style={{ marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input
                                        type="text"
                                        placeholder="Promo Code"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                                        disabled={!!coupon}
                                        style={{ flex: 1, padding: '0.8rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--gray-light)', fontWeight: 600, textTransform: 'uppercase' }}
                                    />
                                    {coupon ? (
                                        <button
                                            onClick={removeCoupon}
                                            style={{ padding: '0 1rem', background: '#ffebee', color: '#d32f2f', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 700 }}
                                        >Remove</button>
                                    ) : (
                                        <button
                                            onClick={handleApplyCoupon}
                                            disabled={isApplying || !couponCode}
                                            style={{ padding: '0 1rem', background: 'var(--gray-light)', color: 'var(--text-main)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 700 }}
                                        >Apply</button>
                                    )}
                                </div>
                                {coupon && (
                                    <p style={{ color: 'green', fontSize: '0.85rem', marginTop: '0.5rem', fontWeight: 600 }}>
                                        ✅ Coupon '{coupon.code}' applied!
                                    </p>
                                )}
                            </div>

                            {/* Available Coupons List */}
                            <div style={{ marginBottom: '2rem' }}>
                                <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '0.8rem' }}>Available Coupons</h4>
                                <div style={{ display: 'grid', gap: '0.8rem', maxHeight: '200px', overflowY: 'auto' }}>
                                    {availableCoupons.length > 0 ? availableCoupons.map(c => (
                                        <div
                                            key={c._id}
                                            onClick={() => {
                                                if (!coupon) {
                                                    setCouponCode(c.code);
                                                    applyCoupon(c.code).then(res => {
                                                        if (res.success) showToast(`Coupon ${c.code} Applied!`, 'success');
                                                        else showToast(res.message, 'error');
                                                    });
                                                }
                                            }}
                                            style={{
                                                border: '1px dashed var(--gray)',
                                                padding: '0.8rem',
                                                borderRadius: '8px',
                                                cursor: coupon ? 'default' : 'pointer',
                                                background: coupon?.code === c.code ? '#ecfdf5' : 'white',
                                                borderColor: coupon?.code === c.code ? 'green' : 'var(--gray-light)',
                                                opacity: coupon && coupon.code !== c.code ? 0.6 : 1
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontWeight: 900, color: 'var(--primary)' }}>{c.code}</span>
                                                {coupon?.code === c.code && <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'green' }}>APPLIED</span>}
                                            </div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--gray)', marginTop: '4px' }}>
                                                {c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`}
                                                {c.minPurchase > 0 && ` • Min Order: ₹${c.minPurchase}`}
                                            </div>
                                        </div>
                                    )) : (
                                        <p style={{ color: 'var(--gray)', fontSize: '0.9rem' }}>No coupons available.</p>
                                    )}
                                </div>
                            </div>

                            <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--gray)', fontWeight: 600 }}>
                                    <span>Subtotal</span>
                                    <span>₹{totalAmount}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--gray)', fontWeight: 600 }}>
                                    <span>Delivery Fee</span>
                                    <span>₹{deliveryFee}</span>
                                </div>
                                {discountAmount > 0 && (
                                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'green', fontWeight: 700 }}>
                                        <span>Discount</span>
                                        <span>-₹{discountAmount}</span>
                                    </div>
                                )}
                            </div>

                            <div style={{ borderTop: '2px dashed var(--gray-light)', paddingTop: '1.5rem', marginBottom: '2.5rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1.5rem', fontWeight: 900 }}>
                                    <span>To Pay</span>
                                    <span style={{ color: 'var(--primary)' }}>₹{grandTotal > 0 ? grandTotal : 0}</span>
                                </div>
                            </div>

                            {/* Payment Method Selection */}
                            <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-light)' }}>
                                <h4 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '1rem' }}>Payment Method</h4>
                                <div style={{ display: 'grid', gap: '0.75rem' }}>
                                    <label
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                            padding: '1rem',
                                            background: paymentMethod === 'COD' ? '#ecfdf5' : 'white',
                                            border: `2px solid ${paymentMethod === 'COD' ? 'var(--success)' : 'var(--gray-light)'}`,
                                            borderRadius: 'var(--radius-md)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="COD"
                                            checked={paymentMethod === 'COD'}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 700, marginBottom: '2px' }}>💵 Cash on Delivery</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>Pay when your order arrives</div>
                                        </div>
                                    </label>

                                    <label
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '0.75rem',
                                            padding: '1rem',
                                            background: paymentMethod === 'ONLINE' ? '#ecfdf5' : 'white',
                                            border: `2px solid ${paymentMethod === 'ONLINE' ? 'var(--success)' : 'var(--gray-light)'}`,
                                            borderRadius: 'var(--radius-md)',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s'
                                        }}
                                    >
                                        <input
                                            type="radio"
                                            name="paymentMethod"
                                            value="ONLINE"
                                            checked={paymentMethod === 'ONLINE'}
                                            onChange={(e) => setPaymentMethod(e.target.value)}
                                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                        />
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 700, marginBottom: '2px' }}>💳 Pay Online</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>UPI, Cards, Netbanking & More</div>
                                        </div>
                                        <div style={{ fontSize: '0.75rem', background: 'var(--primary)', color: 'white', padding: '4px 8px', borderRadius: '4px', fontWeight: 700 }}>
                                            SECURE
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Delivery Address Selection */}
                            <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'var(--bg-main)', borderRadius: 'var(--radius-md)', border: '1px solid var(--gray-light)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h4 style={{ fontSize: '1rem', fontWeight: 800, margin: 0 }}>Delivery Address</h4>
                                    <button
                                        onClick={() => navigate('/addresses')}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: 'var(--primary)',
                                            fontSize: '0.85rem',
                                            fontWeight: 600,
                                            cursor: 'pointer',
                                            textDecoration: 'underline'
                                        }}
                                    >
                                        + Add New
                                    </button>
                                </div>

                                {isLoadingAddresses ? (
                                    <p style={{ color: 'var(--gray)', fontSize: '0.9rem' }}>Loading addresses...</p>
                                ) : addresses.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '1rem' }}>
                                        <p style={{ color: 'var(--gray)', marginBottom: '1rem' }}>No saved addresses</p>
                                        <button
                                            onClick={() => navigate('/addresses')}
                                            className="btn btn-primary"
                                            style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}
                                        >
                                            + Add Address
                                        </button>
                                    </div>
                                ) : (
                                    <div style={{ display: 'grid', gap: '0.75rem' }}>
                                        {addresses.map(address => (
                                            <label
                                                key={address._id}
                                                style={{
                                                    display: 'flex',
                                                    gap: '0.75rem',
                                                    padding: '1rem',
                                                    background: selectedAddress?._id === address._id ? '#ecfdf5' : 'white',
                                                    border: `2px solid ${selectedAddress?._id === address._id ? 'var(--success)' : 'var(--gray-light)'}`,
                                                    borderRadius: 'var(--radius-md)',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s'
                                                }}
                                            >
                                                <input
                                                    type="radio"
                                                    name="deliveryAddress"
                                                    checked={selectedAddress?._id === address._id}
                                                    onChange={() => setSelectedAddress(address)}
                                                    style={{ marginTop: '2px', cursor: 'pointer' }}
                                                />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
                                                        <span>{address.label === 'Home' ? '🏠' : address.label === 'Work' ? '🏢' : '📍'}</span>
                                                        <strong>{address.label}</strong>
                                                        {address.isDefault && (
                                                            <span style={{
                                                                fontSize: '0.7rem',
                                                                background: 'var(--success)',
                                                                color: 'white',
                                                                padding: '2px 6px',
                                                                borderRadius: '4px',
                                                                fontWeight: 700
                                                            }}>DEFAULT</span>
                                                        )}
                                                    </div>
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--gray-dark)', lineHeight: 1.4 }}>
                                                        {address.addressLine1}, {address.addressLine2 && `${address.addressLine2}, `}
                                                        {address.city}, {address.state} {address.zipCode}
                                                    </div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--gray)', marginTop: '4px' }}>
                                                        📞 {address.phoneNumber}
                                                    </div>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Schedule Order Button */}
                            <button
                                className="btn"
                                style={{
                                    width: '100%',
                                    padding: '1rem',
                                    fontSize: '1rem',
                                    borderRadius: 'var(--radius-md)',
                                    marginBottom: '1rem',
                                    background: scheduledFor ? '#fef3c7' : 'white',
                                    border: `2px solid ${scheduledFor ? '#f59e0b' : 'var(--primary)'}`,
                                    color: scheduledFor ? '#92400e' : 'var(--primary)',
                                    fontWeight: 700
                                }}
                                onClick={() => setShowScheduleModal(true)}
                                disabled={!selectedAddress}
                            >
                                {scheduledFor ? (
                                    <>
                                        📅 Scheduled: {new Date(scheduledFor).toLocaleString('en-IN', {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })} • Click to Change
                                    </>
                                ) : (
                                    '📅 Schedule for Later'
                                )}
                            </button>

                            <button
                                className="btn btn-primary"
                                style={{ width: '100%', padding: '1.2rem', fontSize: '1.1rem', borderRadius: 'var(--radius-md)', opacity: (isProcessing || isCreatingOrder || isVerifying || !selectedAddress) ? 0.7 : 1 }}
                                onClick={handlePlaceOrder}
                                disabled={isProcessing || isCreatingOrder || isVerifying || !selectedAddress}
                            >
                                {isCreatingOrder ? '🔄 Creating Order...' :
                                    isVerifying ? '🔄 Verifying Payment...' :
                                        isProcessing ? '🔄 Finalizing Order...' :
                                            scheduledFor ? '✓ Confirm Scheduled Order' :
                                                paymentMethod === 'ONLINE' ? '💳 Pay Now' : '🚀 Place Order (COD)'}
                            </button>

                            {/* Schedule Order Modal */}
                            {showScheduleModal && (
                                <ScheduleOrderModal
                                    onSchedule={(scheduledDateTime) => {
                                        setScheduledFor(scheduledDateTime);
                                        setShowScheduleModal(false);
                                        if (scheduledDateTime) {
                                            showToast('Order scheduled successfully!', 'success');
                                        }
                                    }}
                                    onClose={() => setShowScheduleModal(false)}
                                    minAmount={grandTotal}
                                />
                            )}

                            <p style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.8rem', color: 'var(--gray)', fontWeight: 500 }}>
                                By placing this order, you agree to our <span style={{ textDecoration: 'underline' }}>Terms & Conditions</span>.
                            </p>
                        </div>
                    </aside>
                </div>
            </div>
        </CustomerLayout>
    );
};

export default Checkout;
