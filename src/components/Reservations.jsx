import { useState, useEffect } from 'react';
import { useDatabase } from '../stores/databaseStore';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  Clock, 
  Users, 
  Phone, 
  Mail,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format, addDays, subDays, startOfDay } from 'date-fns';

export const Reservations = () => {
  const { db } = useDatabase();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [reservations, setReservations] = useState([]);
  const [tables, setTables] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingReservation, setEditingReservation] = useState(null);
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    tableId: '',
    date: '',
    time: '',
    duration: 120, // minutes
    partySize: 2,
    notes: ''
  });

  // Time slots from 10:00 to 21:00 in 30-minute intervals
  const timeSlots = [];
  for (let hour = 10; hour <= 21; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      if (hour === 21 && minute > 0) break; // Stop at 21:00
      const time = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeSlots.push(time);
    }
  }

  // Table IDs A1 to A12
  const tableIds = Array.from({ length: 12 }, (_, i) => `A${i + 1}`);

  useEffect(() => {
    initializeTables();
    loadReservations();
    loadTables();
  }, [selectedDate]);

  const initializeTables = () => {
    const existingTables = db.getAll('tables');
    if (existingTables.length === 0) {
      const initialTables = [];
      for (let i = 1; i <= 12; i++) {
        initialTables.push({
          id: `A${i}`,
          name: `A${i}`,
          capacity: i <= 4 ? 2 : i <= 8 ? 4 : 6,
          status: 'available'
        });
      }
      initialTables.forEach(table => db.create('tables', table));
    }
  };

  const loadReservations = () => {
    const allReservations = db.getAll('reservations');
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const dayReservations = allReservations.filter(res => res.date === dateStr);
    setReservations(dayReservations);
  };

  const loadTables = () => {
    const allTables = db.getAll('tables');
    setTables(allTables);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const reservationData = {
      ...formData,
      status: 'confirmed',
      createdAt: new Date().toISOString()
    };

    if (editingReservation) {
      db.update('reservations', editingReservation.id, reservationData);
    } else {
      db.create('reservations', reservationData);
    }

    // Update table status if reservation is for today
    const today = format(new Date(), 'yyyy-MM-dd');
    if (formData.date === today) {
      db.update('tables', formData.tableId, {
        status: 'reserved',
        reservedBy: formData.customerName,
        reservedTime: formData.time
      });
    }

    loadReservations();
    loadTables();
    resetForm();
  };

  const handleEdit = (reservation) => {
    setEditingReservation(reservation);
    setFormData({
      customerName: reservation.customerName,
      customerPhone: reservation.customerPhone || '',
      customerEmail: reservation.customerEmail || '',
      tableId: reservation.tableId,
      date: reservation.date,
      time: reservation.time,
      duration: reservation.duration || 120,
      partySize: reservation.partySize,
      notes: reservation.notes || ''
    });
    setShowAddModal(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this reservation?')) {
      const reservation = reservations.find(r => r.id === id);
      db.delete('reservations', id);
      
      // Update table status if needed
      if (reservation) {
        const today = format(new Date(), 'yyyy-MM-dd');
        if (reservation.date === today) {
          db.update('tables', reservation.tableId, {
            status: 'available',
            reservedBy: null,
            reservedTime: null
          });
        }
      }
      
      loadReservations();
      loadTables();
    }
  };

  const resetForm = () => {
    setFormData({
      customerName: '',
      customerPhone: '',
      customerEmail: '',
      tableId: '',
      date: format(selectedDate, 'yyyy-MM-dd'),
      time: '',
      duration: 120,
      partySize: 2,
      notes: ''
    });
    setEditingReservation(null);
    setShowAddModal(false);
  };

  const isSlotReserved = (tableId, time) => {
    return reservations.some(res => 
      res.tableId === tableId && 
      res.time === time && 
      res.status === 'confirmed'
    );
  };

  const getReservationForSlot = (tableId, time) => {
    return reservations.find(res => 
      res.tableId === tableId && 
      res.time === time && 
      res.status === 'confirmed'
    );
  };

  const navigateDate = (direction) => {
    if (direction === 'prev') {
      setSelectedDate(subDays(selectedDate, 1));
    } else {
      setSelectedDate(addDays(selectedDate, 1));
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <CalendarIcon className="w-8 h-8 text-primary-500" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Reservations</h1>
            <p className="text-gray-600">Manage table reservations and bookings</p>
          </div>
        </div>
        <button
          onClick={() => {
            setFormData({ ...formData, date: format(selectedDate, 'yyyy-MM-dd') });
            setShowAddModal(true);
          }}
          className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors duration-200 flex items-center"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add New Reservation
        </button>
      </div>

      {/* Date Navigation */}
      <div className="bg-white rounded-2xl p-6 shadow-sm">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateDate('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          
          <div className="bg-white px-6 py-2 rounded-lg border border-gray-200 shadow-sm">
            <span className="text-lg font-semibold text-gray-900">
              {format(selectedDate, 'EEEE, MMMM d, yyyy')}
            </span>
          </div>
          
          <button
            onClick={() => navigateDate('next')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Reservation Grid */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-auto">
          <div className="min-w-[1200px]">
            {/* Header Row */}
            <div className="grid grid-cols-[100px_repeat(23,_1fr)] border-b border-gray-200">
              <div className="p-4 bg-gray-50 font-medium text-gray-900 border-r border-gray-200">
                Table
              </div>
              {timeSlots.map((time) => (
                <div key={time} className="p-2 bg-gray-50 text-center text-sm font-medium text-gray-900 border-r border-gray-200">
                  {time}
                </div>
              ))}
            </div>

            {/* Table Rows */}
            <div className="max-h-[600px] overflow-y-auto">
              {tableIds.map((tableId) => (
                <div key={tableId} className="grid grid-cols-[100px_repeat(23,_1fr)] border-b border-gray-200 hover:bg-gray-50">
                  <div className="p-4 bg-gray-900 text-white font-medium border-r border-gray-200 flex items-center justify-center">
                    {tableId}
                  </div>
                  {timeSlots.map((time) => {
                    const reservation = getReservationForSlot(tableId, time);
                    const isReserved = isSlotReserved(tableId, time);
                    
                    return (
                      <div 
                        key={`${tableId}-${time}`} 
                        className="p-2 border-r border-gray-200 min-h-[60px] flex items-center justify-center"
                      >
                        {isReserved && reservation ? (
                          <div 
                            className="w-full h-full bg-gray-300 rounded-lg p-2 cursor-pointer hover:bg-gray-400 transition-colors duration-200 flex items-center justify-center"
                            onClick={() => handleEdit(reservation)}
                            title={`${reservation.customerName} - ${reservation.partySize} people`}
                          >
                            <div className="text-center">
                              <div className="text-xs font-medium text-gray-800 truncate">
                                {reservation.customerName}
                              </div>
                              <div className="text-xs text-gray-600">
                                {reservation.partySize}p
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {/* Empty slot */}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Reservation Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingReservation ? 'Edit Reservation' : 'Add New Reservation'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
                <input
                  type="text"
                  required
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Party Size</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="12"
                    value={formData.partySize}
                    onChange={(e) => setFormData({ ...formData, partySize: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
                <input
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <select
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select Time</option>
                    {timeSlots.map(time => (
                      <option key={time} value={time}>{time}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Table</label>
                  <select
                    required
                    value={formData.tableId}
                    onChange={(e) => setFormData({ ...formData, tableId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select Table</option>
                    {tableIds.map(tableId => (
                      <option key={tableId} value={tableId}>{tableId}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Duration (min)</label>
                  <select
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value={60}>1 hour</option>
                    <option value={90}>1.5 hours</option>
                    <option value={120}>2 hours</option>
                    <option value={150}>2.5 hours</option>
                    <option value={180}>3 hours</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors duration-200"
                >
                  {editingReservation ? 'Update' : 'Create'} Reservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};