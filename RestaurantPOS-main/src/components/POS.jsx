import { useState } from 'react';
import { usePOSStore } from '../stores/posStore';
import { ShoppingCart, Plus, Minus, Trash2, CreditCard } from 'lucide-react';
import clsx from 'clsx';

export const POS = () => {
  const { 
    menuItems, 
    currentOrder, 
    addToOrder, 
    updateOrderItem, 
    removeFromOrder, 
    clearOrder, 
    completeOrder 
  } = usePOSStore();
  
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [customerName, setCustomerName] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [orderType, setOrderType] = useState('dine-in');

  const categories = ['All', ...Array.from(new Set(menuItems.map(item => item.category)))];
  
  const filteredItems = selectedCategory === 'All' 
    ? menuItems 
    : menuItems.filter(item => item.category === selectedCategory);

  const total = currentOrder.reduce((sum, item) => sum + (item.menuItem.price * item.quantity), 0);
  const tax = total * 0.08; // 8% tax
  const finalTotal = total + tax;

  const handleCompleteOrder = () => {
    if (currentOrder.length === 0) return;
    
    completeOrder(
      customerName || undefined,
      tableNumber ? parseInt(tableNumber) : undefined,
      orderType
    );
    
    setCustomerName('');
    setTableNumber('');
    setOrderType('dine-in');
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Menu Items */}
      <div className="flex-1 p-6">
        <div className="bg-white rounded-2xl shadow-sm h-full">
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Menu</h1>
            
            {/* Category Filter */}
            <div className="flex space-x-2 overflow-x-auto">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={clsx(
                    'px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors duration-200',
                    selectedCategory === category
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* Menu Grid */}
          <div className="p-6 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow duration-200 cursor-pointer"
                  onClick={() => addToOrder(item)}
                >
                  <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg mb-3">
                    <div className="flex items-center justify-center text-gray-400">
                      <span className="text-sm">No image</span>
                    </div>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{item.description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-primary-600">₹{item.price.toFixed(2)}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        addToOrder(item);
                      }}
                      className="w-8 h-8 bg-primary-500 text-white rounded-lg flex items-center justify-center hover:bg-primary-600 transition-colors duration-200"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Order Summary */}
      <div className="w-96 p-6">
        <div className="bg-white rounded-2xl shadow-sm h-full flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-2 mb-4">
              <ShoppingCart className="w-6 h-6 text-primary-500" />
              <h2 className="text-xl font-semibold text-gray-900">Current Order</h2>
            </div>

            {/* Order Type */}
            <div className="grid grid-cols-3 gap-2">
              {(['dine-in', 'takeout', 'delivery']).map((type) => (
                <button
                  key={type}
                  onClick={() => setOrderType(type)}
                  className={clsx(
                    'px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200',
                    orderType === type
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  )}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1).replace('-', ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Customer Info */}
          <div className="p-6 border-b border-gray-200">
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Customer name (optional)"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {orderType === 'dine-in' && (
                <input
                  type="number"
                  placeholder="Table number (optional)"
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              )}
            </div>
          </div>

          {/* Order Items */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {currentOrder.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No items in order</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {currentOrder.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">{item.menuItem.name}</h4>
                        <p className="text-sm text-gray-600">₹{item.menuItem.price.toFixed(2)} each</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateOrderItem(item.id, item.quantity - 1)}
                          className="w-6 h-6 bg-gray-200 text-gray-600 rounded flex items-center justify-center hover:bg-gray-300"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateOrderItem(item.id, item.quantity + 1)}
                          className="w-6 h-6 bg-gray-200 text-gray-600 rounded flex items-center justify-center hover:bg-gray-300"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => removeFromOrder(item.id)}
                          className="w-6 h-6 bg-red-100 text-red-600 rounded flex items-center justify-center hover:bg-red-200 ml-2"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Order Total */}
          {currentOrder.length > 0 && (
            <div className="p-6 border-t border-gray-200">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span>₹{total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Tax (8%)</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-lg font-semibold text-gray-900 border-t pt-2">
                  <span>Total</span>
                  <span>₹{finalTotal.toFixed(2)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <button
                  onClick={handleCompleteOrder}
                  className="w-full bg-primary-500 text-white py-3 px-4 rounded-lg hover:bg-primary-600 transition-colors duration-200 font-medium flex items-center justify-center"
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  Complete Order
                </button>
                <button
                  onClick={clearOrder}
                  className="w-full bg-gray-100 text-gray-600 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
                >
                  Clear Order
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};