import React from "react";
import { createBrowserRouter, Navigate, Outlet } from "react-router-dom";

// Layouts
import Layout from "../components/layout/Layout";

// Pages - Public
import HomePage from "../pages/HomePage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import { MemberDashboardLayout, TeacherDashboardLayout, AdminDashboardLayout } from "../components/layout/DashboardLayout";

// Pages - Protected
// Admin min
import AdminDashboard from "../pages/Admin/AdminDashboard";
import AdminUsers from "../pages/Admin/AdminUsers"; // Giả sử bạn lưu ở đây
import AdminCourses from "../pages/Admin/AdminCourses";
// Member 
import MemberDashboard from "../pages/Member/MemberDashboard";
import Courses from "../pages/Member/Courses";
import MemberTests from "../pages/Member/MemberTests";
import MemberNotifications from "../pages/Member/MemberNotifications";
import MemberSettings from "../pages/Member/MemberSettings";
//Teacher
import TeacherDashboard from "../pages/Teacher/TeacherDashboard";
import TeacherClasses from "../pages/Teacher/TeacherClasses";
import TeacherAssignments from "../pages/Teacher/TeacherAssignments";
import TeacherQuiz from "../pages/Teacher/TeacherQuiz";
import TeacherSettings from "../pages/Teacher/TeacherSettings";
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
            { index: true, element: <Navigate to="/auth/login" replace /> },
        ],
    },

    // 3. Member Routes (Protected)
    {
        path: "/member",
        element: (
            <PrivateRoute allowedRoles={["member"]}>
                <MemberDashboardLayout />
            </PrivateRoute>
        ),
        children: [
            { index: true, element: <MemberDashboard /> },
              { path: "courses", element: <Courses /> },
              { path: "test", element: <MemberTests /> },
      { path: "notifications", element: <MemberNotifications /> },
      { path: "settings", element: <MemberSettings /> },
            { path: "*", element: <Navigate to="/member" replace /> },
        ],
    },

    // 4. Teacher Routes (Protected)
    {
        path: "/teacher",
        element: (
            <PrivateRoute allowedRoles={["teacher"]}>
                <TeacherDashboardLayout />
            </PrivateRoute>
        ),
        children: [
            { index: true, element: <TeacherDashboard /> },
            { path: "classes", element: <TeacherClasses /> },
            { path: "assignments", element: <TeacherAssignments /> },
            { path: "quiz", element: <TeacherQuiz /> },
            { path: "settings", element: <TeacherSettings /> },
            { path: "*", element: <Navigate to="/teacher" replace /> },
        ],
    },

    // 5. Admin Routes (Protected)
    {
        path: "/admin",
        element: (
            <PrivateRoute allowedRoles={["Admin", "4"]}>
               <AdminDashboardLayout />
            </PrivateRoute>
        ),
        children: [
            { index: true, element: <AdminDashboard /> },
            { path: "users", element: <AdminUsers /> },      
            { path: "courses", element: <AdminCourses /> },
            
            { path: "*", element: <Navigate to="/admin" replace /> },
        ],
    },
]);

export default routes;