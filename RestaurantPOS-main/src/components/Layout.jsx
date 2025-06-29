import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  BarChart3, 
  Users, 
  Settings, 
  LogOut,
  ChefHat,
  Calendar,
  Table
} from 'lucide-react';
import clsx from 'clsx';

export const Layout = ({ children }) => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const navigationItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'cashier', 'kitchen'] },
    { path: '/pos', label: 'POS', icon: ShoppingCart, roles: ['admin', 'manager', 'cashier'] },
    { path: '/kitchen', label: 'Kitchen', icon: ChefHat, roles: ['admin', 'manager', 'kitchen'] },
    { path: '/tables', label: 'Tables', icon: Table, roles: ['admin', 'manager', 'cashier'] },
    { path: '/reservations', label: 'Reservations', icon: Calendar, roles: ['admin', 'manager', 'cashier'] },
    { path: '/inventory', label: 'Inventory', icon: Package, roles: ['admin', 'manager'] },
    { path: '/reports', label: 'Reports', icon: BarChart3, roles: ['admin', 'manager'] },
    { path: '/users', label: 'Users', icon: Users, roles: ['admin'] },
    { path: '/settings', label: 'Settings', icon: Settings, roles: ['admin', 'manager'] },
  ];

  const allowedItems = navigationItems.filter(item => 
    user && item.roles.includes(user.role)
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg flex flex-col">
        {/* Logo Section */}
        <div className="p-6 border-b border-gray-200">
          <Link to="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <ChefHat className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">GrillBill</span>
          </Link>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 py-6">
          <div className="space-y-1 px-3">
            {allowedItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={clsx(
                    'flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors duration-200',
                    isActive
                      ? 'text-primary-600 bg-primary-50 border-r-2 border-primary-500'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  )}
                >
                  <Icon className="w-5 h-5 mr-3" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User Profile Section */}
        <div className="border-t border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-primary-600">
                {user?.name.charAt(0)}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors duration-200"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
};