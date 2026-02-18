const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    createRazorpayOrder,
    verifyPayment,
    handlePaymentFailure,
    getPaymentDetails
} = require('../controllers/paymentController');

// All payment routes require authentication
router.post('/create-order', protect, createRazorpayOrder);
router.post('/verify', protect, verifyPayment);
router.post('/failure', protect, handlePaymentFailure);
router.get('/:orderId', protect, getPaymentDetails);

module.exports = router;
