const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
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
} = require('../controllers/adminController');

router.get('/users', protect, authorize('admin'), getAllUsers);
router.get('/users/:id', protect, authorize('admin'), getUserDetails);
router.put('/users/:id/block', protect, authorize('admin'), toggleBlockUser);
router.delete('/users/:id', protect, authorize('admin'), deleteUser);
router.get('/restaurants', protect, authorize('admin'), getAllRestaurants);
router.get('/restaurants/:id', protect, authorize('admin'), getRestaurantDetails);
router.put('/restaurants/:id', protect, authorize('admin'), updateRestaurantStatus);
router.get('/orders', protect, authorize('admin'), getAllOrders);
router.get('/stats', protect, authorize('admin'), getSystemStats);
router.get('/trends', protect, authorize('admin'), getOrderTrends);
router.get('/revenue', protect, authorize('admin'), getRevenueGrowth);

module.exports = router;
