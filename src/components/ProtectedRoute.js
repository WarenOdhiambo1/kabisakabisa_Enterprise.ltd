import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  console.log('[PROTECTED ROUTE]', {
    path: location.pathname,
    user: user?.role,
    loading,
    allowedRoles,
    hasAccess: allowedRoles.length === 0 || allowedRoles.includes(user?.role)
  });

  if (loading) {
    console.log('[PROTECTED ROUTE] Loading user...');
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    console.error('[ROUTING ERROR] Unauthorized access attempt to:', location.pathname);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    console.error('[ROUTING ERROR] Forbidden - User role:', user.role, 'Required:', allowedRoles, 'Path:', location.pathname);
    return <Navigate to="/dashboard" replace />;
  }

  console.log('[PROTECTED ROUTE] Access granted to:', location.pathname);
  return children;
};

export default ProtectedRoute;