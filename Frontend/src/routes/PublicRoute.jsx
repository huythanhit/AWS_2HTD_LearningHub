import React from "react";
import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";

// Layouts
import Layout from "../components/layout/Layout";

// Pages - Public
import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";

// Pages - Protected (Placeholder - đảm bảo bạn đã tạo các file này hoặc comment lại nếu chưa có)
import AdminDashboard from "../pages/Admin/AdminDashboard";
import MemberDashboard from "../pages/Member/MemberDashboard";
import TeacherDashboard from "../pages/Teacher/TeacherDashboard";

// Routes Protection
import PrivateRoute from "./PrivateRoute";

const routes = createBrowserRouter([
  // 1. Public Routes (Trang chủ)
  {
    path: "/",
    element: (
      <Layout>
        <Outlet />
      </Layout>
    ),
    children: [
      { index: true, element: <HomePage /> },
      // Bắt các đường dẫn sai ở root về trang chủ
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },

  // 2. Auth Routes (Login/Register)
  {
    path: "/auth",
    element: (
        <Outlet />
    ),
    children: [
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      // Nếu ai đó vào /auth mà không gõ gì thêm -> về login
      { index: true, element: <Navigate to="/auth/login" replace /> },
    ],
  },

  // 3. Member Routes (Protected)
  {
    path: "/member",
    element: (
      <PrivateRoute allowedRoles={["member"]}>
        <Layout>
          <Outlet />
        </Layout>
      </PrivateRoute>
    ),
    children: [
      { index: true, element: <MemberDashboard /> },
      { path: "*", element: <Navigate to="/member" replace /> },
    ],
  },

  // 4. Teacher Routes (Protected)
  {
    path: "/teacher",
    element: (
      <PrivateRoute allowedRoles={["teacher"]}>
        <Layout>
          <Outlet />
        </Layout>
      </PrivateRoute>
    ),
    children: [
      { index: true, element: <TeacherDashboard /> },
      { path: "*", element: <Navigate to="/teacher" replace /> },
    ],
  },

  // 5. Admin Routes (Protected)
  {
    path: "/admin",
    element: (
      <PrivateRoute allowedRoles={["admin"]}>
        <Layout>
          <Outlet />
        </Layout>
      </PrivateRoute>
    ),
    children: [
      { index: true, element: <AdminDashboard /> },
      { path: "*", element: <Navigate to="/admin" replace /> },
    ],
  },
]);

export default routes;