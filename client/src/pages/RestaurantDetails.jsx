import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { useToast } from '../context/ToastContext';
import { MapPin, Star, Clock, ShoppingCart, Plus, Heart } from 'lucide-react';
import CustomerLayout from '../components/CustomerLayout';

const RestaurantDetails = () => {
    const { id } = useParams();
    const [restaurant, setRestaurant] = useState(null);
    const [menu, setMenu] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [isFavorite, setIsFavorite] = useState(false);
    const { addToCart, cartItems, totalAmount, isProcessing } = useCart();
    const { showToast } = useToast();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data } = await axios.get(`http://localhost:5000/api/restaurants/${id}`);
                setRestaurant(data);
                const menuRes = await axios.get(`http://localhost:5000/api/restaurants/${id}/menu`);
                setMenu(menuRes.data);

                // Check favorite status
                if (localStorage.getItem('token')) {
                    try {
                        const favRes = await axios.get(`http://localhost:5000/api/favorites/check/${id}`, {
                            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                        });
                        setIsFavorite(favRes.data.isFavorite);
                    } catch (err) {
                        console.error('Error checking favorite:', err);
                    }
                }
            } catch (error) {
                showToast('Failed to load menu details.', 'error');
                console.error(error);
            }
        };
        fetchData();
    }, [id]);

    const handleToggleFavorite = async () => {
        if (!localStorage.getItem('token')) {
            showToast('Please login to add favorites', 'error');
            return;
        }
        try {
            const response = await axios.post(`http://localhost:5000/api/favorites/toggle/${id}`, {}, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
            });
            setIsFavorite(response.data.isFavorite);
            showToast(response.data.message, 'success');
        } catch (error) {
            console.error('Error toggling favorite:', error);
            showToast('Failed to update favorites', 'error');
        }
    };

    const handleCheckout = () => {
        navigate('/checkout');
    };

    // Get unique categories from menu
    const categories = ['All', ...new Set(menu.map(item => item.category))];

    // Filter menu by selected category
    const filteredMenu = selectedCategory === 'All'
        ? menu
        : menu.filter(item => item.category === selectedCategory);

    if (!restaurant) return (
        <div className="container" style={{ padding: '5rem', textAlign: 'center' }}>
            <div className="spinner" style={{ width: '50px', height: '50px', border: '5px solid var(--gray-light)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1.5rem' }}></div>
            <h2 style={{ color: 'var(--secondary)', fontWeight: 800 }}>Loading Menu...</h2>
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );

    return (
        <CustomerLayout>
            {/* Floating Cart Button */}
            {cartItems.length > 0 && (
                <div
                    onClick={() => {
                        const cartElement = document.getElementById('cart-section');
                        if (cartElement) {
                            cartElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }
                    }}
                    style={{
                        position: 'fixed',
                        top: '100px',
                        right: '30px',
                        zIndex: 2000,
                        background: 'var(--primary)',
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        boxShadow: '0 4px 20px rgba(255,126,6,0.4)',
                        transition: 'all 0.3s'
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'scale(1.1)';
                        e.currentTarget.style.boxShadow = '0 6px 30px rgba(255,126,6,0.6)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.boxShadow = '0 4px 20px rgba(255,126,6,0.4)';
                    }}
                >
                    <div style={{ position: 'relative' }}>
                        <ShoppingCart size={28} color="white" />
                        <div style={{
                            position: 'absolute',
                            top: '-8px',
                            right: '-8px',
                            background: 'var(--secondary)',
                            color: 'white',
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 900,
                            border: '2px solid white'
                        }}>
                            {cartItems.length}
                        </div>
                    </div>
                </div>
            )}

            <div style={{ background: 'var(--bg-main)', minHeight: '100vh' }}>
                {/* Restaurant Banner */}
                <div style={{
                    position: 'relative',
                    height: '400px',
                    background: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url(${restaurant.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200'})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    display: 'flex',
                    alignItems: 'flex-end'
                }}>
                    <div className="container" style={{ padding: '3rem 2rem' }}>
                        <div style={{ maxWidth: '900px' }}>
                            <h1 style={{
                                fontSize: '3.5rem',
                                fontWeight: 900,
                                color: 'white',
                                marginBottom: '1rem',
                                textShadow: '0 2px 20px rgba(0,0,0,0.3)',
                                letterSpacing: '-1px'
                            }}>
                                {restaurant.name}
                            </h1>

                            <button
                                onClick={handleToggleFavorite}
                                style={{
                                    background: 'rgba(255,255,255,0.2)',
                                    backdropFilter: 'blur(10px)',
                                    border: 'none',
                                    borderRadius: '50%',
                                    width: '50px',
                                    height: '50px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    marginLeft: '1rem',
                                    transition: 'all 0.3s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                                onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <Heart
                                    size={28}
                                    fill={isFavorite ? "var(--accent)" : "transparent"}
                                    color={isFavorite ? "var(--accent)" : "white"}
                                    strokeWidth={2.5}
                                />
                            </button>

                            <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    background: 'rgba(255,255,255,0.95)',
                                    padding: '0.75rem 1.25rem',
                                    borderRadius: '12px',
                                    fontWeight: 800,
                                    fontSize: '1.1rem'
                                }}>
                                    <Star size={20} fill="var(--primary)" color="var(--primary)" />
                                    <span style={{ color: 'var(--secondary)' }}>{restaurant.rating || '4.8'}</span>
                                    <span style={{ color: 'var(--gray)', fontSize: '0.9rem', fontWeight: 600 }}>
                                        ({restaurant.numReviews || 120} reviews)
                                    </span>
                                </div>

                                {restaurant.address && (
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        color: 'white',
                                        fontSize: '1rem',
                                        fontWeight: 600
                                    }}>
                                        <MapPin size={18} />
                                        <span>{restaurant.address.street || restaurant.address}, {restaurant.address.city || 'Mumbai'}</span>
                                    </div>
                                )}

                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    color: 'white',
                                    fontSize: '1rem',
                                    fontWeight: 600
                                }}>
                                    <Clock size={18} />
                                    <span>30-45 min</span>
                                </div>
                            </div>

                            {restaurant.cuisine && restaurant.cuisine.length > 0 && (
                                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
                                    {restaurant.cuisine.map((c, idx) => (
                                        <span key={idx} style={{
                                            background: 'rgba(255,255,255,0.2)',
                                            backdropFilter: 'blur(10px)',
                                            color: 'white',
                                            padding: '0.5rem 1rem',
                                            borderRadius: '8px',
                                            fontSize: '0.9rem',
                                            fontWeight: 700,
                                            border: '1px solid rgba(255,255,255,0.3)'
                                        }}>
                                            {c}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="container" style={{
                    paddingTop: '3rem',
                    paddingBottom: '3rem',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '2.5rem',
                    alignItems: 'start'
                }}>
                    {/* Category Sidebar */}
                    <aside style={{ flex: '0 0 250px', position: 'sticky', top: '2rem' }}>
                        <div className="card" style={{ padding: '1.5rem' }}>
                            <h3 style={{
                                fontSize: '1.1rem',
                                fontWeight: 900,
                                marginBottom: '1.25rem',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px',
                                color: 'var(--secondary)'
                            }}>
                                Categories
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {categories.map(category => (
                                    <button
                                        key={category}
                                        onClick={() => setSelectedCategory(category)}
                                        style={{
                                            padding: '0.875rem 1rem',
                                            borderRadius: '10px',
                                            border: 'none',
                                            background: selectedCategory === category
                                                ? 'linear-gradient(135deg, var(--primary) 0%, #d97706 100%)'
                                                : 'var(--bg-main)',
                                            color: selectedCategory === category ? 'white' : 'var(--secondary)',
                                            fontWeight: selectedCategory === category ? 800 : 600,
                                            fontSize: '0.95rem',
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            textAlign: 'left',
                                            boxShadow: selectedCategory === category
                                                ? '0 4px 12px rgba(255,126,6,0.3)'
                                                : 'none'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (selectedCategory !== category) {
                                                e.target.style.background = 'var(--gray-light)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (selectedCategory !== category) {
                                                e.target.style.background = 'var(--bg-main)';
                                            }
                                        }}
                                    >
                                        {category}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </aside>

                    {/* Menu Items List */}
                    <main style={{ flex: '1', minWidth: '300px' }}>
                        <div style={{ marginBottom: '2rem' }}>
                            <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '0.5rem' }}>
                                {selectedCategory === 'All' ? 'Our Menu' : selectedCategory}
                            </h2>
                            <p style={{ color: 'var(--gray)', fontWeight: 600 }}>
                                {filteredMenu.length} {filteredMenu.length === 1 ? 'item' : 'items'} available
                            </p>
                        </div>

                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1.5rem'
                        }}>
                            {filteredMenu.map(item => (
                                <div
                                    key={item._id}
                                    className="card hover-glow"
                                    style={{
                                        padding: '1.25rem',
                                        display: 'flex',
                                        gap: '1.5rem',
                                        alignItems: 'center',
                                        transition: 'all 0.3s',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {/* Food Image */}
                                    <div style={{
                                        width: '140px',
                                        height: '140px',
                                        borderRadius: '12px',
                                        overflow: 'hidden',
                                        position: 'relative',
                                        flexShrink: 0
                                    }}>
                                        <img
                                            src={item.image || `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400`}
                                            alt={item.name}
                                            style={{
                                                width: '100%',
                                                height: '100%',
                                                objectFit: 'cover',
                                                transition: 'transform 0.3s'
                                            }}
                                            onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
                                            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
                                        />
                                        {/* Category Badge */}
                                        <div style={{
                                            position: 'absolute',
                                            bottom: '0',
                                            left: '0',
                                            right: '0',
                                            background: 'rgba(0,0,0,0.6)',
                                            backdropFilter: 'blur(4px)',
                                            padding: '0.3rem',
                                            fontSize: '0.7rem',
                                            fontWeight: 700,
                                            color: 'white',
                                            textAlign: 'center',
                                            textTransform: 'uppercase'
                                        }}>
                                            {item.category}
                                        </div>
                                    </div>

                                    {/* Card Content */}
                                    <div style={{ flex: 1 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                            <h4 style={{
                                                fontSize: '1.25rem',
                                                fontWeight: 900,
                                                color: 'var(--secondary)',
                                                margin: 0
                                            }}>
                                                {item.name}
                                            </h4>
                                            <span style={{
                                                fontWeight: 900,
                                                fontSize: '1.25rem',
                                                color: 'var(--primary)',
                                                whiteSpace: 'nowrap',
                                                marginLeft: '1rem'
                                            }}>
                                                ₹{item.price}
                                            </span>
                                        </div>

                                        <p style={{
                                            color: 'var(--gray)',
                                            fontSize: '0.9rem',
                                            marginBottom: '1rem',
                                            lineHeight: '1.5',
                                            fontWeight: 500,
                                            maxWidth: '90%'
                                        }}>
                                            {item.description}
                                        </p>

                                        <button
                                            className="btn btn-primary"
                                            style={{
                                                padding: '0.5rem 1.25rem',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                fontSize: '0.9rem',
                                                fontWeight: 800
                                            }}
                                            onClick={(e) => {
                                                e.stopPropagation(); // Prevent card click
                                                if (restaurant) {
                                                    addToCart(item, restaurant._id);
                                                    showToast(`${item.name} added to cart!`, 'success');
                                                }
                                            }}
                                        >
                                            <Plus size={16} />
                                            Add
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {filteredMenu.length === 0 && (
                            <div style={{
                                textAlign: 'center',
                                padding: '5rem 2rem',
                                opacity: 0.6
                            }}>
                                <ShoppingCart size={64} style={{ margin: '0 auto 1.5rem', display: 'block', color: 'var(--gray-light)' }} />
                                <h3 style={{ color: 'var(--secondary)', marginBottom: '0.5rem' }}>No items in this category</h3>
                                <p style={{ color: 'var(--gray)', fontWeight: 600 }}>Try selecting a different category</p>
                            </div>
                        )}
                    </main>

                    {/* Cart Sidebar */}
                    <aside id="cart-section" style={{ flex: '0 0 350px', position: 'sticky', top: '2rem', maxWidth: '100%' }}>
                        <div className="card" style={{
                            padding: '2rem',
                            borderTop: '4px solid var(--primary)',
                            boxShadow: 'var(--premium-shadow)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                                <ShoppingCart size={24} color="var(--primary)" />
                                <h3 style={{ margin: 0, fontSize: '1.3rem', fontWeight: 900 }}>Your Cart</h3>
                            </div>

                            {cartItems.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '3rem 0', opacity: 0.5 }}>
                                    <ShoppingCart size={48} style={{ margin: '0 auto 1rem', display: 'block', color: 'var(--gray-light)' }} />
                                    <p style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--gray)' }}>Your cart is empty</p>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--gray)' }}>Add some delicious items!</p>
                                </div>
                            ) : (
                                <>
                                    <div style={{ marginBottom: '1.5rem', maxHeight: '400px', overflowY: 'auto' }}>
                                        {cartItems.map(item => (
                                            <div key={item._id} style={{
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                marginBottom: '1.25rem',
                                                padding: '0.75rem',
                                                background: 'var(--bg-main)',
                                                borderRadius: '8px'
                                            }}>
                                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flex: 1 }}>
                                                    <span style={{
                                                        fontWeight: 900,
                                                        color: 'white',
                                                        background: 'var(--primary)',
                                                        width: '28px',
                                                        height: '28px',
                                                        borderRadius: '6px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontSize: '0.85rem'
                                                    }}>
                                                        {item.quantity}
                                                    </span>
                                                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{item.name}</span>
                                                </div>
                                                <span style={{ fontWeight: 900, color: 'var(--primary)' }}>₹{item.price * item.quantity}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div style={{
                                        borderTop: '2px dashed var(--gray-light)',
                                        paddingTop: '1.5rem',
                                        marginTop: '1.5rem'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            marginBottom: '0.75rem',
                                            fontSize: '0.95rem',
                                            fontWeight: 600,
                                            color: 'var(--gray)'
                                        }}>
                                            <span>Subtotal</span>
                                            <span>₹{totalAmount}</span>
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            marginBottom: '0.75rem',
                                            fontSize: '0.95rem',
                                            fontWeight: 600,
                                            color: 'var(--gray)'
                                        }}>
                                            <span>Delivery Fee</span>
                                            <span style={{ color: 'var(--success)' }}>FREE</span>
                                        </div>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            marginBottom: '1.5rem',
                                            paddingTop: '1rem',
                                            borderTop: '1px solid var(--gray-light)',
                                            fontSize: '1.4rem',
                                            fontWeight: 900,
                                            color: 'var(--secondary)'
                                        }}>
                                            <span>Total</span>
                                            <span style={{ color: 'var(--primary)' }}>₹{totalAmount}</span>
                                        </div>

                                        <button
                                            className="btn btn-primary shimmer"
                                            style={{
                                                width: '100%',
                                                padding: '1.25rem',
                                                fontSize: '1.05rem',
                                                fontWeight: 900,
                                                opacity: isProcessing ? 0.7 : 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '0.5rem'
                                            }}
                                            onClick={handleCheckout}
                                            disabled={isProcessing}
                                        >
                                            {isProcessing ? 'Processing...' : 'Proceed to Checkout'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </aside>
                </div>
            </div>
        </CustomerLayout >
    );
};
export default RestaurantDetails;

