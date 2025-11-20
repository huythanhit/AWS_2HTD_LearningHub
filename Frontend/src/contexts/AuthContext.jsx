import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

const AuthContext = createContext(undefined);
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  // Hàm tải trạng thái người dùng từ localStorage
  const loadAuthState = useCallback(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    const userEmail = localStorage.getItem("userEmail");
    const userName = localStorage.getItem("userName");
    const userId = localStorage.getItem("userId");

    // Kiểm tra xem có đủ thông tin xác thực không
    if (token && role && userEmail && userId) {
      setIsAuthenticated(true);
      setUser({
        userId,
        email: userEmail,
        role,
        userName,
      });
    } else {
      setIsAuthenticated(false);
      setUser(null);
    }
  }, []);

  // Tải trạng thái khi ứng dụng khởi động (chỉ chạy 1 lần)
  useEffect(() => {
    loadAuthState();
  }, [loadAuthState]);

  // Hàm Đăng xuất
  const logout = () => {
    // Xóa tất cả thông tin xác thực
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("userName");
    localStorage.removeItem("userId");
    sessionStorage.removeItem("token");

    // Reset state
    setIsAuthenticated(false);
    setUser(null);
  };

  // Giá trị Context được cung cấp
  const value = useMemo(() => ({
    isAuthenticated,
    user,
    logout,
    refreshAuth: loadAuthState,
  }), [isAuthenticated, user, loadAuthState]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Hook tùy chỉnh để sử dụng AuthContext dễ dàng hơn
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};