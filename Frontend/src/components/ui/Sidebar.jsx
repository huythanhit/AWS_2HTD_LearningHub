import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    BookOpen,
    ClipboardList,
    Bell,
    Settings,
    LogOut,
    GraduationCap, 
    // Thêm icons cho Teacher
    Users, 
    FileText,
    ShieldCheck,
    Database,
    Shield,    // <-- Đây là icon bị thiếu gây ra lỗi
    BarChart2,
    Brain
} from 'lucide-react';

// --- CONFIG: Danh sách Menu Items cho Member ---
export const memberMenuItems = [
    { label: 'Dashboard', to: '/member', icon: LayoutDashboard },
    { label: 'Khóa học của tôi', to: '/member/courses', icon: BookOpen },
    { label: 'Bài kiểm tra', to: '/member/test', icon: ClipboardList },
    { label: 'Luyện tập', to: '/member/practices', icon: Brain },
    { label: 'Thông báo', to: '/member/notifications', icon: Bell },
    { label: 'Cài đặt', to: '/member/settings', icon: Settings },
];
// --- MỚI: CONFIG: Danh sách Menu Items cho Teacher ---
export const teacherMenuItems = [
    { label: 'Tổng quan', to: '/teacher', icon: LayoutDashboard },
    { label: 'Quản lý Lớp học', to: '/teacher/classes', icon: Users },
    { label: 'Quản lý Bài tập', to: '/teacher/assignments', icon: FileText },
    { label: 'Bài tập Flashcard', to: '/teacher/quiz', icon: Brain },
    { label: 'Cài đặt', to: '/teacher/settings', icon: Settings },
];
export const adminMenuItems = [
    { label: 'Tổng quan', to: '/admin', icon: LayoutDashboard },
    { label: 'Người dùng', to: '/admin/users', icon: Users },         // Trang quản lý User
    { label: 'Khóa học', to: '/admin/courses', icon: BookOpen },      // Trang quản lý Khóa học
];

// --- CONFIG CHUNG ---
const PRIMARY_BG = 'bg-[#8c78ec]'; 
const DARK_BG = 'bg-[#443c68]'; 

/**
 * Component Sidebar CHUNG (Xử lý cả Desktop Hover-to-Expand và Mobile Click-to-Open)
 * @param {Object} props
 * @param {Array} props.menuItems - Danh sách menu items.
 * @param {function} props.handleLogout - Hàm xử lý đăng xuất.
 * @param {boolean} props.isExpanded - Trạng thái mở rộng (Desktop).
 * @param {function} props.onMouseEnter - Xử lý hover vào (Desktop).
 * @param {function} props.onMouseLeave - Xử lý hover ra (Desktop).
 * @param {boolean} props.isMobileOpen - Trạng thái mở (Mobile).
 * @param {function} props.onClose - Hàm đóng Sidebar (Mobile - khi click link/overlay).
 */
