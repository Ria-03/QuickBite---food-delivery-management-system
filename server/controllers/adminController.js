const User = require('../models/User');
const Restaurant = require('../models/Restaurant');
const Order = require('../models/Order');

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all restaurants (for approval)
// @route   GET /api/admin/restaurants
// @access  Private (Admin)
const getAllRestaurants = async (req, res) => {
    try {
        const MenuItem = require('../models/MenuItem');
        const restaurants = await Restaurant.find({}).populate('owner', 'name email phone');

        // Add menu item count for each restaurant
        const restaurantsWithCounts = await Promise.all(
            restaurants.map(async (restaurant) => {
                const menuItemCount = await MenuItem.countDocuments({ restaurant: restaurant._id });
                return {
                    ...restaurant.toObject(),
                    menuItemCount
                };
            })
        );

        res.json(restaurantsWithCounts);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Approve/Reject Restaurant
// @route   PUT /api/admin/restaurants/:id
// @access  Private (Admin)
const updateRestaurantStatus = async (req, res) => {
    try {
        const restaurant = await Restaurant.findById(req.params.id);
        if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

        const { isApproved, approvalStatus, rejectionReason } = req.body;

        // Update approval fields
        if (isApproved !== undefined) {
            restaurant.isApproved = isApproved;
        }

        if (approvalStatus) {
            restaurant.approvalStatus = approvalStatus;
            // Sync isApproved with approvalStatus
            restaurant.isApproved = approvalStatus === 'approved';
        }

        if (rejectionReason !== undefined) {
            restaurant.rejectionReason = rejectionReason;
        }

        await restaurant.save();
        res.json(restaurant);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get System Stats
// @route   GET /api/admin/stats
// @access  Private (Admin)
const getSystemStats = async (req, res) => {
    try {
        const users = await User.countDocuments();
        const restaurants = await Restaurant.countDocuments();
        const orders = await Order.countDocuments();
        const totalRevenue = await Order.aggregate([
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);

        res.json({
            users,
            restaurants,
            orders,
            revenue: totalRevenue[0]?.total || 0
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Order Trends (last 7 days)
// @route   GET /api/admin/trends
// @access  Private (Admin)
const getOrderTrends = async (req, res) => {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const trends = await Order.aggregate([
            { $match: { createdAt: { $gte: sevenDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    count: { $sum: 1 },
                    revenue: { $sum: '$totalAmount' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json(trends);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Revenue Growth (last 30 days)
// @route   GET /api/admin/revenue
// @access  Private (Admin)
const getRevenueGrowth = async (req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const revenue = await Order.aggregate([
            { $match: { createdAt: { $gte: thirtyDaysAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    total: { $sum: '$totalAmount' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.json(revenue);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// @desc    Block/Unblock User
// @route   PUT /api/admin/users/:id/block
// @access  Private (Admin)
const toggleBlockUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.role === 'admin') {
            return res.status(403).json({ message: 'Cannot block admin users' });
        }

        user.isBlocked = !user.isBlocked;
        await user.save();

        res.json({
            message: `User ${user.isBlocked ? 'blocked' : 'unblocked'} successfully`,
            user: { ...user.toObject(), password: undefined }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete User
// @route   DELETE /api/admin/users/:id
// @access  Private (Admin)
const deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        if (user.role === 'admin') {
            return res.status(403).json({ message: 'Cannot delete admin users' });
        }

        await User.findByIdAndDelete(req.params.id);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get User Details
// @route   GET /api/admin/users/:id
// @access  Private (Admin)
const getUserDetails = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password')
            .populate('restaurantId', 'name address');

        if (!user) return res.status(404).json({ message: 'User not found' });

        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get Restaurant Details
// @route   GET /api/admin/restaurants/:id
// @access  Private (Admin)
const getRestaurantDetails = async (req, res) => {
    try {
        const MenuItem = require('../models/MenuItem');

        const restaurant = await Restaurant.findById(req.params.id)
            .populate('owner', 'name email phone');

        if (!restaurant) return res.status(404).json({ message: 'Restaurant not found' });

        // Get menu item count
        const menuItemCount = await MenuItem.countDocuments({ restaurant: restaurant._id });

        // Get recent orders count
        const recentOrdersCount = await Order.countDocuments({ restaurant: restaurant._id });

        // Get total revenue
        const revenueData = await Order.aggregate([
            { $match: { restaurant: restaurant._id } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);

        const totalRevenue = revenueData[0]?.total || 0;

        res.json({
            ...restaurant.toObject(),
            menuItemCount,
            recentOrdersCount,
            totalRevenue
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all orders with populated data
// @route   GET /api/admin/orders
// @access  Private (Admin)
const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find({})
            .populate('customer', 'name email phone')
            .populate('restaurant', 'name image address')
            .populate('deliveryPartner', 'name phone')
            .sort({ createdAt: -1 }); // Newest first

        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    getAllUsers,
    getAllRestaurants,
    updateRestaurantStatus,
    getSystemStats,
    getOrderTrends,
    getRevenueGrowth,
    toggleBlockUser,
    deleteUser,
    getUserDetails,
    getRestaurantDetails,
    getAllOrders
};
