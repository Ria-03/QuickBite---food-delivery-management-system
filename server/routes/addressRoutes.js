const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
    getAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress
} = require('../controllers/addressController');

// All address routes require authentication
router.get('/', protect, getAddresses);
router.post('/', protect, createAddress);
router.put('/:id', protect, updateAddress);
router.delete('/:id', protect, deleteAddress);
router.put('/:id/set-default', protect, setDefaultAddress);

module.exports = router;
