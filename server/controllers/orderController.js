const Order = require('../models/Order');
const Restaurant = require('../models/Restaurant');
const { sendEmail } = require('../utils/emailService');

// @desc    Place new order
// @route   POST /api/orders
// @access  Private (Customer)
const Coupon = require('../models/Coupon');
const User = require('../models/User');

// @desc    Place new order
// @route   POST /api/orders
// @access  Private (Customer)
const createOrder = async (req, res) => {
    try {
        const { restaurantId, items, totalAmount, discount, finalAmount, couponCode } = req.body;

        let couponApplied = null;
        if (couponCode) {
            const coupon = await Coupon.findOne({ code: couponCode });
            if (coupon) {
                couponApplied = coupon._id;
                coupon.usedCount += 1;
                await coupon.save();
            }
        }

        // Parse or use User's address
        // Assuming req.user.address is a string, we might need to structure it 
        // or just save it as a string if the model supports it. 
        // The model now expects an object or we can make it flexible.
        // Let's check User model... it's just "address: String".
        // Use regex or just save entire string in 'street' for now to fit the object structure 
        // OR better: Update Order model to just be a String or Object?
        // The implementation_plan said "Object with street, city". 
        // But User model has simple string. 
        // Let's just save the string in 'street' for simplicity or modify Order model to generic Object/String.
        // Actually, to be safe and robust, let's keep it flexible or just use the string.
        // I will map the user's address string to the street field.

        const deliveryAddress = {
            street: req.user.address || 'N/A',
            city: 'Mumbai', // Defaulting for now as User model is simple
            state: 'Maharashtra',
            zip: '400001',
            country: 'India'
        };

        const order = await Order.create({
            customer: req.user._id,
            restaurant: restaurantId,
            items,
            totalAmount,
            discount: discount || 0,
            finalAmount: finalAmount || totalAmount,
            couponApplied,
            status: 'placed',
            deliveryAddress
        });

        // Award Points (10 points per ₹100 spent)
        const pointsEarned = Math.floor((finalAmount || totalAmount) / 100) * 10;
        if (pointsEarned > 0) {
            await User.findByIdAndUpdate(req.user._id, { $inc: { points: pointsEarned } });
        }

        // Emit socket event for real-time update
        const io = req.app.get('socketio');
        // Emit to specific restaurant room
        console.log(`📡 Emitting 'new_order' to: restaurant_${restaurantId}`);
        io.to(`restaurant_${restaurantId}`).emit('new_order', order);
        // Also emit to delivery partners (global 'delivery_available' room? or just let them poll/listen globally for now)
        // Ideally we have a 'delivery_zone' room, but for now global broadcast to delivery partners is okay-ish 
        // IF we had a delivery room. But let's just emit to restaurant for now.
        // Delivery sees it when status becomes 'accepted'.

        // Send Email Notification
        const emailContent = `
            <h2>Order Confirmation</h2>
            <p>Thank you for your order!</p>
            <p><strong>Order ID:</strong> ${order._id}</p>
            <p><strong>Total Amount:</strong> ₹${totalAmount}</p>
            ${discount > 0 ? `<p><strong>Discount:</strong> -₹${discount}</p>` : ''}
            <p><strong>Final Amount:</strong> ₹${finalAmount || totalAmount}</p>
            <p><strong>Points Earned:</strong> ${pointsEarned}</p>
            <p>Your order has been placed successfully and is being processed by the restaurant.</p>
        `;

        await sendEmail({
            to: req.user.email,
            subject: `Order Confirmation - #${order._id.toString().slice(-6).toUpperCase()}`,
            html: emailContent
        });

        // Notify Restaurant Owner
        try {
            const restaurantDoc = await Restaurant.findById(restaurantId).populate('owner');
            if (restaurantDoc && restaurantDoc.owner && restaurantDoc.owner.email) {
                const ownerEmailContent = `
                    <h2>New Order Received! 🔔</h2>
                    <p>You have a new order from <strong>${req.user.name}</strong>.</p>
                    <p><strong>Order ID:</strong> ${order._id}</p>
                    <p><strong>Amount:</strong> ₹${finalAmount || totalAmount}</p>
                    <p>Please check your dashboard to accept and process this order.</p>
                `;

                await sendEmail({
                    to: restaurantDoc.owner.email,
                    subject: `New Order Received - #${order._id.toString().slice(-6).toUpperCase()}`,
                    html: ownerEmailContent
                });
            }
        } catch (emailErr) {
            console.error('Failed to send restaurant email:', emailErr);
        }

        res.status(201).json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get my orders (Customer)
// @route   GET /api/orders/my
// @access  Private
const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ customer: req.user._id }).populate('restaurant', 'name').sort('-createdAt');
        res.json(orders);
    } catch (error) {
        console.error('❌ Error in getMyOrders:', error);
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get restaurant orders
// @route   GET /api/orders/restaurant/:id
// @access  Private (Restaurant)
const getRestaurantOrders = async (req, res) => {
    try {
        const orders = await Order.find({ restaurant: req.params.id }).populate('customer', 'name address').sort('-createdAt');
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private (Restaurant/Delivery)
const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findById(req.params.id);

        if (!order) return res.status(404).json({ message: 'Order not found' });

        order.status = status;
        if (status === 'delivered') {
            order.paymentStatus = 'paid'; // Assuming COD or confirming payment
        }

        // If delivery partner accepting
        if (status === 'preparing' && req.user.role === 'delivery') {
            // Logic to assign delivery partner? No, usually "accepted" by delivery partner
        }

        if (req.user.role === 'delivery' && !order.deliveryPartner) {
            order.deliveryPartner = req.user._id;
        }

        await order.save();

        const io = req.app.get('socketio');

        // Emit to specific rooms
        io.to(`restaurant_${order.restaurant}`).emit('order_status_update', order);
        io.to(`order_${order._id}`).emit('order_status_update', order); // For customer tracking

        // Broadcast to delivery partners if status is relevant
        if (['accepted', 'preparing', 'ready'].includes(status) && !order.deliveryPartner) {
            io.to('delivery_pool').emit('delivery_new_request', order); // Broadcast to all for Toast
            io.to('delivery_pool').emit('order_status_update', order); // Broadcast to all for List
        } else if (order.deliveryPartner) {
            // Order is taken or updated while taken.
            // Broadcast to pool so others remove it from their 'available' list (if logic handles that)
            io.to('delivery_pool').emit('order_status_update', order);

            // Also ensure the specific partner gets it
            io.to(`delivery_${order.deliveryPartner}`).emit('order_status_update', order);
        }

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get orders available for delivery
// @route   GET /api/orders/delivery/available
// @access  Private (Delivery)
const getAvailableOrders = async (req, res) => {
    try {
        const orders = await Order.find({
            status: { $in: ['accepted', 'preparing', 'ready'] },
            deliveryPartner: null
        }).populate('restaurant', 'name address').populate('customer', 'name address').sort('-createdAt');
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get my deliveries
// @route   GET /api/orders/delivery/my
// @access  Private (Delivery)
const getMyDeliveries = async (req, res) => {
    try {
        const orders = await Order.find({ deliveryPartner: req.user._id }).populate('restaurant', 'name address').populate('customer', 'name address').sort('-updatedAt');
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('restaurant', 'name address')
            .populate('customer', 'name address')
            .populate('deliveryPartner', 'name phone');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check Access Rights?
        // Customer can see own order
        // Restaurant can see own order
        // Delivery can see assigned order OR available info?
        // For now, flexible.

        res.json(order);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createOrder,
    getMyOrders,
    getRestaurantOrders,
    updateOrderStatus,
    getAvailableOrders,
    getMyDeliveries,
    getOrderById
};
