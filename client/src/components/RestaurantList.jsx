import { useState, useEffect } from 'react';
import axios from 'axios';
import RestaurantCard from './RestaurantCard';

const RestaurantList = ({ searchTerm = '', sortBy = 'rating', filterType = 'all' }) => {
    const [restaurants, setRestaurants] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRestaurants = async () => {
            try {
                const { data } = await axios.get('http://localhost:5000/api/restaurants');
                setRestaurants(data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching restaurants:', error);
                setLoading(false);
            }
        };

        fetchRestaurants();
    }, []);

    const filteredRestaurants = restaurants
        .filter(r => {
            const nameMatch = r.name?.toLowerCase().includes(searchTerm.toLowerCase());
            const cuisineMatch = Array.isArray(r.cuisine) && r.cuisine.some(c => c.toLowerCase().includes(searchTerm.toLowerCase()));
            const searchMatch = nameMatch || cuisineMatch;

            if (filterType === 'all') return searchMatch;
            if (filterType === 'veg') return searchMatch && (r.isVeg || (r.cuisine && r.cuisine.some(c => c.toLowerCase().includes('veg') && !c.toLowerCase().includes('non')))); // Rudimentary check
            if (filterType === 'rating4') return searchMatch && r.rating >= 4.0;

            return searchMatch;
        })
        .sort((a, b) => {
            if (sortBy === 'rating') return b.rating - a.rating; // High to low
            if (sortBy === 'deliveryTime') return 1; // Placeholder as time is string
            if (sortBy === 'costLow') return 1; // Placeholder
            return 0;
        });

    if (loading) return <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--gray)' }}>Loading premium restaurants...</div>;

    return (
        <div>
            {filteredRestaurants.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                    <p style={{ fontSize: '1.2rem', color: 'var(--gray)' }}>No restaurants match your search.</p>
                </div>
            ) : (
                <div className="restaurant-grid">
                    {filteredRestaurants.map(restaurant => (
                        <RestaurantCard key={restaurant._id} restaurant={restaurant} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default RestaurantList;
