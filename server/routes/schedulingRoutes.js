const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    createScheduledOrder,
    getScheduledOrders,
    updateScheduledOrder,
    cancelScheduledOrder,
    createRecurringOrder,
    getRecurringOrders,
    updateRecurringOrder,
    cancelRecurringOrder
} = require('../controllers/schedulingController');

// Scheduled Orders Routes
router.post('/schedule-order', protect, createScheduledOrder);
router.get('/scheduled-orders', protect, getScheduledOrders);
router.put('/scheduled-orders/:id', protect, updateScheduledOrder);
router.delete('/scheduled-orders/:id', protect, cancelScheduledOrder);

// Recurring Orders Routes
router.post('/recurring-order', protect, createRecurringOrder);
router.get('/recurring-orders', protect, getRecurringOrders);
router.put('/recurring-orders/:id', protect, updateRecurringOrder);
router.delete('/recurring-orders/:id', protect, cancelRecurringOrder);

module.exports = router;
