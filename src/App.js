import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { Toaster } from 'react-hot-toast';
import { initializeRoutingLogger, logRouteChange } from './utils/routingLogger';

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

function RouteLogger() {
  const location = useLocation();
  const { user } = useAuth();

  React.useEffect(() => {
    logRouteChange(location, user);
  }, [location, user]);

  return null;
}

function AppContent() {
  const { user } = useAuth();

  React.useEffect(() => {
    initializeRoutingLogger();
    console.log('[APP] Application initialized');
  }, []);

  React.useEffect(() => {
    console.log('[ROUTING] User state changed:', { 
      isAuthenticated: !!user, 
      role: user?.role,
      userId: user?.id 
    });
  }, [user]);

  return (
    <div className="App">
      <CssBaseline />
      <Router>
        <RouteLogger />
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

            <Route path="*" element={<NotFoundHandler />} />
          </Routes>
        </div>
      </Router>
      <InstallPrompt />
      <Toaster position="top-right" />
    </div>
  );
}

function NotFoundHandler() {
  const location = window.location;
  console.error('[ROUTING ERROR] 404 - Route not found:', {
    pathname: location.pathname,
    search: location.search,
    hash: location.hash,
    timestamp: new Date().toISOString()
  });
  return <Navigate to="/" replace />;
}

function DashboardRedirect() {
  const { user } = useAuth();
  
  console.log('[ROUTING] Dashboard redirect triggered:', { user: user?.role });
  
  if (!user) {
    console.warn('[ROUTING ERROR] No user found, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  const role = user?.role;
  
  switch (role) {
    case 'boss':
      console.log('[ROUTING] Redirecting boss to /boss');
      return <Navigate to="/boss" replace />;
    case 'manager':
      console.log('[ROUTING] Redirecting manager to /manager');
      return <Navigate to="/manager" replace />;
    case 'hr':
      console.log('[ROUTING] Redirecting hr to /hr');
      return <Navigate to="/hr" replace />;
    case 'admin':
      console.log('[ROUTING] Redirecting admin to /admin');
      return <Navigate to="/admin" replace />;
    case 'sales':
      const branchId = user.branchId || user.branch_id || (user.branch_id && user.branch_id[0]);
      if (branchId) {
        console.log('[ROUTING] Redirecting sales to /sales/' + branchId);
        return <Navigate to={`/sales/${branchId}`} replace />;
      } else {
        console.error('[ROUTING ERROR] Sales user has no branchId:', user);
        return <Navigate to="/" replace />;
      }
    case 'logistics':
      console.log('[ROUTING] Redirecting logistics to /logistics');
      return <Navigate to="/logistics" replace />;
    default:
      console.error('[ROUTING ERROR] Unknown role:', role);
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