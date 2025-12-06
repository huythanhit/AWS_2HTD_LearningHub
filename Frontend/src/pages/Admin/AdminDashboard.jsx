import React, { useState, useEffect } from 'react';
import { 
    Users, BookOpen, GraduationCap, Calendar, 
    ArrowUpRight, ArrowDownRight, ChevronLeft, ChevronRight
} from 'lucide-react';

// [FIX] Sửa lại tên hàm import đúng với adminService.js (getAdminCourses thay vì getCourses)
import { getAdminUsers, getAdminCourses } from "../../services/adminService";

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

// --- COMPONENT CHART GIẢ LẬP ---
const ModernBarChart = () => (
    <div className="flex items-end justify-between h-64 w-full gap-2 mt-4 px-2">
        {[45, 67, 89, 54, 78, 92, 65, 88, 76, 54, 87, 95].map((h, i) => (
            <div key={i} className="flex flex-col items-center gap-2 group w-full">
                <div className="relative w-full flex items-end justify-center h-full overflow-hidden rounded-t-lg bg-gray-50">
                    <div 
                        style={{ height: `${h}%` }} 
                        className={`w-4/5 rounded-t-lg transition-all duration-1000 ease-out group-hover:opacity-90 animate-grow 
                        ${i % 2 === 0 ? 'bg-[#5a4d8c]' : 'bg-[#8d7fbf]'}`}
                    ></div>
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        {h * 12} visitors
                    </div>
                </div>
                <span className="text-xs text-gray-400 font-medium">T{i + 1}</span>
            </div>
        ))}
    </div>
);

const DonutChart = ({ pass, fail }) => {
    const total = pass + fail;
    const passPercent = (pass / total) * 100;
    
    return (
        <div className="relative w-48 h-48 flex items-center justify-center">
            <svg viewBox="0 0 36 36" className="w-full h-full rotate-[-90deg]">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f3f4f6" strokeWidth="4" />
                <path 
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" 
                    fill="none" 
                    stroke="#5a4d8c" 
                    strokeWidth="4" 
                    strokeDasharray={`${passPercent}, 100`}
                    className="animate-[dash_1.5s_ease-out_forwards]"
                />
            </svg>
            <div className="absolute flex flex-col items-center animate-fade-in-up">
                <span className="text-3xl font-bold text-gray-800">{Math.round(passPercent)}%</span>
                <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Tỷ lệ đậu</span>
            </div>
        </div>
    );
};

