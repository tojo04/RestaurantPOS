const mongoose = require('mongoose');

const reservationSchema = new mongoose.Schema({
  reservationNumber: {
    type: String,
    unique: true,
    required: true
  },
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  customerPhone: {
    type: String,
    required: [true, 'Phone number is required'],
    trim: true
  },
  customerEmail: {
    type: String,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  partySize: {
    type: Number,
    required: [true, 'Party size is required'],
    min: [1, 'Party size must be at least 1'],
    max: [20, 'Party size cannot exceed 20']
  },
  date: {
    type: Date,
    required: [true, 'Reservation date is required']
  },
  time: {
    type: String,
    required: [true, 'Reservation time is required'],
    match: [/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Please enter a valid time in HH:MM format']
  },
  duration: {
    type: Number,
    default: 120, // in minutes
    min: [30, 'Duration must be at least 30 minutes'],
    max: [480, 'Duration cannot exceed 8 hours']
  },
  table: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Table',
    required: true
  },
  status: {
    type: String,
    enum: ['confirmed', 'seated', 'completed', 'cancelled', 'no-show'],
    default: 'confirmed'
  },
  specialRequests: {
    type: String,
    maxlength: 500
  },
  occasion: {
    type: String,
    enum: ['birthday', 'anniversary', 'business', 'date', 'family', 'other'],
    default: 'other'
  },
  notes: {
    type: String,
    maxlength: 500
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  seatedAt: {
    type: Date
  },
  completedAt: {
    type: Date
  },
  reminderSent: {
    type: Boolean,
    default: false
  },
  confirmationSent: {
    type: Boolean,
    default: false
  },
  order: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Order'
  }
}, {
  timestamps: true
});

// Indexes for better query performance
reservationSchema.index({ date: 1, time: 1 });
reservationSchema.index({ customerPhone: 1 });
reservationSchema.index({ status: 1, date: 1 });
reservationSchema.index({ table: 1, date: 1 });

// Pre-save middleware to generate reservation number
reservationSchema.pre('save', async function(next) {
  if (this.isNew) {
    const count = await this.constructor.countDocuments();
    this.reservationNumber = `RES-${Date.now()}-${(count + 1).toString().padStart(4, '0')}`;
  }
  next();
});

// Virtual for formatted date and time
reservationSchema.virtual('formattedDateTime').get(function() {
  const date = new Date(this.date);
  const [hours, minutes] = this.time.split(':');
  date.setHours(parseInt(hours), parseInt(minutes));
  return date.toLocaleString();
});

// Virtual for end time
reservationSchema.virtual('endTime').get(function() {
  const date = new Date(this.date);
  const [hours, minutes] = this.time.split(':');
  date.setHours(parseInt(hours), parseInt(minutes));
  date.setMinutes(date.getMinutes() + this.duration);
  return date;
});

// Method to seat reservation
reservationSchema.methods.seat = function() {
  this.status = 'seated';
  this.seatedAt = new Date();
  return this.save();
};

// Method to complete reservation
reservationSchema.methods.complete = function() {
  this.status = 'completed';
  this.completedAt = new Date();
  return this.save();
};

// Method to cancel reservation
reservationSchema.methods.cancel = function() {
  this.status = 'cancelled';
  return this.save();
};

// Static method to find conflicts
reservationSchema.statics.findConflicts = function(tableId, date, time, duration, excludeId = null) {
  const startTime = new Date(date);
  const [hours, minutes] = time.split(':');
  startTime.setHours(parseInt(hours), parseInt(minutes));
  
  const endTime = new Date(startTime);
  endTime.setMinutes(endTime.getMinutes() + duration);
  
  const query = {
    table: tableId,
    status: { $in: ['confirmed', 'seated'] },
    $or: [
      {
        $and: [
          { date: { $lte: startTime } },
          { endTime: { $gte: startTime } }
        ]
      },
      {
        $and: [
          { date: { $lte: endTime } },
          { endTime: { $gte: endTime } }
        ]
      }
    ]
  };
  
  if (excludeId) {
    query._id = { $ne: excludeId };
  }
  
  return this.find(query);
};

module.exports = mongoose.model('Reservation', reservationSchema);