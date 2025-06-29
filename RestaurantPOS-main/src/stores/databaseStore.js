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
          name: 'GrillBill',
          address: 'ABCD',
          phone: '+91 9546215751',
          email: 'info@grillbill.com',
          currency: 'IndianRupee',
          taxRate: 8.5,
          timezone: 'Delhi'
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
  async create(collection, data) {
  const items = await this.getAll(collection);  
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


 async getAll(collection) {
  const data = localStorage.getItem(this.collections[collection]);
  return data ? JSON.parse(data) : [];
}

async getById(collection, id) {
  const items = await this.getAll(collection);
  return items.find(item => item.id === id);
}

async update(collection, id, data) {
  const items = await this.getAll(collection);
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

async delete(collection, id) {
  const items = await this.getAll(collection);
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
          const groupKey = typeof key === 'string' ? item[key.replace('₹', '')] : 'all';
          
          if (!grouped[groupKey]) {
            grouped[groupKey] = { _id: groupKey };
          }
          
          Object.keys(stage.$group).forEach(field => {
            if (field !== '_id') {
              const operation = stage.$group[field];
              if (operation.$sum) {
                const sumField = operation.$sum.replace('₹', '');
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
  initializeSampleData: async () => {
    const { db } = get();
     const existingUsers = await db.getAll('users');
    const existingInventory = await db.getAll('inventory');
    // Sample users
    const sampleUsers = [
      {
        name: 'Admin User',
        email: 'admin@restaurant.com',
        role: 'admin',
        status: 'active',
        phone: '+91 9382309234',
        address: 'WXYZ',
        hireDate: '2023-01-15',
        salary: 75000
      },
      {
        name: 'Restaurant Manager',
        email: 'manager@restaurant.com',
        role: 'manager',
        status: 'active',
        phone: '+91 7459807474',
        address: 'ABCD',
        hireDate: '2023-02-01',
        salary: 55000
      },
      {
        name: 'Cashier Staff',
        email: 'cashier@restaurant.com',
        role: 'cashier',
        status: 'active',
        phone: '+1 (555) 345-6789',
        address: 'PQRS',
        hireDate: '2023-03-10',
        salary: 35000
      },
      {
        name: 'Kitchen Staff',
        email: 'kitchen@restaurant.com',
        role: 'kitchen',
        status: 'active',
        phone: '+1 (555) 456-7890',
        address: 'MNOP',
        hireDate: '2023-04-05',
        salary: 40000
      }
    ];

    // Sample inventory
    const sampleInventory = [
  {
    name: 'Paneer',
    category: 'Dairy',
    currentStock: 20,
    minStock: 10,
    maxStock: 40,
    unit: 'kg',
    costPerUnit: 320.00,
    supplier: 'Amul Dairy',
    lastRestocked: new Date().toISOString(),
    expiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    name: 'Basmati Rice',
    category: 'Grains',
    currentStock: 50,
    minStock: 20,
    maxStock: 100,
    unit: 'kg',
    costPerUnit: 90.00,
    supplier: 'India Gate Suppliers',
    lastRestocked: new Date().toISOString(),
    expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString() // Rice has long shelf life
  },
  {
    name: 'Potatoes',
    category: 'Vegetables',
    currentStock: 30,
    minStock: 15,
    maxStock: 50,
    unit: 'kg',
    costPerUnit: 25.00,
    supplier: 'AgroVeg Distributors',
    lastRestocked: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    expiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    name: 'Kidney Beans (Rajma)',
    category: 'Legumes',
    currentStock: 18,
    minStock: 10,
    maxStock: 40,
    unit: 'kg',
    costPerUnit: 110.00,
    supplier: 'Pulses & Co.',
    lastRestocked: new Date().toISOString(),
    expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    name: 'Full Cream Milk',
    category: 'Dairy',
    currentStock: 40,
    minStock: 20,
    maxStock: 60,
    unit: 'litres',
    costPerUnit: 50.00,
    supplier: 'Mother Dairy',
    lastRestocked: new Date().toISOString(),
    expiryDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    name: 'Black Tea Leaves',
    category: 'Beverages',
    currentStock: 10,
    minStock: 5,
    maxStock: 20,
    unit: 'kg',
    costPerUnit: 450.00,
    supplier: 'Tata Tea Distributors',
    lastRestocked: new Date().toISOString(),
    expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    name: 'Garam Masala',
    category: 'Spices',
    currentStock: 5,
    minStock: 2,
    maxStock: 10,
    unit: 'kg',
    costPerUnit: 600.00,
    supplier: 'Everest Spices',
    lastRestocked: new Date().toISOString(),
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
  }
];

  
 

  if (existingUsers.length === 0) {
    for (const user of sampleUsers) {
      await db.create('users', user);
    }
  }

  if (existingInventory.length === 0) {
    for (const item of sampleInventory) {
      await db.create('inventory', item);
    }
  }

  console.log('✅ Sample data initialized');

}
}));