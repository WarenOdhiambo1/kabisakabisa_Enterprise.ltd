import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import theme from './theme';
import Navbar from './components/Navbar';
import ExternalPortal from './components/ExternalPortal';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import SalesPage from './pages/SalesPage';
import StockPage from './pages/StockPage';
import LogisticsPage from './pages/LogisticsPage';
import OrdersPage from './pages/OrdersPage';
import HRPage from './pages/HRPage';
import BossPage from './pages/BossPage';
import ManagerPage from './pages/ManagerPage';
import AdminPage from './pages/AdminPage';
import DataManagementPage from './pages/DataManagementPage';
import ExpensePage from './pages/ExpensePage';
import XeroFinancePage from './pages/XeroFinancePage';
import ProtectedRoute from './components/ProtectedRoute';


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});



function AppContent() {
  const { user, loading } = useAuth();
  const [externalPortal, setExternalPortal] = useState(null);
  
  console.log('AppContent - user:', user, 'loading:', loading);

  const openExternalPortal = (url, title) => {
    setExternalPortal({ url, title });
  };

  const closeExternalPortal = () => {
    setExternalPortal(null);
  };

  return (
    <div className="App">
      <CssBaseline />
      <Router>
        {user && <Navbar openExternalPortal={openExternalPortal} />}
        <div style={{ paddingTop: user ? '64px' : '0', minHeight: '100vh' }}>
        {externalPortal ? (
          <ExternalPortal 
            url={externalPortal.url} 
            title={externalPortal.title} 
            onClose={closeExternalPortal} 
          />
        ) : (
          <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route 
            path="/login" 
            element={user ? <Navigate to="/dashboard" /> : <LoginPage />} 
          />
          <Route 
            path="/register" 
            element={user ? <Navigate to="/dashboard" /> : <RegisterPage />} 
          />

          {/* Protected Routes */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardRedirect />
            </ProtectedRoute>
          } />

          <Route path="/sales/:branchId" element={
            <ProtectedRoute allowedRoles={['sales', 'admin', 'manager', 'boss']}>
              <SalesPage />
            </ProtectedRoute>
          } />

          <Route path="/stock/:branchId" element={
            <ProtectedRoute allowedRoles={['admin', 'manager', 'boss']}>
              <StockPage />
            </ProtectedRoute>
          } />

          <Route path="/logistics" element={
            <ProtectedRoute allowedRoles={['logistics', 'admin', 'manager', 'boss']}>
              <LogisticsPage openExternalPortal={openExternalPortal} />
            </ProtectedRoute>
          } />

          <Route path="/orders" element={
            <ProtectedRoute allowedRoles={['admin', 'manager', 'boss']}>
              <OrdersPage />
            </ProtectedRoute>
          } />

          <Route path="/hr" element={
            <ProtectedRoute allowedRoles={['hr', 'admin', 'manager', 'boss']}>
              <HRPage />
            </ProtectedRoute>
          } />

          <Route path="/boss" element={
            <ProtectedRoute allowedRoles={['boss']}>
              <BossPage />
            </ProtectedRoute>
          } />

          <Route path="/manager" element={
            <ProtectedRoute allowedRoles={['manager']}>
              <ManagerPage />
            </ProtectedRoute>
          } />

          <Route path="/admin" element={
            <ProtectedRoute allowedRoles={['admin', 'boss']}>
              <AdminPage />
            </ProtectedRoute>
          } />

          <Route path="/data" element={
            <ProtectedRoute allowedRoles={['admin', 'boss']}>
              <DataManagementPage />
            </ProtectedRoute>
          } />

          <Route path="/expenses" element={
            <ProtectedRoute allowedRoles={['admin', 'boss', 'manager', 'sales']}>
              <ExpensePage />
            </ProtectedRoute>
          } />

          <Route path="/finance" element={
            <ProtectedRoute allowedRoles={['admin', 'boss', 'manager']}>
              <XeroFinancePage />
            </ProtectedRoute>
          } />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        )}
        </div>
      </Router>
      <Toaster position="top-right" />
    </div>
  );
}

function DashboardRedirect() {
  const { user } = useAuth();
  
  console.log('DashboardRedirect - Full user object:', JSON.stringify(user, null, 2));
  console.log('DashboardRedirect - user.role:', user?.role);
  console.log('DashboardRedirect - typeof user.role:', typeof user?.role);
  
  if (!user) {
    console.log('No user in DashboardRedirect, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  const role = user?.role;
  console.log('Switching on role:', role);
  
  // Redirect to appropriate dashboard based on role
  switch (role) {
    case 'boss':
      console.log('Redirecting to boss page');
      return <Navigate to="/boss" replace />;
    case 'manager':
      console.log('Redirecting to manager page');
      return <Navigate to="/manager" replace />;
    case 'hr':
      console.log('Redirecting to hr page');
      return <Navigate to="/hr" replace />;
    case 'admin':
      console.log('Redirecting to admin page');
      return <Navigate to="/admin" replace />;
    case 'sales':
      console.log('Redirecting to sales page');
      const branchId = user.branchId || user.branch_id || (user.branch_id && user.branch_id[0]);
      if (branchId) {
        return <Navigate to={`/sales/${branchId}`} replace />;
      } else {
        console.log('No branch ID found for sales user, redirecting to home');
        return <Navigate to="/" replace />;
      }
    case 'logistics':
      console.log('Redirecting to logistics page');
      return <Navigate to="/logistics" replace />;
    default:
      console.log('Unknown role, redirecting to home. Role was:', role);
      return <Navigate to="/" replace />;
  }
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;