// --- COMPONENT CHÍNH ---
export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalCourses: 0,
        totalTeachers: 0
    });
    const [loading, setLoading] = useState(true);

    // Selected month for the dashboard (editable via prev/next)
    const [selectedDate, setSelectedDate] = useState(new Date());
    const monthLabel = `Tháng ${selectedDate.getMonth() + 1}/${selectedDate.getFullYear()}`;

    const prevMonth = () => {
        const d = new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1);
        setSelectedDate(d);
    };

    const nextMonth = () => {
        const d = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1);
        setSelectedDate(d);
    };

   useEffect(() => {
        async function fetchDashboardData() {
            try {
                setLoading(true);

                // --- 1. Lấy Users ---
                const usersRes = await getAdminUsers(1, 1000);
                const usersList = usersRes.users || [];
                
                // Khai báo biến totalUsers
                const totalUsers = usersRes.pagination?.total || usersList.length || 0;

                // --- 2. Đếm số lượng Giảng Viên (FIX: dùng role_name) ---
                const teachersList = usersList.filter(u => {
                    // [QUAN TRỌNG] API trả về 'role_name', lấy cả 'role' để dự phòng
                    const roleVal = u.role_name || u.role || ""; 
                    
                    // Chuyển về chữ thường để so sánh (tránh lỗi viết hoa/thường)
                    const roleStr = roleVal.toString().toLowerCase().trim();
                    
                    // Kiểm tra: teacher, giangvien hoặc admin
                    return roleStr === 'teacher' || roleStr === 'giangvien' || roleStr === 'admin'; 
                });
                
                console.log("✅ Đã tìm thấy số giảng viên:", teachersList.length);

                // --- 3. Lấy Courses ---
                const coursesRes = await getAdminCourses();
                const coursesList = Array.isArray(coursesRes) ? coursesRes : (coursesRes.data || []);
                const totalCourses = coursesList.length;

                // --- 4. Cập nhật State ---
                setStats({
                    totalUsers: totalUsers,
                    totalCourses: totalCourses,
                    totalTeachers: teachersList.length
                });

            } catch (error) {
                console.error("❌ Dashboard Sync Error:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchDashboardData();
    }, []);

    const statCards = [
        { 
            title: "Tổng Học Viên", 
            value: loading ? "..." : stats.totalUsers.toLocaleString(),
            change: "+12%", 
            trend: "up", 
            icon: Users, 
            color: "text-gray-700"
        },
        { 
            title: "Tổng Khóa Học", 
            value: loading ? "..." : stats.totalCourses.toLocaleString(),
            change: "+5%", 
            trend: "up", 
            icon: BookOpen, 
            color: "text-gray-700"
        },
        { 
            title: "Giảng Viên", 
            value: loading ? "..." : stats.totalTeachers.toLocaleString(),
            change: "+2", 
            trend: "up", 
            icon: GraduationCap, 
            color: "text-gray-700"
        }
    ];

    return (
        <div className="min-h-screen bg-[#fafafa] p-8 font-sans">
            <style>{styles}</style>

            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 animate-fade-in-up">
                <div>
                    <h1 className="text-3xl font-extrabold text-gray-800 tracking-tight">Tổng Quan</h1>
                    <p className="text-gray-500 mt-1 font-medium">Chào mừng trở lại, Administrator!</p>
                </div>
                
                <div className="flex gap-3 mt-4 md:mt-0">
                    <div className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-xl transition shadow-sm font-medium text-sm">
                        <button onClick={prevMonth} aria-label="Tháng trước" className="p-1 rounded hover:bg-gray-100">
                            <ChevronLeft size={16} />
                        </button>
                        <Calendar size={18} />
                        <span className="font-medium px-2">{monthLabel}</span>
                        <button onClick={nextMonth} aria-label="Tháng sau" className="p-1 rounded hover:bg-gray-100">
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* STAT CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
                {statCards.map((item, index) => (
                    <div 
                        key={index} 
                        className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover-card-effect animate-fade-in-up"
                        style={{ animationDelay: `${index * 100}ms` }}
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 rounded-xl bg-white border border-gray-100">
                                <item.icon className={item.color} size={24} />
                            </div>
                            {item.change && (
                                <span className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${
                                    item.trend === 'up' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'
                                }`}>
                                    {item.trend === 'up' ? <ArrowUpRight size={12}/> : <ArrowDownRight size={12}/>}
                                    {item.change}
                                </span>
                            )}
                        </div>
                        <div>
                            <p className="text-gray-500 text-sm font-medium mb-1">{item.title}</p>
                            <h3 className="text-2xl font-bold text-gray-800">{item.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* CHARTS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* 1. CHART: Thống kê truy cập */}
                <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm animate-fade-in-up delay-200 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">Lượt truy cập hệ thống</h2>
                            <p className="text-sm text-gray-500 mt-1">Số liệu thống kê theo thời gian thực</p>
                        </div>
                        <div className="flex bg-gray-50 p-1 rounded-lg">
                            <button className="px-3 py-1 bg-white shadow-sm rounded-md text-xs font-medium text-gray-800">7 ngày</button>
                            <button className="px-3 py-1 rounded-md text-xs font-medium text-gray-500 hover:text-gray-700">30 ngày</button>
                            <button className="px-3 py-1 rounded-md text-xs font-medium text-gray-500 hover:text-gray-700">1 năm</button>
                        </div>
                    </div>
                    
                    <div className="w-full">
                        <ModernBarChart />
                    </div>
                </div>

                {/* 2. CHART: Tỉ lệ Đậu/Rớt */}
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

// Removed unused chevron helper — month control uses lucide chevrons now