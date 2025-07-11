const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Socket authentication middleware
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user || user.status !== 'active') {
      return next(new Error('Authentication error: Invalid user'));
    }

    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Authentication error: Invalid token'));
  }
};

const socketHandler = (io) => {
  // Authentication middleware
  io.use(authenticateSocket);

  io.on('connection', (socket) => {
    console.log(`🔌 User ${socket.user.name} connected (${socket.user.role})`);

    // Join role-based rooms
    socket.join(socket.user.role);
    socket.join(`user_${socket.user._id}`);

    // Join kitchen room for kitchen staff and managers
    if (['kitchen', 'manager', 'admin'].includes(socket.user.role)) {
      socket.join('kitchen');
    }

    // Join cashier room for cashiers, managers, and admins
    if (['cashier', 'manager', 'admin'].includes(socket.user.role)) {
      socket.join('cashier');
    }

    // Send welcome message with user info
    socket.emit('connected', {
      message: 'Connected to RestaurantPOS',
      user: {
        id: socket.user._id,
        name: socket.user.name,
        role: socket.user.role
      },
      timestamp: new Date().toISOString()
    });

    // Order Events
    socket.on('order:create', (orderData) => {
      console.log(`📝 New order created by ${socket.user.name}:`, orderData.orderNumber);
      
      // Notify kitchen staff about new order
      socket.to('kitchen').emit('order:new', {
        order: orderData,
        message: `New order ${orderData.orderNumber} received`,
        timestamp: new Date().toISOString()
      });

      // Notify managers and admins
      socket.to('manager').emit('order:new', {
        order: orderData,
        message: `New order ${orderData.orderNumber} created by ${socket.user.name}`,
        timestamp: new Date().toISOString()
      });
    });

    socket.on('order:update', (orderData) => {
      console.log(`📋 Order ${orderData.orderNumber} updated by ${socket.user.name}`);
      
      // Notify all relevant users about order update
      io.emit('order:updated', {
        order: orderData,
        updatedBy: socket.user.name,
        timestamp: new Date().toISOString()
      });

      // Special notifications for status changes
      if (orderData.status === 'ready') {
        socket.to('cashier').emit('order:ready', {
          order: orderData,
          message: `Order ${orderData.orderNumber} is ready for pickup`,
          timestamp: new Date().toISOString()
        });
      }
    });

    socket.on('order:status', (data) => {
      const { orderId, status, notes } = data;
      console.log(`🔄 Order ${orderId} status changed to ${status} by ${socket.user.name}`);
      
      // Broadcast status change to all connected clients
      io.emit('order:status_changed', {
        orderId,
        status,
        notes,
        updatedBy: socket.user.name,
        timestamp: new Date().toISOString()
      });
    });

    // Kitchen Events
    socket.on('kitchen:order_start', (orderData) => {
      console.log(`👨‍🍳 Kitchen started preparing order ${orderData.orderNumber}`);
      
      io.emit('kitchen:order_started', {
        order: orderData,
        chef: socket.user.name,
        timestamp: new Date().toISOString()
      });
    });

    socket.on('kitchen:order_complete', (orderData) => {
      console.log(`✅ Kitchen completed order ${orderData.orderNumber}`);
      
      // Notify cashiers that order is ready
      socket.to('cashier').emit('kitchen:order_ready', {
        order: orderData,
        message: `Order ${orderData.orderNumber} is ready for pickup`,
        completedBy: socket.user.name,
        timestamp: new Date().toISOString()
      });

      // Notify all users about completion
      io.emit('kitchen:order_completed', {
        order: orderData,
        completedBy: socket.user.name,
        timestamp: new Date().toISOString()
      });
    });

    // Table Events
    socket.on('table:update', (tableData) => {
      console.log(`🪑 Table ${tableData.tableNumber} updated by ${socket.user.name}`);
      
      io.emit('table:updated', {
        table: tableData,
        updatedBy: socket.user.name,
        timestamp: new Date().toISOString()
      });
    });

    socket.on('table:occupy', (tableData) => {
      console.log(`🪑 Table ${tableData.tableNumber} occupied`);
      
      io.emit('table:occupied', {
        table: tableData,
        occupiedBy: socket.user.name,
        timestamp: new Date().toISOString()
      });
    });

    socket.on('table:free', (tableData) => {
      console.log(`🪑 Table ${tableData.tableNumber} freed`);
      
      io.emit('table:freed', {
        table: tableData,
        freedBy: socket.user.name,
        timestamp: new Date().toISOString()
      });
    });

    // Inventory Events
    socket.on('inventory:low_stock', (inventoryData) => {
      console.log(`📦 Low stock alert for ${inventoryData.name}`);
      
      // Notify managers and admins about low stock
      socket.to('manager').emit('inventory:low_stock_alert', {
        item: inventoryData,
        reportedBy: socket.user.name,
        timestamp: new Date().toISOString()
      });
    });

    socket.on('inventory:update', (inventoryData) => {
      console.log(`📦 Inventory ${inventoryData.name} updated by ${socket.user.name}`);
      
      // Notify managers and admins about inventory changes
      socket.to('manager').emit('inventory:updated', {
        item: inventoryData,
        updatedBy: socket.user.name,
        timestamp: new Date().toISOString()
      });
    });

    // Reservation Events
    socket.on('reservation:create', (reservationData) => {
      console.log(`📅 New reservation ${reservationData.reservationNumber} created`);
      
      io.emit('reservation:created', {
        reservation: reservationData,
        createdBy: socket.user.name,
        timestamp: new Date().toISOString()
      });
    });

    socket.on('reservation:update', (reservationData) => {
      console.log(`📅 Reservation ${reservationData.reservationNumber} updated`);
      
      io.emit('reservation:updated', {
        reservation: reservationData,
        updatedBy: socket.user.name,
        timestamp: new Date().toISOString()
      });
    });

    // User Events
    socket.on('user:typing', (data) => {
      socket.broadcast.emit('user:typing', {
        user: socket.user.name,
        location: data.location,
        timestamp: new Date().toISOString()
      });
    });

    socket.on('user:stop_typing', () => {
      socket.broadcast.emit('user:stop_typing', {
        user: socket.user.name,
        timestamp: new Date().toISOString()
      });
    });

    // System Events
    socket.on('system:notification', (data) => {
      if (['admin', 'manager'].includes(socket.user.role)) {
        io.emit('system:notification', {
          ...data,
          sentBy: socket.user.name,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Error handling
    socket.on('error', (error) => {
      console.error(`Socket error for user ${socket.user.name}:`, error);
      socket.emit('error', {
        message: 'An error occurred',
        timestamp: new Date().toISOString()
      });
    });

    // Disconnect handling
    socket.on('disconnect', (reason) => {
      console.log(`🔌 User ${socket.user.name} disconnected: ${reason}`);
      
      // Notify other users about disconnection (optional)
      socket.broadcast.emit('user:disconnected', {
        user: socket.user.name,
        role: socket.user.role,
        reason,
        timestamp: new Date().toISOString()
      });
    });

    // Ping/Pong for connection health
    socket.on('ping', () => {
      socket.emit('pong', {
        timestamp: new Date().toISOString()
      });
    });
  });

  // Handle connection errors
  io.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  console.log('🔌 Socket.IO server initialized');
};

module.exports = socketHandler;