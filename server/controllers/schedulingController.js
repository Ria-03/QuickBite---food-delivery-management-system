const Order = require('../models/Order');
const RecurringOrder = require('../models/RecurringOrder');
const Address = require('../models/Address');
const moment = require('moment-timezone');

// @desc    Create scheduled order
// @route   POST /api/scheduling/schedule-order
// @access  Private
const createScheduledOrder = async (req, res) => {
    try {
        const { items, restaurant, deliveryAddressId, scheduledFor, paymentMethod, totalAmount, discount, deliveryFee, finalAmount } = req.body;

        // Validate scheduled time is at least 2 hours in future
        const scheduledTime = moment(scheduledFor);
        const minTime = moment().add(2, 'hours');

        if (scheduledTime.isBefore(minTime)) {
            return res.status(400).json({
                success: false,
                message: 'Scheduled time must be at least 2 hours in the future'
            });
        }

        // Validate scheduled time is not more than 30 days ahead
        const maxTime = moment().add(30, 'days');
        if (scheduledTime.isAfter(maxTime)) {
            return res.status(400).json({
                success: false,
                message: 'Cannot schedule orders more than 30 days in advance'
            });
        }

        // Verify address exists and belongs to user
        const address = await Address.findOne({ _id: deliveryAddressId, user: req.user._id });
        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Address not found'
            });
        }

        // Create scheduled order
        const order = await Order.create({
            user: req.user._id,
            customer: req.user._id,
            restaurant,
            items,
            deliveryAddressId,
            deliveryAddress: {
                street: `${address.addressLine1}, ${address.addressLine2 || ''}`,
                city: address.city,
                state: address.state,
                zip: address.zipCode,
                country: address.country
            },
            totalAmount,
            discount,
            deliveryFee,
            finalAmount,
            paymentMethod,
            paymentStatus: paymentMethod === 'COD' ? 'pending' : 'pending',
            status: 'pending',
            orderType: 'scheduled',
            scheduledFor: scheduledTime.toDate(),
            isScheduled: true
        });

        res.status(201).json({
            success: true,
            message: 'Order scheduled successfully',
            order
        });
    } catch (error) {
        console.error('❌ Error creating scheduled order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to schedule order',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Get all scheduled orders for user
// @route   GET /api/scheduling/scheduled-orders
// @access  Private
const getScheduledOrders = async (req, res) => {
    try {
        const { status } = req.query;

        const query = {
            user: req.user._id,
            orderType: 'scheduled',
            isScheduled: true
        };

        if (status) {
            query.status = status;
        }

        const orders = await Order.find(query)
            .populate('restaurant', 'name image')
            .populate('deliveryAddressId')
            .sort({ scheduledFor: 1 });

        res.status(200).json({
            success: true,
            count: orders.length,
            orders
        });
    } catch (error) {
        console.error('❌ Error fetching scheduled orders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch scheduled orders',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Update scheduled order
// @route   PUT /api/scheduling/scheduled-orders/:id
// @access  Private
const updateScheduledOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { scheduledFor, items, deliveryAddressId } = req.body;

        // Find order and verify ownership
        const order = await Order.findOne({ _id: id, user: req.user._id, isScheduled: true });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Scheduled order not found'
            });
        }

        // Check if order hasn't been processed yet
        if (order.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Cannot update order that has already been processed'
            });
        }

        // Update fields
        if (scheduledFor) {
            const scheduledTime = moment(scheduledFor);
            const minTime = moment().add(2, 'hours');

            if (scheduledTime.isBefore(minTime)) {
                return res.status(400).json({
                    success: false,
                    message: 'Scheduled time must be at least 2 hours in the future'
                });
            }

            order.scheduledFor = scheduledTime.toDate();
        }

        if (items) {
            order.items = items;
            // Recalculate amounts if needed
        }

        if (deliveryAddressId) {
            const address = await Address.findOne({ _id: deliveryAddressId, user: req.user._id });
            if (!address) {
                return res.status(404).json({
                    success: false,
                    message: 'Address not found'
                });
            }
            order.deliveryAddressId = deliveryAddressId;
        }

        await order.save();

        res.status(200).json({
            success: true,
            message: 'Scheduled order updated successfully',
            order
        });
    } catch (error) {
        console.error('❌ Error updating scheduled order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update scheduled order',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Cancel scheduled order
// @route   DELETE /api/scheduling/scheduled-orders/:id
// @access  Private
const cancelScheduledOrder = async (req, res) => {
    try {
        const { id } = req.params;

        const order = await Order.findOne({ _id: id, user: req.user._id, isScheduled: true });

        if (!order) {
            return res.status(404).json({
                success: false,
                message: 'Scheduled order not found'
            });
        }

        if (order.status !== 'pending') {
            return res.status(400).json({
                success: false,
                message: 'Cannot cancel order that has already been processed'
            });
        }

        order.status = 'cancelled';
        await order.save();

        res.status(200).json({
            success: true,
            message: 'Scheduled order cancelled successfully'
        });
    } catch (error) {
        console.error('❌ Error cancelling scheduled order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel scheduled order',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Create recurring order
// @route   POST /api/scheduling/recurring-order
// @access  Private
const createRecurringOrder = async (req, res) => {
    try {
        const {
            restaurant,
            items,
            deliveryAddressId,
            frequency,
            dayOfWeek,
            deliveryTime,
            startDate,
            endDate,
            paymentMethod,
            totalAmount,
            discount,
            deliveryFee,
            finalAmount
        } = req.body;

        // Verify address
        const address = await Address.findOne({ _id: deliveryAddressId, user: req.user._id });
        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Address not found'
            });
        }

        // Calculate first delivery date
        const firstDelivery = moment(startDate).set({
            hour: parseInt(deliveryTime.split(':')[0]),
            minute: parseInt(deliveryTime.split(':')[1])
        });

        // Create recurring order
        const recurringOrder = await RecurringOrder.create({
            user: req.user._id,
            restaurant,
            items,
            deliveryAddressId,
            frequency,
            dayOfWeek: frequency === 'weekly' || frequency === 'biweekly' ? dayOfWeek : null,
            deliveryTime,
            startDate: firstDelivery.toDate(),
            endDate: endDate ? moment(endDate).toDate() : null,
            nextDelivery: firstDelivery.toDate(),
            paymentMethod,
            totalAmount,
            discount,
            deliveryFee,
            finalAmount,
            status: 'active'
        });

        res.status(201).json({
            success: true,
            message: 'Recurring order created successfully',
            recurringOrder
        });
    } catch (error) {
        console.error('❌ Error creating recurring order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create recurring order',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Get all recurring orders for user
// @route   GET /api/scheduling/recurring-orders
// @access  Private
const getRecurringOrders = async (req, res) => {
    try {
        const recurringOrders = await RecurringOrder.find({ user: req.user._id })
            .populate('restaurant', 'name image')
            .populate('deliveryAddressId')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: recurringOrders.length,
            recurringOrders
        });
    } catch (error) {
        console.error('❌ Error fetching recurring orders:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch recurring orders',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Update recurring order
// @route   PUT /api/scheduling/recurring-orders/:id
// @access  Private
const updateRecurringOrder = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, frequency, dayOfWeek, deliveryTime, endDate, items } = req.body;

        const recurringOrder = await RecurringOrder.findOne({ _id: id, user: req.user._id });

        if (!recurringOrder) {
            return res.status(404).json({
                success: false,
                message: 'Recurring order not found'
            });
        }

        // Update fields
        if (status) recurringOrder.status = status;
        if (frequency) recurringOrder.frequency = frequency;
        if (dayOfWeek !== undefined) recurringOrder.dayOfWeek = dayOfWeek;
        if (deliveryTime) recurringOrder.deliveryTime = deliveryTime;
        if (endDate !== undefined) recurringOrder.endDate = endDate ? moment(endDate).toDate() : null;
        if (items) recurringOrder.items = items;

        // Recalculate next delivery if frequency or time changed
        if (frequency || deliveryTime) {
            recurringOrder.nextDelivery = recurringOrder.calculateNextDelivery();
        }

        await recurringOrder.save();

        res.status(200).json({
            success: true,
            message: 'Recurring order updated successfully',
            recurringOrder
        });
    } catch (error) {
        console.error('❌ Error updating recurring order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update recurring order',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Cancel recurring order
// @route   DELETE /api/scheduling/recurring-orders/:id
// @access  Private
const cancelRecurringOrder = async (req, res) => {
    try {
        const { id } = req.params;

        const recurringOrder = await RecurringOrder.findOne({ _id: id, user: req.user._id });

        if (!recurringOrder) {
            return res.status(404).json({
                success: false,
                message: 'Recurring order not found'
            });
        }

        recurringOrder.status = 'cancelled';
        await recurringOrder.save();

        res.status(200).json({
            success: true,
            message: 'Recurring order cancelled successfully'
        });
    } catch (error) {
        console.error('❌ Error cancelling recurring order:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel recurring order',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    createScheduledOrder,
    getScheduledOrders,
    updateScheduledOrder,
    cancelScheduledOrder,
    createRecurringOrder,
    getRecurringOrders,
    updateRecurringOrder,
    cancelRecurringOrder
};
