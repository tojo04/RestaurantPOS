// Database simulation using localStorage
import { create } from 'zustand';

// Simulate MongoDB-like database operations
class LocalDatabase {
  constructor() {
    this.collections = {
      users: 'pos_users',
      inventory: 'pos_inventory',
      orders: 'pos_orders',
      reports: 'pos_reports',
      settings: 'pos_settings',
      menuItems: 'pos_menu_items',
      tables: 'pos_tables',
      reservations: 'pos_reservations'
    };
    this.initializeDatabase();
  }

  initializeDatabase() {
    // Initialize collections if they don't exist
    Object.values(this.collections).forEach(collection => {
      if (!localStorage.getItem(collection)) {
        localStorage.setItem(collection, JSON.stringify([]));
      }
    });

    // Initialize settings if not exists
    if (!localStorage.getItem(this.collections.settings)) {
      const defaultSettings = {
        restaurant: {
          name: 'RestaurantPOS',
          address: '123 Main Street, City, State 12345',
          phone: '+1 (555) 123-4567',
          email: 'info@restaurantpos.com',
          currency: 'USD',
          taxRate: 8.5,
          timezone: 'America/New_York'
        },
        pos: {
          autoLogout: 30,
          printReceipts: true,
          soundEnabled: true,
          theme: 'light'
        },
        notifications: {
          lowStock: true,
          newOrders: true,
          email: true,
          sms: false
        }
      };
      localStorage.setItem(this.collections.settings, JSON.stringify(defaultSettings));
    }
  }

