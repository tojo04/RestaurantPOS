const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const MenuItem = require('../models/MenuItem');
const Inventory = require('../models/Inventory');
const Table = require('../models/Table');
const Settings = require('../models/Settings');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('🍃 MongoDB Connected for seeding');
  } catch (error) {
    console.error('Database connection failed:', error.message);
    process.exit(1);
  }
};

const seedUsers = async () => {
  try {
    // Clear existing users
    await User.deleteMany({});

    const users = [
      {
        name: 'Admin User',
        email: 'admin@restaurant.com',
        password: 'password123',
        role: 'admin',
        phone: '+1-555-0001',
        address: '123 Admin Street, City, State 12345',
        salary: 75000,
        status: 'active'
      },
      {
        name: 'Restaurant Manager',
        email: 'manager@restaurant.com',
        password: 'password123',
        role: 'manager',
        phone: '+1-555-0002',
        address: '456 Manager Avenue, City, State 12345',
        salary: 55000,
        status: 'active'
      },
      {
        name: 'John Cashier',
        email: 'cashier@restaurant.com',
        password: 'password123',
        role: 'cashier',
        phone: '+1-555-0003',
        address: '789 Cashier Boulevard, City, State 12345',
        salary: 35000,
        status: 'active'
      },
      {
        name: 'Chef Kitchen',
        email: 'kitchen@restaurant.com',
        password: 'password123',
        role: 'kitchen',
        phone: '+1-555-0004',
        address: '321 Kitchen Road, City, State 12345',
        salary: 45000,
        status: 'active'
      },
      {
        name: 'Sarah Cashier',
        email: 'sarah@restaurant.com',
        password: 'password123',
        role: 'cashier',
        phone: '+1-555-0005',
        address: '654 Staff Street, City, State 12345',
        salary: 33000,
        status: 'active'
      }
    ];

    const createdUsers = await User.create(users);
    console.log(`✅ Created ${createdUsers.length} users`);
    return createdUsers;
  } catch (error) {
    console.error('Error seeding users:', error);
  }
};

const seedMenuItems = async (users) => {
  try {
    // Clear existing menu items
    await MenuItem.deleteMany({});

    const adminUser = users.find(user => user.role === 'admin');

    const menuItems = [
      {
        name: 'Classic Burger',
        description: 'Juicy beef patty with lettuce, tomato, onion, and our special sauce on a brioche bun',
        price: 14.99,
        category: 'Mains',
        preparationTime: 15,
        ingredients: [
          { name: 'Ground Beef', quantity: 0.25, unit: 'lbs' },
          { name: 'Brioche Bun', quantity: 1, unit: 'piece' },
          { name: 'Lettuce', quantity: 2, unit: 'leaves' },
          { name: 'Tomato', quantity: 2, unit: 'slices' }
        ],
        allergens: ['gluten'],
        nutritionalInfo: {
          calories: 650,
          protein: 35,
          carbs: 45,
          fat: 35,
          fiber: 3
        },
        available: true,
        featured: true,
        createdBy: adminUser._id
      },
      {
        name: 'Margherita Pizza',
        description: 'Traditional pizza with fresh mozzarella, tomato sauce, and basil leaves',
        price: 16.99,
        category: 'Mains',
        preparationTime: 20,
        ingredients: [
          { name: 'Pizza Dough', quantity: 1, unit: 'piece' },
          { name: 'Mozzarella Cheese', quantity: 0.2, unit: 'lbs' },
          { name: 'Tomato Sauce', quantity: 0.5, unit: 'cups' },
          { name: 'Fresh Basil', quantity: 5, unit: 'leaves' }
        ],
        allergens: ['gluten', 'dairy'],
        nutritionalInfo: {
          calories: 720,
          protein: 28,
          carbs: 85,
          fat: 25,
          fiber: 4
        },
        available: true,
        featured: true,
        createdBy: adminUser._id
      },
      {
        name: 'Caesar Salad',
        description: 'Crisp romaine lettuce with parmesan cheese, croutons, and Caesar dressing',
        price: 11.99,
        category: 'Salads',
        preparationTime: 8,
        ingredients: [
          { name: 'Romaine Lettuce', quantity: 1, unit: 'head' },
          { name: 'Parmesan Cheese', quantity: 0.1, unit: 'lbs' },
          { name: 'Croutons', quantity: 0.5, unit: 'cups' },
          { name: 'Caesar Dressing', quantity: 2, unit: 'tbsp' }
        ],
        allergens: ['dairy', 'gluten'],
        nutritionalInfo: {
          calories: 320,
          protein: 12,
          carbs: 18,
          fat: 24,
          fiber: 6
        },
        available: true,
        createdBy: adminUser._id
      },
      {
        name: 'Fish & Chips',
        description: 'Beer-battered cod fillet served with golden fries and tartar sauce',
        price: 18.99,
        category: 'Mains',
        preparationTime: 18,
        ingredients: [
          { name: 'Cod Fillet', quantity: 1, unit: 'piece' },
          { name: 'Potatoes', quantity: 0.5, unit: 'lbs' },
          { name: 'Beer Batter', quantity: 0.5, unit: 'cups' },
          { name: 'Tartar Sauce', quantity: 2, unit: 'tbsp' }
        ],
        allergens: ['fish', 'gluten'],
        nutritionalInfo: {
          calories: 850,
          protein: 42,
          carbs: 65,
          fat: 45,
          fiber: 5
        },
        available: true,
        createdBy: adminUser._id
      },
      {
        name: 'Chicken Wings',
        description: 'Crispy chicken wings tossed in your choice of buffalo, BBQ, or honey garlic sauce',
        price: 13.99,
        category: 'Appetizers',
        preparationTime: 12,
        spicyLevel: 3,
        available: true,
        createdBy: adminUser._id
      },
      {
        name: 'Chocolate Lava Cake',
        description: 'Warm chocolate cake with a molten center, served with vanilla ice cream',
        price: 8.99,
        category: 'Desserts',
        preparationTime: 10,
        allergens: ['dairy', 'eggs', 'gluten'],
        available: true,
        createdBy: adminUser._id
      },
      {
        name: 'Craft Beer',
        description: 'Local craft beer selection - ask your server for today\'s options',
        price: 6.99,
        category: 'Beverages',
        preparationTime: 2,
        available: true,
        createdBy: adminUser._id
      },
      {
        name: 'Fresh Lemonade',
        description: 'House-made lemonade with fresh lemons and mint',
        price: 4.99,
        category: 'Beverages',
        preparationTime: 3,
        available: true,
        createdBy: adminUser._id
      }
    ];

    const createdMenuItems = await MenuItem.create(menuItems);
    console.log(`✅ Created ${createdMenuItems.length} menu items`);
    return createdMenuItems;
  } catch (error) {
    console.error('Error seeding menu items:', error);
  }
};

