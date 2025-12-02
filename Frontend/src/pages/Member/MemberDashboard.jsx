import React from 'react';
import { BookOpen, CheckCircle, Clock, Zap, Award, ArrowRight, TrendingUp, Target } from 'lucide-react';

export default function MemberDashboard() {
    
    // --- DỮ LIỆU GIẢ ĐỊNH ---
    const totalCourses = 5;
    const completedCourses = 3; 
    const progressPercent = (completedCourses / totalCourses) * 100;
    
    const completedTasks = 45;
    const pendingTasks = 12;
    const totalTasks = completedTasks + pendingTasks;

    return (
        <div className="w-full"> 
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* 1. HEADER CHÀO MỪNG - PHIÊN BẢN TRONG TRẺO (LIGHT & GLASSY) */}
                <div className="relative overflow-hidden bg-gradient-to-r from-purple-50/100 to-indigo-50/100 backdrop-blur-xl p-8 md:p-10 rounded-3xl border border-white/60 shadow-sm">
                    
                    {/* Họa tiết trang trí nền (Màu Pastel rất nhạt) */}
                    <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-purple-200/40 rounded-full blur-[80px]"></div>
                    <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-60 h-60 bg-indigo-200/40 rounded-full blur-[60px]"></div>

                    <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                        <div>
                            {/* Badge trạng thái - Nền trắng sạch sẽ */}
                            <div className="flex items-center gap-2 mb-3 bg-white/80 w-fit px-3 py-1 rounded-full border border-purple-100 shadow-sm backdrop-blur-sm">
                                <span className="animate-pulse w-2 h-2 bg-[#4ade80] rounded-full"></span>
                                <span className="text-xs font-semibold tracking-wide uppercase text-gray-500">Hệ thống đang hoạt động</span>
                            </div>
                            
                            {/* Tiêu đề - Màu đậm để tương phản với nền nhạt */}
                            <h1 className="text-3xl md:text-4xl font-extrabold mb-2 text-gray-800">
                                Xin chào, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">Học viên!</span> 🚀
                            </h1>
                            <p className="text-gray-500 text-lg max-w-xl font-medium">
                                "Không có con đường tắt nào dẫn đến nơi xứng đáng để đến." <br/> 
                                <span className="text-indigo-900/70 text-base font-normal">Chúc bạn một ngày học tập hiệu quả!</span>
                            </p>
                        </div>
                        
                        {/* Huy hiệu hạng - Chỉnh lại border nhẹ nhàng */}
                        <div className="flex items-center gap-3 bg-white/60 backdrop-blur-md text-gray-800 px-5 py-3 rounded-2xl shadow-sm border border-white/50 font-bold transform transition-transform hover:scale-105 cursor-default hover:bg-white">
                            <div className="p-2 bg-yellow-100 text-yellow-600 rounded-full">
                                <Award size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400 uppercase font-normal">Xếp hạng tuần</p>
                                <p className="text-indigo-900">Ong chăm chỉ</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. KHU VỰC CHÍNH (BENTO GRID) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    
                    {/* CỘT TRÁI: BIỂU ĐỒ TIẾN ĐỘ (Chiếm 4/12 cột) */}
                    <div className="lg:col-span-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-b from-green-50/50 to-transparent opacity-50"></div>
                        
                        <div className="relative z-10 w-full">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                    <Target className="text-emerald-500" size={20}/>
                                    Mục tiêu khóa học
                                </h2>
                                <span className="bg-emerald-100 text-emerald-500 text-xs font-bold px-2 py-1 rounded-lg">Tháng này</span>
                            </div>

                            {/* Custom SVG Donut Chart (XANH LÁ) */}
                            <div className="flex justify-center items-center py-2">
                                <CircularProgress percentage={progressPercent} />
                            </div>

                            <div className="text-center mt-6">
                                <p className="text-gray-500 text-sm mb-1">Tiến độ hiện tại</p>
                                <div className="text-2xl font-bold text-gray-800">
                                    {completedCourses} <span className="text-gray-400 text-lg font-normal">/ {totalCourses} Khóa học</span>
                                </div>
                                
                                <button className="mt-6 w-full py-3 rounded-xl bg-gray-900 text-white font-semibold hover:bg-emerald-500 transition-colors shadow-lg hover:shadow-emerald-200 duration-300 flex items-center justify-center gap-2">
                                    Tiếp tục học
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* CỘT PHẢI: THỐNG KÊ & ACTION (Chiếm 8/12 cột) */}
                    <div className="lg:col-span-8 flex flex-col gap-6">
                        
                        {/* Hàng Thống kê - Colorful Cards */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <StatCard 
                                icon={BookOpen} 
                                label="Tổng bài tập" 
                                value={totalTasks} 
                                subValue="+2 mới hôm nay"
                                theme="blue"
                            />
                            <StatCard 
                                icon={CheckCircle} 
                                label="Đã hoàn thành" 
                                value={completedTasks} 
                                subValue="Tuyệt vời!"
                                theme="green"
                            />
                            <StatCard 
                                icon={Clock} 
                                label="Chờ xử lý" 
                                value={pendingTasks} 
                                subValue="Hạn chót sắp tới"
                                theme="orange"
                            />
                        </div>

                        {/* Khu vực Flashcard - Thiết kế ngang nổi bật */}
                        <div className="flex-1 bg-gradient-to-r from-[#2c2c54] to-[#474787] rounded-3xl p-8 relative overflow-hidden flex flex-col md:flex-row items-center justify-between text-white shadow-xl shadow-indigo-200">
                            {/* Decor */}
                            <div className="absolute right-0 top-0 h-full w-1/2 bg-white/5 skew-x-12 transform origin-bottom-right"></div>
                            
                            <div className="relative z-10 max-w-md">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-pink-500 rounded-lg shadow-lg shadow-pink-500/40">
                                        <Zap size={24} fill="white" className="text-white"/>
                                    </div>
                                    <h3 className="text-2xl font-bold">Ôn tập Flashcard</h3>
                                </div>
                                <p className="text-indigo-200 mb-6 leading-relaxed">
                                    Khoa học chứng minh việc ôn tập ngắt quãng giúp tăng trí nhớ gấp 3 lần. Bạn có <strong className="text-white">120 thẻ</strong> đang chờ!
                                </p>
                                <div className="flex gap-3">
                                    <button className="px-6 py-3 bg-white text-indigo-900 rounded-xl font-bold hover:bg-gray-50 transition shadow-lg active:scale-95">
                                        Bắt đầu ngay
                                    </button>
                                    <button className="px-6 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition backdrop-blur-sm">
                                        Xem lịch sử
                                    </button>
                                </div>
                            </div>

                            {/* Illustration / Biểu tượng lớn bên phải */}
                            <div className="hidden md:flex relative z-10 bg-white/10 p-6 rounded-2xl backdrop-blur-sm border border-white/10 flex-col items-center">
                                <span className="text-4xl font-bold mb-1">120</span>
                                <span className="text-xs uppercase tracking-wider opacity-70">Thẻ từ vựng</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// --- SUB COMPONENTS (Đã tùy chỉnh màu sắc) ---

// 1. Component Thống kê Colorful (StatCard)
const StatCard = ({ icon: Icon, label, value, subValue, theme }) => {
    
    // Định nghĩa Theme màu sắc
    const themes = {
        blue: {
            bg: 'bg-blue-50',
            text: 'text-blue-900',
            iconBg: 'bg-blue-100',
            iconColor: 'text-blue-600',
            border: 'border-blue-100'
        },
        green: {
            bg: 'bg-emerald-50',
            text: 'text-emerald-900',
            iconBg: 'bg-emerald-100',
            iconColor: 'text-emerald-600',
            border: 'border-emerald-100'
        },
        orange: {
            bg: 'bg-orange-50',
            text: 'text-orange-900',
            iconBg: 'bg-orange-100',
            iconColor: 'text-orange-600',
            border: 'border-orange-100'
        }
    };

    const t = themes[theme] || themes.blue;

    return (
        <div className={`p-5 rounded-3xl border ${t.border} ${t.bg} transition-all hover:shadow-md hover:-translate-y-1 duration-300`}>
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${t.iconBg} ${t.iconColor}`}>
                    <Icon size={24} />
                </div>
                {theme === 'green' && <TrendingUp size={20} className="text-emerald-500" />}
            </div>
            <div>
                <p className={`text-sm font-semibold opacity-70 ${t.text}`}>{label}</p>
                <h4 className={`text-3xl font-extrabold ${t.text} mt-1 mb-1`}>{value}</h4>
                <span className={`text-xs font-medium px-2 py-1 rounded-md bg-white/60 ${t.text}`}>
                    {subValue}
                </span>
            </div>
        </div>
    );
};

// 2. Component Biểu đồ tròn XANH LÁ (Green CircularProgress)
const CircularProgress = ({ percentage, size = 200, strokeWidth = 18 }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const dash = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center drop-shadow-xl" style={{ width: size, height: size }}>
            {/* SVG Chart */}
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90">
                {/* Background Circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="#e5e7eb" // gray-200
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                />
                {/* Progress Circle (Green Gradient) */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="url(#greenGradient)" 
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={circumference}
                    strokeDashoffset={dash}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-out"
                />
                {/* Gradient Definition: XANH LÁ */}
                <defs>
                    <linearGradient id="greenGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#10b981" /> {/* Emerald 500 */}
                        <stop offset="100%" stopColor="#34d399" /> {/* Emerald 400 */}
                    </linearGradient>
                </defs>
            </svg>
            
            {/* Text ở giữa */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-5xl font-extrabold text-gray-800">{Math.round(percentage)}%</span>
                <span className="text-xs text-emerald-500 font-bold uppercase tracking-wider mt-2 bg-emerald-50 px-2 py-1 rounded-md">Hoàn thành</span>
            </div>
        </div>
    );
};