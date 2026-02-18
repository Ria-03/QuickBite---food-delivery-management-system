const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const {
    createRestaurant,
    getRestaurants,
    getMyRestaurant,
    getRestaurantById,
    addMenuItem,
    getMenu,
    updateRestaurant
} = require('../controllers/restaurantController');

// Protected routes (Restaurant Owners)
router.get('/my/profile', protect, authorize('restaurant'), getMyRestaurant);
router.post('/', protect, authorize('restaurant'), createRestaurant);
router.post('/menu', protect, authorize('restaurant'), addMenuItem);
router.put('/:id', protect, authorize('restaurant'), updateRestaurant);

// Public routes (Place dynamic routes last)
router.get('/', getRestaurants);
router.get('/:id', getRestaurantById);
router.get('/:id/menu', getMenu);

module.exports = router;
