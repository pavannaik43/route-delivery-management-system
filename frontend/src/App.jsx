import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute, AdminRoute } from './routes/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';

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

export const App = () => {
  return (
    <Routes>
      {/* Public Login Route */}
      <Route path="/login" element={<Login />} />

      {/* Authenticated Protected Shell */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          {/* Operations (All Roles: Admin & Delivery Staff) */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/load" element={<LoadVehicle />} />
          <Route path="/deliver" element={<Delivery />} />
          <Route path="/stock" element={<Stock />} />
          <Route path="/invoices" element={<Invoices />} />
          <Route path="/summary" element={<DaySummary />} />

          {/* Master Data & Analytics (Admin Only) */}
          <Route element={<AdminRoute />}>
            <Route path="/products" element={<Products />} />
            <Route path="/shops" element={<Shops />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/users" element={<Users />} />
          </Route>
        </Route>
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
