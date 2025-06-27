import { useState, useEffect } from 'react';
import { useDatabase } from '../stores/databaseStore';
import { 
  Table as TableIcon, 
  Users, 
  Clock, 
  CheckCircle,
  XCircle,
  Info,
  Edit,
  Trash2,
  Plus
} from 'lucide-react';
import clsx from 'clsx';

export const Tables = () => {
  const { db } = useDatabase();
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [showTableModal, setShowTableModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [editingTable, setEditingTable] = useState(null);

  useEffect(() => {
    initializeTables();
    loadTables();
  }, []);

  const initializeTables = () => {
    const existingTables = db.getAll('tables');
    if (existingTables.length === 0) {
      // Initialize 12 tables A1-A12
      const initialTables = [];
      for (let i = 1; i <= 12; i++) {
        initialTables.push({
          id: `A${i}`,
          name: `A${i}`,
          capacity: i <= 4 ? 2 : i <= 8 ? 4 : 6, // Varied capacity
          status: 'available', // available, occupied, reserved, maintenance
          currentOrder: null,
          reservedBy: null,
          reservedTime: null,
          shape: i === 5 || i === 9 ? 'rectangular' : i === 10 || i === 11 ? 'bar' : 'square'
        });
      }
      initialTables.forEach(table => db.create('tables', table));
    }
  };

  const loadTables = () => {
    const allTables = db.getAll('tables');
    setTables(allTables);
  };

  const updateTableStatus = (tableId, status, additionalData = {}) => {
    db.update('tables', tableId, { 
      status, 
      ...additionalData,
      updatedAt: new Date().toISOString() 
    });
    loadTables();
  };

  const getTableStatusColor = (status) => {
    switch (status) {
      case 'available': return 'bg-white border-gray-300 text-gray-700';
      case 'occupied': return 'bg-red-500 border-red-600 text-white';
      case 'reserved': return 'bg-gray-800 border-gray-900 text-white';
      case 'maintenance': return 'bg-orange-500 border-orange-600 text-white';
      default: return 'bg-white border-gray-300 text-gray-700';
    }
  };

  const getTableShape = (shape, status) => {
    const baseClasses = `relative flex items-center justify-center cursor-pointer transition-all duration-200 hover:shadow-lg border-2 ${getTableStatusColor(status)}`;
    
    switch (shape) {
      case 'rectangular':
        return `${baseClasses} w-48 h-24 rounded-lg`;
      case 'bar':
        return `${baseClasses} w-16 h-48 rounded-lg`;
      default:
        return `${baseClasses} w-32 h-32 rounded-lg`;
    }
  };

  const handleTableClick = (table) => {
    setSelectedTable(table);
    setShowInfoModal(true);
  };

  const TableComponent = ({ table }) => (
    <div 
      key={table.id}
      className={getTableShape(table.shape, table.status)}
      onClick={() => handleTableClick(table)}
    >
      {/* Table decorative elements */}
      <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gray-400 rounded"></div>
      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gray-400 rounded"></div>
      {table.shape !== 'bar' && (
        <>
          <div className="absolute -left-2 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gray-400 rounded"></div>
          <div className="absolute -right-2 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-gray-400 rounded"></div>
        </>
      )}
      
      {/* Table content */}
      <div className="text-center">
        <div className="font-bold text-lg">{table.name}</div>
        {table.status === 'occupied' && table.currentOrder && (
          <div className="text-xs mt-1">Order #{table.currentOrder.slice(-4)}</div>
        )}
        {table.status === 'reserved' && table.reservedBy && (
          <div className="text-xs mt-1">{table.reservedBy}</div>
        )}
      </div>
    </div>
  );

  const availableTables = tables.filter(t => t.status === 'available').length;
  const occupiedTables = tables.filter(t => t.status === 'occupied').length;
  const reservedTables = tables.filter(t => t.status === 'reserved').length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <TableIcon className="w-8 h-8 text-primary-500" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tables</h1>
            <p className="text-gray-600">Manage restaurant table status and assignments</p>
          </div>
        </div>
      </div>

      {/* Status Legend */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-white border-2 border-gray-300 rounded"></div>
              <span className="text-sm font-medium text-gray-700">Available</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-orange-500 rounded"></div>
              <span className="text-sm font-medium text-gray-700">Not Available</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-gray-800 rounded"></div>
              <span className="text-sm font-medium text-gray-700">Reserved</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-sm">
            <div className="flex items-center space-x-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span>{availableTables} Available</span>
            </div>
            <div className="flex items-center space-x-1">
              <XCircle className="w-4 h-4 text-red-500" />
              <span>{occupiedTables} Occupied</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4 text-gray-500" />
              <span>{reservedTables} Reserved</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tables Grid */}
      <div className="bg-white rounded-2xl p-8 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 place-items-center">
          {tables.map((table) => (
            <TableComponent key={table.id} table={table} />
          ))}
        </div>
      </div>

      {/* Table Info Modal */}
      {showInfoModal && selectedTable && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Table {selectedTable.name}</h2>
              <button
                onClick={() => setShowInfoModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Capacity:</span>
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span className="font-medium">{selectedTable.capacity} people</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-gray-600">Status:</span>
                <span className={clsx(
                  'px-2 py-1 rounded-full text-xs font-medium',
                  selectedTable.status === 'available' && 'bg-green-100 text-green-800',
                  selectedTable.status === 'occupied' && 'bg-red-100 text-red-800',
                  selectedTable.status === 'reserved' && 'bg-gray-100 text-gray-800',
                  selectedTable.status === 'maintenance' && 'bg-orange-100 text-orange-800'
                )}>
                  {selectedTable.status.charAt(0).toUpperCase() + selectedTable.status.slice(1)}
                </span>
              </div>

              {selectedTable.status === 'reserved' && selectedTable.reservedBy && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Reserved by:</span>
                    <span className="font-medium">{selectedTable.reservedBy}</span>
                  </div>
                  {selectedTable.reservedTime && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Time:</span>
                      <span className="font-medium">{selectedTable.reservedTime}</span>
                    </div>
                  )}
                </>
              )}

              {selectedTable.status === 'occupied' && selectedTable.currentOrder && (
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Current Order:</span>
                  <span className="font-medium">#{selectedTable.currentOrder.slice(-6)}</span>
                </div>
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              {selectedTable.status === 'available' && (
                <>
                  <button
                    onClick={() => {
                      updateTableStatus(selectedTable.id, 'occupied', {
                        currentOrder: `order_${Date.now()}`
                      });
                      setShowInfoModal(false);
                    }}
                    className="flex-1 bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors duration-200"
                  >
                    Mark Occupied
                  </button>
                  <button
                    onClick={() => {
                      updateTableStatus(selectedTable.id, 'maintenance');
                      setShowInfoModal(false);
                    }}
                    className="flex-1 bg-orange-500 text-white py-2 px-4 rounded-lg hover:bg-orange-600 transition-colors duration-200"
                  >
                    Maintenance
                  </button>
                </>
              )}

              {selectedTable.status === 'occupied' && (
                <button
                  onClick={() => {
                    updateTableStatus(selectedTable.id, 'available', {
                      currentOrder: null
                    });
                    setShowInfoModal(false);
                  }}
                  className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors duration-200"
                >
                  Mark Available
                </button>
              )}

              {(selectedTable.status === 'reserved' || selectedTable.status === 'maintenance') && (
                <button
                  onClick={() => {
                    updateTableStatus(selectedTable.id, 'available', {
                      reservedBy: null,
                      reservedTime: null
                    });
                    setShowInfoModal(false);
                  }}
                  className="flex-1 bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors duration-200"
                >
                  Mark Available
                </button>
              )}

              <button
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};