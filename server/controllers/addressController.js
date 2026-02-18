const Address = require('../models/Address');
const fs = require('fs');
const path = require('path');

const logDebug = (message, data = null) => {
    try {
        const logPath = path.join(__dirname, '../debug_address_errors.log');
        const timestamp = new Date().toISOString();
        let logMessage = `\n[${timestamp}] ${message}`;
        if (data) {
            logMessage += `\nData: ${JSON.stringify(data, null, 2)}`;
        }
        if (data && data.stack) {
            logMessage += `\nStack: ${data.stack}`;
        }
        fs.appendFileSync(logPath, logMessage);
    } catch (e) {
        console.error("Failed to write to debug log", e);
    }
};

// @desc    Get all addresses for logged-in user
// @route   GET /api/addresses
// @access  Private
const getAddresses = async (req, res) => {
    try {
        logDebug('getAddresses called', { userId: req.user._id });
        const addresses = await Address.find({ user: req.user._id })
            .sort({ isDefault: -1, createdAt: -1 }); // Default first, then newest

        res.status(200).json({
            success: true,
            count: addresses.length,
            addresses
        });
    } catch (error) {
        console.error('❌ Error fetching addresses:', error);
        logDebug('Error fetching addresses', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch addresses',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Create new address
// @route   POST /api/addresses
// @access  Private
const createAddress = async (req, res) => {
    try {
        logDebug('createAddress called', { body: req.body, userId: req.user._id });
        const { label, addressLine1, addressLine2, city, state, zipCode, country, landmark, phoneNumber, isDefault } = req.body;

        // Check if user already has 10 addresses (limit)
        const addressCount = await Address.countDocuments({ user: req.user._id });
        if (addressCount >= 10) {
            return res.status(400).json({
                success: false,
                message: 'Maximum 10 addresses allowed per user'
            });
        }

        // If this is the first address, make it default
        const isFirstAddress = addressCount === 0;

        const address = await Address.create({
            user: req.user._id,
            label,
            addressLine1,
            addressLine2,
            city,
            state,
            zipCode,
            country: country || 'India',
            landmark,
            phoneNumber,
            isDefault: isFirstAddress ? true : (isDefault || false)
        });

        res.status(201).json({
            success: true,
            message: 'Address created successfully',
            address
        });
    } catch (error) {
        console.error('❌ Error creating address:', error);
        logDebug('Error creating address', error);

        // Handle validation errors
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to create address',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Update address
// @route   PUT /api/addresses/:id
// @access  Private
const updateAddress = async (req, res) => {
    try {
        const { id } = req.params;
        const { label, addressLine1, addressLine2, city, state, zipCode, country, landmark, phoneNumber, isDefault } = req.body;

        // Find address and verify ownership
        const address = await Address.findOne({ _id: id, user: req.user._id });

        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Address not found'
            });
        }

        // Update fields
        address.label = label || address.label;
        address.addressLine1 = addressLine1 || address.addressLine1;
        address.addressLine2 = addressLine2 !== undefined ? addressLine2 : address.addressLine2;
        address.city = city || address.city;
        address.state = state || address.state;
        address.zipCode = zipCode || address.zipCode;
        address.country = country || address.country;
        address.landmark = landmark !== undefined ? landmark : address.landmark;
        address.phoneNumber = phoneNumber || address.phoneNumber;
        address.isDefault = isDefault !== undefined ? isDefault : address.isDefault;

        await address.save();

        res.status(200).json({
            success: true,
            message: 'Address updated successfully',
            address
        });
    } catch (error) {
        console.error('❌ Error updating address:', error);

        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                message: messages.join(', ')
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to update address',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Delete address
// @route   DELETE /api/addresses/:id
// @access  Private
const deleteAddress = async (req, res) => {
    try {
        const { id } = req.params;

        // Find address and verify ownership
        const address = await Address.findOne({ _id: id, user: req.user._id });

        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Address not found'
            });
        }

        // Check if this is the only address
        const addressCount = await Address.countDocuments({ user: req.user._id });
        if (addressCount === 1) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete the only address. Please add another address first.'
            });
        }

        const wasDefault = address.isDefault;

        // Delete the address
        await Address.deleteOne({ _id: id });

        // If deleted address was default, set another as default
        if (wasDefault) {
            const nextAddress = await Address.findOne({ user: req.user._id }).sort({ createdAt: -1 });
            if (nextAddress) {
                nextAddress.isDefault = true;
                await nextAddress.save();
            }
        }

        res.status(200).json({
            success: true,
            message: 'Address deleted successfully'
        });
    } catch (error) {
        console.error('❌ Error deleting address:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete address',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

// @desc    Set address as default
// @route   PUT /api/addresses/:id/set-default
// @access  Private
const setDefaultAddress = async (req, res) => {
    try {
        const { id } = req.params;

        // Find address and verify ownership
        const address = await Address.findOne({ _id: id, user: req.user._id });

        if (!address) {
            return res.status(404).json({
                success: false,
                message: 'Address not found'
            });
        }

        // Set as default (pre-save hook will unset others)
        address.isDefault = true;
        await address.save();

        res.status(200).json({
            success: true,
            message: 'Default address updated successfully',
            address
        });
    } catch (error) {
        console.error('❌ Error setting default address:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to set default address',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    getAddresses,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress
};
