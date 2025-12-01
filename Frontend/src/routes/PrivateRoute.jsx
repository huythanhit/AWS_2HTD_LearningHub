import { Navigate } from "react-router-dom";
import React from "react";
/**
 * @typedef {Object} PrivateRouteProps
 * @property {React.ReactNode} children 
 * @property {Array<'member' | 'teacher' | 'admin'>} [allowedRoles] 
 */

const PrivateRoute = ({ children, allowedRoles }) => {
  const token = localStorage.getItem("token");
  const roleName = localStorage.getItem("roleName");
  const roleId = localStorage.getItem("roleId"); // Thêm vào để lấy roleId

  // Chưa login hoặc token không có
  if (!token) return <Navigate to="/auth/login" replace />;
  
  // Kiểm tra nếu không có allowedRoles hoặc role không hợp lệ
  if (allowedRoles && roleName) {
      if (!allowedRoles.includes(roleName) && !allowedRoles.includes(roleId)) {
          return <Navigate to="/auth/login" replace />; 
      }
  }
  
  return children; // Cho phép truy cập nếu tất cả điều kiện đều đúng
};

export default PrivateRoute;