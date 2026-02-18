const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    toggleFavorite,
    getFavorites,
    checkFavorite
} = require('../controllers/favoriteController');

router.post('/toggle/:restaurantId', protect, toggleFavorite);
router.get('/', protect, getFavorites);
router.get('/check/:restaurantId', protect, checkFavorite);

module.exports = router;
