const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    cuisine: [{
        type: String
    }],
    address: {
        street: String,
        city: String,
        zip: String
    },
    image: {
        type: String,
        default: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80' // Placeholder
    },
    rating: {
        type: Number,
        default: 0
    },
    numReviews: {
        type: Number,
        default: 0
    },
    isApproved: {
        type: Boolean,
        default: false // Requires Admin approval
    },
    approvalStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    rejectionReason: {
        type: String,
        default: ''
    },
    isOpen: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

const Restaurant = mongoose.model('Restaurant', restaurantSchema);

module.exports = Restaurant;
