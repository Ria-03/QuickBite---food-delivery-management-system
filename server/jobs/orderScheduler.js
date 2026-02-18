const cron = require('node-cron');
const moment = require('moment-timezone');
const Order = require('../models/Order');
const RecurringOrder = require('../models/RecurringOrder');
const Address = require('../models/Address');

// Process scheduled orders that are due
const processScheduledOrders = async () => {
    try {
        const now = moment();
        const windowStart = now.clone().subtract(15, 'minutes');
        const windowEnd = now.clone().add(15, 'minutes');

        // Find scheduled orders due for processing
        const scheduledOrders = await Order.find({
            orderType: 'scheduled',
            isScheduled: true,
            status: 'pending',
            scheduledFor: {
                $gte: windowStart.toDate(),
                $lte: windowEnd.toDate()
            }
        }).populate('restaurant').populate('user');

        console.log(`📅 Processing ${scheduledOrders.length} scheduled orders...`);

        for (const order of scheduledOrders) {
            try {
                // Update order status to 'placed'
                order.status = 'placed';
                order.isScheduled = false; // Mark as processed
                await order.save();

                console.log(`✅ Processed scheduled order: ${order._id}`);

                // TODO: Send notifications to user and restaurant
                // TODO: Emit socket event for real-time updates
            } catch (error) {
                console.error(`❌ Error processing scheduled order ${order._id}:`, error);
            }
        }
    } catch (error) {
        console.error('❌ Error in processScheduledOrders:', error);
    }
};

// Process recurring orders and create new orders
const processRecurringOrders = async () => {
    try {
        const now = moment();

        // Find recurring orders that should be processed
        const recurringOrders = await RecurringOrder.find({
            status: 'active',
            nextDelivery: {
                $lte: now.toDate()
            }
        }).populate('restaurant').populate('user').populate('deliveryAddressId');

        console.log(`🔄 Processing ${recurringOrders.length} recurring orders...`);

        for (const recurringOrder of recurringOrders) {
            try {
                // Check if end date has passed
                if (recurringOrder.endDate && moment(recurringOrder.endDate).isBefore(now)) {
                    recurringOrder.status = 'completed';
                    await recurringOrder.save();
                    console.log(`✅ Completed recurring order: ${recurringOrder._id}`);
                    continue;
                }

                // Get address details
                const address = recurringOrder.deliveryAddressId;

                // Create new order from recurring order
                const newOrder = await Order.create({
                    user: recurringOrder.user._id,
                    customer: recurringOrder.user._id,
                    restaurant: recurringOrder.restaurant._id,
                    items: recurringOrder.items,
                    deliveryAddressId: address._id,
                    deliveryAddress: {
                        street: `${address.addressLine1}, ${address.addressLine2 || ''}`,
                        city: address.city,
                        state: address.state,
                        zip: address.zipCode,
                        country: address.country
                    },
                    totalAmount: recurringOrder.totalAmount,
                    discount: recurringOrder.discount,
                    deliveryFee: recurringOrder.deliveryFee,
                    finalAmount: recurringOrder.finalAmount,
                    paymentMethod: recurringOrder.paymentMethod,
                    paymentStatus: 'pending',
                    status: 'placed',
                    orderType: 'recurring',
                    recurringOrderId: recurringOrder._id
                });

                // Update recurring order statistics
                recurringOrder.totalOrders += 1;
                recurringOrder.completedOrders += 1;
                recurringOrder.lastOrderDate = now.toDate();
                recurringOrder.nextDelivery = recurringOrder.calculateNextDelivery();
                await recurringOrder.save();

                console.log(`✅ Created order from recurring order: ${newOrder._id}`);

                // TODO: Send notifications
                // TODO: Emit socket event
            } catch (error) {
                console.error(`❌ Error processing recurring order ${recurringOrder._id}:`, error);
            }
        }
    } catch (error) {
        console.error('❌ Error in processRecurringOrders:', error);
    }
};

// Start cron jobs
const startScheduler = () => {
    // Run every 15 minutes
    cron.schedule('*/15 * * * *', async () => {
        console.log('🕐 Running order scheduler...');
        await processScheduledOrders();
        await processRecurringOrders();
    });

    console.log('✅ Order scheduler started (runs every 15 minutes)');
};

module.exports = {
    startScheduler,
    processScheduledOrders,
    processRecurringOrders
};