export default function Sidebar({ 
    menuItems, 
    handleLogout, 
    isExpanded, 
    onMouseEnter, 
    onMouseLeave, 
    isMobileOpen, 
    onClose 
    
}) {
    const location = useLocation();

    // --- DESKTOP CLASSES (lg:xx) ---
    const desktopBaseClass = 'lg:flex lg:fixed lg:top-0 lg:h-full lg:z-40 lg:shadow-2xl lg:flex-col lg:transition-all lg:duration-300 lg:ease-in-out hidden';
    const desktopWidthClass = isExpanded ? 'lg:w-64' : 'lg:w-20'; 
    const desktopItemTextClass = `whitespace-nowrap transition-opacity duration-200 ${isExpanded ? 'opacity-100 ml-3' : 'lg:opacity-0 absolute lg:left-full'}`;

    // --- MOBILE CLASSES (Dưới lg) ---
    const mobileBaseClass = 'fixed top-0 left-0 h-full w-64 z-40 lg:hidden transition-transform duration-300 ease-in-out transform';
    const mobileTranslateClass = isMobileOpen ? 'translate-x-0' : '-translate-x-full';

    // --- BASE CLASSES ---
    const itemBaseClass = 'flex items-center p-3 rounded-lg transition-all duration-200 group relative overflow-hidden';
    const baseClass = `${DARK_BG} text-white`;

    const handleLinkClick = () => {
        // Chỉ đóng sidebar mobile khi click vào link
        if (isMobileOpen) {
            onClose(); 
        }
    };
    
    const handleLogoutAndClose = () => {
        handleLogout();
        if (isMobileOpen) {
            onClose();
        }
    }


    return (
        <>
            {/* 1. DESKTOP VIEW: Chỉ hiển thị trên lg+ */}
            <aside 
                className={`${baseClass} ${desktopBaseClass} ${desktopWidthClass}`}
                onMouseEnter={onMouseEnter}
                onMouseLeave={onMouseLeave}
            >
                <div className="flex flex-col h-full">

                    {/* Logo/Tên - DESKTOP */}
                    <div className="py-4 px-2 flex items-center justify-center flex-shrink-0 overflow-hidden relative h-[4.5rem]"> 
                        {/* ICON (Căn giữa khi thu gọn) */}
                        {!isExpanded && (
                            <GraduationCap 
                                size={28} 
                                className="text-white" 
                            />
                        )}
                        {/* TÊN ĐẦY ĐỦ (Căn trái khi mở rộng) */}
                        <div 
                            className={`flex items-center transition-opacity duration-200 absolute top-1/2 left-4 transform -translate-y-1/2 ${isExpanded ? 'opacity-100' : 'opacity-0'}`} 
                        > 
                            <GraduationCap size={28} className="text-white mr-3" />
                            <span className="text-xl font-extrabold text-white whitespace-nowrap">
                                2 HTD LearningHub
                            </span> 
                        </div>
                    </div>

                    {/* Navigation Links - DESKTOP */}
                    <nav className="flex-grow p-2 overflow-y-auto">
                        <ul className="space-y-2">
                            {menuItems.map((item) => {
                                // Logic Active (Chung cho cả hai view)
                                const isExactMatch = location.pathname === item.to;
                                const isPrefixMatch = item.to !== '/member' && location.pathname.startsWith(item.to + '/');
                                let isActive = (item.to === '/member') ? isExactMatch : (isExactMatch || isPrefixMatch);

                                const activeClasses = `${PRIMARY_BG} text-white font-semibold shadow-md`;
                                const inactiveClasses = `text-gray-200 hover:bg-purple-700 hover:text-white`;

                                return (
                                    <li key={item.to}>
                                        <Link
                                            to={item.to}
                                            className={`${itemBaseClass} ${isActive ? activeClasses : inactiveClasses}`}
                                        >
                                            <item.icon className="w-6 h-6 flex-shrink-0" />
                                            {/* Text chỉ hiển thị/dịch chuyển trên Desktop */}
                                            <span className={desktopItemTextClass}>{item.label}</span> 
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>

                    {/* Nút Đăng xuất - DESKTOP */}
                    <div className="p-4 border-t border-gray-600 flex-shrink-0">
                        <button
                            onClick={handleLogout} // Không cần đóng mobile sidebar vì chỉ hiển thị trên desktop
                            className={`w-full ${itemBaseClass} text-red-300 bg-transparent hover:bg-red-800`}
                        >
                            <LogOut className="w-6 h-6 flex-shrink-0" />
                            <span className={desktopItemTextClass}>Đăng xuất</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* 2. MOBILE VIEW: Chỉ hiển thị dưới lg */}
            <aside 
                className={`${baseClass} ${mobileBaseClass} ${mobileTranslateClass}`}
            >
                <div className="flex flex-col h-full">

                    {/* Logo/Tên - MOBILE */}
                    <div className="p-5 flex items-center justify-start flex-shrink-0">
                        <GraduationCap size={28} className="text-white mr-3" />
                        <span className="text-xl font-extrabold text-white cursor-default">
                            2 HTD LearningHub
                        </span> 
                    </div>

                    {/* Navigation Links - MOBILE */}
                    <nav className="flex-grow p-2 overflow-y-auto">
                        <ul className="space-y-2">
                            {menuItems.map((item) => {
                                // Logic Active (Chung)
                                const isExactMatch = location.pathname === item.to;
                                const isPrefixMatch = item.to !== '/member' && location.pathname.startsWith(item.to + '/');
                                let isActive = (item.to === '/member') ? isExactMatch : (isExactMatch || isPrefixMatch);

                                const activeClasses = `${PRIMARY_BG} text-white font-semibold shadow-md`;
                                const inactiveClasses = `text-gray-200 hover:bg-purple-700 hover:text-white`;

                                return (
                                    <li key={item.to}>
                                        <Link
                                            to={item.to}
                                            onClick={handleLinkClick} // Đóng sidebar mobile khi click vào link
                                            className={`${itemBaseClass} ${isActive ? activeClasses : inactiveClasses}`}
                                        >
                                            <item.icon className="w-6 h-6 flex-shrink-0 mr-3" />
                                            <span>{item.label}</span> 
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </nav>

                    {/* Nút Đăng xuất - MOBILE */}
                    <div className="p-4 border-t border-gray-600 flex-shrink-0">
                        <button
                            onClick={handleLogoutAndClose} 
                            className={`w-full ${itemBaseClass} text-red-300 bg-transparent hover:bg-red-800`}
                        >
                            <LogOut className="w-6 h-6 flex-shrink-0 mr-3" />
                            <span>Đăng xuất</span>
                        </button>
                    </div>
                </div>
            </aside>
        </>
    );
}