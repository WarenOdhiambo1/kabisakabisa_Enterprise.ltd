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
            <ProtectedRoute allowedRoles={['logistics', 'manager', 'boss']}>
              <LogisticsPage openExternalPortal={openExternalPortal} />
            </ProtectedRoute>
          } />

          <Route path="/orders" element={
            <ProtectedRoute allowedRoles={['admin', 'manager', 'boss']}>
              <OrdersPage />
            </ProtectedRoute>
          } />

          <Route path="/hr" element={
            <ProtectedRoute allowedRoles={['hr', 'boss']}>
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



          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        )}
      </Router>
      <Toaster position="top-right" />
    </div>
  );
}

function DashboardRedirect() {
  const { user } = useAuth();
  
  console.log('DashboardRedirect - user:', user, 'role:', user?.role);
  
  if (!user) {
    console.log('No user in DashboardRedirect, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  // Redirect to appropriate dashboard based on role
  switch (user?.role) {
    case 'boss':
      return <Navigate to="/boss" />;
    case 'manager':
      return <Navigate to="/manager" />;
    case 'hr':
      return <Navigate to="/hr" />;
    case 'admin':
      return <Navigate to="/admin" />;
    case 'sales':
      return <Navigate to={`/sales/${user.branchId}`} />;
    case 'logistics':
      return <Navigate to="/logistics" />;
    default:
      return <Navigate to="/" />;
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