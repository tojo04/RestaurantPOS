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

  const loadReservations =async () => {
  const allReservationsRaw =await db.getAll('reservations');
  const allReservations = Array.isArray(allReservationsRaw) ? allReservationsRaw : [];

  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const dayReservations = allReservations.filter(res => res.date === dateStr);
  setReservations(dayReservations);
};

  const loadTables =async () => {
    const allTables =await db.getAll('tables');
    setTables(allTables);
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  const reservationData = {
    ...formData,
    status: 'confirmed',
    createdAt: new Date().toISOString()
  };

  const existingReservations = await db.getAll('reservations');

  // Skip checking current reservation if updating
  const filteredReservations = existingReservations.filter(r =>
    r.tableId === formData.tableId &&
    r.date === formData.date &&
    (!editingReservation || r.id !== editingReservation.id)
  );

  const newStart = new Date(`${formData.date}T${formData.time}`);
  const newEnd = new Date(newStart.getTime() + formData.duration * 60000);

  const isConflict = filteredReservations.some(res => {
    const existingStart = new Date(`${res.date}T${res.time}`);
    const existingEnd = new Date(existingStart.getTime() + (res.duration || 120) * 60000);
    
    return (
      (newStart < existingEnd) && (newEnd > existingStart)
    );
  });

  if (isConflict) {
    alert('This table is already reserved for the selected time and duration.');
    return;
  }

  if (editingReservation) {
    await db.update('reservations', editingReservation.id, reservationData);
  } else {
    await db.create('reservations', { id: crypto.randomUUID(), ...reservationData });
  }

  // Update table status if reservation is for today
  const today = format(new Date(), 'yyyy-MM-dd');
  if (formData.date === today) {
    await db.update('tables', formData.tableId, {
      status: 'reserved',
      reservedBy: formData.customerName,
      reservedTime: formData.time
    });
  }

  await loadReservations();
  await loadTables();
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
          <CalendarIcon className="w-8 h-8 text-blue-600" />
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
          className="bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center"
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
        <div className="overflow-x-auto">
          <div className="reservation-grid">
            {/* Header Row */}
            <div className="reservation-header">
              <div className="table-header-cell">
                <span className="text-sm font-semibold text-gray-900">Table</span>
              </div>
              {timeSlots.map((time) => (
                <div key={time} className="time-header-cell">
                  <span className="text-xs font-medium text-gray-700">{time}</span>
                </div>
              ))}
            </div>

            {/* Table Rows */}
            <div className="reservation-body">
              {tableIds.map((tableId) => (
                <div key={tableId} className="table-row">
                  <div className="table-name-cell">
                    <span className="text-sm font-semibold text-white">{tableId}</span>
                  </div>
                  {timeSlots.map((time) => {
                    const reservation = getReservationForSlot(tableId, time);
                    const isReserved = isSlotReserved(tableId, time);
                    
                    return (
                      <div key={`${tableId}-${time}`} className="time-slot-cell">
                        {isReserved && reservation ? (
                          <div 
                            className="reservation-block"
                            onClick={() => handleEdit(reservation)}
                            title={`${reservation.customerName} - ${reservation.partySize} people`}
                          >
                            <div className="reservation-info">
                              <div className="customer-name">
                                {reservation.customerName}
                              </div>
                              <div className="party-size">
                                {reservation.partySize}p
                              </div>
                            </div>
                          </div>
                        ) : null}
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.customerPhone}
                    onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
                <input
                  type="email"
                  value={formData.customerEmail}
                  onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                  <select
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                >
                  {editingReservation ? 'Update' : 'Create'} Reservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .reservation-grid {
          display: table;
          width: 100%;
          min-width: 1400px;
          border-collapse: separate;
          border-spacing: 0;
        }

        .reservation-header {
          display: table-row;
          background-color: #f9fafb;
        }

        .table-header-cell {
          display: table-cell;
          width: 80px;
          min-width: 80px;
          max-width: 80px;
          padding: 12px 8px;
          text-align: center;
          vertical-align: middle;
          border-right: 1px solid #e5e7eb;
          border-bottom: 1px solid #e5e7eb;
          background-color: #f9fafb;
          position: sticky;
          left: 0;
          z-index: 10;
        }

        .time-header-cell {
          display: table-cell;
          width: 60px;
          min-width: 60px;
          max-width: 60px;
          padding: 8px 4px;
          text-align: center;
          vertical-align: middle;
          border-right: 1px solid #e5e7eb;
          border-bottom: 1px solid #e5e7eb;
          background-color: #f9fafb;
        }

        .reservation-body {
          display: table-row-group;
        }

        .table-row {
          display: table-row;
        }

        .table-row:hover {
          background-color: #f9fafb;
        }

        .table-name-cell {
          display: table-cell;
          width: 80px;
          min-width: 80px;
          max-width: 80px;
          padding: 12px 8px;
          text-align: center;
          vertical-align: middle;
          border-right: 1px solid #e5e7eb;
          border-bottom: 1px solid #e5e7eb;
          background-color: #1f2937;
          position: sticky;
          left: 0;
          z-index: 5;
        }

        .time-slot-cell {
          display: table-cell;
          width: 60px;
          min-width: 60px;
          max-width: 60px;
          height: 60px;
          padding: 4px;
          text-align: center;
          vertical-align: middle;
          border-right: 1px solid #e5e7eb;
          border-bottom: 1px solid #e5e7eb;
          position: relative;
        }

        .reservation-block {
          width: 100%;
          height: 52px;
          background-color: #d1d5db;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 4px;
        }

        .reservation-block:hover {
          background-color: #9ca3af;
          transform: scale(1.02);
        }

        .reservation-info {
          text-align: center;
          overflow: hidden;
        }

        .customer-name {
          font-size: 10px;
          font-weight: 600;
          color: #374151;
          line-height: 1.2;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: 48px;
        }

        .party-size {
          font-size: 9px;
          color: #6b7280;
          line-height: 1;
          margin-top: 2px;
        }
      `}</style>
    </div>
  );
};