import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, AdminRoute } from './routes/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { useAuth } from './context/AuthContext';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Products } from './pages/Products';
import { Shops } from './pages/Shops';
import { LoadVehicle } from './pages/LoadVehicle';
import { Stock } from './pages/Stock';
import { Delivery } from './pages/Delivery';
import { Invoices } from './pages/Invoices';
import { DaySummary } from './pages/DaySummary';
import { Reports } from './pages/Reports';
import { Users } from './pages/Users';

const DefaultRedirect = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return isAdmin ? <Navigate to="/dashboard" replace /> : <Navigate to="/deliver" replace />;
};

export const App = () => {
  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/login" element={<Login />} />

      {/* Authenticated Protected Shell */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<DefaultRedirect />} />

          {/* Field Operations (Delivery Staff & Admin) */}
          <Route path="/load" element={<LoadVehicle />} />
          <Route path="/deliver" element={<Delivery />} />
          <Route path="/stock" element={<Stock />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/summary" element={<DaySummary />} />

          {/* Admin Management, Dashboard & Analytics (Admin Only) */}
          <Route element={<AdminRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/shops" element={<Shops />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/users" element={<Users />} />
          </Route>
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<DefaultRedirect />} />
    </Routes>
  );
};

export default App;
