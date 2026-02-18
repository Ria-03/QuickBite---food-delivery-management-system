const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const connectDB = require('./config/db');

const resetPasswords = async () => {
    try {
        await connectDB();

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('123456', salt);

        const usersToReset = [
            'resturant@test.com', // Typos might exist, let's stick to valid emails
            'restaurant@test.com',
            'customer@test.com',
            'user@test.com',
            'delivery@test.com'
        ];

        const result = await User.updateMany(
            { email: { $in: usersToReset } },
            { $set: { password: hashedPassword } }
        );

        console.log(`Updated passwords for ${result.modifiedCount} users to '123456'.`);
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

resetPasswords();
