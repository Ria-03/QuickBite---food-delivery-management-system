const mongoose = require('mongoose');

const menuItemSchema = new mongoose.Schema({
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    price: {
        type: Number,
        required: true
    },
    image: {
        type: String,
        default: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=800&q=80'
    },
    category: {
        type: String,
        default: 'Main'
    },
    isAvailable: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

const MenuItem = mongoose.model('MenuItem', menuItemSchema);

module.exports = MenuItem;
