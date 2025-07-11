const mongoose = require('mongoose');

const tableSchema = new mongoose.Schema({
  tableNumber: {
    type: String,
    required: [true, 'Table number is required'],
    unique: true,
    trim: true
  },
  capacity: {
    type: Number,
    required: [true, 'Table capacity is required'],
    min: [1, 'Capacity must be at least 1'],
    max: [20, 'Capacity cannot exceed 20']
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'reserved', 'maintenance'],
    default: 'available'
  },
  location: {
    type: String,
    enum: ['indoor', 'outdoor', 'private', 'bar'],
    default: 'indoor'
  },
  shape: {
    type: String,
    enum: ['square', 'rectangular', 'round', 'bar'],
    default: 'square'
  },
  currentOrder: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order',
    default: null
  },
  currentReservation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reservation',
    default: null
  },
  occupiedAt: {
    type: Date
  },
  occupiedBy: {
    customerName: String,
    partySize: Number,
    contactInfo: String
  },
  features: [{
    type: String,
    enum: ['window-view', 'wheelchair-accessible', 'high-chair-available', 'booth', 'bar-height']
  }],
  notes: {
    type: String,
    maxlength: 500
  },
  qrCode: {
    type: String,
    unique: true,
    sparse: true
  },
  lastCleaned: {
    type: Date,
    default: Date.now
  },
  maintenanceHistory: [{
    issue: String,
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reportedAt: {
      type: Date,
      default: Date.now
    },
    resolvedAt: Date,
    status: {
      type: String,
      enum: ['reported', 'in-progress', 'resolved'],
      default: 'reported'
    }
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
tableSchema.index({ status: 1 });
tableSchema.index({ location: 1, status: 1 });
tableSchema.index({ capacity: 1 });

// Virtual for availability status
tableSchema.virtual('isAvailable').get(function() {
  return this.status === 'available';
});

// Virtual for occupancy duration
tableSchema.virtual('occupancyDuration').get(function() {
  if (!this.occupiedAt) return 0;
  return Math.round((new Date() - this.occupiedAt) / (1000 * 60)); // in minutes
});

// Method to occupy table
tableSchema.methods.occupy = function(customerName, partySize, contactInfo = '') {
  this.status = 'occupied';
  this.occupiedAt = new Date();
  this.occupiedBy = {
    customerName,
    partySize,
    contactInfo
  };
  return this.save();
};

// Method to free table
tableSchema.methods.free = function() {
  this.status = 'available';
  this.occupiedAt = null;
  this.occupiedBy = {};
  this.currentOrder = null;
  this.lastCleaned = new Date();
  return this.save();
};

// Method to reserve table
tableSchema.methods.reserve = function(reservationId) {
  this.status = 'reserved';
  this.currentReservation = reservationId;
  return this.save();
};

// Method to report maintenance issue
tableSchema.methods.reportMaintenance = function(issue, reportedBy) {
  this.status = 'maintenance';
  this.maintenanceHistory.push({
    issue,
    reportedBy
  });
  return this.save();
};

module.exports = mongoose.model('Table', tableSchema);