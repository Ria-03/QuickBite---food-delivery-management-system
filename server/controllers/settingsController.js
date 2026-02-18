const Settings = require('../models/Settings');

// @desc    Get system settings
// @route   GET /api/settings
// @access  Private/Admin
const getSettings = async (req, res) => {
    try {
        const settings = await Settings.getSettings();
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update system settings
// @route   PUT /api/settings
// @access  Private/Admin
const updateSettings = async (req, res) => {
    try {
        const settings = await Settings.getSettings();

        // Update role permissions
        if (req.body.rolePermissions) {
            settings.rolePermissions = {
                ...settings.rolePermissions,
                ...req.body.rolePermissions
            };
        }

        // Update commission settings
        if (req.body.commission) {
            settings.commission = {
                ...settings.commission,
                ...req.body.commission
            };
        }

        // Update payment configuration
        if (req.body.payment) {
            settings.payment = {
                ...settings.payment,
                ...req.body.payment
            };
        }

        // Update system preferences
        if (req.body.system) {
            settings.system = {
                ...settings.system,
                ...req.body.system
            };
        }

        await settings.save();
        res.json(settings);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

module.exports = {
    getSettings,
    updateSettings
};
