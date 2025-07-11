const express = require('express');
const MenuItem = require('../models/MenuItem');
const { protect, authorize } = require('../middleware/auth');
const { validateMenuItem, validateObjectId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// @desc    Get all menu items
// @route   GET /api/menu
// @access  Public
router.get('/', validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Build query
    let query = {};
    
    if (req.query.category) {
      query.category = req.query.category;
    }
    if (req.query.available !== undefined) {
      query.available = req.query.available === 'true';
    }
    if (req.query.featured !== undefined) {
      query.featured = req.query.featured === 'true';
    }
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    const menuItems = await MenuItem.find(query)
      .populate('createdBy', 'name')
      .sort({ category: 1, name: 1 })
      .skip(skip)
      .limit(limit);

    const total = await MenuItem.countDocuments(query);

    res.json({
      success: true,
      data: {
        menuItems,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get menu items error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching menu items'
    });
  }
});

// @desc    Get single menu item
// @route   GET /api/menu/:id
// @access  Public
router.get('/:id', validateObjectId, async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    res.json({
      success: true,
      data: { menuItem }
    });
  } catch (error) {
    console.error('Get menu item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching menu item'
    });
  }
});

// @desc    Create menu item
// @route   POST /api/menu
// @access  Private (Admin, Manager)
router.post('/', protect, authorize('admin', 'manager'), validateMenuItem, async (req, res) => {
  try {
    const menuItemData = {
      ...req.body,
      createdBy: req.user.id
    };

    const menuItem = await MenuItem.create(menuItemData);
    
    const populatedMenuItem = await MenuItem.findById(menuItem._id)
      .populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Menu item created successfully',
      data: { menuItem: populatedMenuItem }
    });
  } catch (error) {
    console.error('Create menu item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating menu item'
    });
  }
});

// @desc    Update menu item
// @route   PUT /api/menu/:id
// @access  Private (Admin, Manager)
router.put('/:id', protect, authorize('admin', 'manager'), validateObjectId, async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    const updatedMenuItem = await MenuItem.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('createdBy', 'name email');

    res.json({
      success: true,
      message: 'Menu item updated successfully',
      data: { menuItem: updatedMenuItem }
    });
  } catch (error) {
    console.error('Update menu item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating menu item'
    });
  }
});

// @desc    Delete menu item
// @route   DELETE /api/menu/:id
// @access  Private (Admin, Manager)
router.delete('/:id', protect, authorize('admin', 'manager'), validateObjectId, async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    await MenuItem.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Menu item deleted successfully'
    });
  } catch (error) {
    console.error('Delete menu item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting menu item'
    });
  }
});

// @desc    Toggle menu item availability
// @route   PUT /api/menu/:id/availability
// @access  Private (Admin, Manager, Kitchen)
router.put('/:id/availability', protect, authorize('admin', 'manager', 'kitchen'), validateObjectId, async (req, res) => {
  try {
    const menuItem = await MenuItem.findById(req.params.id);
    if (!menuItem) {
      return res.status(404).json({
        success: false,
        message: 'Menu item not found'
      });
    }

    menuItem.available = !menuItem.available;
    await menuItem.save();

    res.json({
      success: true,
      message: `Menu item ${menuItem.available ? 'enabled' : 'disabled'}`,
      data: { menuItem }
    });
  } catch (error) {
    console.error('Toggle availability error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating availability'
    });
  }
});

// @desc    Get menu categories
// @route   GET /api/menu/categories/list
// @access  Public
router.get('/categories/list', async (req, res) => {
  try {
    const categories = await MenuItem.distinct('category');
    
    res.json({
      success: true,
      data: { categories }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching categories'
    });
  }
});

module.exports = router;