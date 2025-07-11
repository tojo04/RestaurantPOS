const express = require('express');
const Order = require('../models/Order');
const Inventory = require('../models/Inventory');
const User = require('../models/User');
const MenuItem = require('../models/MenuItem');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// @desc    Get sales report
// @route   GET /api/reports/sales
// @access  Private (Admin, Manager)
router.get('/sales', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { startDate, endDate, groupBy = 'day' } = req.query;

    // Build date filter
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Get orders for the period
    const orders = await Order.find({
      ...dateFilter,
      status: { $in: ['completed', 'ready'] }
    }).populate('items.menuItem', 'name category');

    // Calculate totals
    const totalRevenue = orders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Group sales by period
    const salesByPeriod = {};
    orders.forEach(order => {
      let periodKey;
      const date = new Date(order.createdAt);
      
      switch (groupBy) {
        case 'hour':
          periodKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}-${date.getHours()}`;
          break;
        case 'day':
          periodKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          periodKey = `${weekStart.getFullYear()}-W${Math.ceil((weekStart.getTime() - new Date(weekStart.getFullYear(), 0, 1).getTime()) / (7 * 24 * 60 * 60 * 1000))}`;
          break;
        case 'month':
          periodKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
          break;
        default:
          periodKey = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
      }

      if (!salesByPeriod[periodKey]) {
        salesByPeriod[periodKey] = { revenue: 0, orders: 0 };
      }
      salesByPeriod[periodKey].revenue += order.total;
      salesByPeriod[periodKey].orders += 1;
    });

    // Top selling items
    const itemSales = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        const itemName = item.menuItem.name;
        if (!itemSales[itemName]) {
          itemSales[itemName] = {
            name: itemName,
            category: item.menuItem.category,
            quantity: 0,
            revenue: 0
          };
        }
        itemSales[itemName].quantity += item.quantity;
        itemSales[itemName].revenue += item.quantity * item.price;
      });
    });

    const topItems = Object.values(itemSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Order type distribution
    const orderTypes = {};
    orders.forEach(order => {
      orderTypes[order.orderType] = (orderTypes[order.orderType] || 0) + 1;
    });

    res.json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalOrders,
          avgOrderValue
        },
        salesByPeriod,
        topItems,
        orderTypes
      }
    });
  } catch (error) {
    console.error('Sales report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating sales report'
    });
  }
});

// @desc    Get inventory report
// @route   GET /api/reports/inventory
// @access  Private (Admin, Manager)
router.get('/inventory', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const inventoryItems = await Inventory.find({});

    // Calculate totals
    const totalItems = inventoryItems.length;
    const totalValue = inventoryItems.reduce((sum, item) => sum + item.totalValue, 0);
    const lowStockItems = inventoryItems.filter(item => item.stockStatus === 'low').length;

    // Category breakdown
    const categoryBreakdown = {};
    inventoryItems.forEach(item => {
      if (!categoryBreakdown[item.category]) {
        categoryBreakdown[item.category] = {
          items: 0,
          value: 0,
          lowStock: 0
        };
      }
      categoryBreakdown[item.category].items += 1;
      categoryBreakdown[item.category].value += item.totalValue;
      if (item.stockStatus === 'low') {
        categoryBreakdown[item.category].lowStock += 1;
      }
    });

    // Expiring items
    const today = new Date();
    const expiringItems = inventoryItems.filter(item => {
      if (!item.expiryDate) return false;
      const daysUntilExpiry = item.daysUntilExpiry;
      return daysUntilExpiry !== null && daysUntilExpiry <= 7 && daysUntilExpiry >= 0;
    }).length;

    res.json({
      success: true,
      data: {
        summary: {
          totalItems,
          totalValue,
          lowStockItems,
          expiringItems
        },
        categoryBreakdown
      }
    });
  } catch (error) {
    console.error('Inventory report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating inventory report'
    });
  }
});

// @desc    Get staff report
// @route   GET /api/reports/staff
// @access  Private (Admin, Manager)
router.get('/staff', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const users = await User.find({}).select('-password');
    const { startDate, endDate } = req.query;

    // Build date filter for orders
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    // Get orders for performance metrics
    const orders = await Order.find(dateFilter).populate('cashier', 'name role');

    // Calculate staff metrics
    const totalStaff = users.length;
    const activeStaff = users.filter(user => user.status === 'active').length;

    // Role distribution
    const roleDistribution = {};
    users.forEach(user => {
      roleDistribution[user.role] = (roleDistribution[user.role] || 0) + 1;
    });

    // Performance metrics
    const staffPerformance = {};
    orders.forEach(order => {
      if (order.cashier) {
        const cashierId = order.cashier._id.toString();
        if (!staffPerformance[cashierId]) {
          staffPerformance[cashierId] = {
            name: order.cashier.name,
            role: order.cashier.role,
            ordersProcessed: 0,
            totalRevenue: 0
          };
        }
        staffPerformance[cashierId].ordersProcessed += 1;
        staffPerformance[cashierId].totalRevenue += order.total;
      }
    });

    const topPerformers = Object.values(staffPerformance)
      .sort((a, b) => b.totalRevenue - a.totalRevenue)
      .slice(0, 5);

    res.json({
      success: true,
      data: {
        summary: {
          totalStaff,
          activeStaff,
          inactiveStaff: totalStaff - activeStaff
        },
        roleDistribution,
        topPerformers
      }
    });
  } catch (error) {
    console.error('Staff report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating staff report'
    });
  }
});

// @desc    Get menu performance report
// @route   GET /api/reports/menu
// @access  Private (Admin, Manager)
router.get('/menu', protect, authorize('admin', 'manager'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Build date filter
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = new Date(startDate);
      if (endDate) dateFilter.createdAt.$lte = new Date(endDate);
    }

    const orders = await Order.find({
      ...dateFilter,
      status: { $in: ['completed', 'ready'] }
    }).populate('items.menuItem', 'name category price');

    const menuItems = await MenuItem.find({});

    // Analyze menu item performance
    const itemPerformance = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        const itemId = item.menuItem._id.toString();
        if (!itemPerformance[itemId]) {
          itemPerformance[itemId] = {
            name: item.menuItem.name,
            category: item.menuItem.category,
            price: item.menuItem.price,
            quantitySold: 0,
            revenue: 0,
            orderCount: 0
          };
        }
        itemPerformance[itemId].quantitySold += item.quantity;
        itemPerformance[itemId].revenue += item.quantity * item.price;
        itemPerformance[itemId].orderCount += 1;
      });
    });

    // Find items that haven't sold
    const soldItemIds = new Set(Object.keys(itemPerformance));
    const unsoldItems = menuItems.filter(item => !soldItemIds.has(item._id.toString()));

    // Sort by performance
    const topSellingItems = Object.values(itemPerformance)
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 10);

    const topRevenueItems = Object.values(itemPerformance)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // Category performance
    const categoryPerformance = {};
    Object.values(itemPerformance).forEach(item => {
      if (!categoryPerformance[item.category]) {
        categoryPerformance[item.category] = {
          quantitySold: 0,
          revenue: 0,
          itemCount: 0
        };
      }
      categoryPerformance[item.category].quantitySold += item.quantitySold;
      categoryPerformance[item.category].revenue += item.revenue;
      categoryPerformance[item.category].itemCount += 1;
    });

    res.json({
      success: true,
      data: {
        topSellingItems,
        topRevenueItems,
        categoryPerformance,
        unsoldItems: unsoldItems.map(item => ({
          name: item.name,
          category: item.category,
          price: item.price
        }))
      }
    });
  } catch (error) {
    console.error('Menu report error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while generating menu report'
    });
  }
});

module.exports = router;