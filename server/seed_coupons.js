const mongoose = require('mongoose');
const Coupon = require('./models/Coupon');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const connectDB = require('./config/db');

const seedCoupons = async () => {
    try {
        await connectDB();

        await Coupon.deleteMany({}); // Clear existing coupons

        const coupons = [
            {
                code: 'WELCOME50',
                discountType: 'percentage',
                discountValue: 50,
                minPurchase: 200,
                maxDiscount: 150,
                expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
            },
            {
                code: 'SAVE100',
                discountType: 'fixed',
                discountValue: 100,
                minPurchase: 500,
                expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
            },
            {
                code: 'FESTIVE20',
                discountType: 'percentage',
                discountValue: 20,
                minPurchase: 1000,
                maxDiscount: 500,
                expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            }
        ];

        await Coupon.insertMany(coupons);
        console.log('✅ Coupons Seeded Successfully');
        process.exit();
    } catch (error) {
        console.error('❌ Error seeding coupons:', error);
        process.exit(1);
    }
};

seedCoupons();
