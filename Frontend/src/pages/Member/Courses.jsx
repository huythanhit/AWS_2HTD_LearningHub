import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Clock, CheckCircle, PlayCircle, Search, Trophy, Users } from 'lucide-react';

export default function Courses() {
  const navigate = useNavigate();
  
  // --- DỮ LIỆU ĐÃ CẬP NHẬT ẢNH MINH HỌA ---
  const [courses, setCourses] = useState([
    {
      id: 1,
      title: "IELTS Intensive (Band 7.0+)",
      instructor: "Dr. Sarah Smith",
      progress: 65,
      lessons: 24,
      completed: 16,
      duration: "12 tuần",
      // Ảnh minh họa: Sách vở, môi trường học thuật
      image: "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=1000&auto=format&fit=crop",
      status: "in-progress"
    },
    {
      id: 2,
      title: "Business English Communication",
      instructor: "Mr. David Chen",
      progress: 100,
      lessons: 18,
      completed: 18,
      duration: "8 tuần",
      // Ảnh minh họa: Môi trường công sở, làm việc
      image: "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=1000&auto=format&fit=crop",
      status: "completed"
    },
    {
      id: 3,
      title: "TOEIC Mastery & Skills",
      instructor: "Ms. Le Lan",
      progress: 30,
      lessons: 20,
      completed: 6,
      duration: "10 tuần",
      // Ảnh minh họa: Tai nghe, luyện thi
      image: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1000&auto=format&fit=crop",
      status: "in-progress"
    },
    {
        id: 4,
        title: "English for Beginners",
        instructor: "Ms. Emily Rose",
        progress: 0,
        lessons: 30,
        completed: 0,
        duration: "15 tuần",
        // Ảnh minh họa: Khởi đầu, chữ cái
        image: "https://images.unsplash.com/photo-1472289065668-ce650ac443d2?q=80&w=1000&auto=format&fit=crop",
        status: "in-progress"
    }
  ]);

  const [filterStatus, setFilterStatus] = useState("all");

  const filteredCourses = filterStatus === "all" 
    ? courses 
    : courses.filter(course => course.status === filterStatus);

  // Thống kê nhanh
  const totalCourses = courses.length;
  const completedCount = courses.filter(c => c.status === 'completed').length;
  const inProgressCount = courses.filter(c => c.status === 'in-progress').length;

  return (
    <div className="w-full space-y-8 pb-10">
      
      {/* 1. HEADER */}
      <div className="relative overflow-hidden bg-gradient-to-r from-purple-50/100 to-indigo-50/100 backdrop-blur-xl p-8 rounded-3xl border border-white/60 shadow-sm">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-purple-200/40 rounded-full blur-[80px]"></div>
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-60 h-60 bg-indigo-200/40 rounded-full blur-[60px]"></div>

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div>
                  <h1 className="text-3xl font-extrabold text-[#5a4d8c] mb-2">Khóa học của tôi</h1>
                  <p className="text-gray-600 max-w-lg">
                      Tiếp tục hành trình chinh phục tri thức. Hãy hoàn thành các bài học còn dang dở.
                  </p>
              </div>

              {/* Stats Box */}
              <div className="flex gap-3 bg-white/60 backdrop-blur-md p-2 rounded-2xl border border-white/50 shadow-sm">
                  <div className="px-4 py-2 text-center border-r border-gray-200">
                      <div className="text-[#5a4d8c] font-bold text-xl">{totalCourses}</div>
                      <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Tổng</div>
                  </div>
                  <div className="px-4 py-2 text-center border-r border-gray-200">
                      <div className="text-emerald-600 font-bold text-xl">{completedCount}</div>
                      <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Xong</div>
                  </div>
                  <div className="px-4 py-2 text-center">
                      <div className="text-indigo-600 font-bold text-xl">{inProgressCount}</div>
                      <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Đang học</div>
                  </div>
              </div>
          </div>
      </div>

      {/* 2. FILTER & SEARCH */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Tabs */}
        <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 flex gap-1">
            {[
                { key: 'all', label: 'Tất cả' },
                { key: 'in-progress', label: 'Đang học' },
                { key: 'completed', label: 'Đã hoàn thành' }
            ].map(tab => (
                <button
                    key={tab.key}
                    onClick={() => setFilterStatus(tab.key)}
                    className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                        filterStatus === tab.key
                        ? "bg-[#8c78ec] text-white shadow-md shadow-purple-200"
                        : "text-gray-500 hover:bg-gray-50 hover:text-[#5a4d8c]"
                    }`}
                >
                    {tab.label}
                </button>
            ))}
        </div>

        {/* Search */}
        <div className="relative group w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-hover:text-[#8c78ec] transition-colors" />
            <input 
                type="text" 
                placeholder="Tìm tên khóa học..." 
                className="w-full md:w-64 pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8c78ec]/20 focus:border-[#8c78ec] transition-all shadow-sm"
            />
        </div>
      </div>

      {/* 3. GRID COURSES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredCourses.map((course) => (
          <div 
            key={course.id} 
            className="group bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 transition-all duration-300 flex flex-col h-full relative"
          >
            {/* Status Badge (Absolute on top of image) */}
            <div className="absolute top-8 right-8 z-20">
                <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border backdrop-blur-md shadow-sm ${
                    course.status === "completed"
                    ? "bg-white/90 text-green-600 border-green-100"
                    : "bg-white/90 text-indigo-600 border-indigo-100"
                }`}>
                    {course.status === "completed" ? "Đã hoàn thành" : "Đang học"}
                </span>
            </div>

            {/* --- IMAGE AREA (THAY ĐỔI CHÍNH TẠI ĐÂY) --- */}
            <div className="h-48 rounded-2xl mb-5 relative overflow-hidden shadow-inner group-hover:shadow-md transition-all">
                {/* Image Real */}
                <img 
                    src={course.image} 
                    alt={course.title} 
                    className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out"
                />
                
                {/* Overlay Gradient nhẹ để text dễ đọc nếu cần, hoặc tạo chiều sâu */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>

            {/* Content Body */}
            <div className="flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-gray-800 mb-1 group-hover:text-[#8c78ec] transition-colors line-clamp-1" title={course.title}>
                    {course.title}
                </h3>
                <p className="text-sm text-gray-500 mb-4 flex items-center gap-1">
                    <Users size={14} className="text-gray-400" />
                    GV: <span className="font-medium text-gray-700">{course.instructor}</span>
                </p>

                {/* Progress Bar Section */}
                <div className="mb-5 bg-gray-50 p-3 rounded-xl border border-gray-100">
                    <div className="flex justify-between items-end mb-2">
                         <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tiến độ</span>
                         <span className="text-sm font-bold text-[#5a4d8c]">{course.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ease-out ${
                                course.status === "completed" 
                                ? "bg-gradient-to-r from-emerald-400 to-green-500"
                                : "bg-gradient-to-r from-[#8c78ec] to-[#5a4d8c]"
                            }`}
                            style={{ width: `${course.progress}%` }}
                        ></div>
                    </div>
                    <div className="flex justify-between mt-2 text-[11px] text-gray-400">
                        <span>{course.completed}/{course.lessons} bài học</span>
                    </div>
                </div>
                
                {/* Stats Row */}
                <div className="flex items-center gap-4 mb-5 text-sm text-gray-500 border-t border-gray-100 pt-4">
                    <div className="flex items-center gap-1.5">
                        <BookOpen size={16} className="text-[#8c78ec]" />
                        <span>{course.lessons} bài</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Clock size={16} className="text-[#8c78ec]" />
                        <span>{course.duration}</span>
                    </div>
                </div>

                {/* Action Button */}
                <button
                    onClick={() => navigate(`/member/course/${course.id}`)}
                    className={`mt-auto w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${
                        course.status === "completed"
                        ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100"
                        : "bg-[#8c78ec] text-white hover:bg-[#7a66d3] shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-1"
                    }`}
                >
                    {course.status === "completed" ? (
                        <> <Trophy size={18} /> Xem chứng chỉ </>
                    ) : (
                        <> <PlayCircle size={18} /> Vào học ngay </>
                    )}
                </button>
            </div>
          </div>
        ))}
      </div>

      {/* 4. EMPTY STATE */}
      {filteredCourses.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                <Search size={40} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Không tìm thấy kết quả</h3>
            <p className="text-gray-500 mb-6">Thử thay đổi bộ lọc hoặc tìm kiếm từ khóa khác.</p>
            <button
                onClick={() => setFilterStatus('all')}
                className="px-8 py-3 bg-[#8c78ec] text-white rounded-xl font-bold hover:bg-[#7a66d3] transition shadow-lg"
            >
                Xem tất cả khóa học
            </button>
        </div>
      )}
    </div>
  );
}