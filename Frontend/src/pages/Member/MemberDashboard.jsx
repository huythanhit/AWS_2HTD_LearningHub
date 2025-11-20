import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function MemberDashboard() {
    const navigate = useNavigate();
    
    // Hàm xử lý Logout
    const handleLogout = () => {
        // Xóa thông tin xác thực khỏi localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('userRole'); 
        
        // Điều hướng về trang Đăng nhập
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-xl">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-4xl font-bold text-[#5a4d8c]">
                        MEMBER Dashboard
                    </h1>
                    <button 
                        onClick={handleLogout}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
                    >
                        Đăng xuất
                    </button>
                </div>
                <p className="text-lg text-gray-700 mb-4">
                    Chào mừng, **Học viên**. Đây là khu vực cá nhân của bạn.
                </p>
                <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="p-4 bg-blue-100 rounded-lg">Khóa học của tôi</div>
                    <div className="p-4 bg-blue-100 rounded-lg">Tiến độ học tập</div>
                    <div className="p-4 bg-blue-100 rounded-lg">Cộng đồng</div>
                </div>
            </div>
        </div>
    );
}