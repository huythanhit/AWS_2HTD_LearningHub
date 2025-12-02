import React, { useState, useMemo } from 'react';
import { 
    Search, Plus, BookOpen, Users, Star, 
    LayoutGrid, List, Filter, Edit, Trash2, Eye, FileText,
    CheckCircle, AlertCircle, X, Save, Layers, Check, XCircle
} from 'lucide-react';

export default function AdminCourses() {
    // --- STATE ---
    const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'
    const [filterStatus, setFilterStatus] = useState('All');
    const [searchTerm, setSearchTerm] = useState('');

    // State cho Modal Chỉnh sửa
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [currentCourse, setCurrentCourse] = useState(null);

    // --- MOCK DATA ---
    const [courses, setCourses] = useState([
        { 
            id: 1, 
            title: 'IELTS Intensive 7.0+', 
            category: 'IELTS',
            teacher: 'Ms. Hoa', 
            students: 120, 
            lessons: 24,
            rating: 4.8, 
            status: 'Published', 
            img: 'bg-gradient-to-br from-blue-400 to-blue-600' 
        },
        { 
            id: 2, 
            title: 'English for Business', 
            category: 'Business',
            teacher: 'Mr. David', 
            students: 85, 
            lessons: 15,
            rating: 4.5, 
            status: 'Draft', 
            img: 'bg-gradient-to-br from-orange-400 to-red-500' 
        },
        { 
            id: 3, 
            title: 'Giao tiếp cơ bản (Basic)', 
            category: 'Communication',
            teacher: 'Ms. Lan', 
            students: 200, 
            lessons: 30,
            rating: 4.9, 
            status: 'Published', 
            img: 'bg-gradient-to-br from-green-400 to-emerald-600' 
        },
        { 
            id: 4, 
            title: 'TOEIC 500+ Cấp tốc', 
            category: 'TOEIC',
            teacher: 'Mr. John', 
            students: 150, 
            lessons: 18,
            rating: 4.6, 
            status: 'Review', // Trạng thái chờ duyệt
            img: 'bg-gradient-to-br from-purple-400 to-indigo-600' 
        },
        { 
            id: 5, 
            title: 'Luyện Viết Email Chuyên Nghiệp', 
            category: 'Skill',
            teacher: 'Mr. David', 
            students: 45, 
            lessons: 10,
            rating: 4.2, 
            status: 'Draft', 
            img: 'bg-gray-400' 
        },
        { 
            id: 6, 
            title: 'Phát âm chuẩn Mỹ (Review Demo)', 
            category: 'Pronunciation',
            teacher: 'Ms. Sarah', 
            students: 10, 
            lessons: 8,
            rating: 0, 
            status: 'Review', // Thêm 1 item chờ duyệt để test
            img: 'bg-gradient-to-br from-pink-400 to-rose-600' 
        },
    ]);

    // --- LOGIC HANDLERS ---
    
    // 1. Xóa khóa học
    const handleDelete = (id) => {
        if(window.confirm('Bạn có chắc muốn xóa khóa học này?')) {
            setCourses(courses.filter(c => c.id !== id));
        }
    };

    // 2. Mở Modal Sửa
    const handleEditClick = (course) => {
        setCurrentCourse({ ...course }); 
        setIsEditModalOpen(true);
    };

    // 3. Lưu thay đổi
    const handleSaveCourse = () => {
        if (!currentCourse.title || !currentCourse.teacher) {
            alert("Vui lòng nhập tên khóa học và giảng viên!");
            return;
        }
        const updatedCourses = courses.map(c => 
            c.id === currentCourse.id ? currentCourse : c
        );
        setCourses(updatedCourses);
        setIsEditModalOpen(false);
        setCurrentCourse(null);
    };

    // 4. DUYỆT BÀI (Approve)
    const handleApprove = (id, title) => {
        if(window.confirm(`Xác nhận DUYỆT và CÔNG KHAI khóa học: "${title}"?`)) {
            const updatedCourses = courses.map(c => 
                c.id === id ? { ...c, status: 'Published' } : c
            );
            setCourses(updatedCourses);
        }
    };

    // 5. TỪ CHỐI BÀI (Reject)
    const handleReject = (id, title) => {
        if(window.confirm(`Từ chối duyệt và trả về BẢN NHÁP: "${title}"?`)) {
            const updatedCourses = courses.map(c => 
                c.id === id ? { ...c, status: 'Draft' } : c
            );
            setCourses(updatedCourses);
        }
    };

    // Helper: Render Status Badge
    const getStatusBadge = (status) => {
        switch(status) {
            case 'Published': 
                return <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 border border-green-200"><CheckCircle size={12}/> Published</span>;
            case 'Draft': 
                return <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200"><FileText size={12}/> Draft</span>;
            case 'Review': 
                return <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-700 border border-yellow-200 animate-pulse"><AlertCircle size={12}/> Review</span>;
            default: return null;
        }
    };

    // Filter Logic
    const filteredCourses = courses.filter(course => {
        const matchStatus = filterStatus === 'All' || course.status === filterStatus;
        const matchSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            course.teacher.toLowerCase().includes(searchTerm.toLowerCase());
        return matchStatus && matchSearch;
    });

    // Count pending reviews
    const pendingCount = useMemo(() => courses.filter(c => c.status === 'Review').length, [courses]);

    // --- RENDER ---
    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans animate-fade-in-up">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Quản lý Khóa học</h1>
                    <p className="text-gray-500 text-sm">Quản lý nội dung và trạng thái xuất bản.</p>
                </div>
                <button className="flex items-center gap-2 px-5 py-2.5 bg-[#5a4d8c] text-white font-medium rounded-xl hover:bg-[#483d73] shadow-lg shadow-indigo-200 transition">
                    <Plus size={20} /> Tạo khóa học mới
                </button>
            </div>

            {/* Toolbar Filter & View Mode */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col lg:flex-row gap-4 justify-between items-center">
                
                {/* Search & Filter Group */}
                <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                    <div className="relative flex-1 min-w-[280px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                            type="text" 
                            placeholder="Tìm tên khóa học, giảng viên..." 
                            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-[#5a4d8c] transition text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <Filter size={18} className="text-gray-400" />
                        <div className="relative">
                            <select 
                                className="px-3 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm focus:outline-none focus:border-[#5a4d8c] cursor-pointer bg-white pr-8"
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                            >
                                <option value="All">Tất cả trạng thái</option>
                                <option value="Published">Đang hoạt động</option>
                                <option value="Draft">Bản nháp</option>
                                <option value="Review">Chờ duyệt</option>
                            </select>
                            {/* Badge thông báo số lượng cần duyệt */}
                            {pendingCount > 0 && filterStatus !== 'Review' && (
                                <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                                    {pendingCount}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* View Switcher */}
                <div className="flex bg-gray-100 p-1 rounded-lg">
                    <button 
                        onClick={() => setViewMode('grid')}
                        className={`p-2 rounded-md transition ${viewMode === 'grid' ? 'bg-white text-[#5a4d8c] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <LayoutGrid size={20} />
                    </button>
                    <button 
                        onClick={() => setViewMode('table')}
                        className={`p-2 rounded-md transition ${viewMode === 'table' ? 'bg-white text-[#5a4d8c] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <List size={20} />
                    </button>
                </div>
            </div>

            {/* CONTENT AREA */}
            {viewMode === 'grid' ? (
                /* --- GRID VIEW --- */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
                    {filteredCourses.map((course) => (
                        <div key={course.id} className={`bg-white rounded-2xl border shadow-sm hover:shadow-lg transition duration-300 group overflow-hidden flex flex-col ${course.status === 'Review' ? 'border-yellow-200 ring-1 ring-yellow-100' : 'border-gray-100'}`}>
                            {/* Image Header */}
                            <div className={`h-44 w-full ${course.img} flex flex-col justify-between p-4 relative`}>
                                <div className="flex justify-between items-start">
                                    <span className="px-2 py-1 bg-black/20 backdrop-blur-sm text-white text-xs font-bold rounded-md border border-white/20">
                                        {course.category}
                                    </span>
                                    <div className="bg-white/90 backdrop-blur px-2 py-1 rounded-full text-xs font-bold shadow-sm">
                                        {getStatusBadge(course.status)}
                                    </div>
                                </div>
                                <BookOpen className="text-white/30 w-16 h-16 absolute bottom-2 right-2 rotate-[-10deg]" />
                            </div>

                            {/* Body */}
                            <div className="p-5 flex-1 flex flex-col">
                                <h3 className="font-bold text-gray-800 text-lg mb-1 line-clamp-2 group-hover:text-[#5a4d8c] transition" title={course.title}>
                                    {course.title}
                                </h3>
                                <p className="text-sm text-gray-500 mb-4 flex items-center gap-1">
                                    Giảng viên: <span className="font-medium text-gray-700">{course.teacher}</span>
                                </p>

                                {/* Stats Grid */}
                                <div className="flex justify-between text-sm text-gray-600 mt-auto mb-4 border-t border-gray-50 pt-3">
                                    <div className="flex flex-col items-center">
                                        <Users size={16} className="text-blue-500 mb-1"/> 
                                        <span className="text-xs">{course.students} HV</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <Star size={16} className="text-yellow-500 fill-yellow-500 mb-1"/> 
                                        <span className="text-xs">{course.rating}</span>
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <FileText size={16} className="text-purple-500 mb-1"/> 
                                        <span className="text-xs">{course.lessons} bài</span>
                                    </div>
                                </div>

                                {/* Action Buttons - LOGIC DUYỆT BÀI */}
                                <div className="flex gap-2 pt-2">
                                    {course.status === 'Review' ? (
                                        <>
                                            <button 
                                                onClick={() => handleReject(course.id, course.title)}
                                                className="flex-1 py-2 text-sm font-bold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition flex items-center justify-center gap-1"
                                            >
                                                <XCircle size={16}/> Từ chối
                                            </button>
                                            <button 
                                                onClick={() => handleApprove(course.id, course.title)}
                                                className="flex-1 py-2 text-sm font-bold text-green-700 bg-green-50 rounded-lg hover:bg-green-100 transition flex items-center justify-center gap-1"
                                            >
                                                <Check size={16}/> Duyệt
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button className="flex-1 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-lg hover:bg-gray-100 transition flex items-center justify-center gap-1">
                                                <Eye size={16}/> Xem
                                            </button>
                                            <button 
                                                onClick={() => handleEditClick(course)}
                                                className="flex-1 py-2 text-sm font-medium text-[#5a4d8c] bg-purple-50 rounded-lg hover:bg-[#5a4d8c] hover:text-white transition flex items-center justify-center gap-1"
                                            >
                                                <Edit size={16}/> Sửa
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* --- TABLE VIEW --- */
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                                <tr>
                                    <th className="p-4 pl-6">Khóa học</th>
                                    <th className="p-4">Danh mục</th>
                                    <th className="p-4">Giảng viên</th>
                                    <th className="p-4 text-center">Thống kê</th>
                                    <th className="p-4 text-center">Trạng thái</th>
                                    <th className="p-4 text-right pr-6">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 text-sm">
                                {filteredCourses.map((course) => (
                                    <tr key={course.id} className={`hover:bg-purple-50/30 transition group ${course.status === 'Review' ? 'bg-yellow-50/30' : ''}`}>
                                        <td className="p-4 pl-6">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-lg ${course.img} flex items-center justify-center text-white shadow-sm`}>
                                                    <BookOpen size={20}/>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-800 line-clamp-1">{course.title}</p>
                                                    <p className="text-xs text-gray-400">{course.lessons} bài học</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-xs font-medium border border-gray-200">
                                                {course.category}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-700 font-medium">{course.teacher}</td>
                                        
                                        <td className="p-4">
                                            <div className="flex flex-col items-center gap-1 text-xs text-gray-500">
                                                <div className="flex items-center gap-1"><Users size={12}/> {course.students}</div>
                                                <div className="flex items-center gap-1"><Star size={12} className="text-yellow-500 fill-yellow-500"/> {course.rating}</div>
                                            </div>
                                        </td>
                                        <td className="p-4 text-center">
                                            <div className="flex justify-center">
                                                {getStatusBadge(course.status)}
                                            </div>
                                        </td>
                                        <td className="p-4 text-right pr-6">
                                            <div className="flex justify-end gap-2">
                                                {/* ACTIONS CHO TRẠNG THÁI REVIEW */}
                                                {course.status === 'Review' ? (
                                                    <>
                                                        <button 
                                                            onClick={() => handleApprove(course.id, course.title)}
                                                            className="p-2 text-green-600 bg-green-50 hover:bg-green-100 rounded-lg transition border border-green-200" 
                                                            title="Duyệt bài"
                                                        >
                                                            <Check size={18} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleReject(course.id, course.title)}
                                                            className="p-2 text-red-500 bg-red-50 hover:bg-red-100 rounded-lg transition border border-red-200" 
                                                            title="Từ chối"
                                                        >
                                                            <XCircle size={18} />
                                                        </button>
                                                        {/* Vẫn cho phép sửa khi đang Review để admin chỉnh lại lỗi nhỏ */}
                                                        <button 
                                                            onClick={() => handleEditClick(course)}
                                                            className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition" 
                                                            title="Xem/Sửa chi tiết"
                                                        >
                                                            <Edit size={18} />
                                                        </button>
                                                    </>
                                                ) : (
                                                    // ACTIONS THÔNG THƯỜNG
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                                        <button 
                                                            onClick={() => handleEditClick(course)}
                                                            className="p-2 text-[#5a4d8c] hover:bg-purple-50 rounded-lg transition" title="Chỉnh sửa"
                                                        >
                                                            <Edit size={18} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(course.id)}
                                                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition" 
                                                            title="Xóa khóa học"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            
            {/* Empty State */}
            {filteredCourses.length === 0 && (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-100 border-dashed">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                        <Search size={32}/>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800">Không tìm thấy khóa học nào</h3>
                    <p className="text-gray-500 text-sm">Thử thay đổi bộ lọc hoặc tìm kiếm từ khóa khác.</p>
                </div>
            )}

            {/* --- MODAL CHỈNH SỬA --- */}
            {isEditModalOpen && currentCourse && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100">
                        {/* Header Modal */}
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <Edit className="text-[#5a4d8c]" size={20}/> Chỉnh sửa Khóa học
                            </h3>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded-full transition"><X size={20}/></button>
                        </div>
                        
                        {/* Body Modal */}
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên khóa học</label>
                                <input 
                                    type="text" 
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#5a4d8c] outline-none text-sm font-medium"
                                    value={currentCourse.title}
                                    onChange={(e) => setCurrentCourse({...currentCourse, title: e.target.value})}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Danh mục</label>
                                    <div className="relative">
                                        <Layers size={14} className="absolute left-3 top-2.5 text-gray-400"/>
                                        <input 
                                            type="text" 
                                            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 focus:border-[#5a4d8c] outline-none text-sm"
                                            value={currentCourse.category}
                                            onChange={(e) => setCurrentCourse({...currentCourse, category: e.target.value})}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Số bài học</label>
                                    <input 
                                        type="number" 
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#5a4d8c] outline-none text-sm"
                                        value={currentCourse.lessons}
                                        onChange={(e) => setCurrentCourse({...currentCourse, lessons: parseInt(e.target.value) || 0})}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Giảng viên phụ trách</label>
                                <input 
                                    type="text" 
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#5a4d8c] outline-none text-sm"
                                    value={currentCourse.teacher}
                                    onChange={(e) => setCurrentCourse({...currentCourse, teacher: e.target.value})}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-[#5a4d8c] uppercase mb-1">Trạng thái</label>
                                <select 
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#5a4d8c] outline-none text-sm bg-white"
                                    value={currentCourse.status}
                                    onChange={(e) => setCurrentCourse({...currentCourse, status: e.target.value})}
                                >
                                    <option value="Published">Published (Công khai)</option>
                                    <option value="Draft">Draft (Bản nháp)</option>
                                    <option value="Review">Review (Chờ duyệt)</option>
                                </select>
                            </div>
                        </div>

                        {/* Footer Modal */}
                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                            <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm font-medium hover:bg-white transition">Hủy bỏ</button>
                            <button onClick={handleSaveCourse} className="px-4 py-2 rounded-lg bg-[#5a4d8c] text-white text-sm font-bold hover:bg-[#483d73] shadow-md transition flex items-center gap-2">
                                <Save size={16}/> Lưu thay đổi
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}