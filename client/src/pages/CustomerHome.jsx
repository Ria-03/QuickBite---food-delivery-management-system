import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import RestaurantList from '../components/RestaurantList';
import OrderTracker from '../components/OrderTracker';
import CustomerLayout from '../components/CustomerLayout';
import TopNavigation from '../components/TopNavigation';

const CustomerHome = () => {
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('rating');
    const [filterType, setFilterType] = useState('all');

    return (
        <CustomerLayout>
            <div style={{ background: 'var(--bg-main)', minHeight: '100vh' }}>
                <TopNavigation searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

                <div className="container" style={{ marginTop: '2.5rem', paddingBottom: '5rem' }}>
                    <OrderTracker />
                    <div style={{ marginBottom: '2.5rem', marginTop: '1rem' }}>
                        <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
                            Welcome back, {user?.name?.split(' ')[0]}!
                        </h2>
                        <p style={{ color: 'var(--gray)', fontSize: '1.1rem', fontWeight: 500 }}>What are you craving today?</p>
                    </div>

                    <div style={{ marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Featured Restaurants</h3>
                            <p style={{ color: 'var(--gray)', fontSize: '0.9rem' }}>Handpicked premium selections</p>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <select
                                className="btn"
                                style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', background: 'var(--white)', border: '1px solid var(--gray-light)', cursor: 'pointer', outline: 'none' }}
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                            >
                                <option value="all">All Restaurants</option>
                                <option value="veg">Pure Veg/Veg Options</option>
                                <option value="rating4">Rating 4.0+</option>
                            </select>
                            <select
                                className="btn"
                                style={{ padding: '0.4rem 1rem', fontSize: '0.8rem', background: 'var(--white)', border: '1px solid var(--gray-light)', cursor: 'pointer', outline: 'none' }}
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                            >
                                <option value="rating">Top Rated</option>
                                <option value="deliveryTime">Fastest Delivery</option>
                                <option value="costLow">Cost: Low to High</option>
                            </select>
                        </div>
                    </div>

                    <RestaurantList searchTerm={searchTerm} sortBy={sortBy} filterType={filterType} />
                </div>
            </div>
        </CustomerLayout>
    );
};

export default CustomerHome;
