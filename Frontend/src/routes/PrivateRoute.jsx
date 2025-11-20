import { Navigate } from "react-router-dom";
import React from "react";
/**
 * @typedef {Object} PrivateRouteProps
 * @property {React.ReactNode} children 
 * @property {Array<'member' | 'teacher' | 'admin'>} [allowedRoles] 
 */

const PrivateRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
// chưa login hoặc token không có -> về login
  if (!token) return <Navigate to="/auth/login" replace />;
// role không hợp lệ -> redirect về login
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/auth/login" replace />; 
  }
  return children;
};

export default PrivateRoute;