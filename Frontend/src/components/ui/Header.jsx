import React from 'react';
import { User, Menu } from 'lucide-react'; // Import Menu icon

/**
 * Header CHỈ UI (Presentation) cho khu vực Dashboard
 * @param {Object} props
 * @param {string} props.userName - Tên người dùng.
 * @param {string} props.currentPageTitle - Tên trang hiện tại.
 * @param {function} props.onToggleMobileSidebar - Hàm gọi khi click nút mobile menu. <-- Đổi tên
 */
export default function DashboardHeader({ userName, currentPageTitle, onToggleMobileSidebar }) {
    const primaryColor = 'text-[#5a4d8c]'; 
    const primaryBg = 'bg-[#f0eaf9]'; 

    return (
        <header className={`sticky top-0 z-20 py-4 px-6 ${primaryBg} shadow-md transition-all duration-300 ease-in-out w-full`}>
            <div className="flex justify-between items-center max-w-full">
                
                {/* 1. Tên Trang Hiện Tại (Góc Trái) & Mobile Toggle */}
                <div className="flex items-center space-x-4">
                    
                    {/* Nút Toggle Sidebar (Chỉ hiển thị trên mobile) */}
                    <button 
                        onClick={onToggleMobileSidebar} // <-- Dùng prop mới
                        className={`lg:hidden p-1 rounded-md ${primaryColor} hover:bg-purple-200 transition`}
                        aria-label="Toggle Menu"
                    >
                        <Menu size={24} />
                    </button>

                    {/* Tên Trang hiện tại */}
                    <div className="flex flex-col items-start">
                        <h1 className={`text-2xl md:text-3xl font-extrabold ${primaryColor}`}>
                            {currentPageTitle || 'Dashboard'}
                        </h1>
                    </div>
                </div>

                {/* 2. Tên User & Avatar (Góc Phải) */}
                <div className="flex items-center space-x-3">
                    {/* Hiển thị Tên User */}
                    <span className="text-gray-700 font-semibold hidden sm:inline">
                        {userName}
                    </span>
                    {/* Avatar */}
                    <div className={`p-2 rounded-full bg-purple-200 ${primaryColor} flex items-center justify-center`}>
                        <User size={20} />
                    </div>
                </div>
            </div>
        </header>
    );
}