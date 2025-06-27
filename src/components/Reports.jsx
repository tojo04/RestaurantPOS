import { useState, useEffect } from 'react';
import { useDatabase } from '../stores/databaseStore';
import { usePOSStore } from '../stores/posStore';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  ShoppingCart,
  Calendar,
  Download,
  Filter,
  Users,
  Package,
  Clock
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';

export const Reports = () => {
  const { db } = useDatabase();
  const { orders } = usePOSStore();
  const [dateRange, setDateRange] = useState('today');
  const [reportType, setReportType] = useState('sales');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const getDateRange = () => {
    const today = new Date();
    
    switch (dateRange) {
      case 'today':
        return { start: startOfDay(today), end: endOfDay(today) };
      case 'yesterday':
        const yesterday = subDays(today, 1);
        return { start: startOfDay(yesterday), end: endOfDay(yesterday) };
      case 'week':
        return { start: startOfDay(subDays(today, 7)), end: endOfDay(today) };
      case 'month':
        return { start: startOfDay(subDays(today, 30)), end: endOfDay(today) };
      case 'custom':
        return {
          start: customStartDate ? startOfDay(new Date(customStartDate)) : startOfDay(today),
          end: customEndDate ? endOfDay(new Date(customEndDate)) : endOfDay(today)
        };
      default:
        return { start: startOfDay(today), end: endOfDay(today) };
    }
  };

  const getFilteredOrders = () => {
    const { start, end } = getDateRange();
    return orders.filter(order => {
      const orderDate = new Date(order.createdAt);
      return isWithinInterval(orderDate, { start, end });
    });
  };

  const getSalesData = () => {
    const filteredOrders = getFilteredOrders();
    
    const totalRevenue = filteredOrders.reduce((sum, order) => sum + order.total, 0);
    const totalOrders = filteredOrders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    // Group by date for chart
    const salesByDate = {};
    filteredOrders.forEach(order => {
      const date = format(new Date(order.createdAt), 'yyyy-MM-dd');
      if (!salesByDate[date]) {
        salesByDate[date] = { revenue: 0, orders: 0 };
      }
      salesByDate[date].revenue += order.total;
      salesByDate[date].orders += 1;
    });

    // Top selling items
    const itemSales = {};
    filteredOrders.forEach(order => {
      order.items.forEach(item => {
        const itemName = item.menuItem.name;
        if (!itemSales[itemName]) {
          itemSales[itemName] = { quantity: 0, revenue: 0 };
        }
        itemSales[itemName].quantity += item.quantity;
        itemSales[itemName].revenue += item.quantity * item.menuItem.price;
      });
    });

    const topItems = Object.entries(itemSales)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Order types distribution
    const orderTypes = {};
    filteredOrders.forEach(order => {
      orderTypes[order.orderType] = (orderTypes[order.orderType] || 0) + 1;
    });

    return {
      totalRevenue,
      totalOrders,
      avgOrderValue,
      salesByDate,
      topItems,
      orderTypes
    };
  };

  const getInventoryData = () => {
    const inventory = db.getAll('inventory');
    
    const totalItems = inventory.length;
    const lowStockItems = inventory.filter(item => item.currentStock <= item.minStock);
    const totalValue = inventory.reduce((sum, item) => sum + (item.currentStock * item.costPerUnit), 0);
    
    // Category breakdown
    const categoryBreakdown = {};
    inventory.forEach(item => {
      if (!categoryBreakdown[item.category]) {
        categoryBreakdown[item.category] = { items: 0, value: 0 };
      }
      categoryBreakdown[item.category].items += 1;
      categoryBreakdown[item.category].value += item.currentStock * item.costPerUnit;
    });

    // Expiring items
    const today = new Date();
    const expiringItems = inventory.filter(item => {
      if (!item.expiryDate) return false;
      const expiry = new Date(item.expiryDate);
      const diffTime = expiry - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays <= 7 && diffDays >= 0;
    });

    return {
      totalItems,
      lowStockItems: lowStockItems.length,
      totalValue,
      categoryBreakdown,
      expiringItems: expiringItems.length
    };
  };

  const getStaffData = () => {
    const users = db.getAll('users');
    const filteredOrders = getFilteredOrders();
    
    const totalStaff = users.length;
    const activeStaff = users.filter(user => user.status === 'active').length;
    
    // Role distribution
    const roleDistribution = {};
    users.forEach(user => {
      roleDistribution[user.role] = (roleDistribution[user.role] || 0) + 1;
    });

    // Orders by cashier (if available)
    const ordersByCashier = {};
    filteredOrders.forEach(order => {
      if (order.cashierId) {
        const cashier = users.find(user => user.id === order.cashierId);
        const cashierName = cashier ? cashier.name : 'Unknown';
        ordersByCashier[cashierName] = (ordersByCashier[cashierName] || 0) + 1;
      }
    });

    return {
      totalStaff,
      activeStaff,
      roleDistribution,
      ordersByCashier
    };
  };

  const exportReport = () => {
    const data = reportType === 'sales' ? getSalesData() : 
                  reportType === 'inventory' ? getInventoryData() : 
                  getStaffData();
    
    const jsonData = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${reportType}-report-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const salesData = getSalesData();
  const inventoryData = getInventoryData();
  const staffData = getStaffData();

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">Track your restaurant's performance and insights</p>
        </div>
        <button
          onClick={exportReport}
          className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors duration-200 flex items-center"
        >
          <Download className="w-5 h-5 mr-2" />
          Export Report
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="sales">Sales Report</option>
              <option value="inventory">Inventory Report</option>
              <option value="staff">Staff Report</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          {dateRange === 'custom' && (
            <div className="flex space-x-2">
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          )}
        </div>
      </div>

      {/* Sales Report */}
      {reportType === 'sales' && (
        <>
          {/* Sales Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-green-600">${salesData.totalRevenue.toFixed(2)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-blue-600">{salesData.totalOrders}</p>
                </div>
                <ShoppingCart className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg Order Value</p>
                  <p className="text-2xl font-bold text-primary-600">${salesData.avgOrderValue.toFixed(2)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-primary-500" />
              </div>
            </div>
          </div>

          {/* Top Selling Items */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Selling Items</h2>
            <div className="space-y-3">
              {salesData.topItems.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <span className="w-6 h-6 bg-primary-500 text-white rounded-full flex items-center justify-center text-sm font-medium mr-3">
                      {index + 1}
                    </span>
                    <div>
                      <p className="font-medium text-gray-900">{item.name}</p>
                      <p className="text-sm text-gray-600">{item.quantity} sold</p>
                    </div>
                  </div>
                  <p className="font-semibold text-gray-900">${item.revenue.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Order Types */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Types Distribution</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(salesData.orderTypes).map(([type, count]) => (
                <div key={type} className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                  <p className="text-sm text-gray-600 capitalize">{type.replace('-', ' ')}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Inventory Report */}
      {reportType === 'inventory' && (
        <>
          {/* Inventory Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Items</p>
                  <p className="text-2xl font-bold text-blue-600">{inventoryData.totalItems}</p>
                </div>
                <Package className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
                  <p className="text-2xl font-bold text-red-600">{inventoryData.lowStockItems}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-red-500" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Value</p>
                  <p className="text-2xl font-bold text-green-600">${inventoryData.totalValue.toFixed(2)}</p>
                </div>
                <DollarSign className="w-8 h-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Expiring Soon</p>
                  <p className="text-2xl font-bold text-orange-600">{inventoryData.expiringItems}</p>
                </div>
                <Clock className="w-8 h-8 text-orange-500" />
              </div>
            </div>
          </div>

          {/* Category Breakdown */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Inventory by Category</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(inventoryData.categoryBreakdown).map(([category, data]) => (
                <div key={category} className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-medium text-gray-900">{category}</h3>
                  <p className="text-sm text-gray-600">{data.items} items</p>
                  <p className="text-lg font-semibold text-gray-900">${data.value.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Staff Report */}
      {reportType === 'staff' && (
        <>
          {/* Staff Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Staff</p>
                  <p className="text-2xl font-bold text-blue-600">{staffData.totalStaff}</p>
                </div>
                <Users className="w-8 h-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Staff</p>
                  <p className="text-2xl font-bold text-green-600">{staffData.activeStaff}</p>
                </div>
                <Users className="w-8 h-8 text-green-500" />
              </div>
            </div>
          </div>

          {/* Role Distribution */}
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Staff by Role</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(staffData.roleDistribution).map(([role, count]) => (
                <div key={role} className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900">{count}</p>
                  <p className="text-sm text-gray-600 capitalize">{role}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Orders by Cashier */}
          {Object.keys(staffData.ordersByCashier).length > 0 && (
            <div className="bg-white rounded-2xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Orders by Cashier</h2>
              <div className="space-y-3">
                {Object.entries(staffData.ordersByCashier).map(([cashier, count]) => (
                  <div key={cashier} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <p className="font-medium text-gray-900">{cashier}</p>
                    <p className="font-semibold text-gray-900">{count} orders</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};