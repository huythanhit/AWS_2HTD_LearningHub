import React, { useState, useEffect } from 'react';
import { 
    Users, BookOpen, GraduationCap, 
    ArrowUpRight, ArrowDownRight, TrendingUp
} from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

// [FIX] Sửa lại tên hàm import đúng với adminService.js (getAdminCourses thay vì getCourses)
import { getAdminUsers, getAdminCourses, getTopPopularCourses } from "../../services/adminService";

// Đăng ký các components Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

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


// --- COMPONENT CHÍNH ---
export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalCourses: 0,
        totalTeachers: 0
    });
    const [loading, setLoading] = useState(true);
    const [topCoursesData, setTopCoursesData] = useState([]);
    const [loadingTopCourses, setLoadingTopCourses] = useState(true);


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

        async function fetchTopPopularCourses() {
            try {
                setLoadingTopCourses(true);
                const data = await getTopPopularCourses();
                
                // Đảm bảo data là array và có format đúng
                if (Array.isArray(data) && data.length > 0) {
                    setTopCoursesData(data);
                } else {
                    // Fallback về empty array nếu không có data
                    setTopCoursesData([]);
                }
            } catch (error) {
                console.error("❌ Error fetching top popular courses:", error);
                // Giữ empty array nếu có lỗi
                setTopCoursesData([]);
            } finally {
                setLoadingTopCourses(false);
            }
        }

        fetchDashboardData();
        fetchTopPopularCourses();
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

            {/* BAR CHART - Top 5 Khóa Học Phổ Biến */}
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover-card-effect animate-fade-in-up">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="text-[#5a4d8c]" size={20} />
                            <h2 className="text-xl font-bold text-gray-800">Top 5 Khóa Học Phổ Biến</h2>
                        </div>
                        <p className="text-sm text-gray-500">So sánh số lượng học viên của các khóa học hàng đầu</p>
                    </div>
                </div>
                
                {loadingTopCourses ? (
                    <div className="h-80 flex items-center justify-center">
                        <div className="text-center">
                            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#5a4d8c] mb-4"></div>
                            <p className="text-gray-500 text-sm">Đang tải dữ liệu...</p>
                        </div>
                    </div>
                ) : topCoursesData.length === 0 ? (
                    <div className="h-80 flex items-center justify-center">
                        <div className="text-center">
                            <p className="text-gray-500 text-sm">Chưa có dữ liệu khóa học phổ biến</p>
                        </div>
                    </div>
                ) : (
                    <div className="h-80">
                        <Bar
                            data={{
                                labels: topCoursesData.map(course => {
                                    // Truncate title nếu quá dài (giới hạn 35 ký tự)
                                    const maxLength = 35;
                                    if (course.name.length > maxLength) {
                                        return course.name.substring(0, maxLength) + '...';
                                    }
                                    return course.name;
                                }),
                                datasets: [
                                    {
                                        label: 'Số lượng học viên',
                                        data: topCoursesData.map(course => course.students),
                                        backgroundColor: topCoursesData.map((_, index) => {
                                            // Tạo gradient màu từ đậm đến nhạt
                                            const opacity = 0.8 - (index * 0.1);
                                            return `rgba(90, 77, 140, ${Math.max(opacity, 0.4)})`;
                                        }),
                                        borderColor: topCoursesData.map(() => 'rgba(90, 77, 140, 1)'),
                                        borderWidth: 1,
                                        borderRadius: 8,
                                        borderSkipped: false,
                                    }
                                ]
                            }}
                        options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            layout: {
                                padding: {
                                    bottom: 20
                                }
                            },
                            plugins: {
                                legend: {
                                    display: true,
                                    position: 'top',
                                    labels: {
                                        font: {
                                            size: 12,
                                            family: "'Inter', sans-serif",
                                            weight: '500'
                                        },
                                        color: '#6b7280',
                                        padding: 15,
                                        usePointStyle: true,
                                        pointStyle: 'circle'
                                    }
                                },
                                tooltip: {
                                    backgroundColor: 'rgba(0, 0, 0, 0.85)',
                                    padding: 14,
                                    titleFont: {
                                        size: 14,
                                        weight: '600',
                                        family: "'Inter', sans-serif"
                                    },
                                    bodyFont: {
                                        size: 13,
                                        family: "'Inter', sans-serif"
                                    },
                                    borderColor: 'rgba(90, 77, 140, 0.3)',
                                    borderWidth: 1,
                                    cornerRadius: 8,
                                    displayColors: true,
                                    callbacks: {
                                        title: function(context) {
                                            // Hiển thị full name trong tooltip
                                            const index = context[0].dataIndex;
                                            return topCoursesData[index].name;
                                        },
                                        label: function(context) {
                                            return `Học viên: ${context.parsed.y.toLocaleString('vi-VN')}`;
                                        }
                                    }
                                }
                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    max: 100, // Giới hạn tối đa là 100
                                    grid: {
                                        color: 'rgba(0, 0, 0, 0.05)',
                                        drawBorder: false,
                                    },
                                    ticks: {
                                        stepSize: 10, // Mỗi số cách nhau 10 đơn vị
                                        precision: 0, // Không có số thập phân
                                        maxTicksLimit: 11, // Tối đa 11 ticks (0, 10, 20, ..., 100)
                                        font: {
                                            size: 11,
                                            family: "'Inter', sans-serif"
                                        },
                                        color: '#6b7280',
                                        padding: 10,
                                        callback: function(value) {
                                            // Chỉ hiển thị số nguyên và là bội số của 10
                                            if (Number.isInteger(value) && value % 10 === 0) {
                                                return value.toLocaleString('vi-VN');
                                            }
                                            return ''; // Ẩn số không phải bội số của 10
                                        }
                                    }
                                },
                                x: {
                                    grid: {
                                        display: false,
                                    },
                                    ticks: {
                                        font: {
                                            size: 11,
                                            family: "'Inter', sans-serif",
                                            weight: '500'
                                        },
                                        color: '#374151',
                                        padding: 16,
                                        maxRotation: 0, // Không rotate
                                        minRotation: 0,
                                        autoSkip: false,
                                        maxTicksLimit: 10,
                                        callback: function(value, index) {
                                            // Truncate label nếu quá dài
                                            const label = this.getLabelForValue(value);
                                            const maxLength = 30;
                                            if (label && label.length > maxLength) {
                                                return label.substring(0, maxLength) + '...';
                                            }
                                            return label;
                                        }
                                    }
                                }
                            },
                            animation: {
                                duration: 1000,
                                easing: 'easeInOutQuart'
                            },
                            interaction: {
                                intersect: false,
                                mode: 'index'
                            }
                            }}
                        />
                    </div>
                )}

                {/* Summary Stats */}
                {!loadingTopCourses && topCoursesData.length > 0 && (
                    <div className="mt-6 pt-6 border-t border-gray-100">
                        <div className={`flex gap-4 ${topCoursesData.length <= 2 ? 'flex-wrap' : ''}`}>
                            {topCoursesData.map((course, index) => (
                                <div 
                                    key={index} 
                                    className={`flex flex-col items-center text-center flex-1 min-w-0 ${topCoursesData.length <= 2 ? 'flex-basis-[calc(50%-0.5rem)]' : topCoursesData.length <= 4 ? 'md:flex-basis-[calc(25%-0.75rem)]' : 'md:flex-basis-[calc(20%-0.8rem)]'}`}
                                >
                                    <div className="text-xs text-gray-500 mb-1 line-clamp-2 flex-shrink-0 min-h-[2.5rem] flex items-center justify-center">{course.name}</div>
                                    <div className="text-lg font-bold text-[#5a4d8c] flex-shrink-0 min-h-[1.75rem] flex items-center justify-center">{course.students.toLocaleString('vi-VN')}</div>
                                    <div className="text-xs text-gray-400 flex-shrink-0 min-h-[1.25rem] flex items-center justify-center">học viên</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
}

// Removed unused chevron helper — month control uses lucide chevrons now