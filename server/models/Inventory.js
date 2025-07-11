const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Meat', 'Dairy', 'Vegetables', 'Seafood', 'Beverages', 'Pantry', 'Spices', 'Other']
  },
  currentStock: {
    type: Number,
    required: [true, 'Current stock is required'],
    min: [0, 'Stock cannot be negative']
  },
  minStock: {
    type: Number,
    required: [true, 'Minimum stock level is required'],
    min: [0, 'Minimum stock cannot be negative']
  },
  maxStock: {
    type: Number,
    required: [true, 'Maximum stock level is required'],
    min: [0, 'Maximum stock cannot be negative']
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    enum: ['kg', 'lbs', 'pieces', 'liters', 'gallons', 'boxes', 'cans', 'bottles']
  },
  costPerUnit: {
    type: Number,
    required: [true, 'Cost per unit is required'],
    min: [0, 'Cost cannot be negative']
  },
  supplier: {
    name: {
      type: String,
      required: [true, 'Supplier name is required']
    },
    contact: String,
    email: String,
    phone: String
  },
  expiryDate: {
    type: Date
  },
  lastRestocked: {
    type: Date,
    default: Date.now
  },
  location: {
    type: String,
    default: 'Main Storage'
  },
  barcode: {
    type: String,
    unique: true,
    sparse: true
  },
  description: {
    type: String,
    maxlength: 500
  },
  alerts: {
    lowStock: {
      type: Boolean,
      default: true
    },
    expiry: {
      type: Boolean,
      default: true
    }
  },
  stockHistory: [{
    action: {
      type: String,
      enum: ['restock', 'usage', 'waste', 'adjustment'],
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    reason: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes for better query performance
inventorySchema.index({ category: 1 });
inventorySchema.index({ currentStock: 1, minStock: 1 });
inventorySchema.index({ expiryDate: 1 });
inventorySchema.index({ name: 'text', description: 'text' });

// Virtual for stock status
inventorySchema.virtual('stockStatus').get(function() {
  if (this.currentStock <= this.minStock) {
    return 'low';
  } else if (this.currentStock >= this.maxStock) {
    return 'high';
  }
  return 'normal';
});

// Virtual for days until expiry
inventorySchema.virtual('daysUntilExpiry').get(function() {
  if (!this.expiryDate) return null;
  const today = new Date();
  const expiry = new Date(this.expiryDate);
  const diffTime = expiry - today;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Virtual for total value
inventorySchema.virtual('totalValue').get(function() {
  return this.currentStock * this.costPerUnit;
});

// Method to update stock
inventorySchema.methods.updateStock = function(action, quantity, reason, performedBy) {
  let newStock = this.currentStock;
  
  switch (action) {
    case 'restock':
      newStock += quantity;
      this.lastRestocked = new Date();
      break;
    case 'usage':
    case 'waste':
      newStock -= quantity;
      break;
    case 'adjustment':
      newStock = quantity; // Direct adjustment to specific amount
      break;
  }
  
  this.currentStock = Math.max(0, newStock);
  
  this.stockHistory.push({
    action,
    quantity,
    reason,
    performedBy
  });
  
  return this.save();
};

// Pre-save validation
inventorySchema.pre('save', function(next) {
  if (this.minStock > this.maxStock) {
    next(new Error('Minimum stock cannot be greater than maximum stock'));
  }
  next();
});

module.exports = mongoose.model('Inventory', inventorySchema);