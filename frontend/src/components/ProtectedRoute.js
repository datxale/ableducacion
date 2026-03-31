import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './common/LoadingSpinner';

const ProtectedRoute = ({ children, adminOnly = false, allowedRoles = null }) => {
  const { isAuthenticated, loading, isAdmin, user } = useAuth();
  const location = useLocation();
  const effectiveAllowedRoles = adminOnly ? ['admin'] : allowedRoles;

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (effectiveAllowedRoles && !effectiveAllowedRoles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
