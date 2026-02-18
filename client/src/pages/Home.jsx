import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import logo from '../assets/logo.svg';
import heroFood from '../assets/hero-food.svg';

const Home = () => {
    const navigate = useNavigate();
    const { loading, user, logout } = useAuth();

    const handleNavigation = (path) => {
        if (user) {
            navigate('/customer/home');
        } else {
            navigate(path);
        }
    };

    const handleAddToCart = () => {
        if (user) {
            navigate('/customer/home');
        } else {
            navigate('/login');
        }
    }

    if (loading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <div style={{ background: 'var(--bg-main)' }}>
            {/* Navigation */}
            <div className="top-navbar">
                <div className="top-nav-container">
                    <div className="nav-left">
                        <div className="logo" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <img src={logo} alt="QuickBite Logo" style={{ height: '40px' }} />
                            <span>Quick<span>Bite</span></span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        {user ? (
                            <>
                                <span style={{ fontWeight: 600, color: 'var(--secondary)' }}>Hello, {user.name}</span>
                                <button className="btn btn-outline" onClick={logout}>Logout</button>
                                <button className="btn btn-primary" onClick={() => navigate('/customer/home')}>Dashboard</button>
                            </>
                        ) : (
                            <>
                                <button className="btn" onClick={() => navigate('/login')}>Login</button>
                                <button className="btn btn-primary" onClick={() => navigate('/register')}>Sign Up</button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Hero Section */}
            <div className="hero-section">
                <div className="container hero-container-split">
                    <div className="hero-content-left">
                        <h1 className="hero-title-text fade-up">
                            Order food from your <br />
                            <span className="gradient-text">favorite restaurants</span>
                        </h1>
                        <p className="hero-subtitle-text fade-up" style={{ animationDelay: '0.1s' }}>
                            Delicious meals delivered to your door, fast and fresh.
                            Experience the next generation of food delivery.
                        </p>

                        <div className="hero-search-container fade-up" style={{ animationDelay: '0.2s' }}>
                            <div className="hero-search-input-wrapper">
                                <span className="search-icon">📍</span>
                                <input
                                    type="text"
                                    placeholder="Enter your delivery address"
                                    className="hero-search-input"
                                />
                                <button className="btn btn-primary hero-search-btn" onClick={() => handleNavigation('/login')}>
                                    Find Food
                                </button>
                            </div>
                        </div>

                        <div className="hero-buttons-container fade-up" style={{ animationDelay: '0.3s' }}>
                            <div className="trust-badges">
                                <div className="trust-item">
                                    <span className="check-icon">✓</span> No Minimum Order
                                </div>
                                <div className="trust-item">
                                    <span className="check-icon">✓</span> Live Tracking
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="hero-content-right fade-up" style={{ animationDelay: '0.3s' }}>
                        <div className="hero-image-wrapper">
                            <img
                                src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80"
                                alt="Delicious Food Spread"
                                className="hero-image"
                            />
                            <div className="floating-badge badge-1">
                                <span>⚡</span> 30 min Delivery
                            </div>
                            <div className="floating-badge badge-2">
                                <span>⭐</span> 4.9 Rating
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Popular Items Section */}
            <div className="popular-section">
                <div className="container">
                    <h2 className="section-title text-center">Trending in Your Area</h2>
                    <p className="section-subtitle text-center">
                        Top picks that everyone is raving about
                    </p>

                    <div className="popular-grid">
                        <div className="popular-card">
                            <div className="popular-image-wrapper">
                                <img
                                    src="https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=500&q=80"
                                    alt="Gourmet Burger"
                                    className="popular-image"
                                />
                            </div>
                            <div className="popular-content">
                                <div className="popular-header">
                                    <h3>Gourmet Burger</h3>
                                    <span className="price">₹12.99</span>
                                </div>
                                <p>Juicy beef patty with swiss cheese and special sauce</p>
                                <div className="popular-footer">
                                    <span className="rating">⭐ 4.8 (2k+)</span>
                                    <button className="btn-icon-add" onClick={handleAddToCart}>+</button>
                                </div>
                            </div>
                        </div>

                        <div className="popular-card">
                            <div className="popular-image-wrapper">
                                <img
                                    src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=500&q=80"
                                    alt="Pepperoni Pizza"
                                    className="popular-image"
                                />
                            </div>
                            <div className="popular-content">
                                <div className="popular-header">
                                    <h3>Pepperoni Feast</h3>
                                    <span className="price">₹18.50</span>
                                </div>
                                <p>Double pepperoni with extra mozzarella cheese</p>
                                <div className="popular-footer">
                                    <span className="rating">⭐ 4.9 (5k+)</span>
                                    <button className="btn-icon-add" onClick={handleAddToCart}>+</button>
                                </div>
                            </div>
                        </div>

                        <div className="popular-card">
                            <div className="popular-image-wrapper">
                                <img
                                    src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&q=80"
                                    alt="Greek Salad"
                                    className="popular-image"
                                />
                            </div>
                            <div className="popular-content">
                                <div className="popular-header">
                                    <h3>Greek Salad</h3>
                                    <span className="price">₹10.50</span>
                                </div>
                                <p>Fresh cucumbers, tomatoes, olives, and feta cheese</p>
                                <div className="popular-footer">
                                    <span className="rating">⭐ 4.7 (1k+)</span>
                                    <button className="btn-icon-add" onClick={handleAddToCart}>+</button>
                                </div>
                            </div>
                        </div>
                        <div className="popular-card">
                            <div className="popular-image-wrapper">
                                <img
                                    src="https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=500&q=80"
                                    alt="Sushi Platter"
                                    className="popular-image"
                                />
                            </div>
                            <div className="popular-content">
                                <div className="popular-header">
                                    <h3>Sushi Platter</h3>
                                    <span className="price">₹24.00</span>
                                </div>
                                <p>Assorted fresh sushi rolls with wasabi and ginger</p>
                                <div className="popular-footer">
                                    <span className="rating">⭐ 4.9 (3k+)</span>
                                    <button className="btn-icon-add" onClick={handleAddToCart}>+</button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="center-btn-container">
                        <button className="btn btn-outline" onClick={() => handleNavigation('/login')}>View Full Menu</button>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="features-section">
                <div className="container">
                    <h2 className="section-title text-center">Why Choose QuickBite?</h2>
                    <p className="section-subtitle text-center">
                        We're revolutionizing food delivery with cutting-edge technology and exceptional service
                    </p>

                    <div className="features-grid">
                        <div className="feature-card">
                            <div className="feature-icon">⚡</div>
                            <h3 className="feature-title">Lightning Fast</h3>
                            <p className="feature-description">
                                Get your favorite meals delivered in under 30 minutes with our optimized delivery network
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">🍔</div>
                            <h3 className="feature-title">Wide Selection</h3>
                            <p className="feature-description">
                                Choose from thousands of restaurants and cuisines. From local favorites to premium dining
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">📱</div>
                            <h3 className="feature-title">Easy Ordering</h3>
                            <p className="feature-description">
                                Intuitive interface makes ordering a breeze. Save favorites and reorder with one tap
                            </p>
                        </div>

                        <div className="feature-card">
                            <div className="feature-icon">📍</div>
                            <h3 className="feature-title">Live Tracking</h3>
                            <p className="feature-description">
                                Track your order in real-time from kitchen to doorstep with our advanced tracking system
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* How It Works Section */}
            <div className="how-it-works-section">
                <div className="container">
                    <h2 className="section-title text-center">How It Works</h2>
                    <p className="section-subtitle text-center">Simple steps to get your favorite food</p>

                    <div className="steps-container">
                        <div className="step-card">
                            <div className="step-number">1</div>
                            <div className="step-icon">📍</div>
                            <h3>Set Location</h3>
                            <p>Choose your delivery location to see restaurants near you</p>
                        </div>
                        <div className="step-connector"></div>
                        <div className="step-card">
                            <div className="step-number">2</div>
                            <div className="step-icon">🍱</div>
                            <h3>Choose Food</h3>
                            <p>Browse menus and select your favorite dishes</p>
                        </div>
                        <div className="step-connector"></div>
                        <div className="step-card">
                            <div className="step-number">3</div>
                            <div className="step-icon">🛵</div>
                            <h3>Fast Delivery</h3>
                            <p>Relax while we deliver your food hot and fresh</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Testimonials Section */}
            <div className="testimonials-section">
                <div className="container">
                    <h2 className="section-title text-center">What Our Customers Say</h2>
                    <p className="section-subtitle text-center">Don't just take our word for it</p>

                    <div className="testimonials-grid">
                        <div className="testimonial-card">
                            <div className="testimonial-header">
                                <div className="user-avatar">AD</div>
                                <div>
                                    <h4>Alex Dawson</h4>
                                    <div className="stars">⭐⭐⭐⭐⭐</div>
                                </div>
                            </div>
                            <p className="testimonial-text">
                                "The fastest delivery app I've ever used! The food always arrives hot and fresh. The real-time tracking is a game changer."
                            </p>
                        </div>

                        <div className="testimonial-card">
                            <div className="testimonial-header">
                                <div className="user-avatar">SJ</div>
                                <div>
                                    <h4>Sarah Jenkins</h4>
                                    <div className="stars">⭐⭐⭐⭐⭐</div>
                                </div>
                            </div>
                            <p className="testimonial-text">
                                "I love the variety of restaurants available. Whether I'm craving sushi or burgers, QuickBite has it all. Highly recommended!"
                            </p>
                        </div>

                        <div className="testimonial-card">
                            <div className="testimonial-header">
                                <div className="user-avatar">MR</div>
                                <div>
                                    <h4>Michael Ross</h4>
                                    <div className="stars">⭐⭐⭐⭐⭐</div>
                                </div>
                            </div>
                            <p className="testimonial-text">
                                "The app is so easy to use and customer support is top notch. I had a small issue with an order and they fixed it instantly."
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Statistics Section */}
            <div className="stats-section">
                <div className="container">
                    <div className="stats-container">
                        <div className="stat-item">
                            <span className="stat-number">500+</span>
                            <span className="stat-text">Partner Restaurants</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">50K+</span>
                            <span className="stat-text">Happy Customers</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">100K+</span>
                            <span className="stat-text">Orders Delivered</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-number">4.8★</span>
                            <span className="stat-text">Average Rating</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA Section */}
            <div className="cta-section">
                <div className="container">
                    <h2 className="section-title">Ready to Get Started?</h2>
                    <p className="section-subtitle">
                        Join thousands of satisfied customers enjoying delicious food delivered fast
                    </p>
                    <div className="cta-buttons">
                        <button
                            className="btn btn-primary btn-hero"
                            onClick={() => navigate('/register')}
                        >
                            Sign Up Now
                        </button>
                        <button
                            className="btn btn-secondary btn-hero"
                            onClick={() => navigate('/delivery/login')}
                        >
                            Become a Delivery Partner
                        </button>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="footer-section">
                <div className="container">
                    <div className="footer-content">
                        <div className="footer-brand">
                            <div className="logo" style={{ color: 'white', marginBottom: '1rem' }}>
                                <img src={logo} alt="QuickBite Logo" style={{ height: '30px' }} />
                                <span>Quick<span>Bite</span></span>
                            </div>
                            <p>Delivering happiness to your doorstep.</p>
                        </div>
                        <div className="footer-links">
                            <div className="footer-col">
                                <h4>Company</h4>
                                <a href="#">About Us</a>
                                <a href="#">Careers</a>
                                <a href="#">Team</a>
                            </div>
                            <div className="footer-col">
                                <h4>Contact</h4>
                                <a href="#">Help & Support</a>
                                <a href="#">Partner with us</a>
                                <a href="#">Ride with us</a>
                            </div>
                            <div className="footer-col">
                                <h4>Legal</h4>
                                <a href="#">Terms & Conditions</a>
                                <a href="#">Refund & Cancellation</a>
                                <a href="#">Privacy Policy</a>
                            </div>
                        </div>
                    </div>
                    <div className="footer-bottom">
                        <p>&copy; {new Date().getFullYear()} QuickBite. All rights reserved.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default Home;

