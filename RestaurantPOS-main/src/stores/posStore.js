import { create } from 'zustand';

// Mock data
const mockMenuItems = [
  { id: '1', name: 'Paneer Butter Masala', description: 'Cottage cheese cubes in creamy tomato gravy', price: 220.00, category: 'Mains', available: true },
  { id: '2', name: 'Chicken Biryani', description: 'Fragrant basmati rice cooked with spiced chicken', price: 250.00, category: 'Mains', available: true },
  { id: '3', name: 'Masala Dosa', description: 'Crispy rice crepe filled with spiced potato mash', price: 120.00, category: 'Snacks', available: true },
  { id: '4', name: 'Rajma Chawal', description: 'Kidney beans curry served with steamed rice', price: 150.00, category: 'Mains', available: true },
  { id: '5', name: 'Gulab Jamun', description: 'Soft fried milk balls soaked in sugar syrup', price: 60.00, category: 'Desserts', available: true },
  { id: '6', name: 'Masala Chai', description: 'Spiced Indian tea with milk and sugar', price: 30.00, category: 'Beverages', available: true },
];

const mockInventory = [
  { id: '1', name: 'Paneer', category: 'Dairy', currentStock: 20, minStock: 10, unit: 'kg', cost: 320.00, lastRestocked: new Date().toISOString() },
  { id: '2', name: 'Basmati Rice', category: 'Grains', currentStock: 50, minStock: 20, unit: 'kg', cost: 90.00, lastRestocked: new Date().toISOString() },
  { id: '3', name: 'Potatoes', category: 'Vegetables', currentStock: 30, minStock: 15, unit: 'kg', cost: 25.00, lastRestocked: new Date().toISOString() },
  { id: '4', name: 'Kidney Beans (Rajma)', category: 'Legumes', currentStock: 18, minStock: 10, unit: 'kg', cost: 110.00, lastRestocked: new Date().toISOString() },
  { id: '5', name: 'Milk', category: 'Dairy', currentStock: 40, minStock: 20, unit: 'litres', cost: 50.00, lastRestocked: new Date().toISOString() },
  { id: '6', name: 'Black Tea Leaves', category: 'Beverages', currentStock: 10, minStock: 5, unit: 'kg', cost: 450.00, lastRestocked: new Date().toISOString() },
  { id: '7', name: 'Sugar Syrup (for Gulab Jamun)', category: 'Prepared Ingredients', currentStock: 10, minStock: 5, unit: 'litres', cost: 80.00, lastRestocked: new Date().toISOString() },
  { id: '8', name: 'Garam Masala', category: 'Spices', currentStock: 5, minStock: 2, unit: 'kg', cost: 600.00, lastRestocked: new Date().toISOString() },
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