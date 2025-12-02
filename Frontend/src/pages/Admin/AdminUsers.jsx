import React, { useState } from 'react';
import { 
    Search, Filter, Plus, MoreVertical, 
    Edit, Trash2, Mail, Phone, BookOpen, 
    CheckCircle, XCircle, AlertCircle, X, Save, UserCog
} from 'lucide-react';

export default function AdminUsers() {
    // --- STATE QUẢN LÝ ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null); // User đang được chỉnh sửa

    // Mock Data: Danh sách học viên & User
    const [users, setUsers] = useState([
        { 
            id: 1, 
            name: 'Nguyễn Văn An', 
            email: 'an.nguyen@gmail.com', 
            phone: '0901234567',
            role: 'Student', 
            level: 'B1', 
            courses: ['IELTS Foundation', 'Giao tiếp K12'],
            status: 'Active', 
            joinDate: '15/10/2023' 
        },
        { 
            id: 2, 
            name: 'Trần Thị Bích', 
            email: 'bich.tran@teacher.com', 
            phone: '0912345678',
            role: 'Teacher', 
            level: 'N/A', 
            courses: ['IELTS Intensive'], // Giáo viên dạy lớp này
            status: 'Active', 
            joinDate: '01/09/2023' 
        },
        { 
            id: 3, 
            name: 'Lê Văn Cường', 
            email: 'cuongle@gmail.com', 
            phone: '0987654321',
            role: 'Student', 
            level: 'A2', 
            courses: ['Toeic 500+'],
            status: 'Drop', // Đã bỏ học
            joinDate: '20/11/2023' 
        },
        { 
            id: 4, 
            name: 'Phạm Thu Dung', 
            email: 'dungpham@gmail.com', 
            phone: '0933445566',
            role: 'Student', 
            level: 'C1', 
            courses: ['IELTS Master', 'Speaking Club'],
            status: 'Completed', // Đã hoàn thành
            joinDate: '05/12/2023' 
        },
        { 
            id: 5, 
            name: 'Admin System', 
            email: 'admin@system.com', 
            phone: '---',
            role: 'Admin', 
            level: '---', 
            courses: [],
            status: 'Active', 
            joinDate: '01/01/2023' 
        },
    ]);

    // --- HELPER FUNCTIONS ---
    
    // Mở Modal Edit
    const handleEditClick = (user) => {
        setCurrentUser({ ...user }); // Clone object để sửa không ảnh hưởng list gốc ngay
        setIsModalOpen(true);
    };

    // Lưu thay đổi từ Modal
    const handleSaveUser = () => {
        if (!currentUser) return;
        
        // Cập nhật lại list users
        const updatedUsers = users.map(u => 
            u.id === currentUser.id ? currentUser : u
        );
        setUsers(updatedUsers);
        setIsModalOpen(false);
        setCurrentUser(null);
    };

    // UI Helpers
    const getStatusStyle = (status) => {
        switch(status) {
            case 'Active': return 'bg-green-100 text-green-700 border-green-200';
            case 'Drop': return 'bg-red-100 text-red-700 border-red-200';
            case 'Completed': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    const getLevelColor = (level) => {
        if(['A1', 'A2'].includes(level)) return 'bg-orange-100 text-orange-700';
        if(['B1', 'B2'].includes(level)) return 'bg-indigo-100 text-indigo-700';
        if(['C1', 'C2'].includes(level)) return 'bg-purple-100 text-purple-700';
        return 'bg-gray-100 text-gray-500';
    };

    // --- RENDER ---
    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans animate-fade-in-up">
            
            {/* --- HEADER --- */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Quản lý Học viên & Phân quyền</h1>
                    <p className="text-gray-500 text-sm">Quản lý danh sách, trình độ và trạng thái học tập.</p>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition shadow-sm">
                        <UserCog size={18} /> <span>Phân quyền nhanh</span>
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-[#5a4d8c] text-white rounded-xl hover:bg-[#483d73] shadow-md shadow-indigo-200 transition">
                        <Plus size={18} /> Thêm học viên
                    </button>
                </div>
            </div>

            {/* --- TOOLBAR --- */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative flex-1 w-full md:max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                    <input 
                        type="text" 
                        placeholder="Tìm tên, email hoặc SĐT..." 
                        className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:border-[#5a4d8c] transition"
                    />
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <select className="px-4 py-2.5 rounded-lg border border-gray-200 text-gray-600 focus:outline-none focus:border-[#5a4d8c] bg-white cursor-pointer">
                        <option value="All">Tất cả Role</option>
                        <option value="Student">Học viên</option>
                        <option value="Teacher">Giảng viên</option>
                        <option value="Admin">Quản trị viên</option>
                    </select>
                    <select className="px-4 py-2.5 rounded-lg border border-gray-200 text-gray-600 focus:outline-none focus:border-[#5a4d8c] bg-white cursor-pointer">
                        <option value="All">Tất cả trạng thái</option>
                        <option value="Active">Đang học (Active)</option>
                        <option value="Completed">Đã hoàn thành</option>
                        <option value="Drop">Đã thôi học</option>
                    </select>
                </div>
            </div>

            {/* --- TABLE --- */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50/80 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                                <th className="p-4 pl-6 font-semibold">Thông tin học viên</th>
                                <th className="p-4 font-semibold">Vai trò (Role)</th>
                                <th className="p-4 font-semibold">Trình độ</th>
                                <th className="p-4 font-semibold">Khóa học đăng ký</th>
                                <th className="p-4 font-semibold text-center">Trạng thái</th>
                                <th className="p-4 font-semibold text-right pr-6">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-indigo-50/30 transition duration-200 group">
                                    {/* 1. Tên & Liên hệ */}
                                    <td className="p-4 pl-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 text-[#5a4d8c] flex items-center justify-center font-bold text-sm border border-indigo-50">
                                                {user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800">{user.name}</p>
                                                <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                                                    <span className="flex items-center gap-1"><Mail size={12}/> {user.email}</span>
                                                    <span className="flex items-center gap-1"><Phone size={12}/> {user.phone}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* 2. Role */}
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 rounded-md text-xs font-bold border ${user.role === 'Admin' ? 'bg-red-50 text-red-600 border-red-100' : user.role === 'Teacher' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                                            {user.role}
                                        </span>
                                    </td>

                                    {/* 3. Level */}
                                    <td className="p-4">
                                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getLevelColor(user.level)}`}>
                                            {user.level}
                                        </span>
                                    </td>

                                    {/* 4. Khóa học */}
                                    <td className="p-4">
                                        <div className="flex flex-col gap-1">
                                            {user.courses.length > 0 ? (
                                                user.courses.slice(0, 2).map((course, idx) => (
                                                    <span key={idx} className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded border border-gray-100 w-fit">
                                                        <BookOpen size={10} className="text-[#5a4d8c]"/> {course}
                                                    </span>
                                                ))
                                            ) : (
                                                <span className="text-xs text-gray-400 italic">Chưa đăng ký</span>
                                            )}
                                            {user.courses.length > 2 && <span className="text-xs text-gray-400 ml-1">+{user.courses.length - 2} khác</span>}
                                        </div>
                                    </td>

                                    {/* 5. Trạng thái */}
                                    <td className="p-4 text-center">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(user.status)}`}>
                                            {user.status === 'Active' && <CheckCircle size={12}/>}
                                            {user.status === 'Drop' && <XCircle size={12}/>}
                                            {user.status === 'Completed' && <CheckCircle size={12}/>}
                                            {user.status === 'Active' ? 'Đang học' : user.status === 'Drop' ? 'Đã nghỉ' : 'Hoàn thành'}
                                        </span>
                                        <p className="text-[10px] text-gray-400 mt-1">Từ: {user.joinDate}</p>
                                    </td>

                                    {/* 6. Action */}
                                    <td className="p-4 pr-6 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => handleEditClick(user)}
                                                className="p-2 text-gray-400 hover:text-[#5a4d8c] hover:bg-purple-50 rounded-lg transition" 
                                                title="Chỉnh sửa & Phân quyền"
                                            >
                                                <Edit size={18} />
                                            </button>
                                            <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Xóa">
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- MODAL EDIT / PHÂN QUYỀN --- */}
            {isModalOpen && currentUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all scale-100">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                <Edit className="text-[#5a4d8c]" size={20}/> Chỉnh sửa thông tin
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-200 rounded-full transition"><X size={20}/></button>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            {/* Thông tin cơ bản */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Họ và tên</label>
                                    <input 
                                        type="text" 
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#5a4d8c] outline-none text-sm"
                                        value={currentUser.name}
                                        onChange={(e) => setCurrentUser({...currentUser, name: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Số điện thoại</label>
                                    <input 
                                        type="text" 
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#5a4d8c] outline-none text-sm"
                                        value={currentUser.phone}
                                        onChange={(e) => setCurrentUser({...currentUser, phone: e.target.value})}
                                    />
                                </div>
                            </div>
                            
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                                <input 
                                    type="email" 
                                    className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#5a4d8c] outline-none text-sm bg-gray-50"
                                    value={currentUser.email}
                                    readOnly // Thường email không cho sửa dễ dàng
                                />
                            </div>

                            <hr className="border-gray-100 my-2"/>

                            {/* PHÂN QUYỀN & TRẠNG THÁI */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-[#5a4d8c] uppercase mb-1">Vai trò (Role)</label>
                                    <select 
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#5a4d8c] outline-none text-sm bg-white font-medium"
                                        value={currentUser.role}
                                        onChange={(e) => setCurrentUser({...currentUser, role: e.target.value})}
                                    >
                                        <option value="Student">Student</option>
                                        <option value="Teacher">Teacher</option>
                                        <option value="Admin">Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-[#5a4d8c] uppercase mb-1">Trạng thái học</label>
                                    <select 
                                        className="w-full px-3 py-2 rounded-lg border border-gray-200 focus:border-[#5a4d8c] outline-none text-sm bg-white font-medium"
                                        value={currentUser.status}
                                        onChange={(e) => setCurrentUser({...currentUser, status: e.target.value})}
                                    >
                                        <option value="Active">Active (Đang học)</option>
                                        <option value="Drop">Drop (Nghỉ học)</option>
                                        <option value="Completed">Completed (Hoàn thành)</option>
                                    </select>
                                </div>
                            </div>

                            {/* Trình độ (Chỉ hiện nếu là Student) */}
                            {currentUser.role === 'Student' && (
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Trình độ hiện tại</label>
                                    <div className="flex gap-2">
                                        {['A1', 'A2', 'B1', 'B2', 'C1'].map(lvl => (
                                            <button 
                                                key={lvl}
                                                onClick={() => setCurrentUser({...currentUser, level: lvl})}
                                                className={`px-3 py-1 rounded text-xs font-bold border transition ${currentUser.level === lvl ? 'bg-[#5a4d8c] text-white border-[#5a4d8c]' : 'bg-white text-gray-500 border-gray-200 hover:border-[#5a4d8c]'}`}
                                            >
                                                {lvl}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex justify-end gap-3">
                            <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 text-sm font-medium hover:bg-white transition">Hủy bỏ</button>
                            <button onClick={handleSaveUser} className="px-4 py-2 rounded-lg bg-[#5a4d8c] text-white text-sm font-bold hover:bg-[#483d73] shadow-md transition flex items-center gap-2">
                                <Save size={16}/> Lưu thay đổi
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}