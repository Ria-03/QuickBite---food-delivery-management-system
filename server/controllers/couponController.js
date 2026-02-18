const Coupon = require('../models/Coupon');

// @desc    Create a new coupon
// @route   POST /api/coupons
// @access  Private (Admin/Restaurant)
const createCoupon = async (req, res) => {
    try {
        const { code, discountType, discountValue, minPurchase, expiryDate, usageLimit } = req.body;

        const couponExists = await Coupon.findOne({ code });
        if (couponExists) {
            return res.status(400).json({ message: 'Coupon already exists' });
        }

        const coupon = await Coupon.create({
            code,
            discountType,
            discountValue,
            minPurchase,
            expiryDate,
            usageLimit
        });

        res.status(201).json(coupon);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all active coupons
// @route   GET /api/coupons
// @access  Private (Customer)
const getCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.find({
            isActive: true,
            expiryDate: { $gt: new Date() }
        });
        res.json(coupons);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Validate coupon
// @route   POST /api/coupons/validate
// @access  Private (Customer)
const validateCoupon = async (req, res) => {
    const { code, totalAmount } = req.body;

    try {
        const coupon = await Coupon.findOne({ code, isActive: true });

        if (!coupon) {
            return res.status(404).json({ message: 'Invalid coupon code' });
        }

        if (new Date() > coupon.expiryDate) {
            return res.status(400).json({ message: 'Coupon has expired' });
        }

        if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
            return res.status(400).json({ message: 'Coupon usage limit reached' });
        }

        if (totalAmount < coupon.minPurchase) {
            return res.status(400).json({ message: `Minimum purchase of ₹${coupon.minPurchase} required` });
        }

        let discount = 0;
        if (coupon.discountType === 'percentage') {
            discount = (totalAmount * coupon.discountValue) / 100;
            if (coupon.maxDiscount > 0 && discount > coupon.maxDiscount) {
                discount = coupon.maxDiscount;
            }
        } else {
            discount = coupon.discountValue;
        }

        res.json({
            success: true,
            discount,
            couponId: coupon._id,
            code: coupon.code
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createCoupon,
    getCoupons,
    validateCoupon
};
