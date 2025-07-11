const express = require('express');
const Reservation = require('../models/Reservation');
const Table = require('../models/Table');
const { protect, authorize } = require('../middleware/auth');
const { validateReservation, validateObjectId, validatePagination } = require('../middleware/validation');

const router = express.Router();

// @desc    Get all reservations
// @route   GET /api/reservations
// @access  Private (Admin, Manager, Cashier)
router.get('/', protect, authorize('admin', 'manager', 'cashier'), validatePagination, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Build query
    let query = {};
    
    if (req.query.status) {
      query.status = req.query.status;
    }
    if (req.query.date) {
      const startDate = new Date(req.query.date);
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      query.date = { $gte: startDate, $lt: endDate };
    }
    if (req.query.table) {
      query.table = req.query.table;
    }

    const reservations = await Reservation.find(query)
      .populate('table', 'tableNumber capacity location')
      .populate('createdBy', 'name email')
      .populate('order', 'orderNumber total status')
      .sort({ date: 1, time: 1 })
      .skip(skip)
      .limit(limit);

    const total = await Reservation.countDocuments(query);

    res.json({
      success: true,
      data: {
        reservations,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('Get reservations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching reservations'
    });
  }
});

// @desc    Get single reservation
// @route   GET /api/reservations/:id
// @access  Private (Admin, Manager, Cashier)
router.get('/:id', protect, authorize('admin', 'manager', 'cashier'), validateObjectId, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id)
      .populate('table', 'tableNumber capacity location features')
      .populate('createdBy', 'name email')
      .populate('order', 'orderNumber total status items');

    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    res.json({
      success: true,
      data: { reservation }
    });
  } catch (error) {
    console.error('Get reservation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching reservation'
    });
  }
});

// @desc    Create reservation
// @route   POST /api/reservations
// @access  Private (Admin, Manager, Cashier)
router.post('/', protect, authorize('admin', 'manager', 'cashier'), validateReservation, async (req, res) => {
  try {
    const { table, date, time, duration, partySize } = req.body;

    // Check if table exists and has sufficient capacity
    const tableDoc = await Table.findById(table);
    if (!tableDoc) {
      return res.status(400).json({
        success: false,
        message: 'Table not found'
      });
    }

    if (tableDoc.capacity < partySize) {
      return res.status(400).json({
        success: false,
        message: `Table capacity (${tableDoc.capacity}) is insufficient for party size (${partySize})`
      });
    }

    // Check for conflicts
    const conflicts = await Reservation.findConflicts(table, date, time, duration);
    if (conflicts.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Table is not available at the requested time'
      });
    }

    const reservationData = {
      ...req.body,
      createdBy: req.user.id
    };

    const reservation = await Reservation.create(reservationData);
    
    const populatedReservation = await Reservation.findById(reservation._id)
      .populate('table', 'tableNumber capacity location')
      .populate('createdBy', 'name email');

    // Update table status if reservation is for today
    const today = new Date().toDateString();
    const reservationDate = new Date(date).toDateString();
    
    if (reservationDate === today) {
      await Table.findByIdAndUpdate(table, {
        status: 'reserved',
        currentReservation: reservation._id
      });
    }

    // Emit socket event for real-time updates
    if (req.io) {
      req.io.emit('reservation:created', {
        reservation: populatedReservation,
        createdBy: req.user.name,
        timestamp: new Date().toISOString()
      });
    }

    res.status(201).json({
      success: true,
      message: 'Reservation created successfully',
      data: { reservation: populatedReservation }
    });
  } catch (error) {
    console.error('Create reservation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while creating reservation'
    });
  }
});

