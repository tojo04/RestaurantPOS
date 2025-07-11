const { body, param, query, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// User validation rules
const validateUser = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .isIn(['admin', 'manager', 'cashier', 'kitchen'])
    .withMessage('Invalid role'),
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  handleValidationErrors
];

// Login validation rules
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  handleValidationErrors
];

// Menu item validation rules
const validateMenuItem = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  body('price')
    .isFloat({ min: 0 })
    .withMessage('Price must be a positive number'),
  body('category')
    .isIn(['Appetizers', 'Mains', 'Salads', 'Desserts', 'Beverages', 'Specials'])
    .withMessage('Invalid category'),
  body('preparationTime')
    .optional()
    .isInt({ min: 1, max: 120 })
    .withMessage('Preparation time must be between 1 and 120 minutes'),
  handleValidationErrors
];

// Order validation rules
const validateOrder = [
  body('items')
    .isArray({ min: 1 })
    .withMessage('Order must contain at least one item'),
  body('items.*.menuItem')
    .isMongoId()
    .withMessage('Invalid menu item ID'),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Quantity must be at least 1'),
  body('orderType')
    .isIn(['dine-in', 'takeout', 'delivery'])
    .withMessage('Invalid order type'),
  body('customerName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Customer name must be between 2 and 100 characters'),
  body('tableNumber')
    .optional()
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage('Table number must be between 1 and 10 characters'),
  handleValidationErrors
];

// Inventory validation rules
const validateInventory = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  body('category')
    .isIn(['Meat', 'Dairy', 'Vegetables', 'Seafood', 'Beverages', 'Pantry', 'Spices', 'Other'])
    .withMessage('Invalid category'),
  body('currentStock')
    .isFloat({ min: 0 })
    .withMessage('Current stock must be a positive number'),
  body('minStock')
    .isFloat({ min: 0 })
    .withMessage('Minimum stock must be a positive number'),
  body('maxStock')
    .isFloat({ min: 0 })
    .withMessage('Maximum stock must be a positive number'),
  body('costPerUnit')
    .isFloat({ min: 0 })
    .withMessage('Cost per unit must be a positive number'),
  body('unit')
    .isIn(['kg', 'lbs', 'pieces', 'liters', 'gallons', 'boxes', 'cans', 'bottles'])
    .withMessage('Invalid unit'),
  handleValidationErrors
];

// Table validation rules
const validateTable = [
  body('tableNumber')
    .trim()
    .isLength({ min: 1, max: 10 })
    .withMessage('Table number must be between 1 and 10 characters'),
  body('capacity')
    .isInt({ min: 1, max: 20 })
    .withMessage('Capacity must be between 1 and 20'),
  body('location')
    .optional()
    .isIn(['indoor', 'outdoor', 'private', 'bar'])
    .withMessage('Invalid location'),
  body('shape')
    .optional()
    .isIn(['square', 'rectangular', 'round', 'bar'])
    .withMessage('Invalid shape'),
  handleValidationErrors
];

// Reservation validation rules
const validateReservation = [
  body('customerName')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Customer name must be between 2 and 100 characters'),
  body('customerPhone')
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  body('customerEmail')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('partySize')
    .isInt({ min: 1, max: 20 })
    .withMessage('Party size must be between 1 and 20'),
  body('date')
    .isISO8601()
    .withMessage('Please provide a valid date'),
  body('time')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Please provide a valid time in HH:MM format'),
  body('table')
    .isMongoId()
    .withMessage('Invalid table ID'),
  body('duration')
    .optional()
    .isInt({ min: 30, max: 480 })
    .withMessage('Duration must be between 30 and 480 minutes'),
  handleValidationErrors
];

// MongoDB ObjectId validation
const validateObjectId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid ID format'),
  handleValidationErrors
];

// Pagination validation
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  handleValidationErrors
];

module.exports = {
  validateUser,
  validateLogin,
  validateMenuItem,
  validateOrder,
  validateInventory,
  validateTable,
  validateReservation,
  validateObjectId,
  validatePagination,
  handleValidationErrors
};