const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { createCoupon, getCoupons, validateCoupon } = require('../controllers/couponController');

router.post('/', protect, authorize('admin', 'restaurant'), createCoupon);
router.get('/', protect, getCoupons);
router.post('/validate', protect, validateCoupon);

module.exports = router;
