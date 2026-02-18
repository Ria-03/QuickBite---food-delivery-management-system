import { useState, useEffect } from 'react';
import CustomerLayout from '../components/CustomerLayout';
import { Heart, Star, MapPin, Clock } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Favorites = () => {
    const [favorites, setFavorites] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const fetchFavorites = async () => {
            try {
                const response = await axios.get('http://localhost:5000/api/favorites', {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setFavorites(response.data);
            } catch (error) {
                console.error('Error fetching favorites:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchFavorites();
        } else {
            setLoading(false);
        }
    }, [user]);

    if (loading) {
        return (
            <CustomerLayout>
                <div style={{ padding: '3rem', textAlign: 'center' }}>
                    <div className="spinner" style={{ width: '50px', height: '50px', border: '5px solid var(--gray-light)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 1.5rem' }}></div>
                    <h2 style={{ color: 'var(--secondary)', fontWeight: 800 }}>Loading Favorites...</h2>
                    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
            </CustomerLayout>
        );
    }

    return (
        <CustomerLayout>
            <div style={{ padding: '3rem', maxWidth: '1200px', margin: '0 auto' }}>
                <div style={{ marginBottom: '3rem' }}>
                    <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: '0.5rem' }}>My Favorites</h1>
                    <p style={{ color: 'var(--gray)', fontSize: '1.1rem', fontWeight: 600 }}>
                        Your favorite restaurants in one place
                    </p>
                </div>

                {favorites.length === 0 ? (
                    <div className="card" style={{ padding: '5rem 2rem', textAlign: 'center' }}>
                        <Heart size={64} style={{ margin: '0 auto 1.5rem', display: 'block', color: 'var(--gray-light)' }} />
                        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '0.5rem' }}>No Favorites Yet</h3>
                        <p style={{ color: 'var(--gray)', fontWeight: 600, marginBottom: '2rem' }}>
                            Start adding restaurants to your favorites!
                        </p>
                        <button
                            className="btn btn-primary"
                            onClick={() => navigate('/home')}
                            style={{ padding: '1rem 2rem', fontSize: '1rem', fontWeight: 800 }}
                        >
                            Browse Restaurants
                        </button>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
                        {favorites.map(restaurant => (
                            <div
                                key={restaurant._id}
                                className="card hover-glow"
                                style={{ cursor: 'pointer', overflow: 'hidden', padding: 0 }}
                                onClick={() => navigate(`/restaurant/${restaurant._id}`)}
                            >
                                <div style={{
                                    height: '200px',
                                    backgroundImage: `url(${restaurant.image})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    position: 'relative'
                                }}>
                                    <button
                                        style={{
                                            position: 'absolute',
                                            top: '1rem',
                                            right: '1rem',
                                            background: 'rgba(255,255,255,0.95)',
                                            border: 'none',
                                            borderRadius: '50%',
                                            width: '40px',
                                            height: '40px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer'
                                        }}
                                    >
                                        <Heart size={20} fill="var(--primary)" color="var(--primary)" />
                                    </button>
                                </div>
                                <div style={{ padding: '1.5rem' }}>
                                    <h3 style={{ fontSize: '1.3rem', fontWeight: 900, marginBottom: '0.5rem' }}>
                                        {restaurant.name}
                                    </h3>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                        <Star size={16} fill="var(--primary)" color="var(--primary)" />
                                        <span style={{ fontWeight: 700 }}>{restaurant.rating}</span>
                                        <span style={{ color: 'var(--gray)', fontWeight: 600 }}>({restaurant.numReviews} reviews)</span>
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                        {restaurant.cuisine?.slice(0, 3).map((c, idx) => (
                                            <span key={idx} style={{
                                                background: 'var(--gray-light)',
                                                padding: '0.25rem 0.75rem',
                                                borderRadius: '6px',
                                                fontSize: '0.85rem',
                                                fontWeight: 700,
                                                color: 'var(--secondary)'
                                            }}>
                                                {c}
                                            </span>
                                        ))}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--gray)', fontSize: '0.9rem', fontWeight: 600 }}>
                                        <Clock size={14} />
                                        <span>30-45 min</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </CustomerLayout>
    );
};

export default Favorites;
