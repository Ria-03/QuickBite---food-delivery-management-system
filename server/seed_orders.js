const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./models/User');
const Restaurant = require('./models/Restaurant');
const MenuItem = require('./models/MenuItem');
const Order = require('./models/Order');

// Helper to get random item from array
const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Helper to get random number between min and max
const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Helper to get random date within last N days
const getRandomDate = (daysAgo) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    // Random time between 10 AM and 10 PM
    date.setHours(getRandomInt(10, 22), getRandomInt(0, 59), getRandomInt(0, 59));
    return date;
};

mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/quickbite')
    .then(async () => {
        console.log('Connected to DB');

        // Fetch required data
        const customers = await User.find({ role: 'customer' });
        const restaurants = await Restaurant.find({});

        if (customers.length === 0 || restaurants.length === 0) {
            console.log('❌ Need customers and restaurants to create orders. Run seed_database.js first if needed.');
            process.exit(1);
        }

        console.log(`Found ${customers.length} customers and ${restaurants.length} restaurants.`);
        console.log('🗑️  Clearing existing orders...');
        await Order.deleteMany({});

        console.log('📦 Generating orders for the last 30 days...');
        let totalOrders = 0;
        let totalRevenue = 0;

        // Create orders for each day in the last 30 days
        for (let i = 0; i < 30; i++) {
            // More orders for recent days (to show growth)
            const ordersCount = getRandomInt(3, 8) + Math.floor((30 - i) / 5);

            for (let j = 0; j < ordersCount; j++) {
                const customer = getRandomElement(customers);
                const restaurant = getRandomElement(restaurants);

                // Get menu items for this restaurant
                const menuItems = await MenuItem.find({ restaurant: restaurant._id });
                if (menuItems.length === 0) continue;

                // Create random items for the order
                const numItems = getRandomInt(1, 4);
                const orderItems = [];
                let orderTotal = 0;

                for (let k = 0; k < numItems; k++) {
                    const item = getRandomElement(menuItems);
                    const quantity = getRandomInt(1, 2);
                    orderItems.push({
                        menuItem: item._id,
                        name: item.name,
                        price: item.price,
                        quantity: quantity
                    });
                    orderTotal += item.price * quantity;
                }

                const deliveryFee = 40;
                const taxes = Math.round(orderTotal * 0.05);
                const finalAmount = orderTotal + deliveryFee + taxes;

                // Determine status based on "how long ago"
                let status = 'delivered';
                const rand = Math.random();
                if (i === 0) { // Today
                    if (rand < 0.2) status = 'placed';
                    else if (rand < 0.4) status = 'preparing';
                    else if (rand < 0.6) status = 'ready';
                    else if (rand < 0.8) status = 'picked_up';
                } else {
                    if (rand < 0.05) status = 'cancelled'; // 5% cancellation rate
                }

                await Order.create({
                    customer: customer._id,
                    restaurant: restaurant._id,
                    items: orderItems,
                    totalAmount: orderTotal,
                    finalAmount: finalAmount,
                    status: status,
                    paymentMethod: Math.random() > 0.3 ? 'ONLINE' : 'COD',
                    paymentStatus: status === 'cancelled' ? 'failed' : 'paid',
                    deliveryAddress: {
                        street: '123 Test St',
                        city: 'Test City',
                        zip: '123456',
                        country: 'India'
                    },
                    createdAt: getRandomDate(i),
                    updatedAt: getRandomDate(i)
                });

                totalOrders++;
                if (status !== 'cancelled') totalRevenue += finalAmount;
            }
        }

        console.log('\\n📊 Summary:');
        console.log(`  ✅ Generated ${totalOrders} orders`);
        console.log(`  💰 Total Revenue: ₹${totalRevenue.toLocaleString()}`);
        console.log('\\n✨ Orders seeded successfully!');

        process.exit(0);
    })
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
