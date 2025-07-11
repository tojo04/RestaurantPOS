const express = require('express');
const Table = require('../models/Table');
const { protect, authorize } = require('../middleware/auth');
const { validateTable, validateObjectId } = require('../middleware/validation');

const router = express.Router();

// @desc    Get all tables
// @route   GET /api/tables
// @access  Private (Admin, Manager, Cashier)
router.get('/', protect, authorize('admin', 'manager', 'cashier'), async (req, res) => {
  try {
    let query = {};
    
    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.location) {
      query.location = req.query.location;
    }
    if (req.query.capacity) {
      query.capacity = parseInt(req.query.capacity);
    }

    const tables = await Table.find(query)
      .populate('currentOrder', 'orderNumber status total')
      .populate('currentReservation', 'reservationNumber customerName time')
      .sort({ tableNumber: 1 });

    res.json({
      success: true,
      data: { tables }
    });
  } catch (error) {
    console.error('Get tables error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching tables'
    });
  }
});

// @desc    Get single table
// @route   GET /api/tables/:id
// @access  Private (Admin, Manager, Cashier)
router.get('/:id', protect, authorize('admin', 'manager', 'cashier'), validateObjectId, async (req, res) => {
  try {
    const table = await Table.findById(req.params.id)
      .populate('currentOrder', 'orderNumber status total items customerName')
      .populate('currentReservation', 'reservationNumber customerName time partySize')
      .populate('maintenanceHistory.reportedBy', 'name')
      .populate('maintenanceHistory.resolvedBy', 'name');

    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    res.json({
      success: true,
      data: { table }
    });
  } catch (error) {
    console.error('Get table error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching table'
    });
  }
});

// @desc    Create table
// @route   POST /api/tables
// @access  Private (Admin, Manager)
router.post('/', protect, authorize('admin', 'manager'), validateTable, async (req, res) => {
  try {
    // Check if table number already exists
    const existingTable = await Table.findOne({ tableNumber: req.body.tableNumber });
    if (existingTable) {
      return res.status(400).json({
        success: false,
        message: 'Table number already exists'
      });
    }

    const table = await Table.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Table created successfully',
      data: { table }
    });
  } catch (error) {
    console.error('Create table error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating table'
    });
  }
});

// @desc    Update table
// @route   PUT /api/tables/:id
// @access  Private (Admin, Manager)
router.put('/:id', protect, authorize('admin', 'manager'), validateObjectId, async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    // Check if new table number conflicts with existing tables
    if (req.body.tableNumber && req.body.tableNumber !== table.tableNumber) {
      const existingTable = await Table.findOne({ tableNumber: req.body.tableNumber });
      if (existingTable) {
        return res.status(400).json({
          success: false,
          message: 'Table number already exists'
        });
      }
    }

    const updatedTable = await Table.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    // Emit socket event for real-time updates
    if (req.io) {
      req.io.emit('table:updated', {
        table: updatedTable,
        updatedBy: req.user.name,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Table updated successfully',
      data: { table: updatedTable }
    });
  } catch (error) {
    console.error('Update table error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating table'
    });
  }
});

// @desc    Update table status
// @route   PUT /api/tables/:id/status
// @access  Private (Admin, Manager, Cashier)
router.put('/:id/status', protect, authorize('admin', 'manager', 'cashier'), validateObjectId, async (req, res) => {
  try {
    const { status, customerName, partySize, contactInfo } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const validStatuses = ['available', 'occupied', 'reserved', 'maintenance'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    if (status === 'occupied') {
      if (!customerName || !partySize) {
        return res.status(400).json({
          success: false,
          message: 'Customer name and party size are required for occupied status'
        });
      }
      await table.occupy(customerName, partySize, contactInfo);
    } else if (status === 'available') {
      await table.free();
    } else {
      table.status = status;
      await table.save();
    }

    const updatedTable = await Table.findById(req.params.id);

    // Emit socket event for real-time updates
    if (req.io) {
      const eventName = status === 'occupied' ? 'table:occupied' : 
                       status === 'available' ? 'table:freed' : 'table:updated';
      
      req.io.emit(eventName, {
        table: updatedTable,
        updatedBy: req.user.name,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: `Table status updated to ${status}`,
      data: { table: updatedTable }
    });
  } catch (error) {
    console.error('Update table status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating table status'
    });
  }
});

// @desc    Report maintenance issue
// @route   POST /api/tables/:id/maintenance
// @access  Private (Admin, Manager, Cashier)
router.post('/:id/maintenance', protect, authorize('admin', 'manager', 'cashier'), validateObjectId, async (req, res) => {
  try {
    const { issue } = req.body;

    if (!issue) {
      return res.status(400).json({
        success: false,
        message: 'Issue description is required'
      });
    }

    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    await table.reportMaintenance(issue, req.user.id);

    const updatedTable = await Table.findById(req.params.id)
      .populate('maintenanceHistory.reportedBy', 'name');

    res.json({
      success: true,
      message: 'Maintenance issue reported successfully',
      data: { table: updatedTable }
    });
  } catch (error) {
    console.error('Report maintenance error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while reporting maintenance issue'
    });
  }
});

// @desc    Delete table
// @route   DELETE /api/tables/:id
// @access  Private (Admin)
router.delete('/:id', protect, authorize('admin'), validateObjectId, async (req, res) => {
  try {
    const table = await Table.findById(req.params.id);
    if (!table) {
      return res.status(404).json({
        success: false,
        message: 'Table not found'
      });
    }

    // Check if table is currently in use
    if (table.status === 'occupied' || table.currentOrder) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete table that is currently in use'
      });
    }

    await Table.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Table deleted successfully'
    });
  } catch (error) {
    console.error('Delete table error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting table'
    });
  }
});

module.exports = router;