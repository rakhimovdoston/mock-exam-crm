import React from "react";
import { useSelector } from "react-redux";
import { Navigate, useLocation } from "react-router-dom";

const ProtectedRoute = ({ children, requiredRoles }) => {
  const { accessToken, user } = useSelector((state) => state.auth);
  const location = useLocation();  

  if (!accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (requiredRoles && requiredRoles.length > 0) {
    const userRoles = user?.roles || [];
    const hasRequiredRole = requiredRoles.some(role => user?.roles.includes(role));

    if (!hasRequiredRole) {
      return <Navigate to="/not-found" state={{ from: location }} replace />;
    }
  }

  return children;
};

export default ProtectedRoute;