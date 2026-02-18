const User = require('../models/User');
const Restaurant = require('../models/Restaurant');

// @desc    Toggle favorite restaurant
// @route   POST /api/favorites/toggle/:restaurantId
// @access  Private
const toggleFavorite = async (req, res) => {
    try {
        const { restaurantId } = req.params;
        const userId = req.user._id;

        // Check if restaurant exists
        const restaurant = await Restaurant.findById(restaurantId);
        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        const user = await User.findById(userId);

        // Check if already in favorites
        const isFavorite = user.favorites.includes(restaurantId);

        if (isFavorite) {
            // Remove from favorites
            user.favorites = user.favorites.filter(id => id.toString() !== restaurantId);
            await user.save();
            res.json({ message: 'Removed from favorites', isFavorite: false });
        } else {
            // Add to favorites
            user.favorites.push(restaurantId);
            await user.save();
            res.json({ message: 'Added to favorites', isFavorite: true });
        }
    } catch (error) {
        console.error('Error toggling favorite:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Get user favorites
// @route   GET /api/favorites
// @access  Private
const getFavorites = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('favorites');
        res.json(user.favorites);
    } catch (error) {
        console.error('Error fetching favorites:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// @desc    Check if restaurant is favorite
// @route   GET /api/favorites/check/:restaurantId
// @access  Private
const checkFavorite = async (req, res) => {
    try {
        const user = await User.findById(req.user._id);
        const isFavorite = user.favorites.includes(req.params.restaurantId);
        res.json({ isFavorite });
    } catch (error) {
        console.error('Error checking favorite:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = {
    toggleFavorite,
    getFavorites,
    checkFavorite
};
