const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Restaurant = require('../models/Restaurant');
const Supplier = require('../models/Supplier');
const Ingredient = require('../models/Ingredient');
const connectDB = require('../config/db');

// Load env vars
dotenv.config();

// Connect to database
connectDB();

const seedInventory = async () => {
    try {
        console.log('🌱 Starting inventory seed...');

        // 1. Find a restaurant to seed data for
        const restaurant = await Restaurant.findOne();

        if (!restaurant) {
            console.error('❌ No restaurant found. Please create a restaurant first.');
            process.exit(1);
        }

        console.log(`📍 Seeding data for restaurant: ${restaurant.name} (${restaurant._id})`);

        // 2. Clear existing inventory data for this restaurant
        await Supplier.deleteMany({ restaurant: restaurant._id });
        await Ingredient.deleteMany({ restaurant: restaurant._id });
        console.log('🧹 Cleared existing inventory data.');

        // 3. Create Suppliers
        const suppliers = [
            {
                name: 'Fresh Farms Produce',
                phone: '9876543210',
                email: 'orders@freshfarms.com',
                address: { street: '45 Green Way', city: 'Mumbai', state: 'MH', zipCode: '400001' },
                paymentTerms: 'credit_15',
                creditLimit: 50000,
                deliverySchedule: 'Daily, 6 AM'
            },
            {
                name: 'Metro Dairy & Poultry',
                phone: '9876543211',
                email: 'sales@metrodairy.com',
                address: { street: '12 Industrial Estate', city: 'Mumbai', state: 'MH', zipCode: '400002' },
                paymentTerms: 'credit_30',
                creditLimit: 100000,
                deliverySchedule: 'Mon, Wed, Fri'
            },
            {
                name: 'Global Spices Co.',
                phone: '9876543212',
                email: 'info@globalspices.com',
                address: { street: '8 Spice Market', city: 'Mumbai', state: 'MH', zipCode: '400003' },
                paymentTerms: 'cash',
                deliverySchedule: 'On Demand'
            },
            {
                name: 'Ocean Catch Seafood',
                phone: '9876543213',
                email: 'fresh@oceancatch.com',
                address: { street: 'Dock 4', city: 'Mumbai', state: 'MH', zipCode: '400004' },
                paymentTerms: 'credit_7',
                deliverySchedule: 'Daily, 5 AM'
            }
        ];

        const createdSuppliers = await Supplier.insertMany(
            suppliers.map(s => ({ ...s, restaurant: restaurant._id }))
        );
        console.log(`✅ Created ${createdSuppliers.length} suppliers.`);

        // Helper to get supplier ID by name
        const getSupplierId = (name) => {
            const supplier = createdSuppliers.find(s => s.name === name);
            return supplier ? supplier._id : null;
        };

        // 4. Create Ingredients
        const ingredients = [
            // Vegetables (Fresh Farms)
            { name: 'Tomatoes', category: 'Vegetables', unit: 'kg', currentStock: 15, minStock: 10, maxStock: 50, costPerUnit: 40, supplier: 'Fresh Farms Produce' },
            { name: 'Onions', category: 'Vegetables', unit: 'kg', currentStock: 45, minStock: 20, maxStock: 100, costPerUnit: 30, supplier: 'Fresh Farms Produce' },
            { name: 'Potatoes', category: 'Vegetables', unit: 'kg', currentStock: 80, minStock: 30, maxStock: 150, costPerUnit: 25, supplier: 'Fresh Farms Produce' },
            { name: 'Bell Peppers', category: 'Vegetables', unit: 'kg', currentStock: 5, minStock: 8, maxStock: 30, costPerUnit: 120, supplier: 'Fresh Farms Produce' }, // Low Stock
            { name: 'Lettuce', category: 'Vegetables', unit: 'pcs', currentStock: 0, minStock: 10, maxStock: 40, costPerUnit: 45, supplier: 'Fresh Farms Produce' }, // Out of Stock

            // Dairy & Meat (Metro Dairy)
            { name: 'Milk', category: 'Dairy', unit: 'l', currentStock: 25, minStock: 15, maxStock: 60, costPerUnit: 65, supplier: 'Metro Dairy & Poultry' },
            { name: 'Cheese (Mozzarella)', category: 'Dairy', unit: 'kg', currentStock: 12, minStock: 5, maxStock: 25, costPerUnit: 450, supplier: 'Metro Dairy & Poultry' },
            { name: 'Butter', category: 'Dairy', unit: 'kg', currentStock: 8, minStock: 5, maxStock: 20, costPerUnit: 520, supplier: 'Metro Dairy & Poultry' },
            { name: 'Chicken Breast', category: 'Meat', unit: 'kg', currentStock: 18, minStock: 15, maxStock: 50, costPerUnit: 280, supplier: 'Metro Dairy & Poultry' },
            { name: 'Eggs', category: 'Dairy', unit: 'dozen', currentStock: 30, minStock: 10, maxStock: 100, costPerUnit: 80, supplier: 'Metro Dairy & Poultry' },

            // Spices (Global Spices)
            { name: 'Black Pepper', category: 'Spices', unit: 'kg', currentStock: 2, minStock: 1, maxStock: 5, costPerUnit: 800, supplier: 'Global Spices Co.' },
            { name: 'Salt', category: 'Spices', unit: 'kg', currentStock: 15, minStock: 5, maxStock: 50, costPerUnit: 20, supplier: 'Global Spices Co.' },
            { name: 'Olive Oil', category: 'Oils', unit: 'l', currentStock: 10, minStock: 5, maxStock: 30, costPerUnit: 950, supplier: 'Global Spices Co.' },
            { name: 'Paprika', category: 'Spices', unit: 'kg', currentStock: 0.5, minStock: 1, maxStock: 3, costPerUnit: 1200, supplier: 'Global Spices Co.' }, // Low Stock

            // Seafood (Ocean Catch)
            { name: 'Salmon Fillet', category: 'Seafood', unit: 'kg', currentStock: 5, minStock: 8, maxStock: 20, costPerUnit: 1500, supplier: 'Ocean Catch Seafood' }, // Low Stock
            { name: 'Prawns', category: 'Seafood', unit: 'kg', currentStock: 12, minStock: 5, maxStock: 25, costPerUnit: 600, supplier: 'Ocean Catch Seafood' },

            // Other
            { name: 'Basmati Rice', category: 'Grains', unit: 'kg', currentStock: 100, minStock: 50, maxStock: 200, costPerUnit: 90, supplier: 'Fresh Farms Produce' },
            { name: 'Flour', category: 'Grains', unit: 'kg', currentStock: 50, minStock: 20, maxStock: 100, costPerUnit: 40, supplier: 'Fresh Farms Produce' },
            { name: 'Pasta (Penne)', category: 'Grains', unit: 'kg', currentStock: 40, minStock: 10, maxStock: 80, costPerUnit: 150, supplier: 'Fresh Farms Produce' },
            { name: 'Cola', category: 'Beverages', unit: 'pack', currentStock: 20, minStock: 10, maxStock: 50, costPerUnit: 400, supplier: 'Metro Dairy & Poultry' }
        ];

        await Ingredient.insertMany(
            ingredients.map(ing => ({
                ...ing,
                restaurant: restaurant._id,
                supplier: getSupplierId(ing.supplier)
            }))
        );

        console.log(`✅ Created ${ingredients.length} ingredients.`);

        // 5. Create Recipes
        const Recipe = require('../models/Recipe');
        const MenuItem = require('../models/MenuItem');

        await Recipe.deleteMany({ restaurant: restaurant._id });
        console.log('🧹 Cleared existing recipes.');

        // Fetch created ingredients to get their IDs
        const dbIngredients = await Ingredient.find({ restaurant: restaurant._id });
        const getIngId = (name) => {
            const ing = dbIngredients.find(i => i.name === name);
            if (!ing) console.warn(`⚠️ Ingredient not found: ${name}`);
            return ing ? ing._id : null;
        };

        // Fetch menu items
        const menuItems = await MenuItem.find({ restaurant: restaurant._id });

        if (menuItems.length === 0) {
            console.log('⚠️ No menu items found. Skipping recipe creation.');
        } else {
            let recipesCreated = 0;

            for (const item of menuItems) {
                let recipeIngredients = [];

                // Simple logic to match menu items to ingredients based on name keywords
                const name = item.name.toLowerCase();

                if (name.includes('pizza')) {
                    recipeIngredients.push({ ingredient: getIngId('Flour'), quantity: 0.2, unit: 'kg' }); // Dough
                    recipeIngredients.push({ ingredient: getIngId('Cheese (Mozzarella)'), quantity: 0.15, unit: 'kg' });
                    recipeIngredients.push({ ingredient: getIngId('Tomatoes'), quantity: 0.1, unit: 'kg' }); // Sauce

                    if (name.includes('pepperoni') || name.includes('meat')) {
                        recipeIngredients.push({ ingredient: getIngId('Chicken Breast'), quantity: 0.1, unit: 'kg' }); // Using chicken as placeholder meat
                    }
                    if (name.includes('veggie') || name.includes('farm')) {
                        recipeIngredients.push({ ingredient: getIngId('Bell Peppers'), quantity: 0.05, unit: 'kg' });
                        recipeIngredients.push({ ingredient: getIngId('Onions'), quantity: 0.05, unit: 'kg' });
                    }
                }
                else if (name.includes('burger')) {
                    recipeIngredients.push({ ingredient: getIngId('Chicken Breast'), quantity: 0.15, unit: 'kg' }); // Patty
                    recipeIngredients.push({ ingredient: getIngId('Lettuce'), quantity: 1, unit: 'pcs' });
                    recipeIngredients.push({ ingredient: getIngId('Tomatoes'), quantity: 0.05, unit: 'kg' }); // Slice
                    recipeIngredients.push({ ingredient: getIngId('Cheese (Mozzarella)'), quantity: 0.05, unit: 'kg' }); // Slice
                }
                else if (name.includes('pasta')) {
                    recipeIngredients.push({ ingredient: getIngId('Pasta (Penne)'), quantity: 0.15, unit: 'kg' });
                    recipeIngredients.push({ ingredient: getIngId('Tomatoes'), quantity: 0.1, unit: 'kg' }); // Sauce
                    recipeIngredients.push({ ingredient: getIngId('Olive Oil'), quantity: 0.02, unit: 'l' });
                    recipeIngredients.push({ ingredient: getIngId('Black Pepper'), quantity: 0.005, unit: 'kg' });
                }
                else if (name.includes('rice') || name.includes('biryani') || name.includes('bowl')) {
                    recipeIngredients.push({ ingredient: getIngId('Basmati Rice'), quantity: 0.2, unit: 'kg' });
                    recipeIngredients.push({ ingredient: getIngId('Olive Oil'), quantity: 0.03, unit: 'l' });
                    recipeIngredients.push({ ingredient: getIngId('Salt'), quantity: 0.01, unit: 'kg' });
                }

                // Clean up any nulls if ingredient wasn't found
                recipeIngredients = recipeIngredients.filter(ri => ri.ingredient);

                if (recipeIngredients.length > 0) {
                    await Recipe.create({
                        restaurant: restaurant._id,
                        menuItem: item._id,
                        menuItemName: item.name,
                        ingredients: recipeIngredients,
                        preparationTime: Math.floor(Math.random() * 20) + 10, // 10-30 mins
                        servingSize: 1,
                        instructions: 'Standard preparation procedure.'
                    });
                    recipesCreated++;
                }
            }
            console.log(`✅ Created ${recipesCreated} recipes.`);
        }

        console.log('🎉 Seed completed successfully!');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error seeding inventory:', error);
        process.exit(1);
    }
};

seedInventory();
