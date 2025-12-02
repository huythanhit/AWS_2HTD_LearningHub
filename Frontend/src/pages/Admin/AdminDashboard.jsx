import React, { useState, useEffect } from 'react';
import { 
    Users, BookOpen, GraduationCap, Activity, 
    TrendingUp, Calendar, MoreHorizontal,
    ArrowUpRight, ArrowDownRight, Filter
} from 'lucide-react';

// --- CSS STYLES & ANIMATIONS ---
const styles = `
  @keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes growUp {
    from { height: 0; opacity: 0; }
    to { opacity: 1; }
  }
  .animate-fade-in-up {
    animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }
  .animate-grow {
    animation: growUp 1s ease-out forwards;
  }
  .glass-effect {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(10px);
  }
  .hover-card-effect {
    transition: all 0.3s ease;
  }
  .hover-card-effect:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  }
`;

// --- COMPONENT: BIỂU ĐỒ CỘT HIỆN ĐẠI (PRO VERSION) ---
const ModernBarChart = () => {
    // Dữ liệu mẫu 6 tháng
    const data = [
        { label: 'Tháng 6', value: 120, growth: '+5%' },
        { label: 'Tháng 7', value: 155, growth: '+12%' },
        { label: 'Tháng 8', value: 110, growth: '-8%' },
        { label: 'Tháng 9', value: 240, growth: '+25%' }, // Cao điểm tựu trường
        { label: 'Tháng 10', value: 210, growth: '+5%' },
        { label: 'Tháng 11', value: 285, growth: '+18%' },
    ];
    
    const maxVal = Math.max(...data.map(d => d.value)) * 1.1; // Thêm 10% padding top

    return (
        <div className="relative h-72 w-full flex flex-col justify-end gap-2 pt-8 select-none">
            {/* Background Grid Lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-0 px-2 pb-8 pt-4 opacity-30">
                {[100, 75, 50, 25, 0].map((line, i) => (
                    <div key={i} className="w-full border-t border-dashed border-gray-300 relative">
                        <span className="absolute -left-0 -top-2.5 text-[10px] text-gray-400">{Math.round(maxVal * (line/100))}</span>
                    </div>
                ))}
            </div>

            {/* Bars Container */}
            <div className="flex items-end justify-between h-full z-10 px-4 md:px-8 gap-4">
                {data.map((item, index) => {
                    const heightPct = (item.value / maxVal) * 100;
                    return (
                        <div key={index} className="flex flex-col items-center flex-1 h-full justify-end group cursor-pointer relative">
                            {/* Tooltip */}
                            <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 bg-gray-800 text-white text-xs py-1.5 px-3 rounded-lg shadow-lg z-20 whitespace-nowrap">
                                {item.value} Học viên <span className="text-gray-400">({item.growth})</span>
                                <div className="absolute bottom-[-4px] left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-800 rotate-45"></div>
                            </div>

                            {/* The Bar */}
                            <div 
                                className="w-full max-w-[40px] rounded-t-lg relative overflow-hidden animate-grow shadow-sm group-hover:shadow-indigo-200 transition-all duration-300"
                                style={{ 
                                    height: `${heightPct}%`, 
                                    animationDelay: `${index * 100}ms`,
                                    background: `linear-gradient(180deg, #5a4d8c 0%, #8172b8 100%)`
                                }}
                            >
                                {/* Shine Effect overlay */}
                                <div className="absolute top-0 left-0 w-full h-full bg-white opacity-0 group-hover:opacity-10 transition-opacity duration-300 bg-gradient-to-b from-white/20 to-transparent"></div>
                            </div>

                            {/* Label */}
                            <span className="text-xs text-gray-500 font-medium mt-3 group-hover:text-[#5a4d8c] transition-colors">{item.label}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

// --- COMPONENT: DONUT CHART (TỈ LỆ) ---
const DonutChart = ({ pass, fail }) => {
    const total = pass + fail;
    const passPct = (pass / total) * 100;
    const dashArray = 2 * Math.PI * 45; // radius 45
    const passDash = (passPct / 100) * dashArray;

    return (
        <div className="relative w-full h-full flex flex-col items-center justify-center py-4">
            <div className="relative w-56 h-56 transform hover:scale-105 transition-transform duration-500 ease-out">
                <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 drop-shadow-lg">
                    {/* Background Circle */}
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#F3F4F6" strokeWidth="10" />
                    
                    {/* Fail Circle (Red Background behind) - optional styling */}
                    <circle cx="50" cy="50" r="45" fill="none" stroke="#FECACA" strokeWidth="10" 
                        strokeDasharray={dashArray} strokeDashoffset={passDash} 
                        className="transition-all duration-1000 ease-out" />

                    {/* Pass Circle (Main) */}
                    <circle cx="50" cy="50" r="45" fill="none" stroke="url(#gradientPass)" strokeWidth="10" 
                        strokeLinecap="round" strokeDasharray={`${passDash} ${dashArray - passDash}`}
                        className="animate-grow origin-center transition-all duration-1000 ease-out" 
                    />
                    
                    {/* Gradients */}
                    <defs>
                        <linearGradient id="gradientPass" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#5a4d8c" />
                            <stop offset="100%" stopColor="#818cf8" />
                        </linearGradient>
                    </defs>
                </svg>
                
                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-700">
                    <span className="text-sm text-gray-400 font-medium">Tỉ lệ Đậu</span>
                    <span className="text-4xl font-extrabold text-[#5a4d8c]">{Math.round(passPct)}%</span>
                </div>
            </div>

            <div className="flex gap-8 mt-4">
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-[#5a4d8c]"></span>
                    <span className="text-sm font-medium text-gray-600">Đạt ({pass})</span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-200"></span>
                    <span className="text-sm font-medium text-gray-600">Trượt ({fail})</span>
                </div>
            </div>
        </div>
    );
};

// --- MAIN DASHBOARD ---
export default function AdminDashboard() {
    return (
        <div className="min-h-screen bg-[#f8fafc] font-sans text-gray-800 p-6 md:p-8">
            <style>{styles}</style>
            
            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 animate-fade-in-up">
                <div>
                    <div className="flex items-center gap-2 text-gray-500 text-sm font-medium mb-1">
                        <Calendar size={16} className="text-[#5a4d8c]"/>
                        <span>{new Date().toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">
                        Tổng Quan Quản Trị
                    </h1>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition shadow-sm flex items-center gap-2">
                        <Filter size={16} /> Lọc dữ liệu
                    </button>
                    <button className="px-5 py-2 bg-[#5a4d8c] text-white rounded-xl text-sm font-bold hover:bg-[#483d73] transition shadow-lg shadow-indigo-200 flex items-center gap-2">
                        + Tạo thông báo mới
                    </button>
                </div>
            </div>

            {/* --- STATS WIDGETS --- */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {[
                    { title: "Tổng học viên", value: "2,845", sub: "+125 tháng này", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
                    { title: "Tổng giáo viên", value: "42", sub: "Full-time & Part-time", icon: GraduationCap, color: "text-indigo-600", bg: "bg-indigo-50" },
                    { title: "Khóa học active", value: "18", sub: "Trên tổng số 24", icon: BookOpen, color: "text-orange-600", bg: "bg-orange-50" },
                    { title: "Tỉ lệ hoàn thành", value: "94.2%", sub: "+2.1% so với kỳ trước", icon: Activity, color: "text-emerald-600", bg: "bg-emerald-50" },
                ].map((stat, idx) => (
                    <div 
                        key={idx} 
                        className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover-card-effect animate-fade-in-up"
                        style={{ animationDelay: `${idx * 0.1}s` }}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3.5 rounded-2xl ${stat.bg} ${stat.color}`}>
                                <stat.icon size={26} strokeWidth={2.5} />
                            </div>
                            <button className="text-gray-300 hover:text-gray-500 transition"><MoreHorizontal size={20}/></button>
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-3xl font-bold text-gray-800">{stat.value}</h3>
                            <p className="text-sm font-semibold text-gray-500">{stat.title}</p>
                            <p className={`text-xs font-medium mt-2 flex items-center gap-1 ${stat.sub.includes('+') ? 'text-green-600' : 'text-gray-400'}`}>
                                {stat.sub.includes('+') && <TrendingUp size={12} />}
                                {stat.sub}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* --- CHARTS SECTION --- */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* 1. CHART: Tăng trưởng học viên (Chiếm 2/3) */}
                <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm animate-fade-in-up hover:shadow-md transition-shadow duration-300 delay-200">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Phân tích tăng trưởng học viên</h2>
                            <p className="text-sm text-gray-500 mt-1">Số lượng đăng ký mới trong 6 tháng gần nhất</p>
                        </div>
                        <div className="flex bg-gray-100 p-1 rounded-lg">
                            <button className="px-3 py-1 bg-white rounded-md text-xs font-bold text-gray-700 shadow-sm">6 tháng</button>
                            <button className="px-3 py-1 text-xs font-medium text-gray-500 hover:text-gray-700">1 năm</button>
                        </div>
                    </div>
                    
                    {/* Chèn Component Chart */}
                    <div className="w-full">
                        <ModernBarChart />
                    </div>
                </div>

                {/* 2. CHART: Tỉ lệ Đậu/Rớt (Chiếm 1/3) */}
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm animate-fade-in-up hover:shadow-md transition-shadow duration-300 delay-300 flex flex-col">
                    <div className="mb-2">
                        <h2 className="text-xl font-bold text-gray-800">Chất lượng đào tạo</h2>
                        <p className="text-sm text-gray-500 mt-1">Kết quả bài thi cuối khóa toàn hệ thống</p>
                    </div>
                    
                    <div className="flex-1 flex items-center justify-center">
                        <DonutChart pass={1560} fail={340} />
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100">
                        <button className="w-full py-2.5 rounded-xl border border-indigo-100 text-[#5a4d8c] bg-indigo-50 font-semibold text-sm hover:bg-[#5a4d8c] hover:text-white transition-all">
                            Xem báo cáo chi tiết
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}