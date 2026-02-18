import { useNavigate } from 'react-router-dom';

const RestaurantCard = ({ restaurant }) => {
    const navigate = useNavigate();

    return (
        <div
            className="card"
            onClick={() => navigate(`/restaurant/${restaurant._id}`)}
            style={{
                cursor: 'pointer',
                padding: 0,
                overflow: 'hidden',
                borderRadius: 'var(--radius-lg)',
                border: 'none',
                background: 'var(--white)',
                boxShadow: '0 4px 20px rgba(0,0,0,0.06)'
            }}
        >
            <div style={{ position: 'relative', paddingTop: '56.25%' /* 16:9 Aspect Ratio */ }}>
                <img
                    src={restaurant.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80'}
                    alt={restaurant.name}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <div style={{
                    position: 'absolute',
                    top: '1rem',
                    right: '1rem',
                    background: 'rgba(255, 255, 255, 0.95)',
                    padding: '0.4rem 0.8rem',
                    borderRadius: 'var(--radius-full)',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                    <span style={{ color: '#FFD700' }}>★</span> {restaurant.rating || '4.5'}
                </div>
            </div>

            <div style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <h3 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0 }}>{restaurant.name}</h3>
                </div>

                <p style={{ color: 'var(--gray)', fontSize: '0.95rem', marginBottom: '1rem', fontWeight: 500 }}>
                    {restaurant.cuisine?.join(' • ') || 'Cuisine • Fast Food'}
                </p>

                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: '1rem',
                    borderTop: '1px solid var(--gray-light)'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--gray)', fontWeight: 600, fontSize: '0.85rem' }}>
                        <span style={{ fontSize: '1.1rem' }}>🕒</span> 25-30 mins
                    </div>
                    <button className="btn btn-primary" style={{ padding: '0.6rem 1.25rem', fontSize: '0.9rem', borderRadius: 'var(--radius-md)' }}>
                        View Menu
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RestaurantCard;
