const express = require('express');
const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const { protect, authorize } = require('../middleware/auth');
const { validateOrder, validateObjectId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private (Admin, Manager, Cashier, Kitchen)
router.get('/', protect, validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build query based on user role and filters
    let query = {};

    // Role-based filtering
    if (req.user.role === 'cashier') {
      query.cashier = req.user.id;
    } else if (req.user.role === 'kitchen') {
      query.status = { $in: ['pending', 'confirmed', 'preparing'] };
    }

    // Additional filters
    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.orderType) {
      query.orderType = req.query.orderType;
    }
    if (req.query.tableNumber) {
      query.tableNumber = req.query.tableNumber;
    }
    if (req.query.date) {
      const startDate = new Date(req.query.date);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      query.createdAt = { $gte: startDate, $lt: endDate };
    }

    const orders = await Order.find(query)
      .populate('items.menuItem', 'name price category')
      .populate('cashier', 'name email')
      .populate('kitchen.assignedTo', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(query);

    res.json({
      success: true,
      data: {
        orders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching orders'
    });
  }
});

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
router.get('/:id', protect, validateObjectId, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.menuItem', 'name price category description')
      .populate('cashier', 'name email')
      .populate('kitchen.assignedTo', 'name')
      .populate('statusHistory.updatedBy', 'name');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check if user has permission to view this order
    if (req.user.role === 'cashier' && order.cashier.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: { order }
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching order'
    });
  }
});

// @desc    Create new order
// @route   POST /api/orders
// @access  Private (Admin, Manager, Cashier)
router.post('/', protect, authorize('admin', 'manager', 'cashier'), validateOrder, async (req, res) => {
  try {
    const { items, customerName, customerPhone, customerEmail, orderType, tableNumber, notes, deliveryAddress } = req.body;

    // Validate menu items and calculate totals
    let subtotal = 0;
    const orderItems = [];

    for (const item of items) {
      const menuItem = await MenuItem.findById(item.menuItem);
      if (!menuItem) {
        return res.status(400).json({
          success: false,
          message: `Menu item with ID ${item.menuItem} not found`
        });
      }

      if (!menuItem.available) {
        return res.status(400).json({
          success: false,
          message: `Menu item ${menuItem.name} is not available`
        });
      }

      const itemTotal = menuItem.price * item.quantity;
      subtotal += itemTotal;

      orderItems.push({
        menuItem: menuItem._id,
        quantity: item.quantity,
        price: menuItem.price,
        notes: item.notes,
        modifications: item.modifications
      });
    }

    // Calculate tax and total
    const taxRate = 0.08; // 8% tax rate (should come from settings)
    const tax = subtotal * taxRate;
    const total = subtotal + tax;

    // Create order
    const order = await Order.create({
      items: orderItems,
      customerName,
      customerPhone,
      customerEmail,
      orderType,
      tableNumber,
      subtotal,
      tax,
      total,
      notes,
      deliveryAddress,
      cashier: req.user.id,
      status: 'pending'
    });

    // Populate the created order
    const populatedOrder = await Order.findById(order._id)
      .populate('items.menuItem', 'name price category')
      .populate('cashier', 'name email');

    // Emit socket event for real-time updates
    if (req.io) {
      req.io.emit('order:created', {
        order: populatedOrder,
        createdBy: req.user.name,
        timestamp: new Date().toISOString()
      });
    }

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: { order: populatedOrder }
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating order'
    });
  }
});

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private
router.put('/:id/status', protect, validateObjectId, async (req, res) => {
  try {
    const { status, notes } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const validStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Role-based status update permissions
    const allowedTransitions = {
      cashier: ['pending', 'confirmed', 'completed', 'cancelled'],
      kitchen: ['confirmed', 'preparing', 'ready'],
      manager: ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled'],
      admin: ['pending', 'confirmed', 'preparing', 'ready', 'completed', 'cancelled']
    };

    if (!allowedTransitions[req.user.role]?.includes(status)) {
      return res.status(403).json({
        success: false,
        message: `Role ${req.user.role} cannot set status to ${status}`
      });
    }

    // Update order status with history
    await order.updateStatus(status, req.user.id, notes);

    // Assign kitchen staff if status is preparing
    if (status === 'preparing' && req.user.role === 'kitchen') {
      order.kitchen.assignedTo = req.user.id;
      await order.save();
    }

    const updatedOrder = await Order.findById(order._id)
      .populate('items.menuItem', 'name price category')
      .populate('cashier', 'name email')
      .populate('kitchen.assignedTo', 'name');

    // Emit socket event for real-time updates
    if (req.io) {
      req.io.emit('order:status_updated', {
        order: updatedOrder,
        updatedBy: req.user.name,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Order status updated successfully',
      data: { order: updatedOrder }
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating order status'
    });
  }
});

// @desc    Update order
// @route   PUT /api/orders/:id
// @access  Private (Admin, Manager, Cashier - own orders)
router.put('/:id', protect, validateObjectId, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Check permissions
    if (req.user.role === 'cashier' && order.cashier.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Only allow updates if order is still pending or confirmed
    if (!['pending', 'confirmed'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update order that is being prepared or completed'
      });
    }

    const { customerName, customerPhone, customerEmail, tableNumber, notes } = req.body;

    const updatedOrder = await Order.findByIdAndUpdate(
      req.params.id,
      { customerName, customerPhone, customerEmail, tableNumber, notes },
      { new: true, runValidators: true }
    ).populate('items.menuItem', 'name price category')
     .populate('cashier', 'name email');

    // Emit socket event for real-time updates
    if (req.io) {
      req.io.emit('order:updated', {
        order: updatedOrder,
        updatedBy: req.user.name,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Order updated successfully',
      data: { order: updatedOrder }
    });
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating order'
    });
  }
});

// @desc    Delete order
// @route   DELETE /api/orders/:id
// @access  Private (Admin, Manager)
router.delete('/:id', protect, authorize('admin', 'manager'), validateObjectId, async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }

    // Only allow deletion if order is cancelled or pending
    if (!['pending', 'cancelled'].includes(order.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete order that is being processed'
      });
    }

    await Order.findByIdAndDelete(req.params.id);

    // Emit socket event for real-time updates
    if (req.io) {
      req.io.emit('order:deleted', {
        orderId: req.params.id,
        deletedBy: req.user.name,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Order deleted successfully'
    });
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting order'
    });
  }
});

// @desc    Get kitchen orders (for kitchen display)
// @route   GET /api/orders/kitchen/display
// @access  Private (Kitchen, Manager, Admin)
router.get('/kitchen/display', protect, authorize('kitchen', 'manager', 'admin'), async (req, res) => {
  try {
    const orders = await Order.find({
      status: { $in: ['pending', 'confirmed', 'preparing'] }
    })
    .populate('items.menuItem', 'name preparationTime')
    .populate('kitchen.assignedTo', 'name')
    .sort({ createdAt: 1 }); // Oldest first

    res.json({
      success: true,
      data: { orders }
    });
  } catch (error) {
    console.error('Get kitchen orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching kitchen orders'
    });
  }
});

module.exports = router;