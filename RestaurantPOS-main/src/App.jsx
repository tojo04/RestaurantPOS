import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Layout } from './components/Layout';
import { Landing } from './components/Landing';
import { Login } from './components/Auth/Login';
import { Register } from './components/Auth/Register';
import { Dashboard } from './components/Dashboard';
import { POS } from './components/POS';
import { Kitchen } from './components/Kitchen';
import { Tables } from './components/Tables';
import { Reservations } from './components/Reservations';
import { Inventory } from './components/Inventory';
import { Reports } from './components/Reports';
import { Users } from './components/Users';
import { Settings } from './components/Settings';

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Landing />} />
        <Route path="/login" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/register" element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Register />} />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/pos"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager', 'cashier']}>
              <Layout>
                <POS />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/kitchen"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager', 'kitchen']}>
              <Layout>
                <Kitchen />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/tables"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager', 'cashier']}>
              <Layout>
                <Tables />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reservations"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager', 'cashier']}>
              <Layout>
                <Reservations />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventory"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <Layout>
                <Inventory />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <Layout>
                <Reports />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout>
                <Users />
              </Layout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={['admin', 'manager']}>
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;