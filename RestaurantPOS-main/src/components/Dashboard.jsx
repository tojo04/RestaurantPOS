import { useAuthStore } from '../stores/authStore';
import { usePOSStore } from '../stores/posStore';
import { 
  TrendingUp, 
  Users, 
  ShoppingCart, 
  DollarSign,
  Clock,
  AlertTriangle,
  Package,
  Star
} from 'lucide-react';
import { format } from 'date-fns';

export const Dashboard = () => {
  const { user } = useAuthStore();
  const { orders, inventory } = usePOSStore();

  // Calculate stats
  const todayOrders = orders.filter(order => 
    format(new Date(order.createdAt), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
  );
  
  const todayRevenue = todayOrders.reduce((sum, order) => sum + order.total, 0);
  const avgOrderValue = todayOrders.length > 0 ? todayRevenue / todayOrders.length : 0;
  
  const lowStockItems = inventory.filter(item => item.currentStock <= item.minStock);
  
  const recentOrders = orders.slice(0, 5);

  const stats = [
    {
      title: 'Today\'s Revenue',
      value: `₹${todayRevenue.toFixed(2)}`,
      change: '+12.5%',
      icon: DollarSign,
      color: 'text-green-600 bg-green-100'
    },
    {
      title: 'Orders Today',
      value: todayOrders.length.toString(),
      change: '+8.2%',
      icon: ShoppingCart,
      color: 'text-blue-600 bg-blue-100'
    },
    {
      title: 'Avg Order Value',
      value: `₹${avgOrderValue.toFixed(2)}`,
      change: '+5.1%',
      icon: TrendingUp,
      color: 'text-primary-600 bg-primary-100'
    },
    {
      title: 'Low Stock Alerts',
      value: lowStockItems.length.toString(),
      change: lowStockItems.length > 0 ? 'Attention needed' : 'All good',
      icon: AlertTriangle,
      color: lowStockItems.length > 0 ? 'text-red-600 bg-red-100' : 'text-green-600 bg-green-100'
    }
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'preparing': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900">
          {getGreeting()}, {user?.name}!
        </h1>
        <p className="text-gray-600 mt-1">
          Here's what's happening at your restaurant today.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <p className="text-sm text-gray-500 mt-1">{stat.change}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Recent Orders</h2>
            <Clock className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">
                      Order #{order.id.slice(-6)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {order.customerName || 'Walk-in'} • {order.items.length} items
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">${order.total.toFixed(2)}</p>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">No orders yet today</p>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Inventory Alerts</h2>
            <Package className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="space-y-4">
            {lowStockItems.length > 0 ? (
              lowStockItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-red-50 rounded-xl border border-red-200">
                  <div>
                    <p className="font-medium text-gray-900">{item.name}</p>
                    <p className="text-sm text-red-600">
                      Only {item.currentStock} {item.unit} remaining
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      Low Stock
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Star className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-green-600 font-medium">All items well stocked!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      {(user?.role === 'admin' || user?.role === 'manager' || user?.role === 'cashier') && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center justify-center p-4 bg-primary-50 hover:bg-primary-100 text-primary-600 rounded-xl transition-colors duration-200">
              <ShoppingCart className="w-5 h-5 mr-2" />
              Start New Order
            </button>
            <button className="flex items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-xl transition-colors duration-200">
              <Package className="w-5 h-5 mr-2" />
              Check Inventory
            </button>
            <button className="flex items-center justify-center p-4 bg-green-50 hover:bg-green-100 text-green-600 rounded-xl transition-colors duration-200">
              <TrendingUp className="w-5 h-5 mr-2" />
              View Reports
            </button>
          </div>
        </div>
      )}
    </div>
  );
};