// @desc    Update reservation
// @route   PUT /api/reservations/:id
// @access  Private (Admin, Manager, Cashier)
router.put('/:id', protect, authorize('admin', 'manager', 'cashier'), validateObjectId, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    // Only allow updates if reservation is not completed or cancelled
    if (['completed', 'cancelled'].includes(reservation.status)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update completed or cancelled reservation'
      });
    }

    // If changing table, date, or time, check for conflicts
    if (req.body.table || req.body.date || req.body.time || req.body.duration) {
      const table = req.body.table || reservation.table;
      const date = req.body.date || reservation.date;
      const time = req.body.time || reservation.time;
      const duration = req.body.duration || reservation.duration;

      const conflicts = await Reservation.findConflicts(table, date, time, duration, req.params.id);
      if (conflicts.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Table is not available at the requested time'
        });
      }
    }

    const updatedReservation = await Reservation.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    ).populate('table', 'tableNumber capacity location')
     .populate('createdBy', 'name email');

    // Emit socket event for real-time updates
    if (req.io) {
      req.io.emit('reservation:updated', {
        reservation: updatedReservation,
        updatedBy: req.user.name,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Reservation updated successfully',
      data: { reservation: updatedReservation }
    });
  } catch (error) {
    console.error('Update reservation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating reservation'
    });
  }
});

// @desc    Update reservation status
// @route   PUT /api/reservations/:id/status
// @access  Private (Admin, Manager, Cashier)
router.put('/:id/status', protect, authorize('admin', 'manager', 'cashier'), validateObjectId, async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required'
      });
    }

    const validStatuses = ['confirmed', 'seated', 'completed', 'cancelled', 'no-show'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    // Update reservation status
    if (status === 'seated') {
      await reservation.seat();
      // Update table status
      await Table.findByIdAndUpdate(reservation.table, {
        status: 'occupied',
        occupiedAt: new Date(),
        occupiedBy: {
          customerName: reservation.customerName,
          partySize: reservation.partySize,
          contactInfo: reservation.customerPhone
        }
      });
    } else if (status === 'completed') {
      await reservation.complete();
      // Free the table
      await Table.findByIdAndUpdate(reservation.table, {
        status: 'available',
        occupiedAt: null,
        occupiedBy: {},
        currentReservation: null
      });
    } else if (status === 'cancelled' || status === 'no-show') {
      await reservation.cancel();
      // Free the table if it was reserved
      await Table.findByIdAndUpdate(reservation.table, {
        status: 'available',
        currentReservation: null
      });
    } else {
      reservation.status = status;
      await reservation.save();
    }

    const updatedReservation = await Reservation.findById(req.params.id)
      .populate('table', 'tableNumber capacity location')
      .populate('createdBy', 'name email');

    res.json({
      success: true,
      message: `Reservation status updated to ${status}`,
      data: { reservation: updatedReservation }
    });
  } catch (error) {
    console.error('Update reservation status error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while updating reservation status'
    });
  }
});

// @desc    Delete reservation
// @route   DELETE /api/reservations/:id
// @access  Private (Admin, Manager)
router.delete('/:id', protect, authorize('admin', 'manager'), validateObjectId, async (req, res) => {
  try {
    const reservation = await Reservation.findById(req.params.id);
    if (!reservation) {
      return res.status(404).json({
        success: false,
        message: 'Reservation not found'
      });
    }

    // Free the table if it was reserved
    if (reservation.status === 'confirmed') {
      await Table.findByIdAndUpdate(reservation.table, {
        status: 'available',
        currentReservation: null
      });
    }

    await Reservation.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Reservation deleted successfully'
    });
  } catch (error) {
    console.error('Delete reservation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting reservation'
    });
  }
});

// @desc    Get available tables for date/time
// @route   GET /api/reservations/available-tables
// @access  Private (Admin, Manager, Cashier)
router.get('/available-tables', protect, authorize('admin', 'manager', 'cashier'), async (req, res) => {
  try {
    const { date, time, duration = 120, partySize } = req.query;

    if (!date || !time) {
      return res.status(400).json({
        success: false,
        message: 'Date and time are required'
      });
    }

    // Get all tables with sufficient capacity
    let query = {};
    if (partySize) {
      query.capacity = { $gte: parseInt(partySize) };
    }

    const allTables = await Table.find(query).sort({ tableNumber: 1 });

    // Check for conflicts for each table
    const availableTables = [];
    for (const table of allTables) {
      const conflicts = await Reservation.findConflicts(table._id, date, time, parseInt(duration));
      if (conflicts.length === 0) {
        availableTables.push(table);
      }
    }

    res.json({
      success: true,
      data: { availableTables }
    });
  } catch (error) {
    console.error('Get available tables error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching available tables'
    });
  }
});

module.exports = router;