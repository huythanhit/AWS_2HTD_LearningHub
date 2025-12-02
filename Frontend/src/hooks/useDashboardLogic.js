import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
// Giả định AuthContext.jsx nằm ở ../contexts/AuthContext
import { useAuth } from '../contexts/AuthContext'; 

/**
 * Hook tùy chỉnh quản lý logic cho Dashboard Layout
 * (State Sidebar Desktop, State Sidebar Mobile, Lấy tên User, Xử lý Logout)
 * @param {string} userRole - Vai trò của người dùng ('member', 'teacher', 'admin')
 */
export default function useDashboardLogic(userRole = 'member') {
    // 1. State cho Sidebar (Desktop: Hover-to-expand)
    const [isDesktopSidebarExpanded, setIsDesktopSidebarExpanded] = useState(false);
    // 2. State cho Sidebar (Mobile: Click-to-open)
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    const navigate = useNavigate();
    const { logout, user } = useAuth(); 

    // Tên người dùng
    const userName = user?.userName || (
        userRole === 'member' ? 'Học viên' : 
        userRole === 'teacher' ? 'Giáo viên' : 
        'Admin'
    );

    // --- Xử lý Sidebar Desktop (Hover) ---
    const handleMouseEnter = () => {
        setIsDesktopSidebarExpanded(true);
    };

    const handleMouseLeave = () => {
        setIsDesktopSidebarExpanded(false);
    };

    // --- Xử lý Sidebar Mobile (Click) ---
    const toggleMobileSidebar = () => {
        setIsMobileSidebarOpen(prev => !prev);
    };
    
    // Tắt Mobile Sidebar khi click vào Link
    const closeMobileSidebar = () => {
        setIsMobileSidebarOpen(false);
    }
    
    // Hàm Xử lý Đăng xuất
    const handleLogout = () => {
        logout(); 
        navigate('/auth/login');
    };

    return {
        // Desktop
        isDesktopSidebarExpanded,
        handleMouseEnter, 
        handleMouseLeave, 
        
        // Mobile
        isMobileSidebarOpen,
        toggleMobileSidebar,
        closeMobileSidebar,

        // Chung
        userName,
        handleLogout
    };
}