const seedInventory = async (users) => {
  try {
    // Clear existing inventory
    await Inventory.deleteMany({});

    const adminUser = users.find(user => user.role === 'admin');

    const inventoryItems = [
      {
        name: 'Ground Beef',
        category: 'Meat',
        currentStock: 25,
        minStock: 10,
        maxStock: 50,
        unit: 'lbs',
        costPerUnit: 8.99,
        supplier: {
          name: 'Fresh Meat Co.',
          contact: 'John Smith',
          phone: '+1-555-MEAT',
          email: 'orders@freshmeat.com'
        },
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        location: 'Walk-in Freezer A',
        description: 'Premium ground beef, 80/20 lean-to-fat ratio'
      },
      {
        name: 'Mozzarella Cheese',
        category: 'Dairy',
        currentStock: 15,
        minStock: 5,
        maxStock: 30,
        unit: 'lbs',
        costPerUnit: 6.50,
        supplier: {
          name: 'Dairy Fresh Inc.',
          contact: 'Maria Garcia',
          phone: '+1-555-DAIRY',
          email: 'orders@dairyfresh.com'
        },
        expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        location: 'Walk-in Cooler',
        description: 'Fresh mozzarella cheese, whole milk'
      },
      {
        name: 'Romaine Lettuce',
        category: 'Vegetables',
        currentStock: 8,
        minStock: 12,
        maxStock: 25,
        unit: 'pieces',
        costPerUnit: 2.99,
        supplier: {
          name: 'Green Valley Farms',
          contact: 'Tom Wilson',
          phone: '+1-555-FARM',
          email: 'orders@greenvalley.com'
        },
        expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        location: 'Produce Cooler',
        description: 'Fresh romaine lettuce heads, organic'
      },
      {
        name: 'Cod Fillets',
        category: 'Seafood',
        currentStock: 20,
        minStock: 8,
        maxStock: 35,
        unit: 'pieces',
        costPerUnit: 12.99,
        supplier: {
          name: 'Ocean Fresh Seafood',
          contact: 'Captain Bob',
          phone: '+1-555-FISH',
          email: 'orders@oceanfresh.com'
        },
        expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        location: 'Seafood Freezer',
        description: 'Fresh Atlantic cod fillets, sustainably sourced'
      },
      {
        name: 'Tomatoes',
        category: 'Vegetables',
        currentStock: 30,
        minStock: 15,
        maxStock: 50,
        unit: 'lbs',
        costPerUnit: 3.49,
        supplier: {
          name: 'Green Valley Farms',
          contact: 'Tom Wilson',
          phone: '+1-555-FARM',
          email: 'orders@greenvalley.com'
        },
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        location: 'Produce Cooler',
        description: 'Fresh vine-ripened tomatoes'
      },
      {
        name: 'Chicken Breast',
        category: 'Meat',
        currentStock: 18,
        minStock: 10,
        maxStock: 40,
        unit: 'lbs',
        costPerUnit: 7.99,
        supplier: {
          name: 'Fresh Meat Co.',
          contact: 'John Smith',
          phone: '+1-555-MEAT',
          email: 'orders@freshmeat.com'
        },
        expiryDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
        location: 'Walk-in Freezer A',
        description: 'Boneless, skinless chicken breast'
      }
    ];

    // Add stock history for each item
    const createdItems = [];
    for (const item of inventoryItems) {
      const createdItem = await Inventory.create({
        ...item,
        stockHistory: [{
          action: 'restock',
          quantity: item.currentStock,
          reason: 'Initial stock',
          performedBy: adminUser._id
        }]
      });
      createdItems.push(createdItem);
    }

    console.log(`✅ Created ${createdItems.length} inventory items`);
    return createdItems;
  } catch (error) {
    console.error('Error seeding inventory:', error);
  }
};