  // Generic CRUD operations
  create(collection, data) {
    const items = this.getAll(collection);
    const newItem = {
      id: this.generateId(),
      ...data,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    items.push(newItem);
    localStorage.setItem(this.collections[collection], JSON.stringify(items));
    return newItem;
  }

  getAll(collection) {
    const data = localStorage.getItem(this.collections[collection]);
    return data ? JSON.parse(data) : [];
  }

  getById(collection, id) {
    const items = this.getAll(collection);
    return items.find(item => item.id === id);
  }

  update(collection, id, data) {
    const items = this.getAll(collection);
    const index = items.findIndex(item => item.id === id);
    if (index !== -1) {
      items[index] = {
        ...items[index],
        ...data,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(this.collections[collection], JSON.stringify(items));
      return items[index];
    }
    return null;
  }

  delete(collection, id) {
    const items = this.getAll(collection);
    const filteredItems = items.filter(item => item.id !== id);
    localStorage.setItem(this.collections[collection], JSON.stringify(filteredItems));
    return true;
  }

  // Settings specific operations
  getSettings() {
    const data = localStorage.getItem(this.collections.settings);
    return data ? JSON.parse(data) : {};
  }

  updateSettings(settings) {
    localStorage.setItem(this.collections.settings, JSON.stringify(settings));
    return settings;
  }

  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Query operations
  query(collection, filter = {}) {
    const items = this.getAll(collection);
    return items.filter(item => {
      return Object.keys(filter).every(key => {
        if (typeof filter[key] === 'object' && filter[key].$regex) {
          return new RegExp(filter[key].$regex, filter[key].$options || 'i').test(item[key]);
        }
        return item[key] === filter[key];
      });
    });
  }

  // Aggregation operations for reports
  aggregate(collection, pipeline) {
    const items = this.getAll(collection);
    // Simple aggregation implementation
    let result = items;
    
    pipeline.forEach(stage => {
      if (stage.$match) {
        result = result.filter(item => {
          return Object.keys(stage.$match).every(key => {
            return item[key] === stage.$match[key];
          });
        });
      }
      
      if (stage.$group) {
        const grouped = {};
        result.forEach(item => {
          const key = stage.$group._id;
          const groupKey = typeof key === 'string' ? item[key.replace('$', '')] : 'all';
          
          if (!grouped[groupKey]) {
            grouped[groupKey] = { _id: groupKey };
          }
          
          Object.keys(stage.$group).forEach(field => {
            if (field !== '_id') {
              const operation = stage.$group[field];
              if (operation.$sum) {
                const sumField = operation.$sum.replace('$', '');
                grouped[groupKey][field] = (grouped[groupKey][field] || 0) + (item[sumField] || 0);
              }
              if (operation.$count) {
                grouped[groupKey][field] = (grouped[groupKey][field] || 0) + 1;
              }
            }
          });
        });
        result = Object.values(grouped);
      }
    });
    
    return result;
  }
}

export const useDatabase = create((set, get) => ({
  db: new LocalDatabase(),
  
  // Initialize with sample data
  initializeSampleData: () => {
    const { db } = get();
    
    // Sample users
    const sampleUsers = [
      {
        name: 'Admin User',
        email: 'admin@restaurant.com',
        role: 'admin',
        status: 'active',
        phone: '+1 (555) 123-4567',
        address: '123 Admin St, City, State',
        hireDate: '2023-01-15',
        salary: 75000
      },
      {
        name: 'Restaurant Manager',
        email: 'manager@restaurant.com',
        role: 'manager',
        status: 'active',
        phone: '+1 (555) 234-5678',
        address: '456 Manager Ave, City, State',
        hireDate: '2023-02-01',
        salary: 55000
      },
      {
        name: 'Cashier Staff',
        email: 'cashier@restaurant.com',
        role: 'cashier',
        status: 'active',
        phone: '+1 (555) 345-6789',
        address: '789 Cashier Blvd, City, State',
        hireDate: '2023-03-10',
        salary: 35000
      },
      {
        name: 'Kitchen Staff',
        email: 'kitchen@restaurant.com',
        role: 'kitchen',
        status: 'active',
        phone: '+1 (555) 456-7890',
        address: '321 Kitchen Rd, City, State',
        hireDate: '2023-04-05',
        salary: 40000
      }
    ];

    // Sample inventory
    const sampleInventory = [
      {
        name: 'Ground Beef',
        category: 'Meat',
        currentStock: 25,
        minStock: 10,
        maxStock: 50,
        unit: 'lbs',
        costPerUnit: 8.99,
        supplier: 'Fresh Meat Co.',
        lastRestocked: new Date().toISOString(),
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        name: 'Mozzarella Cheese',
        category: 'Dairy',
        currentStock: 15,
        minStock: 5,
        maxStock: 30,
        unit: 'lbs',
        costPerUnit: 6.50,
        supplier: 'Dairy Fresh Inc.',
        lastRestocked: new Date().toISOString(),
        expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        name: 'Romaine Lettuce',
        category: 'Vegetables',
        currentStock: 8,
        minStock: 12,
        maxStock: 25,
        unit: 'heads',
        costPerUnit: 2.99,
        supplier: 'Green Valley Farms',
        lastRestocked: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        name: 'Cod Fillets',
        category: 'Seafood',
        currentStock: 20,
        minStock: 8,
        maxStock: 35,
        unit: 'pieces',
        costPerUnit: 12.99,
        supplier: 'Ocean Fresh Seafood',
        lastRestocked: new Date().toISOString(),
        expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        name: 'Tomatoes',
        category: 'Vegetables',
        currentStock: 30,
        minStock: 15,
        maxStock: 50,
        unit: 'lbs',
        costPerUnit: 3.49,
        supplier: 'Green Valley Farms',
        lastRestocked: new Date().toISOString(),
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        name: 'Chicken Breast',
        category: 'Meat',
        currentStock: 18,
        minStock: 10,
        maxStock: 40,
        unit: 'lbs',
        costPerUnit: 7.99,
        supplier: 'Fresh Meat Co.',
        lastRestocked: new Date().toISOString(),
        expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    // Check if data already exists
    if (db.getAll('users').length === 0) {
      sampleUsers.forEach(user => db.create('users', user));
    }
    
    if (db.getAll('inventory').length === 0) {
      sampleInventory.forEach(item => db.create('inventory', item));
    }
  }
}));