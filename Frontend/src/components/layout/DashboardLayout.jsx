import React, { useMemo } from 'react'; 
import { Outlet, useLocation } from 'react-router-dom'; 
// Import Logic & UI
import useDashboardLogic from '../../hooks/useDashboardLogic'; 
import useUnreadNotifications from '../../hooks/useUnreadNotifications';
import Sidebar, { memberMenuItems, teacherMenuItems, adminMenuItems } from '../ui/Sidebar';
import Header from '../ui/Header'; 

// Cấu hình menu cho các role khác (ví dụ)


/**Layout kết hợp Logic và UI cho các trang Dashboard (Container)*/
export default function DashboardLayout({ menuItems = memberMenuItems, role = 'member' }) {
    const location = useLocation(); 
    
    // Gọi Logic Hook
    const { 
        isDesktopSidebarExpanded, 
        isMobileSidebarOpen, 
        userName, 
        handleMouseEnter, 
        handleMouseLeave, 
        toggleMobileSidebar, 
        closeMobileSidebar,  
        handleLogout 
    } = useDashboardLogic(role);

    // Lấy số lượng thông báo chưa đọc (chỉ cho member và teacher)
    const { unreadCount, refreshUnreadCount } = useUnreadNotifications();
    
    // Refresh unread count khi vào trang notifications
    React.useEffect(() => {
        if (location.pathname.includes('/notifications')) {
            refreshUnreadCount();
        }
    }, [location.pathname, refreshUnreadCount]); 

    // --- LOGIC TÌM TÊN TRANG HIỆN TẠI (Giữ nguyên) ---
    const currentPageTitle = useMemo(() => {
        // Logic tìm tên trang 
        const activeItem = menuItems.find(item => location.pathname === item.to);
        if (activeItem) return activeItem.label; 

        const parentItem = menuItems.find(item => 
            location.pathname.startsWith(item.to + '/') 
            && item.to !== '/' 
        );

        if (parentItem) return parentItem.label;

        return 'Dashboard';
    }, [location.pathname, menuItems]);
    // --- KẾT THÚC LOGIC TÌM TÊN TRANG HIỆN TẠI ---


    // Class động cho Main Content để dịch chuyển khi Sidebar Desktop mở rộng
    const mainContentClass = isDesktopSidebarExpanded ? 'lg:ml-64' : 'lg:ml-20';

    return (
        <div className="flex min-h-screen bg-gray-50">
            
            {/* SIDEBAR UI (Kết hợp Mobile/Desktop) */}
            <Sidebar 
                menuItems={menuItems} 
                handleLogout={handleLogout} 
                // Desktop props
                isExpanded={isDesktopSidebarExpanded} 
                onMouseEnter={handleMouseEnter} 
                onMouseLeave={handleMouseLeave} 
                // Mobile props MỚI
                isMobileOpen={isMobileSidebarOpen} 
                onClose={closeMobileSidebar} // Hàm đóng mobile sidebar
                // Notification badge
                unreadCount={unreadCount}
            />

            {/* Main Content Area */}
            <div className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${mainContentClass}`}>

                {/* HEADER UI */}
                <Header
                    userName={userName} 
                    currentPageTitle={currentPageTitle} 
                    onToggleMobileSidebar={toggleMobileSidebar} // Đổi tên prop cho rõ ràng
                />

                {/* Main Content */}
                <main className="flex-grow p-4 md:p-8">
                    <Outlet /> 
                </main>
            </div>
            
            {/* Overlay cho Mobile khi Sidebar mở */}
            {isMobileSidebarOpen && (
                <div 
                    className="fixed inset-0 z-30 bg-black opacity-50 lg:hidden" // Chỉ hiển thị trên mobile
                    onClick={closeMobileSidebar} // Đóng khi click Overlay
                />
            )}
        </div>
    );
}

// Export Member Layout để sử dụng
export const MemberDashboardLayout = () => <DashboardLayout role='member' menuItems={memberMenuItems} />;
export const TeacherDashboardLayout = () => <DashboardLayout role='teacher' menuItems={teacherMenuItems} />;
export const AdminDashboardLayout = () => <DashboardLayout role='admin' menuItems={adminMenuItems} />;