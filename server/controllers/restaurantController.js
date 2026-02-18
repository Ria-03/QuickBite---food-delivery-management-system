const Restaurant = require('../models/Restaurant');
const MenuItem = require('../models/MenuItem');
const User = require('../models/User');

// @desc    Create new restaurant
// @route   POST /api/restaurants
// @access  Private (Restaurant Owner)
const createRestaurant = async (req, res) => {
    try {
        const { name, description, address, cuisine } = req.body;

        const restaurant = await Restaurant.create({
            owner: req.user._id,
            name,
            description,
            address,
            cuisine,
            isApproved: true // Auto-approve for development
        });

        // Link restaurant to user
        await User.findByIdAndUpdate(req.user._id, { restaurantId: restaurant._id });

        res.status(201).json(restaurant);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all restaurants (Public)
// @route   GET /api/restaurants
// @access  Public
const getRestaurants = async (req, res) => {
    try {
        const restaurants = await Restaurant.find({ isApproved: true }); // Only valid ones
        res.json(restaurants);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get my restaurant details
// @route   GET /api/restaurants/my
// @access  Private (Owner)
const getMyRestaurant = async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ owner: req.user._id });
        if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
        res.json(restaurant);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add menu item
// @route   POST /api/restaurants/menu
// @access  Private (Owner)
const addMenuItem = async (req, res) => {
    try {
        const restaurant = await Restaurant.findOne({ owner: req.user._id });
        if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

        const menuItem = await MenuItem.create({
            restaurant: restaurant._id,
            ...req.body
        });

        res.status(201).json(menuItem);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get menu items for a restaurant
// @route   GET /api/restaurants/:id/menu
// @access  Public
const getMenu = async (req, res) => {
    try {
        const menu = await MenuItem.find({ restaurant: req.params.id });
        res.json(menu);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getRestaurantById = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });
        res.json(restaurant);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update restaurant details
// @route   PUT /api/restaurants/:id
// @access  Private (Owner)
const updateRestaurant = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);

        if (!restaurant) {
            return res.status(404).json({ message: 'Restaurant not found' });
        }

        // Check ownership
        if (restaurant.owner.toString() !== req.user._id.toString()) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const updatedRestaurant = await Restaurant.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true }
        );

        res.json(updatedRestaurant);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createRestaurant,
    getRestaurants,
    getMyRestaurant,
    getRestaurantById,
    addMenuItem,
    getMenu,
    updateRestaurant
};
