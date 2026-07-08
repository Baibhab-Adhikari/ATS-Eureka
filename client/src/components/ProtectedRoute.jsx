import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

const ProtectedRoute = ({ allowedRole, children }) => {
  const token = localStorage.getItem('token');
  const userType = localStorage.getItem('user_type');

  if (!token) {
    return <Navigate to="/signin" replace />;
  }

  if (allowedRole && userType !== allowedRole) {
    // Redirect based on user's actual role if they try to access wrong route
    if (userType === 'employee') {
      return <Navigate to="/employee" replace />;
    } else if (userType === 'employer') {
      return <Navigate to="/employer" replace />;
    }
    return <Navigate to="/" replace />;
  }

  return children ? children : <Outlet />;
};

export default ProtectedRoute;
