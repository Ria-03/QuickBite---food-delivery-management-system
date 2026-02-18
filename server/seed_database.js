const mongoose = require('mongoose');
require('dotenv').config();
const Restaurant = require('./models/Restaurant');
const MenuItem = require('./models/MenuItem');
const User = require('./models/User');

// Restaurant data templates
const restaurantTemplates = [
    { name: 'Pizza Paradise', cuisine: ['Italian', 'Pizza', 'Pasta'], type: 'italian', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80' },
    { name: 'Burger Kingdom', cuisine: ['American', 'Burgers', 'Fast Food'], type: 'burger', image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=800&q=80' },
    { name: 'Sushi Master', cuisine: ['Japanese', 'Sushi', 'Asian'], type: 'sushi', image: 'https://images.unsplash.com/photo-1579584425555-c3ce17fd4351?w=800&q=80' },
    { name: 'Curry House', cuisine: ['Indian', 'Curry', 'Spicy'], type: 'indian', image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=800&q=80' },
    { name: 'Taco Fiesta', cuisine: ['Mexican', 'Tacos', 'Burritos'], type: 'mexican', image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80' },
    { name: 'Noodle Bar', cuisine: ['Chinese', 'Noodles', 'Asian'], type: 'chinese', image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?w=800&q=80' },
    { name: 'Grill & Chill', cuisine: ['BBQ', 'Grilled', 'American'], type: 'bbq', image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=800&q=80' },
    { name: 'Veggie Delight', cuisine: ['Vegetarian', 'Healthy', 'Organic'], type: 'veg', image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800&q=80' },
    { name: 'Seafood Shack', cuisine: ['Seafood', 'Fish', 'Coastal'], type: 'seafood', image: 'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80' },
    { name: 'Dessert Dreams', cuisine: ['Desserts', 'Sweets', 'Bakery'], type: 'dessert', image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=800&q=80' },
    { name: 'Breakfast Club', cuisine: ['Breakfast', 'Brunch', 'Coffee'], type: 'breakfast', image: 'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=800&q=80' },
    { name: 'Thai Spice', cuisine: ['Thai', 'Asian', 'Spicy'], type: 'thai', image: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800&q=80' },
    { name: 'Mediterranean Grill', cuisine: ['Mediterranean', 'Greek', 'Healthy'], type: 'mediterranean', image: 'https://images.unsplash.com/photo-1544148103-0773bf10d330?w=800&q=80' },
    { name: 'Korean BBQ', cuisine: ['Korean', 'BBQ', 'Asian'], type: 'korean', image: 'https://images.unsplash.com/photo-1590301157890-4810ed352733?w=800&q=80' },
    { name: 'French Bistro', cuisine: ['French', 'Fine Dining', 'European'], type: 'french', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80' }
];

// Menu item templates by category
const menuTemplates = {
    italian: [
        { name: 'Margherita Pizza', category: 'Pizza', basePrice: 299, image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&q=80' },
        { name: 'Pepperoni Pizza', category: 'Pizza', basePrice: 399, image: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&q=80' },
        { name: 'Veggie Supreme Pizza', category: 'Pizza', basePrice: 349, image: 'https://images.unsplash.com/photo-1511689660979-10d2b1aada49?w=400&q=80' },
        { name: 'BBQ Chicken Pizza', category: 'Pizza', basePrice: 449, image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&q=80' },
        { name: 'Spaghetti Carbonara', category: 'Pasta', basePrice: 329, image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400&q=80' },
        { name: 'Penne Arrabbiata', category: 'Pasta', basePrice: 299, image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&q=80' },
        { name: 'Fettuccine Alfredo', category: 'Pasta', basePrice: 349, image: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=400&q=80' },
        { name: 'Lasagna', category: 'Main', basePrice: 399, image: 'https://images.unsplash.com/photo-1574894709920-11b28e7367e3?w=400&q=80' },
        { name: 'Garlic Bread', category: 'Appetizer', basePrice: 129, image: 'https://images.unsplash.com/photo-1573140401552-388e3c0b1f6a?w=400&q=80' },
        { name: 'Bruschetta', category: 'Appetizer', basePrice: 179, image: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400&q=80' },
        { name: 'Caesar Salad', category: 'Salad', basePrice: 199, image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&q=80' },
        { name: 'Caprese Salad', category: 'Salad', basePrice: 229, image: 'https://images.unsplash.com/photo-1608897013039-887f21d8c804?w=400&q=80' },
        { name: 'Tiramisu', category: 'Dessert', basePrice: 249, image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&q=80' },
        { name: 'Panna Cotta', category: 'Dessert', basePrice: 199, image: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?w=400&q=80' },
        { name: 'Gelato', category: 'Dessert', basePrice: 149, image: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&q=80' },
        { name: 'Minestrone Soup', category: 'Soup', basePrice: 179, image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?w=400&q=80' },
        { name: 'Risotto', category: 'Main', basePrice: 379, image: 'https://images.unsplash.com/photo-1476124369491-b79d9f72d4d8?w=400&q=80' },
        { name: 'Calzone', category: 'Pizza', basePrice: 369, image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&q=80' },
        { name: 'Ravioli', category: 'Pasta', basePrice: 359, image: 'https://images.unsplash.com/photo-1587740908075-9e245070dfaa?w=400&q=80' },
        { name: 'Focaccia', category: 'Appetizer', basePrice: 149, image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&q=80' }
    ],
    burger: [
        { name: 'Classic Burger', category: 'Burger', basePrice: 249, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&q=80' },
        { name: 'Cheese Burger', category: 'Burger', basePrice: 279, image: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?w=400&q=80' },
        { name: 'Bacon Burger', category: 'Burger', basePrice: 329, image: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&q=80' },
        { name: 'Veggie Burger', category: 'Burger', basePrice: 229, image: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400&q=80' },
        { name: 'Chicken Burger', category: 'Burger', basePrice: 299, image: 'https://images.unsplash.com/photo-1606755962773-d324e0a13086?w=400&q=80' },
        { name: 'Double Decker', category: 'Burger', basePrice: 399, image: 'https://images.unsplash.com/photo-1594212699903-ec8a3eca50f5?w=400&q=80' },
        { name: 'French Fries', category: 'Sides', basePrice: 99, image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=80' },
        { name: 'Onion Rings', category: 'Sides', basePrice: 129, image: 'https://images.unsplash.com/photo-1639024471283-03518883512d?w=400&q=80' },
        { name: 'Chicken Wings', category: 'Appetizer', basePrice: 249, image: 'https://images.unsplash.com/photo-1608039829572-78524f79c4c7?w=400&q=80' },
        { name: 'Chicken Nuggets', category: 'Appetizer', basePrice: 199, image: 'https://images.unsplash.com/photo-1562967914-608f82629710?w=400&q=80' },
        { name: 'Coleslaw', category: 'Salad', basePrice: 99, image: 'https://images.unsplash.com/photo-1625938145312-c260f410b584?w=400&q=80' },
        { name: 'Garden Salad', category: 'Salad', basePrice: 149, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&q=80' },
        { name: 'Milkshake Vanilla', category: 'Beverage', basePrice: 149, image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&q=80' },
        { name: 'Milkshake Chocolate', category: 'Beverage', basePrice: 149, image: 'https://images.unsplash.com/photo-1579954115545-a95591f28bfc?w=400&q=80' },
        { name: 'Milkshake Strawberry', category: 'Beverage', basePrice: 149, image: 'https://images.unsplash.com/photo-1577805947697-89e18249d767?w=400&q=80' },
        { name: 'Loaded Fries', category: 'Sides', basePrice: 179, image: 'https://images.unsplash.com/photo-1630431341973-02e1c36d5b1e?w=400&q=80' },
        { name: 'Fish Burger', category: 'Burger', basePrice: 279, image: 'https://images.unsplash.com/photo-1619740455993-557c2f48d58e?w=400&q=80' },
        { name: 'Mushroom Burger', category: 'Burger', basePrice: 299, image: 'https://images.unsplash.com/photo-1585238341710-4a85e4e76d0e?w=400&q=80' },
        { name: 'Spicy Chicken Burger', category: 'Burger', basePrice: 319, image: 'https://images.unsplash.com/photo-1603064752734-4c48eff53d05?w=400&q=80' },
        { name: 'BBQ Burger', category: 'Burger', basePrice: 349, image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=400&q=80' }
    ],
    sushi: [
        { name: 'California Roll', category: 'Sushi', basePrice: 349 },
        { name: 'Spicy Tuna Roll', category: 'Sushi', basePrice: 399 },
        { name: 'Dragon Roll', category: 'Sushi', basePrice: 449 },
        { name: 'Rainbow Roll', category: 'Sushi', basePrice: 499 },
        { name: 'Salmon Nigiri', category: 'Sushi', basePrice: 299 },
        { name: 'Tuna Nigiri', category: 'Sushi', basePrice: 299 },
        { name: 'Eel Nigiri', category: 'Sushi', basePrice: 329 },
        { name: 'Shrimp Tempura', category: 'Appetizer', basePrice: 279 },
        { name: 'Edamame', category: 'Appetizer', basePrice: 149 },
        { name: 'Miso Soup', category: 'Soup', basePrice: 129 },
        { name: 'Seaweed Salad', category: 'Salad', basePrice: 179 },
        { name: 'Gyoza', category: 'Appetizer', basePrice: 199 },
        { name: 'Teriyaki Chicken', category: 'Main', basePrice: 379 },
        { name: 'Teriyaki Salmon', category: 'Main', basePrice: 449 },
        { name: 'Ramen Bowl', category: 'Main', basePrice: 329 },
        { name: 'Udon Noodles', category: 'Main', basePrice: 299 },
        { name: 'Green Tea Ice Cream', category: 'Dessert', basePrice: 149 },
        { name: 'Mochi', category: 'Dessert', basePrice: 179 },
        { name: 'Philadelphia Roll', category: 'Sushi', basePrice: 379 },
        { name: 'Vegetable Roll', category: 'Sushi', basePrice: 279 }
    ],
    indian: [
        { name: 'Butter Chicken', category: 'Main', basePrice: 349 },
        { name: 'Chicken Tikka Masala', category: 'Main', basePrice: 329 },
        { name: 'Palak Paneer', category: 'Main', basePrice: 279 },
        { name: 'Dal Makhani', category: 'Main', basePrice: 249 },
        { name: 'Biryani Chicken', category: 'Rice', basePrice: 299 },
        { name: 'Biryani Veg', category: 'Rice', basePrice: 249 },
        { name: 'Naan', category: 'Bread', basePrice: 49 },
        { name: 'Garlic Naan', category: 'Bread', basePrice: 69 },
        { name: 'Roti', category: 'Bread', basePrice: 39 },
        { name: 'Samosa', category: 'Appetizer', basePrice: 99 },
        { name: 'Pakora', category: 'Appetizer', basePrice: 129 },
        { name: 'Tandoori Chicken', category: 'Main', basePrice: 379 },
        { name: 'Paneer Tikka', category: 'Appetizer', basePrice: 249 },
        { name: 'Raita', category: 'Sides', basePrice: 79 },
        { name: 'Gulab Jamun', category: 'Dessert', basePrice: 99 },
        { name: 'Rasmalai', category: 'Dessert', basePrice: 129 },
        { name: 'Kheer', category: 'Dessert', basePrice: 99 },
        { name: 'Chole Bhature', category: 'Main', basePrice: 199 },
        { name: 'Masala Dosa', category: 'Main', basePrice: 149 },
        { name: 'Idli Sambar', category: 'Main', basePrice: 129 }
    ],
    mexican: [
        { name: 'Chicken Tacos', category: 'Tacos', basePrice: 249 },
        { name: 'Beef Tacos', category: 'Tacos', basePrice: 279 },
        { name: 'Fish Tacos', category: 'Tacos', basePrice: 299 },
        { name: 'Veggie Tacos', category: 'Tacos', basePrice: 229 },
        { name: 'Chicken Burrito', category: 'Burrito', basePrice: 299 },
        { name: 'Beef Burrito', category: 'Burrito', basePrice: 329 },
        { name: 'Bean Burrito', category: 'Burrito', basePrice: 249 },
        { name: 'Quesadilla', category: 'Main', basePrice: 279 },
        { name: 'Nachos', category: 'Appetizer', basePrice: 199 },
        { name: 'Guacamole & Chips', category: 'Appetizer', basePrice: 179 },
        { name: 'Salsa & Chips', category: 'Appetizer', basePrice: 129 },
        { name: 'Enchiladas', category: 'Main', basePrice: 329 },
        { name: 'Fajitas', category: 'Main', basePrice: 379 },
        { name: 'Taco Salad', category: 'Salad', basePrice: 249 },
        { name: 'Mexican Rice', category: 'Sides', basePrice: 99 },
        { name: 'Refried Beans', category: 'Sides', basePrice: 99 },
        { name: 'Churros', category: 'Dessert', basePrice: 149 },
        { name: 'Flan', category: 'Dessert', basePrice: 129 },
        { name: 'Tostadas', category: 'Main', basePrice: 229 },
        { name: 'Tamales', category: 'Main', basePrice: 249 }
    ]
};

// Default menu for other types
const defaultMenu = [
    { name: 'Signature Dish', category: 'Main', basePrice: 349 },
    { name: 'Chef Special', category: 'Main', basePrice: 399 },
    { name: 'House Salad', category: 'Salad', basePrice: 199 },
    { name: 'Soup of the Day', category: 'Soup', basePrice: 149 },
    { name: 'Appetizer Platter', category: 'Appetizer', basePrice: 299 },
    { name: 'Grilled Chicken', category: 'Main', basePrice: 329 },
    { name: 'Grilled Fish', category: 'Main', basePrice: 379 },
    { name: 'Vegetable Stir Fry', category: 'Main', basePrice: 249 },
    { name: 'Rice Bowl', category: 'Main', basePrice: 229 },
    { name: 'Noodle Bowl', category: 'Main', basePrice: 249 },
    { name: 'Spring Rolls', category: 'Appetizer', basePrice: 179 },
    { name: 'Dumplings', category: 'Appetizer', basePrice: 199 },
    { name: 'Fried Rice', category: 'Sides', basePrice: 149 },
    { name: 'Steamed Vegetables', category: 'Sides', basePrice: 129 },
    { name: 'Chocolate Cake', category: 'Dessert', basePrice: 199 },
    { name: 'Ice Cream', category: 'Dessert', basePrice: 129 },
    { name: 'Fresh Juice', category: 'Beverage', basePrice: 99 },
    { name: 'Smoothie', category: 'Beverage', basePrice: 149 },
    { name: 'Coffee', category: 'Beverage', basePrice: 79 },
    { name: 'Tea', category: 'Beverage', basePrice: 59 }
];

const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad'];
const streets = ['MG Road', 'Park Street', 'Brigade Road', 'Linking Road', 'Commercial Street', 'Main Street', 'Central Avenue'];

const getRandomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const getRandomPrice = (basePrice) => basePrice + Math.floor(Math.random() * 100);

mongoose.connect(process.env.DATABASE_URL || 'mongodb://localhost:27017/quickbite')
    .then(async () => {
        console.log('Connected to DB');

        // Find the restaurant owner user
        // Find the restaurant owner user
        const owner = await User.findOne({ email: 'restaurant@quickbite.com' });

        if (!owner) {
            console.log('❌ No restaurant owner found. Please create a user first.');
            process.exit(1);
        }

        console.log(`Found owner: ${owner.name} (${owner.email})`);

        // Clear existing data
        console.log('\\n🗑️  Clearing existing restaurants and menu items...');
        await Restaurant.deleteMany({});
        await MenuItem.deleteMany({});

        console.log('\\n🏪 Creating 30 restaurants...');
        const restaurants = [];

        for (let i = 0; i < 30; i++) {
            const template = restaurantTemplates[i % restaurantTemplates.length];
            const suffix = Math.floor(i / restaurantTemplates.length) + 1;
            const name = suffix > 1 ? `${template.name} ${suffix}` : template.name;

            const restaurant = await Restaurant.create({
                owner: owner._id,
                name: name,
                description: `Delicious ${template.cuisine[0]} cuisine with authentic flavors`,
                cuisine: template.cuisine,
                address: {
                    street: `${Math.floor(Math.random() * 500) + 1} ${getRandomElement(streets)}`,
                    city: getRandomElement(cities),
                    zip: `${Math.floor(Math.random() * 900000) + 100000}`
                },
                image: template.image,
                rating: (4.0 + Math.random() * 1.0).toFixed(1),
                numReviews: Math.floor(Math.random() * 200) + 50,
                isApproved: true,
                isOpen: true
            });

            restaurants.push(restaurant);
            console.log(`  ✅ Created: ${restaurant.name}`);
        }

        console.log('\\n🍽️  Adding 20 menu items to each restaurant...');
        let totalMenuItems = 0;

        for (const restaurant of restaurants) {
            // Find the template for this restaurant
            const template = restaurantTemplates.find(t => restaurant.name.includes(t.name.split(' ')[0]));
            const menuTemplate = menuTemplates[template?.type] || defaultMenu;

            for (let j = 0; j < 20; j++) {
                const itemTemplate = menuTemplate[j % menuTemplate.length];
                const variation = Math.floor(j / menuTemplate.length) + 1;
                const itemName = variation > 1 ? `${itemTemplate.name} ${variation}` : itemTemplate.name;

                await MenuItem.create({
                    restaurant: restaurant._id,
                    name: itemName,
                    description: `Delicious ${itemName.toLowerCase()} made with fresh ingredients`,
                    price: getRandomPrice(itemTemplate.basePrice),
                    category: itemTemplate.category,
                    image: itemTemplate.image || `https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400&q=80`,
                    isAvailable: true
                });

                totalMenuItems++;
            }

            console.log(`  ✅ Added 20 items to ${restaurant.name}`);
        }

        console.log('\\n📊 Summary:');
        console.log(`  🏪 Total Restaurants: ${restaurants.length}`);
        console.log(`  🍽️  Total Menu Items: ${totalMenuItems}`);
        console.log(`  ✅ Average items per restaurant: ${totalMenuItems / restaurants.length}`);
        console.log('\\n✨ Database seeded successfully!');

        process.exit(0);
    })
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
