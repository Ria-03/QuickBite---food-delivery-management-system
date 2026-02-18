const mongoose = require('mongoose');
const User = require('./models/User');
const Restaurant = require('./models/Restaurant');
const MenuItem = require('./models/MenuItem');
const Order = require('./models/Order');
const Coupon = require('./models/Coupon');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const connectDB = require('./config/db');

const resetSystem = async () => {
    try {
        await connectDB();

        console.log('🗑️  Clearing entire database...');
        await User.deleteMany({});
        await Restaurant.deleteMany({});
        await MenuItem.deleteMany({});
        await Order.deleteMany({});
        await Coupon.deleteMany({});
        console.log('✅ Database cleared.');

        console.log('👥 Creating fresh users...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123456', salt);

        const users = [
            { name: 'John Doe', email: 'customer@quickbite.com', password: hashedPassword, role: 'customer' },
            { name: 'Chef Mario', email: 'restaurant@quickbite.com', password: hashedPassword, role: 'restaurant' },
            { name: 'Speedy Gonzales', email: 'delivery@quickbite.com', password: hashedPassword, role: 'delivery' },
            { name: 'Admin User', email: 'admin@quickbite.com', password: hashedPassword, role: 'admin' }
        ];

        await User.insertMany(users);
        console.log('✅ Created 4 fresh users with password "123456":');
        users.forEach(u => console.log(`   - ${u.role.toUpperCase()}: ${u.email}`));

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

resetSystem();
