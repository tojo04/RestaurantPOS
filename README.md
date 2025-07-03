# RestaurantPOS - Complete Restaurant Management System

A comprehensive, modern restaurant management system built with React, featuring point-of-sale operations, inventory management, staff administration, and detailed analytics. This production-ready application includes role-based access control, real-time order tracking, and a complete suite of restaurant management tools.

![RestaurantPOS Dashboard](https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg?auto=compress&cs=tinysrgb&w=1200&h=600&fit=crop)

## 🚀 Features

### 🔐 Authentication & Authorization
- **Role-Based Access Control (RBAC)** with 4 user roles:
  - **Admin**: Full system access
  - **Manager**: Operations and reporting access
  - **Cashier**: POS and table management
  - **Kitchen**: Order management and kitchen display
- Secure login/logout system
- Protected routes based on user permissions
- Session management

### 💳 Point of Sale (POS)
- Intuitive order creation interface
- Menu item management with categories
- Real-time order calculations with tax
- Multiple order types (dine-in, takeout, delivery)
- Order modification and cancellation
- Receipt generation

### 🍽️ Kitchen Management
- Kitchen Display System (KDS)
- Real-time order queue management
- Order status tracking (pending → preparing → ready)
- Time-based order prioritization
- Visual alerts for urgent orders

### 🪑 Table Management
- Interactive table layout with 12 tables (A1-A12)
- Real-time table status tracking
- Visual table representations with different shapes
- Table reservation integration
- Occupancy management

### 📅 Reservation System
- Grid-based reservation interface
- Time slot management (10:00 AM - 9:00 PM)
- Customer information tracking
- Reservation status management
- Date navigation and filtering

### 📦 Inventory Management
- Comprehensive stock tracking
- Low stock alerts and notifications
- Expiry date monitoring
- Category-based organization
- Supplier management
- Cost tracking and valuation
- Automated restock notifications

### 👥 User Management
- Staff account creation and management
- Role assignment and permissions
- Employee information tracking
- Payroll information
- User status management (active/inactive)
- Performance tracking

### 📊 Reports & Analytics
- **Sales Reports**: Revenue tracking, order analysis, top-selling items
- **Inventory Reports**: Stock levels, category breakdown, expiring items
- **Staff Reports**: Performance metrics, role distribution
- Date range filtering and custom reports
- Export functionality (JSON format)
- Real-time dashboard with key metrics

### ⚙️ Settings & Configuration
- Restaurant information management
- POS system preferences
- Notification settings
- Security configurations
- Theme and display options
- Tax rate and currency settings

## 🛠️ Technology Stack

### Frontend
- **React 18** - Modern React with hooks and functional components
- **React Router DOM** - Client-side routing and navigation
- **Tailwind CSS** - Utility-first CSS framework for styling
- **Lucide React** - Beautiful icon library
- **React Hook Form** - Performant form management
- **Zustand** - Lightweight state management
- **Date-fns** - Modern date utility library
- **Clsx** - Conditional className utility

### Development Tools
- **Vite** - Fast build tool and development server
- **ESLint** - Code linting and quality assurance
- **PostCSS** - CSS processing with Autoprefixer
- **Hot Module Replacement (HMR)** - Fast development experience

### Data Management
- **LocalStorage Database Simulation** - MongoDB-like operations
- **CRUD Operations** - Complete data management
- **Query and Aggregation** - Advanced data filtering
- **Data Relationships** - Normalized data structure
- **Backup and Export** - Data persistence and portability

## 🚀 Getting Started

