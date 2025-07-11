const express = require('express');
const Settings = require('../models/Settings');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Get restaurant settings
// @route   GET /api/settings
// @access  Private (Admin, Manager)
router.get('/', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    
    res.json({
      success: true,
      data: { settings }
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching settings'
    });
  }
});

// @desc    Update restaurant settings
// @route   PUT /api/settings
// @access  Private (Admin)
router.put('/', protect, authorize('admin'), async (req, res) => {
  try {
    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = await Settings.create(req.body);
    } else {
      // Update existing settings
      Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'object' && req.body[key] !== null) {
          settings[key] = { ...settings[key], ...req.body[key] };
        } else {
          settings[key] = req.body[key];
        }
      });
      await settings.save();
    }

    res.json({
      success: true,
      message: 'Settings updated successfully',
      data: { settings }
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating settings'
    });
  }
});

// @desc    Get specific setting section
// @route   GET /api/settings/:section
// @access  Private (Admin, Manager)
router.get('/:section', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { section } = req.params;
    const validSections = ['restaurant', 'pos', 'notifications', 'payment', 'kitchen', 'security'];
    
    if (!validSections.includes(section)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid settings section'
      });
    }

    const settings = await Settings.getSettings();
    
    res.json({
      success: true,
      data: { [section]: settings[section] }
    });
  } catch (error) {
    console.error('Get settings section error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching settings section'
    });
  }
});

// @desc    Update specific setting section
// @route   PUT /api/settings/:section
// @access  Private (Admin)
router.put('/:section', protect, authorize('admin'), async (req, res) => {
  try {
    const { section } = req.params;
    const validSections = ['restaurant', 'pos', 'notifications', 'payment', 'kitchen', 'security'];
    
    if (!validSections.includes(section)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid settings section'
      });
    }

    let settings = await Settings.findOne();
    
    if (!settings) {
      settings = await Settings.create({ [section]: req.body });
    } else {
      settings[section] = { ...settings[section], ...req.body };
      await settings.save();
    }

    res.json({
      success: true,
      message: `${section.charAt(0).toUpperCase() + section.slice(1)} settings updated successfully`,
      data: { [section]: settings[section] }
    });
  } catch (error) {
    console.error('Update settings section error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating settings section'
    });
  }
});

// @desc    Reset settings to default
// @route   POST /api/settings/reset
// @access  Private (Admin)
router.post('/reset', protect, authorize('admin'), async (req, res) => {
  try {
    // Delete existing settings
    await Settings.deleteMany({});
    
    // Create new default settings
    const settings = await Settings.create({});

    res.json({
      success: true,
      message: 'Settings reset to default values',
      data: { settings }
    });
  } catch (error) {
    console.error('Reset settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while resetting settings'
    });
  }
});

module.exports = router;