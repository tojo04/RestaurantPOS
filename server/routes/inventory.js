const express = require('express');
const Inventory = require('../models/Inventory');
const { protect, authorize } = require('../middleware/auth');
const { validateInventory, validateObjectId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// @desc    Get all inventory items
// @route   GET /api/inventory
// @access  Private (Admin, Manager)
router.get('/', protect, authorize('admin', 'manager'), validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Build query
    let query = {};
    
    if (req.query.category) {
      query.category = req.query.category;
    }
    if (req.query.lowStock === 'true') {
      query.$expr = { $lte: ['$currentStock', '$minStock'] };
    }
    if (req.query.search) {
      query.$text = { $search: req.query.search };
    }

    const inventoryItems = await Inventory.find(query)
      .populate('stockHistory.performedBy', 'name')
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Inventory.countDocuments(query);

    res.json({
      success: true,
      data: {
        inventoryItems,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching inventory'
    });
  }
});

// @desc    Get single inventory item
// @route   GET /api/inventory/:id
// @access  Private (Admin, Manager)
router.get('/:id', protect, authorize('admin', 'manager'), validateObjectId, async (req, res) => {
  try {
    const inventoryItem = await Inventory.findById(req.params.id)
      .populate('stockHistory.performedBy', 'name email');

    if (!inventoryItem) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    res.json({
      success: true,
      data: { inventoryItem }
    });
  } catch (error) {
    console.error('Get inventory item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching inventory item'
    });
  }
});

// @desc    Create inventory item
// @route   POST /api/inventory
// @access  Private (Admin, Manager)
router.post('/', protect, authorize('admin', 'manager'), validateInventory, async (req, res) => {
  try {
    const inventoryData = {
      ...req.body,
      stockHistory: [{
        action: 'restock',
        quantity: req.body.currentStock,
        reason: 'Initial stock',
        performedBy: req.user.id
      }]
    };

    const inventoryItem = await Inventory.create(inventoryData);
    
    const populatedItem = await Inventory.findById(inventoryItem._id)
      .populate('stockHistory.performedBy', 'name');

    res.status(201).json({
      success: true,
      message: 'Inventory item created successfully',
      data: { inventoryItem: populatedItem }
    });
  } catch (error) {
    console.error('Create inventory item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating inventory item'
    });
  }
});

// @desc    Update inventory item
// @route   PUT /api/inventory/:id
// @access  Private (Admin, Manager)
router.put('/:id', protect, authorize('admin', 'manager'), validateObjectId, async (req, res) => {
  try {
    const inventoryItem = await Inventory.findById(req.params.id);
    if (!inventoryItem) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    const updatedItem = await Inventory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('stockHistory.performedBy', 'name');

    res.json({
      success: true,
      message: 'Inventory item updated successfully',
      data: { inventoryItem: updatedItem }
    });
  } catch (error) {
    console.error('Update inventory item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating inventory item'
    });
  }
});

// @desc    Update stock
// @route   PUT /api/inventory/:id/stock
// @access  Private (Admin, Manager)
router.put('/:id/stock', protect, authorize('admin', 'manager'), validateObjectId, async (req, res) => {
  try {
    const { action, quantity, reason } = req.body;

    if (!action || !quantity) {
      return res.status(400).json({
        success: false,
        message: 'Action and quantity are required'
      });
    }

    const validActions = ['restock', 'usage', 'waste', 'adjustment'];
    if (!validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid action'
      });
    }

    const inventoryItem = await Inventory.findById(req.params.id);
    if (!inventoryItem) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    await inventoryItem.updateStock(action, quantity, reason, req.user.id);

    const updatedItem = await Inventory.findById(req.params.id)
      .populate('stockHistory.performedBy', 'name');

    // Emit socket event for low stock alert
    if (updatedItem.stockStatus === 'low' && req.io) {
      req.io.to('manager').emit('inventory:low_stock_alert', {
        item: updatedItem,
        updatedBy: req.user.name,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Stock updated successfully',
      data: { inventoryItem: updatedItem }
    });
  } catch (error) {
    console.error('Update stock error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating stock'
    });
  }
});

// @desc    Delete inventory item
// @route   DELETE /api/inventory/:id
// @access  Private (Admin, Manager)
router.delete('/:id', protect, authorize('admin', 'manager'), validateObjectId, async (req, res) => {
  try {
    const inventoryItem = await Inventory.findById(req.params.id);
    if (!inventoryItem) {
      return res.status(404).json({
        success: false,
        message: 'Inventory item not found'
      });
    }

    await Inventory.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Inventory item deleted successfully'
    });
  } catch (error) {
    console.error('Delete inventory item error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting inventory item'
    });
  }
});

// @desc    Get low stock items
// @route   GET /api/inventory/alerts/low-stock
// @access  Private (Admin, Manager)
router.get('/alerts/low-stock', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const lowStockItems = await Inventory.find({
      $expr: { $lte: ['$currentStock', '$minStock'] }
    }).sort({ name: 1 });

    res.json({
      success: true,
      data: { lowStockItems }
    });
  } catch (error) {
    console.error('Get low stock items error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching low stock items'
    });
  }
});

// @desc    Get expiring items
// @route   GET /api/inventory/alerts/expiring
// @access  Private (Admin, Manager)
router.get('/alerts/expiring', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);

    const expiringItems = await Inventory.find({
      expiryDate: {
        $exists: true,
        $lte: expiryDate,
        $gte: new Date()
      }
    }).sort({ expiryDate: 1 });

    res.json({
      success: true,
      data: { expiringItems }
    });
  } catch (error) {
    console.error('Get expiring items error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching expiring items'
    });
  }
});

module.exports = router;