const seedTables = async () => {
  try {
    // Clear existing tables
    await Table.deleteMany({});

    const tables = [];
    
    // Create 12 tables with varied configurations
    for (let i = 1; i <= 12; i++) {
      const table = {
        tableNumber: `A${i}`,
        capacity: i <= 4 ? 2 : i <= 8 ? 4 : 6,
        location: i <= 8 ? 'indoor' : i <= 10 ? 'outdoor' : 'private',
        shape: i === 5 || i === 9 ? 'rectangular' : i === 10 || i === 11 ? 'bar' : 'square',
        status: 'available',
        features: []
      };

      // Add features based on table number
      if (i <= 2) table.features.push('window-view');
      if (i === 3) table.features.push('wheelchair-accessible');
      if (i === 4 || i === 8) table.features.push('booth');
      if (i === 10 || i === 11) table.features.push('bar-height');
      if (i === 12) table.features.push('wheelchair-accessible', 'window-view');

      tables.push(table);
    }

    const createdTables = await Table.create(tables);
    console.log(`✅ Created ${createdTables.length} tables`);
    return createdTables;
  } catch (error) {
    console.error('Error seeding tables:', error);
  }
};

const seedSettings = async () => {
  try {
    // Clear existing settings
    await Settings.deleteMany({});

    const settings = {
      restaurant: {
        name: 'RestaurantPOS Demo',
        address: {
          street: '123 Main Street',
          city: 'Demo City',
          state: 'Demo State',
          zipCode: '12345',
          country: 'United States'
        },
        contact: {
          phone: '+1-555-RESTAURANT',
          email: 'info@restaurantpos.com',
          website: 'https://restaurantpos.com'
        },
        businessHours: {
          monday: { open: '11:00', close: '22:00', closed: false },
          tuesday: { open: '11:00', close: '22:00', closed: false },
          wednesday: { open: '11:00', close: '22:00', closed: false },
          thursday: { open: '11:00', close: '22:00', closed: false },
          friday: { open: '11:00', close: '23:00', closed: false },
          saturday: { open: '10:00', close: '23:00', closed: false },
          sunday: { open: '10:00', close: '21:00', closed: false }
        },
        currency: 'USD',
        taxRate: 8.5,
        timezone: 'America/New_York'
      },
      pos: {
        autoLogout: 30,
        printReceipts: true,
        soundEnabled: true,
        theme: 'light',
        orderNumberPrefix: 'ORD',
        reservationNumberPrefix: 'RES'
      },
      notifications: {
        lowStock: {
          enabled: true,
          threshold: 20
        },
        newOrders: {
          enabled: true,
          sound: true
        },
        email: {
          enabled: true
        },
        sms: {
          enabled: false
        }
      },
      payment: {
        acceptedMethods: ['cash', 'card', 'digital'],
        tipSuggestions: [15, 18, 20, 25]
      },
      kitchen: {
        displayTimeout: 30,
        preparationTimes: {
          appetizers: 10,
          mains: 20,
          desserts: 8,
          beverages: 3
        },
        priorityOrders: {
          enabled: true,
          threshold: 45
        }
      },
      security: {
        passwordPolicy: {
          minLength: 6,
          requireUppercase: false,
          requireNumbers: false,
          requireSpecialChars: false
        },
        sessionTimeout: 480,
        maxLoginAttempts: 5
      }
    };

    const createdSettings = await Settings.create(settings);
    console.log('✅ Created restaurant settings');
    return createdSettings;
  } catch (error) {
    console.error('Error seeding settings:', error);
  }
};

const seedDatabase = async () => {
  try {
    await connectDB();
    
    console.log('🌱 Starting database seeding...');
    
    const users = await seedUsers();
    const menuItems = await seedMenuItems(users);
    const inventory = await seedInventory(users);
    const tables = await seedTables();
    const settings = await seedSettings();
    
    console.log('🎉 Database seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`   Users: ${users?.length || 0}`);
    console.log(`   Menu Items: ${menuItems?.length || 0}`);
    console.log(`   Inventory Items: ${inventory?.length || 0}`);
    console.log(`   Tables: ${tables?.length || 0}`);
    console.log(`   Settings: ${settings ? 1 : 0}`);
    
    console.log('\n🔐 Demo Login Credentials:');
    console.log('   Admin: admin@restaurant.com / password123');
    console.log('   Manager: manager@restaurant.com / password123');
    console.log('   Cashier: cashier@restaurant.com / password123');
    console.log('   Kitchen: kitchen@restaurant.com / password123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
    process.exit(1);
  }
};

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };