const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    createOrder,
    getMyOrders,
    getRestaurantOrders,
    updateOrderStatus,
    getAvailableOrders,
    getMyDeliveries,
    getOrderById
} = require('../controllers/orderController');

// Allow all roles to place orders and view their history as customers
router.post('/', protect, authorize('customer', 'restaurant', 'delivery'), createOrder);
router.get('/my', protect, authorize('customer', 'restaurant', 'delivery'), getMyOrders);
router.get('/restaurant/:id', protect, authorize('restaurant'), getRestaurantOrders);
router.get('/delivery/available', protect, authorize('delivery'), getAvailableOrders);
router.get('/delivery/my', protect, authorize('delivery'), getMyDeliveries);
router.get('/:id', protect, getOrderById);
router.put('/:id/status', protect, authorize('restaurant', 'delivery'), updateOrderStatus);

module.exports = router;
