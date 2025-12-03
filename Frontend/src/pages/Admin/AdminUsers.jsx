import React, { useState, useEffect } from 'react';
import { 
    Search, Plus, Edit, Trash2, Mail, Phone,
    X, Save, UserCog, RefreshCcw
} from 'lucide-react';

import { getAdminUsers, createUser, updateUser, deleteUser, restoreUser } from "../../services/adminService";

export default function AdminUsers() {

    // --- STATE ---
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [page, setPage] = useState(1);
    const [limit] = useState(10);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);   // create + edit
    

    // --- FETCH USERS ---
    useEffect(() => {
        async function fetchUsers() {
            try {
                setLoading(true);
                const res = await getAdminUsers(page, limit);
                setUsers(res.users);
            } catch (err) {
                console.error("ERROR FETCH USERS:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchUsers();
    }, [page, limit]);


    // --- OPEN CREATE USER MODAL ---
    const openCreateModal = () => {
        setCurrentUser({
            full_name: "",
            email: "",
            phone: "",
            password: "",
            role: "member"
        });
        setIsModalOpen(true);
    };


    // --- OPEN EDIT USER MODAL ---
    const handleEditClick = (u) => {
        setCurrentUser({
            id: u.id,
            full_name: u.full_name,
            email: u.email,
            phone: u.phone,
            role: u.role_name.toLowerCase(),
            password: ""  // không chỉnh password
        });
        setIsModalOpen(true);
    };


    // --- SAVE USER (CREATE or UPDATE) ---
    const handleSaveUser = async () => {
        try {
            if (!currentUser.id) {
                // CREATE USER
                const payload = {
                    fullName: currentUser.full_name,
                    email: currentUser.email,
                    phone: currentUser.phone,
                    password: currentUser.password,
                    role: currentUser.role
                };

                await createUser(payload);
            } else {
                // UPDATE USER
                const payload = {
                    fullName: currentUser.full_name,
                    phone: currentUser.phone,
                    role: currentUser.role
                };

                await updateUser(currentUser.id, payload);
            }

            setIsModalOpen(false);

            // RELOAD LIST
            const res = await getAdminUsers(page, limit);
            setUsers(res.users);

        } catch (err) {
            alert("Lỗi: " + err.message);
        }
    };


    // --- DELETE USER ---
    const handleDeleteUser = async (userId) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa user này không?")) return;

        try {
            await deleteUser(userId);
            alert("Xóa user thành công!");

            const res = await getAdminUsers(page, limit);
            setUsers(res.users);

        } catch (err) {
            alert("Lỗi khi xóa user: " + err.message);
        }
    };

    // --- RESTORE USER ---
    const handleRestoreUser = async (userId) => {
        if (!window.confirm("Bạn có chắc chắn muốn khôi phục user này không?")) return;

        try {
            await restoreUser(userId);
            alert("Khôi phục user thành công!");

            const res = await getAdminUsers(page, limit);
            setUsers(res.users);

        } catch (err) {
            alert("Lỗi khi khôi phục user: " + err.message);
        }
    };


    // --- STATUS STYLE ---
    const getStatusStyle = (verified) => {
        return verified 
            ? "bg-green-100 text-green-700 border-green-200"
            : "bg-red-100 text-red-700 border-red-200";
    };


    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans animate-fade-in-up">

            {/* HEADER */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Quản lý User & Phân quyền</h1>
                    <p className="text-gray-500 text-sm">Danh sách người dùng hệ thống.</p>
                </div>
                <div className="flex gap-2">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition shadow-sm">
                        <UserCog size={18} /> <span>Phân quyền nhanh</span>
                    </button>

                    <button
                        onClick={openCreateModal}
                        className="flex items-center gap-2 px-4 py-2 bg-[#5a4d8c] text-white rounded-xl hover:bg-[#483d73] shadow-md transition">
                        <Plus size={18} /> Thêm User
                    </button>
                </div>
            </div>


            {/* LOADING */}
            {loading && (
                <div className="text-center py-10 text-gray-500">
                    Đang tải danh sách người dùng...
                </div>
            )}

            {/* ERROR */}
            {error && (
                <div className="text-center py-4 text-red-500 font-semibold">
                    Lỗi tải dữ liệu: {error}
                </div>
            )}


            {/* TABLE */}
            {!loading && !error && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                                <th className="p-4 pl-6 font-semibold">Thông tin User</th>
                                <th className="p-4 font-semibold">Role</th>
                                <th className="p-4 font-semibold">Email Verified</th>
                                <th className="p-4 font-semibold text-right pr-6">Hành động</th>
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-indigo-50/30 transition duration-200 group">

                                    {/* USER INFO */}
                                    <td className="p-4 pl-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 text-[#5a4d8c] flex items-center justify-center font-bold text-sm">
                                                {user.full_name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-800">{user.full_name}</p>
                                                <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                                                    <span className="flex items-center gap-1"><Mail size={12}/> {user.email}</span>
                                                    <span className="flex items-center gap-1"><Phone size={12}/> {user.phone}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </td>

                                    {/* ROLE */}
                                    <td className="p-4">
                                        <span className="px-3 py-1 rounded-md text-xs font-bold bg-gray-100 border border-gray-300">
                                            {user.role_name}
                                        </span>
                                    </td>

                                    {/* EMAIL VERIFIED */}
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(user.email_verified)}`}>
                                            {user.email_verified ? "Verified" : "Not Verified"}
                                        </span>
                                    </td>

                                    {/* ACTION */}
                                    <td className="p-4 pr-6 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition">

                                            {/* Edit */}
                                            {!user.deleted && (
                                                <button 
                                                    onClick={() => handleEditClick(user)}
                                                    className="p-2 text-gray-400 hover:text-[#5a4d8c] hover:bg-purple-50 rounded-lg">
                                                    <Edit size={18} />
                                                </button>
                                            )}

                                            {/* Delete */}
                                            {!user.deleted && (
                                                <button 
                                                    onClick={() => handleDeleteUser(user.id)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                                    <Trash2 size={18} />
                                                </button>
                                            )}

                                            {/* Restore */}
                                            {user.deleted && (
                                                <button 
                                                    onClick={() => handleRestoreUser(user.id)}
                                                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg">
                                                    <RefreshCcw size={18}/>
                                                </button>
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


            {/* MODAL CREATE / EDIT USER */}
            {isModalOpen && currentUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

                        {/* HEADER */}
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                {currentUser.id ? "Chỉnh sửa User" : "Tạo User mới"}
                            </h3>
                            <button 
                                onClick={() => setIsModalOpen(false)} 
                                className="text-gray-400 hover:text-gray-600 p-1">
                                <X size={20}/>
                            </button>
                        </div>

                        {/* BODY */}
                        <div className="p-6 space-y-4">

                            {/* Full Name */}
                            <div>
                                <label className="block text-xs font-bold mb-1">Họ và tên</label>
                                <input 
                                    type="text"
                                    className="w-full px-3 py-2 rounded-lg border"
                                    value={currentUser.full_name}
                                    onChange={(e)=>setCurrentUser({...currentUser, full_name:e.target.value})}
                                />
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-xs font-bold mb-1">Email</label>
                                <input 
                                    type="email"
                                    className="w-full px-3 py-2 rounded-lg border"
                                    value={currentUser.email}
                                    onChange={(e)=>setCurrentUser({...currentUser, email:e.target.value})}
                                    disabled={currentUser.id}
                                />
                            </div>

                            {/* Phone */}
                            <div>
                                <label className="block text-xs font-bold mb-1">Số điện thoại</label>
                                <input 
                                    type="text"
                                    className="w-full px-3 py-2 rounded-lg border"
                                    value={currentUser.phone}
                                    onChange={(e)=>setCurrentUser({...currentUser, phone:e.target.value})}
                                />
                            </div>

                            {/* Password — only for CREATE */}
                            {!currentUser.id && (
                                <div>
                                    <label className="block text-xs font-bold mb-1">Mật khẩu</label>
                                    <input 
                                        type="password"
                                        className="w-full px-3 py-2 rounded-lg border"
                                        value={currentUser.password}
                                        onChange={(e)=>setCurrentUser({...currentUser, password:e.target.value})}
                                    />
                                </div>
                            )}

                            {/* Role */}
                            <div>
                                <label className="block text-xs font-bold mb-1">Role</label>
                                <select 
                                    className="w-full px-3 py-2 rounded-lg border"
                                    value={currentUser.role}
                                    onChange={(e)=>setCurrentUser({...currentUser, role:e.target.value})}
                                >
                                    <option value="admin">Admin</option>
                                    <option value="teacher">Teacher</option>
                                    <option value="member">Member</option>
                                </select>
                            </div>

                        </div>

                        {/* FOOTER */}
                        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
                            <button 
                                onClick={()=>setIsModalOpen(false)} 
                                className="px-4 py-2 border rounded-lg">
                                Hủy
                            </button>

                            <button 
                                onClick={handleSaveUser} 
                                className="px-4 py-2 bg-[#5a4d8c] text-white rounded-lg font-bold flex items-center gap-1">
                                <Save size={16}/>
                                {currentUser.id ? "Lưu" : "Tạo User"}
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}
