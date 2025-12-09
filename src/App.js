import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import theme from './theme';
import Navbar from './components/Navbar';
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
import ExpensePage from './pages/ExpensePage';
import FinancePage from './pages/FinancePage';
import ProtectedRoute from './components/ProtectedRoute';
import InstallPrompt from './components/InstallPrompt';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppContent() {
  const { user } = useAuth();

  return (
    <div className="App">
      <CssBaseline />
      <Router>
        {user && <Navbar />}
        <div style={{ paddingTop: user ? '64px' : '0', minHeight: '100vh' }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route 
              path="/login" 
              element={user ? <Navigate to="/dashboard" /> : <LoginPage />} 
            />
            <Route 
              path="/register" 
              element={user ? <Navigate to="/dashboard" /> : <RegisterPage />} 
            />

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
                <LogisticsPage />
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

            <Route path="/expenses" element={
              <ProtectedRoute allowedRoles={['admin', 'boss', 'manager', 'sales']}>
                <ExpensePage />
              </ProtectedRoute>
            } />

            <Route path="/finance" element={
              <ProtectedRoute allowedRoles={['admin', 'boss', 'manager']}>
                <FinancePage />
              </ProtectedRoute>
            } />

            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </Router>
      <InstallPrompt />
      <Toaster position="top-right" />
    </div>
  );
}

function DashboardRedirect() {
  const { user } = useAuth();
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  const role = user?.role;
  
  switch (role) {
    case 'boss':
      return <Navigate to="/boss" replace />;
    case 'manager':
      return <Navigate to="/manager" replace />;
    case 'hr':
      return <Navigate to="/hr" replace />;
    case 'admin':
      return <Navigate to="/admin" replace />;
    case 'sales':
      const branchId = user.branchId || user.branch_id || (user.branch_id && user.branch_id[0]);
      if (branchId) {
        return <Navigate to={`/sales/${branchId}`} replace />;
      } else {
        return <Navigate to="/" replace />;
      }
    case 'logistics':
      return <Navigate to="/logistics" replace />;
    default:
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