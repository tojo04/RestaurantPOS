import { usePOSStore } from '../stores/posStore';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';

export const Kitchen = () => {
  const { orders, updateOrderStatus } = usePOSStore();

  const kitchenOrders = orders.filter(order => 
    ['pending', 'preparing'].includes(order.status)
  );

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'border-l-yellow-500 bg-yellow-50';
      case 'preparing': return 'border-l-blue-500 bg-blue-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const getOrderAge = (createdAt) => {
    const orderTime = new Date(createdAt);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    return formatDistanceToNow(orderTime, { addSuffix: true });
  };

  const isOrderUrgent = (createdAt) => {
    const orderTime = new Date(createdAt);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - orderTime.getTime()) / (1000 * 60));
    return diffInMinutes > 15; // Orders older than 15 minutes are urgent
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Kitchen Display</h1>
        <p className="text-gray-600 mt-1">
          {kitchenOrders.length} orders in queue
        </p>
      </div>

      {kitchenOrders.length === 0 ? (
        <div className="bg-white rounded-2xl p-12 text-center shadow-sm">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">All caught up!</h2>
          <p className="text-gray-600">No orders in the kitchen queue.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {kitchenOrders.map((order) => (
            <div
              key={order.id}
              className={clsx(
                'bg-white rounded-2xl p-6 shadow-sm border-l-4',
                getStatusColor(order.status),
                isOrderUrgent(order.createdAt) && 'ring-2 ring-red-200'
              )}
            >
              {/* Order Header */}
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Order #{order.id.slice(-6)}
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>{getOrderAge(order.createdAt)}</span>
                    {isOrderUrgent(order.createdAt) && (
                      <AlertCircle className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">
                    {order.orderType.charAt(0).toUpperCase() + order.orderType.slice(1).replace('-', ' ')}
                  </p>
                  {order.tableNumber && (
                    <p className="text-sm font-medium text-gray-900">
                      Table {order.tableNumber}
                    </p>
                  )}
                  {order.customerName && (
                    <p className="text-sm text-gray-600">{order.customerName}</p>
                  )}
                </div>
              </div>

              {/* Order Items */}
              <div className="space-y-2 mb-6">
                {order.items.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{item.menuItem.name}</p>
                      {item.notes && (
                        <p className="text-sm text-gray-600 italic">Note: {item.notes}</p>
                      )}
                    </div>
                    <span className="bg-white px-2 py-1 rounded text-sm font-medium text-gray-900">
                      {item.quantity}x
                    </span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="space-y-2">
                {order.status === 'pending' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'preparing')}
                    className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors duration-200 font-medium"
                  >
                    Start Preparing
                  </button>
                )}
                
                {order.status === 'preparing' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'ready')}
                    className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors duration-200 font-medium"
                  >
                    Mark as Ready
                  </button>
                )}

                <div className="text-xs text-gray-500 text-center">
                  Order time: {format(new Date(order.createdAt), 'HH:mm')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};