### Prerequisites
- Node.js (version 16 or higher)
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd restaurant-pos-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173`

### Demo Accounts

The system comes with pre-configured demo accounts for testing:

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| Admin | admin@restaurant.com | password | Full system access |
| Manager | manager@restaurant.com | password | Operations & reporting |
| Cashier | cashier@restaurant.com | password | POS & tables |
| Kitchen | kitchen@restaurant.com | password | Kitchen operations |

## 📱 Usage Guide

### For Administrators
1. **User Management**: Create and manage staff accounts
2. **System Settings**: Configure restaurant information and preferences
3. **Reports**: Access comprehensive analytics and reports
4. **Inventory**: Monitor stock levels and manage suppliers

### For Managers
1. **Operations Oversight**: Monitor daily operations and performance
2. **Inventory Management**: Track stock and manage reorders
3. **Staff Coordination**: Oversee team performance
4. **Reporting**: Generate and analyze business reports

### For Cashiers
1. **Order Processing**: Take customer orders through the POS system
2. **Table Management**: Manage table assignments and status
3. **Reservations**: Handle customer reservations
4. **Payment Processing**: Complete transactions

### For Kitchen Staff
1. **Order Management**: View and update order status
2. **Kitchen Display**: Monitor order queue and priorities
3. **Preparation Tracking**: Update order progress in real-time

## 🏗️ Project Structure

```
src/
├── components/           # React components
│   ├── Auth/            # Authentication components
│   ├── Dashboard.jsx    # Main dashboard
│   ├── POS.jsx         # Point of sale interface
│   ├── Kitchen.jsx     # Kitchen display system
│   ├── Tables.jsx      # Table management
│   ├── Reservations.jsx # Reservation system
│   ├── Inventory.jsx   # Inventory management
│   ├── Reports.jsx     # Analytics and reporting
│   ├── Users.jsx       # User management
│   ├── Settings.jsx    # System configuration
│   ├── Layout.jsx      # Main layout wrapper
│   ├── Landing.jsx     # Landing page
│   └── ProtectedRoute.jsx # Route protection
├── stores/              # State management
│   ├── authStore.js    # Authentication state
│   ├── posStore.js     # POS operations state
│   └── databaseStore.js # Database simulation
├── types/              # Type definitions
└── App.jsx            # Main application component
```

## 🎨 Design Features

### Modern UI/UX
- **Apple-level design aesthetics** with attention to detail
- **Responsive design** that works on all devices
- **Smooth animations** and micro-interactions
- **Consistent color palette** with orange primary theme
- **Intuitive navigation** with role-based menus

### Accessibility
- **Semantic HTML** structure
- **ARIA labels** and roles
- **Keyboard navigation** support
- **Screen reader** compatibility
- **High contrast** color schemes

### Performance
- **Code splitting** with React Router
- **Optimized bundle size** with Vite
- **Efficient re-renders** with proper state management
- **Fast development** with HMR
- **Production-ready** build optimization

## 🔧 Configuration

### Environment Setup
The application uses localStorage for data persistence in demo mode. For production deployment, you would typically:

1. **Database Integration**: Replace localStorage with a real database (MongoDB, PostgreSQL, etc.)
2. **Authentication Service**: Implement proper authentication (JWT, OAuth, etc.)
3. **API Integration**: Connect to backend services
4. **Payment Processing**: Integrate payment gateways
5. **Cloud Storage**: Implement file upload and storage

### Customization
- **Branding**: Update colors, logos, and styling in `tailwind.config.js`
- **Menu Items**: Modify default menu items in `posStore.js`
- **User Roles**: Extend or modify roles in `types/index.js`
- **Features**: Add new components and routes as needed

## 📦 Build and Deployment

### Development Build
```bash
npm run dev
```

### Production Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Linting
```bash
npm run lint
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **React Team** for the amazing framework
- **Tailwind CSS** for the utility-first CSS framework
- **Lucide** for the beautiful icon library
- **Vite** for the fast build tool
- **Pexels** for the stock photography

## 📞 Support

For support, email support@restaurantpos.com or join our Slack channel.

## 🗺️ Roadmap

### Upcoming Features
- [ ] Mobile app (React Native)
- [ ] Real-time notifications (WebSocket)
- [ ] Advanced analytics dashboard
- [ ] Multi-location support
- [ ] Integration with delivery platforms
- [ ] Customer loyalty program
- [ ] Advanced inventory forecasting
- [ ] Staff scheduling system

### Version History
- **v1.0.0** - Initial release with core POS functionality
- **v1.1.0** - Added table management and reservations
- **v1.2.0** - Enhanced reporting and analytics
- **v1.3.0** - Improved UI/UX and performance optimizations

---

**RestaurantPOS** - Revolutionizing restaurant management, one order at a time. 🍽️