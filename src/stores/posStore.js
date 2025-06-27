import { create } from 'zustand';

// Mock data
const mockMenuItems = [
  { id: '1', name: 'Classic Burger', description: 'Beef patty with lettuce, tomato, and our special sauce', price: 12.99, category: 'Mains', available: true },
  { id: '2', name: 'Margherita Pizza', description: 'Fresh mozzarella, tomato sauce, and basil', price: 14.99, category: 'Mains', available: true },
  { id: '3', name: 'Caesar Salad', description: 'Crisp romaine lettuce with parmesan and croutons', price: 9.99, category: 'Salads', available: true },
  { id: '4', name: 'Fish & Chips', description: 'Beer-battered cod with golden fries', price: 16.99, category: 'Mains', available: true },
  { id: '5', name: 'Chocolate Cake', description: 'Rich chocolate cake with vanilla ice cream', price: 7.99, category: 'Desserts', available: true },
  { id: '6', name: 'Iced Coffee', description: 'Cold brew coffee with milk', price: 4.99, category: 'Beverages', available: true },
];

const mockInventory = [
  { id: '1', name: 'Ground Beef', category: 'Meat', currentStock: 25, minStock: 10, unit: 'lbs', cost: 8.99, lastRestocked: new Date().toISOString() },
  { id: '2', name: 'Mozzarella Cheese', category: 'Dairy', currentStock: 15, minStock: 5, unit: 'lbs', cost: 6.50, lastRestocked: new Date().toISOString() },
  { id: '3', name: 'Romaine Lettuce', category: 'Vegetables', currentStock: 8, minStock: 12, unit: 'heads', cost: 2.99, lastRestocked: new Date().toISOString() },
  { id: '4', name: 'Cod Fillets', category: 'Seafood', currentStock: 20, minStock: 8, unit: 'pieces', cost: 12.99, lastRestocked: new Date().toISOString() },
];

export const usePOSStore = create((set, get) => ({
  menuItems: mockMenuItems,
  currentOrder: [],
  orders: [],
  inventory: mockInventory,
  
  addToOrder: (item, quantity = 1) => {
    const { currentOrder } = get();
    const existingItem = currentOrder.find(orderItem => orderItem.menuItem.id === item.id);
    
    if (existingItem) {
      set({
        currentOrder: currentOrder.map(orderItem =>
          orderItem.menuItem.id === item.id
            ? { ...orderItem, quantity: orderItem.quantity + quantity }
            : orderItem
        )
      });
    } else {
      const newOrderItem = {
        id: Math.random().toString(36).substr(2, 9),
        menuItem: item,
        quantity
      };
      set({ currentOrder: [...currentOrder, newOrderItem] });
    }
  },
  
  removeFromOrder: (itemId) => {
    const { currentOrder } = get();
    set({ currentOrder: currentOrder.filter(item => item.id !== itemId) });
  },
  
  updateOrderItem: (itemId, quantity) => {
    const { currentOrder } = get();
    if (quantity <= 0) {
      get().removeFromOrder(itemId);
      return;
    }
    
    set({
      currentOrder: currentOrder.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      )
    });
  },
  
  clearOrder: () => {
    set({ currentOrder: [] });
  },
  
  completeOrder: (customerName, tableNumber, orderType = 'dine-in') => {
    const { currentOrder, orders } = get();
    if (currentOrder.length === 0) return;
    
    const total = currentOrder.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);
    
    const newOrder = {
      id: Math.random().toString(36).substr(2, 9),
      items: [...currentOrder],
      total,
      status: 'pending',
      customerName,
      tableNumber,
      orderType,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      paymentStatus: 'paid',
      cashierId: '1' // This would come from auth store
    };
    
    set({
      orders: [newOrder, ...orders],
      currentOrder: []
    });
  },
  
  updateOrderStatus: (orderId, status) => {
    const { orders } = get();
    set({
      orders: orders.map(order =>
        order.id === orderId
          ? { ...order, status, updatedAt: new Date().toISOString() }
          : order
      )
    });
  },
}));