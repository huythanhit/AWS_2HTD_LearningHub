import React, { useState } from 'react';
import { 
    Users, Calendar, Clock, MoreVertical, Search, Plus, 
    ArrowLeft, Mail, Trash, Edit, BookOpen, GraduationCap,
    Save, X, MapPin, BarChart3, Filter
} from 'lucide-react';

export default function TeacherClasses() {
    // --- STATE QUẢN LÝ ---
    const [selectedClass, setSelectedClass] = useState(null); 
    const [isCreating, setIsCreating] = useState(false); 
    const [students, setStudents] = useState([]); // State danh sách học viên (sẽ được cập nhật động)

    // MOCK DATA: ĐỒNG BỘ VỚI DASHBOARD
    const [classes, setClasses] = useState([
        { 
            id: 'CLS001', 
            name: 'IELTS Foundation K12', 
            students: 28, 
            level: 'Pre-Intermediate', 
            schedule: 'Thứ 2 - 4', 
            time: '19:00 - 21:00', 
            room: 'Zoom 01',
            progress: 75 
        },
        { 
            id: 'CLS002', 
            name: 'General English - Work', 
            students: 22, 
            level: 'Intermediate', 
            schedule: 'Thứ 3 - 5', 
            time: '18:00 - 19:30', 
            room: 'Phòng 204',
            progress: 60 
        },
        { 
            id: 'CLS003', 
            name: 'IELTS Intensive 7.0+', 
            students: 16, 
            level: 'Upper-Intermediate', 
            schedule: 'Thứ 7', 
            time: '09:00 - 12:00', 
            room: 'Zoom 03',
            progress: 45 
        },
        { 
            id: 'CLS004', 
            name: 'Communication Master', 
            students: 12, 
            level: 'Advanced', 
            schedule: 'Chủ Nhật', 
            time: '14:00 - 16:00', 
            room: 'Phòng 301',
            progress: 90 
        },
    ]);

    // State cho Form tạo mới
    const [newClassData, setNewClassData] = useState({
        name: '', schedule: '', time: '', room: '', level: 'Basic'
    });

    // --- HELPER: SINH DỮ LIỆU HỌC VIÊN GIẢ LẬP THEO SỐ LƯỢNG ---
    const generateMockStudents = (count, classId) => {
        const firstNames = ["An", "Bình", "Cường", "Dung", "Giang", "Huy", "Lan", "Minh", "Nam", "Ngọc", "Phúc", "Quỳnh", "Sơn", "Thảo", "Tùng", "Vân", "Yến"];
        const lastNames = ["Nguyễn", "Trần", "Lê", "Phạm", "Hoàng", "Huỳnh", "Phan", "Vũ", "Đặng", "Bùi", "Đỗ", "Hồ", "Ngô", "Dương", "Lý"];
        
        return Array.from({ length: count }, (_, i) => {
            const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
            const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
            
            // Random điểm số (Giả lập thang điểm 10 hoặc 9.0 IELTS)
            const lis = (Math.random() * 4 + 5).toFixed(1); // 5.0 - 9.0
            const read = (Math.random() * 4 + 5).toFixed(1);
            const writ = (Math.random() * 4 + 4).toFixed(1);
            const speak = (Math.random() * 4 + 4).toFixed(1);
            const avg = ((parseFloat(lis) + parseFloat(read) + parseFloat(writ) + parseFloat(speak)) / 4).toFixed(1);

            return {
                id: `${classId}_SV_${i + 1}`,
                name: `${lastName} ${firstName}`,
                email: `student.${i + 1}@email.com`,
                completedTasks: Math.floor(Math.random() * 10), // 0-10 bài
                totalTasks: 10,
                scores: {
                    listening: lis,
                    reading: read,
                    writing: writ,
                    speaking: speak,
                    average: avg
                }
            };
        });
    };

    // --- HÀM XỬ LÝ ---
    const handleViewClass = (cls) => {
        setSelectedClass(cls);
        // Tự động sinh danh sách học viên đúng với sĩ số lớp
        const mockList = generateMockStudents(cls.students, cls.id);
        setStudents(mockList);
    };

    const handleBackToList = () => { setSelectedClass(null); setIsCreating(false); };
    
    const handleRemoveStudent = (studentId) => {
        if(window.confirm('Bạn có chắc muốn xóa học viên này khỏi lớp?')) {
            setStudents(students.filter(s => s.id !== studentId));
        }
    };

    const handleSaveNewClass = () => {
        if (!newClassData.name || !newClassData.schedule) {
            alert("Vui lòng nhập tên lớp và lịch học!");
            return;
        }
        const newClass = {
            id: Date.now(),
            ...newClassData,
            students: 0,
            progress: 0
        };
        setClasses([...classes, newClass]);
        setIsCreating(false);
        setNewClassData({ name: '', schedule: '', time: '', room: '', level: 'Basic' });
    };

    const getScoreColor = (score) => {
        if (score >= 8.0) return 'text-green-600 font-bold';
        if (score >= 6.5) return 'text-blue-600 font-medium';
        if (score >= 5.0) return 'text-orange-500';
        return 'text-red-500';
    };

    const getProgressColor = (pct) => {
        if (pct >= 80) return 'bg-green-500';
        if (pct >= 50) return 'bg-indigo-500';
        return 'bg-orange-400';
    };

    // --- RENDER ---
    return (
        <div className="relative min-h-screen bg-gray-50 p-6 font-sans text-gray-800">
            
            {/* --- MODAL TẠO LỚP MỚI --- */}
            {isCreating && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all scale-100">
                        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100 bg-gray-50/50">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <Plus className="text-[#5a4d8c]" size={24} />
                                Tạo lớp học mới
                            </h2>
                            <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition"><X size={20} /></button>
                        </div>
                        <div className="p-8 space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Tên khóa học</label>
                                <input type="text" placeholder="VD: IELTS Intensive K15" className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#5a4d8c] outline-none transition"
                                    value={newClassData.name} onChange={(e) => setNewClassData({...newClassData, name: e.target.value})} />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Lịch học</label>
                                    <input type="text" placeholder="VD: Thứ 2 - 4" className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#5a4d8c] outline-none transition"
                                        value={newClassData.schedule} onChange={(e) => setNewClassData({...newClassData, schedule: e.target.value})} />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Thời gian</label>
                                    <input type="text" placeholder="VD: 19:00 - 21:00" className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#5a4d8c] outline-none transition"
                                        value={newClassData.time} onChange={(e) => setNewClassData({...newClassData, time: e.target.value})} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Phòng học / Zoom</label>
                                <input type="text" placeholder="VD: Zoom 01" className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#5a4d8c] outline-none transition"
                                    value={newClassData.room} onChange={(e) => setNewClassData({...newClassData, room: e.target.value})} />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 px-8 py-5 border-t border-gray-100 bg-gray-50/50">
                            <button onClick={() => setIsCreating(false)} className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-600 font-medium hover:bg-white transition">Hủy bỏ</button>
                            <button onClick={handleSaveNewClass} className="px-6 py-2.5 rounded-lg bg-[#5a4d8c] text-white font-medium hover:bg-[#483d73] shadow-lg transition flex items-center gap-2"><Save size={18} /> Lưu lớp học</button>
                        </div>
                    </div>
                </div>
            )}

            <div className={`space-y-6 transition-all ${isCreating ? 'blur-[2px]' : ''}`}>
                {!selectedClass ? (
                    <>
                        {/* --- LIST VIEW GIỮ NGUYÊN --- */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-800">Quản lý Lớp học</h2>
                                <p className="text-gray-500">Danh sách các lớp đang giảng dạy.</p>
                            </div>
                            <button onClick={() => setIsCreating(true)} className="flex items-center gap-2 bg-[#5a4d8c] text-white px-5 py-2.5 rounded-xl hover:bg-[#483d73] transition shadow-md shadow-purple-100 font-medium">
                                <Plus size={20} /> <span>Tạo lớp mới</span>
                            </button>
                        </div>

                        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex items-center gap-3 focus-within:ring-2 focus-within:ring-[#5a4d8c]/20 transition">
                            <Search size={20} className="text-gray-400" />
                            <input type="text" placeholder="Tìm kiếm lớp học..." className="flex-1 outline-none text-gray-700 placeholder-gray-400" />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {classes.map((cls) => (
                                <div key={cls.id} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-purple-100 transition duration-300 group cursor-pointer flex flex-col justify-between h-full" onClick={() => handleViewClass(cls)}>
                                    <div>
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="w-12 h-12 flex items-center justify-center bg-purple-50 text-[#5a4d8c] rounded-xl font-bold text-xl group-hover:bg-[#5a4d8c] group-hover:text-white transition-colors duration-300">
                                                {cls.name.charAt(0)}
                                            </div>
                                            <button className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full transition" onClick={(e) => {e.stopPropagation()}}>
                                                <MoreVertical size={20} />
                                            </button>
                                        </div>
                                        
                                        <h3 className="font-bold text-lg text-gray-800 mb-1 group-hover:text-[#5a4d8c] transition line-clamp-1" title={cls.name}>
                                            {cls.name}
                                        </h3>
                                        <div className="mb-4">
                                            <span className="inline-block px-2 py-1 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100">
                                                {cls.level}
                                            </span>
                                        </div>
                                        <div className="space-y-3 text-sm text-gray-600 mb-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-5 flex justify-center"><Users size={16} className="text-blue-500" /></div>
                                                <span>{cls.students} học viên</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-5 flex justify-center"><Calendar size={16} className="text-orange-500" /></div>
                                                <span>{cls.schedule}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-5 flex justify-center"><Clock size={16} className="text-green-500" /></div>
                                                <span>{cls.time}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <div className="w-5 flex justify-center"><MapPin size={16} className="text-gray-400" /></div>
                                                <span>{cls.room}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-auto">
                                        <div className="mb-4">
                                            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                                                <span>Tiến độ lớp</span>
                                                <span className="font-semibold text-gray-700">{cls.progress}%</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                                <div 
                                                    className={`h-full rounded-full transition-all duration-500 ${getProgressColor(cls.progress)}`} 
                                                    style={{ width: `${cls.progress}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                        <button className="w-full py-2.5 rounded-lg border border-[#5a4d8c]/20 bg-purple-50/50 text-[#5a4d8c] font-medium group-hover:bg-[#5a4d8c] group-hover:text-white transition-all">
                                            Xem chi tiết
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    /* --- CHI TIẾT LỚP HỌC (ĐÃ UPDATE BẢNG ĐIỂM CHI TIẾT) --- */
                    <div className="space-y-6 animate-fade-in-up">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                            <div className="flex items-center gap-4">
                                <button onClick={handleBackToList} className="p-2 hover:bg-gray-100 rounded-lg transition text-gray-500 border border-transparent hover:border-gray-200">
                                    <ArrowLeft size={24} />
                                </button>
                                <div>
                                    <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                                        {selectedClass.name}
                                        <span className="text-xs font-semibold bg-indigo-100 text-indigo-700 px-2 py-1 rounded-md border border-indigo-200">
                                            {selectedClass.level || 'Standard'}
                                        </span>
                                    </h2>
                                    <p className="text-gray-500 flex items-center gap-2 text-sm mt-1">
                                        <MapPin size={14} className="text-gray-400"/> {selectedClass.room} • {selectedClass.schedule}, {selectedClass.time}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex gap-2 self-end md:self-auto">
                                <button className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded-lg hover:bg-gray-50 text-gray-600 font-medium transition">
                                    <Filter size={18} /> <span className="hidden sm:inline">Lọc điểm</span>
                                </button>
                                <button className="flex items-center gap-2 bg-[#5a4d8c] text-white px-4 py-2 rounded-lg hover:bg-[#483d73] font-medium transition shadow-md shadow-purple-100">
                                    <Plus size={18} /> Thêm học viên
                                </button>
                            </div>
                        </div>

                        {/* Thống kê nhanh */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition">
                                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Users size={28}/></div>
                                <div>
                                    <p className="text-gray-500 text-sm font-medium">Tổng học viên</p>
                                    <p className="text-2xl font-bold text-gray-800">{students.length}</p>
                                </div>
                            </div>
                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition">
                                <div className="p-3 bg-green-50 text-green-600 rounded-xl"><BookOpen size={28}/></div>
                                <div>
                                    <p className="text-gray-500 text-sm font-medium">Tiến độ khóa</p>
                                    <p className="text-2xl font-bold text-gray-800">{selectedClass.progress}%</p>
                                </div>
                            </div>
                            <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 hover:shadow-md transition">
                                <div className="p-3 bg-orange-50 text-orange-600 rounded-xl"><GraduationCap size={28}/></div>
                                <div>
                                    <p className="text-gray-500 text-sm font-medium">Bài Test đã làm</p>
                                    <p className="text-2xl font-bold text-gray-800">4</p>
                                </div>
                            </div>
                        </div>

                        {/* Bảng danh sách học viên và điểm chi tiết */}
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-3 bg-gray-50/50">
                                <h3 className="font-bold text-gray-800 text-lg">Bảng điểm chi tiết</h3>
                                <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg border border-gray-200 focus-within:ring-2 focus-within:ring-[#5a4d8c]/20 w-full sm:w-auto transition">
                                    <Search size={18} className="text-gray-400" />
                                    <input type="text" placeholder="Tìm tên học viên..." className="bg-transparent outline-none text-sm w-full" />
                                </div>
                            </div>
                            
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50 text-gray-500 font-medium text-xs uppercase tracking-wider">
                                        <tr>
                                            <th className="p-4 pl-6">Họ và Tên</th>
                                            <th className="p-4 text-center">Tiến độ bài tập</th>
                                            <th className="p-4 text-center">Listening</th>
                                            <th className="p-4 text-center">Reading</th>
                                            <th className="p-4 text-center">Writing</th>
                                            <th className="p-4 text-center">Speaking</th>
                                            <th className="p-4 text-center">Average</th>
                                            <th className="p-4 text-right">Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {students.map((student) => {
                                            const progress = (student.completedTasks / student.totalTasks) * 100;
                                            return (
                                                <tr key={student.id} className="hover:bg-purple-50/30 transition group text-sm">
                                                    <td className="p-4 pl-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 text-[#5a4d8c] flex items-center justify-center font-bold text-xs border border-purple-100">
                                                                {student.name.split(' ').pop().charAt(0)}
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-gray-800">{student.name}</p>
                                                                <p className="text-xs text-gray-500">{student.email}</p>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="p-4 align-middle text-center">
                                                        <div className="w-24 mx-auto">
                                                            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden mb-1">
                                                                <div 
                                                                    className={`h-1.5 rounded-full ${progress === 100 ? 'bg-green-500' : 'bg-[#5a4d8c]'}`} 
                                                                    style={{ width: `${progress}%` }}
                                                                ></div>
                                                            </div>
                                                            <span className="text-xs text-gray-400">{student.completedTasks}/{student.totalTasks} bài</span>
                                                        </div>
                                                    </td>
                                                    {/* Các cột điểm chi tiết */}
                                                    <td className={`p-4 text-center font-medium ${getScoreColor(student.scores.listening)}`}>
                                                        {student.scores.listening}
                                                    </td>
                                                    <td className={`p-4 text-center font-medium ${getScoreColor(student.scores.reading)}`}>
                                                        {student.scores.reading}
                                                    </td>
                                                    <td className={`p-4 text-center font-medium ${getScoreColor(student.scores.writing)}`}>
                                                        {student.scores.writing}
                                                    </td>
                                                    <td className={`p-4 text-center font-medium ${getScoreColor(student.scores.speaking)}`}>
                                                        {student.scores.speaking}
                                                    </td>
                                                    <td className="p-4 text-center">
                                                        <span className={`px-2 py-1 rounded-md font-bold text-xs border ${getScoreColor(student.scores.average).replace('text-', 'bg-opacity-10 bg-').replace('font-bold', 'border-opacity-20 border-')}`}>
                                                            {student.scores.average}
                                                        </span>
                                                    </td>
                                                    
                                                    <td className="p-4 text-right">
                                                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button className="p-1.5 text-blue-500 hover:bg-blue-50 rounded transition" title="Sửa điểm">
                                                                <Edit size={16} />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleRemoveStudent(student.id)}
                                                                className="p-1.5 text-red-500 hover:bg-red-50 rounded transition" 
                                                                title="Xóa"
                                                            >
                                                                <Trash size={16} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            
                            {students.length === 0 && (
                                <div className="p-10 text-center flex flex-col items-center gap-3">
                                    <div className="bg-gray-100 p-4 rounded-full text-gray-400">
                                        <Users size={32} />
                                    </div>
                                    <span className="text-gray-500 font-medium">Lớp học này chưa có học viên nào.</span>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}