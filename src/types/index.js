// User types and interfaces
export const UserRoles = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  CASHIER: 'cashier',
  KITCHEN: 'kitchen'
};

export const OrderStatus = {
  PENDING: 'pending',
  PREPARING: 'preparing',
  READY: 'ready',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

export const OrderType = {
  DINE_IN: 'dine-in',
  TAKEOUT: 'takeout',
  DELIVERY: 'delivery'
};

export const PaymentStatus = {
  PENDING: 'pending',
  PAID: 'paid',
  REFUNDED: 'refunded'
};

// Helper functions for type checking
export const isValidUserRole = (role) => {
  return Object.values(UserRoles).includes(role);
};

export const isValidOrderStatus = (status) => {
  return Object.values(OrderStatus).includes(status);
};

export const isValidOrderType = (type) => {
  return Object.values(OrderType).includes(type);
};

export const isValidPaymentStatus = (status) => {
  return Object.values(PaymentStatus).includes(status);
};