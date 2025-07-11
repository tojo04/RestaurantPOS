const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  restaurant: {
    name: {
      type: String,
      required: [true, 'Restaurant name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    address: {
      street: String,
      city: String,
      state: String,
      zipCode: String,
      country: {
        type: String,
        default: 'United States'
      }
    },
    contact: {
      phone: String,
      email: String,
      website: String
    },
    businessHours: {
      monday: { open: String, close: String, closed: Boolean },
      tuesday: { open: String, close: String, closed: Boolean },
      wednesday: { open: String, close: String, closed: Boolean },
      thursday: { open: String, close: String, closed: Boolean },
      friday: { open: String, close: String, closed: Boolean },
      saturday: { open: String, close: String, closed: Boolean },
      sunday: { open: String, close: String, closed: Boolean }
    },
    currency: {
      type: String,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'CAD', 'AUD']
    },
    taxRate: {
      type: Number,
      required: [true, 'Tax rate is required'],
      min: [0, 'Tax rate cannot be negative'],
      max: [100, 'Tax rate cannot exceed 100%']
    },
    timezone: {
      type: String,
      default: 'America/New_York'
    },
    logo: String
  },
  pos: {
    autoLogout: {
      type: Number,
      default: 30, // minutes
      min: [5, 'Auto logout cannot be less than 5 minutes'],
      max: [480, 'Auto logout cannot exceed 8 hours']
    },
    printReceipts: {
      type: Boolean,
      default: true
    },
    soundEnabled: {
      type: Boolean,
      default: true
    },
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    },
    orderNumberPrefix: {
      type: String,
      default: 'ORD',
      maxlength: [5, 'Prefix cannot exceed 5 characters']
    },
    reservationNumberPrefix: {
      type: String,
      default: 'RES',
      maxlength: [5, 'Prefix cannot exceed 5 characters']
    }
  },
  notifications: {
    lowStock: {
      enabled: {
        type: Boolean,
        default: true
      },
      threshold: {
        type: Number,
        default: 10 // percentage
      }
    },
    newOrders: {
      enabled: {
        type: Boolean,
        default: true
      },
      sound: {
        type: Boolean,
        default: true
      }
    },
    email: {
      enabled: {
        type: Boolean,
        default: true
      },
      smtp: {
        host: String,
        port: Number,
        secure: Boolean,
        username: String,
        password: String
      }
    },
    sms: {
      enabled: {
        type: Boolean,
        default: false
      },
      provider: String,
      apiKey: String
    }
  },
  payment: {
    acceptedMethods: [{
      type: String,
      enum: ['cash', 'card', 'digital', 'check']
    }],
    cardProcessing: {
      provider: String,
      merchantId: String,
      publicKey: String,
      privateKey: String
    },
    tipSuggestions: [{
      type: Number,
      min: 0,
      max: 100
    }]
  },
  kitchen: {
    displayTimeout: {
      type: Number,
      default: 30, // minutes
      min: [10, 'Display timeout cannot be less than 10 minutes']
    },
    preparationTimes: {
      appetizers: { type: Number, default: 10 },
      mains: { type: Number, default: 20 },
      desserts: { type: Number, default: 8 },
      beverages: { type: Number, default: 3 }
    },
    priorityOrders: {
      enabled: {
        type: Boolean,
        default: true
      },
      threshold: {
        type: Number,
        default: 45 // minutes
      }
    }
  },
  security: {
    passwordPolicy: {
      minLength: {
        type: Number,
        default: 6,
        min: [6, 'Minimum password length cannot be less than 6']
      },
      requireUppercase: {
        type: Boolean,
        default: false
      },
      requireNumbers: {
        type: Boolean,
        default: false
      },
      requireSpecialChars: {
        type: Boolean,
        default: false
      }
    },
    sessionTimeout: {
      type: Number,
      default: 480, // minutes (8 hours)
      min: [30, 'Session timeout cannot be less than 30 minutes']
    },
    maxLoginAttempts: {
      type: Number,
      default: 5,
      min: [3, 'Max login attempts cannot be less than 3']
    }
  }
}, {
  timestamps: true
});

// Ensure only one settings document exists
settingsSchema.statics.getSettings = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

module.exports = mongoose.model('Settings', settingsSchema);