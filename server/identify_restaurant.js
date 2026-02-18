const mongoose = require('mongoose');
const Restaurant = require('./models/Restaurant');
const User = require('./models/User');
const fs = require('fs');
require('dotenv').config();

const identifyRestaurant = async () => {
    try {
        await mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/quickbite');

        const targetId = '6986e282ac33f998eb462ba8'; // From user screenshot
        let output = '';

        // Find specific restaurant
        try {
            const restaurant = await Restaurant.findById(targetId);
            if (restaurant) {
                output += `\n🎯 The Dashboard is currently managing:\n`;
                output += `   Name: ${restaurant.name}\n`;
                output += `   ID:   ${restaurant._id}\n`;
            } else {
                output += `\n❌ Could not find restaurant with ID: ${targetId}\n`;
            }
        } catch (e) {
            output += `\n❌ Invalid ID format: ${targetId}\n`;
        }

        // List all chef restaurants
        const user = await User.findOne({ email: 'restaurant@quickbite.com' });
        if (user) {
            const allRestaurants = await Restaurant.find({ owner: user._id });
            output += `\n📋 All restaurants owned by Chef Mario (${allRestaurants.length}):\n`;
            allRestaurants.forEach(r => {
                output += `   - ${r.name} (${r._id})\n`;
            });
        }

        fs.writeFileSync('restaurant_list.txt', output);
        console.log('Done writing to restaurant_list.txt');
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

identifyRestaurant();
