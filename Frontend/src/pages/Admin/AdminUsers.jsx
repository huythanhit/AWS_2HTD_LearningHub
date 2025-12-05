import React, { useState, useEffect } from 'react';
import { 
    Plus, Edit, Trash2, Mail, Phone,
    X, Save, RefreshCcw
} from 'lucide-react';

import { 
    getAdminUsers, 
    getDeletedUsers,
    createUser, 
    updateUser, 
    deleteUser, 
    restoreUser 
} from "../../services/adminService";

export default function AdminUsers() {

    // --- STATE ---
    const [users, setUsers] = useState([]);
    const [deletedUsers, setDeletedUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [pageDeleted, setPageDeleted] = useState(1);
    const [limitDeleted] = useState(10);

    const [tab, setTab] = useState("active");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);

    const [searchText, setSearchText] = useState("");
    const [filterRole, setFilterRole] = useState("all");

    // --- FETCH USERS ---
    async function loadActiveUsers() {
        const res = await getAdminUsers(page, limit);
        setUsers(res.users);
    }

    async function loadDeletedUsers() {
        const res = await getDeletedUsers(pageDeleted, limitDeleted);
        setDeletedUsers(res.users);
    }

    useEffect(() => {
        async function fetchAll() {
            try {
                setLoading(true);
                await Promise.all([loadActiveUsers(), loadDeletedUsers()]);
            } catch (err) {
                console.error("ERROR FETCH USERS:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }
        fetchAll();
    }, [page, limit, pageDeleted, limitDeleted]);

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
            password: ""
        });
        setIsModalOpen(true);
    };

    // --- SAVE USER ---
    const handleSaveUser = async () => {
        try {
            if (!currentUser.id) {
                const payload = {
                    fullName: currentUser.full_name,
                    email: currentUser.email,
                    phone: currentUser.phone,
                    password: currentUser.password,
                    role: currentUser.role
                };
                await createUser(payload);
            } else {
                const payload = {
                    fullName: currentUser.full_name,
                    phone: currentUser.phone,
                    role: currentUser.role
                };
                await updateUser(currentUser.id, payload);
            }
            setIsModalOpen(false);
            await loadActiveUsers();
            await loadDeletedUsers();
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
            await loadActiveUsers();
            await loadDeletedUsers();
        } catch (err) {
            alert("Lỗi khi xóa user: " + err.message);
        }
    };

    // --- RESTORE USER ---
    const handleRestoreUser = async (userId) => {
        if (!window.confirm("Khôi phục tài khoản này?")) return;
        try {
            await restoreUser(userId);
            alert("Khôi phục user thành công!");
            await loadActiveUsers();
            await loadDeletedUsers();
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

    // --- FILTER USERS ---
    const filterUsers = (list) => {
        return list.filter(u => {
            const matchesSearch = [u.full_name, u.email, u.phone]
                .some(field => field?.toLowerCase().includes(searchText.toLowerCase()));
            const matchesRole = filterRole === "all" || u.role_name.toLowerCase() === filterRole;
            return matchesSearch && matchesRole;
        });
    };

    // --- RENDER USER ROW (THÊM STT) ---
    const renderUserRow = (user, index, isDeleted = false) => (
        <tr key={user.id} className="hover:bg-indigo-50/30 transition duration-200 group">
            <td className="p-4 text-center font-semibold w-16 text-gray-700">
                {isDeleted ? (pageDeleted - 1) * limitDeleted + index + 1 : (page - 1) * limit + index + 1}
            </td>

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

            <td className="p-4">
                <span className="px-3 py-1 rounded-md text-xs font-bold bg-gray-100 border border-gray-300">
                    {user.role_name}
                </span>
            </td>

            {!isDeleted && (
                <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(user.email_verified)}`}>
                        {user.email_verified ? "Verified" : "Not Verified"}
                    </span>
                </td>
            )}

            <td className="p-4 pr-6 text-right">
                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition">
                    {!isDeleted && (
                        <button 
                            onClick={() => handleEditClick(user)}
                            className="p-2 text-gray-400 hover:text-[#5a4d8c] hover:bg-purple-50 rounded-lg">
                            <Edit size={18} />
                        </button>
                    )}

                    {!isDeleted && (
                        <button 
                            onClick={() => handleDeleteUser(user.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                            <Trash2 size={18} />
                        </button>
                    )}

                    {isDeleted && (
                        <button 
                            onClick={() => handleRestoreUser(user.id)}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg">
                            <RefreshCcw size={18}/>
                        </button>
                    )}
                </div>
            </td>
        </tr>
    );


    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans animate-fade-in-up">
            {/* HEADER */}
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-gray-800">Quản lý User & Phân quyền</h1>
                <button
                    onClick={openCreateModal}
                    className="flex items-center gap-2 px-4 py-2 bg-[#5a4d8c] text-white rounded-xl hover:bg-[#483d73] shadow-md transition">
                    <Plus size={18} /> Thêm User
                </button>
            </div>

            {/* TABS */}
            <div className="flex gap-4 mb-4">
                <button
                    className={`px-4 py-2 rounded-lg font-bold ${tab === "active" ? "bg-[#5a4d8c] text-white" : "bg-white border"}`}
                    onClick={() => setTab("active")}
                >
                    Người dùng đang hoạt động
                </button>

                <button
                    className={`px-4 py-2 rounded-lg font-bold ${tab === "deleted" ? "bg-[#5a4d8c] text-white" : "bg-white border"}`}
                    onClick={() => setTab("deleted")}
                >
                    Người dùng đã xóa
                </button>
            </div>

            {/* SEARCH & FILTER */}
            <div className="flex flex-wrap gap-4 mb-4">
                <input
                    type="text"
                    placeholder="Tìm kiếm theo tên, email hoặc số điện thoại"
                    className="px-3 py-2 border rounded-lg flex-1 min-w-[250px]"
                    value={searchText}
                    onChange={(e) => { setSearchText(e.target.value); setPage(1); setPageDeleted(1); }}
                />
                <select
                    className="px-3 py-2 border rounded-lg"
                    value={filterRole}
                    onChange={(e) => { setFilterRole(e.target.value); setPage(1); setPageDeleted(1); }}
                >
                    <option value="all">Tất cả role</option>
                    <option value="admin">Admin</option>
                    <option value="teacher">Teacher</option>
                    <option value="member">Member</option>
                </select>
            </div>

            {/* LOADING */}
            {loading && <div className="text-center py-10 text-gray-500">Đang tải dữ liệu...</div>}

            {/* ERROR */}
            {error && <div className="text-center py-4 text-red-500 font-semibold">Lỗi tải dữ liệu: {error}</div>}

            {/* TABLE */}
            {!loading && !error && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-100">
                                    <th className="p-4 text-center font-semibold w-16">STT</th>
                                    <th className="p-4 pl-6 font-semibold">Thông tin User</th>
                                    <th className="p-4 font-semibold">Role</th>
                                    {tab === "active" && <th className="p-4 font-semibold">Email Verified</th>}
                                    <th className="p-4 font-semibold text-right pr-6">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {tab === "active"
                                    ? filterUsers(users).map((u, i) => renderUserRow(u, i, false))
                                    : filterUsers(deletedUsers).map((u, i) => renderUserRow(u, i, true))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* PAGINATION */}
            {tab === "active" && (
                <div className="flex items-center justify-between mt-4">
                    <button
                        disabled={page === 1}
                        onClick={() => setPage(page - 1)}
                        className={`px-4 py-2 border rounded-lg ${page === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"}`}
                    >
                        ← Trước
                    </button>
                    <span className="text-gray-700 font-semibold">Trang {page}</span>
                    <button
                        disabled={filterUsers(users).length < limit}
                        onClick={() => setPage(page + 1)}
                        className={`px-4 py-2 border rounded-lg ${filterUsers(users).length < limit ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"}`}
                    >
                        Sau →
                    </button>
                </div>
            )}

            {tab === "deleted" && (
                <div className="flex items-center justify-between mt-4">
                    <button
                        disabled={pageDeleted === 1}
                        onClick={() => setPageDeleted(pageDeleted - 1)}
                        className={`px-4 py-2 border rounded-lg ${pageDeleted === 1 ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"}`}
                    >
                        ← Trước
                    </button>
                    <span className="text-gray-700 font-semibold">Trang {pageDeleted}</span>
                    <button
                        disabled={filterUsers(deletedUsers).length < limitDeleted}
                        onClick={() => setPageDeleted(pageDeleted + 1)}
                        className={`px-4 py-2 border rounded-lg ${filterUsers(deletedUsers).length < limitDeleted ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-100"}`}
                    >
                        Sau →
                    </button>
                </div>
            )}

            {/* MODAL */}
            {isModalOpen && currentUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">

                        <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
                            <h3 className="text-lg font-bold">{currentUser.id ? "Chỉnh sửa User" : "Tạo User mới"}</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1">
                                <X size={20}/>
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold mb-1">Họ và tên</label>
                                <input 
                                    type="text"
                                    className="w-full px-3 py-2 rounded-lg border"
                                    value={currentUser.full_name}
                                    onChange={(e)=>setCurrentUser({...currentUser, full_name:e.target.value})}
                                />
                            </div>

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

                            <div>
                                <label className="block text-xs font-bold mb-1">Số điện thoại</label>
                                <input 
                                    type="text"
                                    className="w-full px-3 py-2 rounded-lg border"
                                    value={currentUser.phone}
                                    onChange={(e)=>setCurrentUser({...currentUser, phone:e.target.value})}
                                />
                            </div>

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

                            <div>
                                <label className="block text-xs font-bold mb-1">Role</label>
                                <select 
                                    className="w-full px-3 py-2 rounded-lg border"
                                    value={currentUser.role}
                                    onChange={(e)=>setCurrentUser({...currentUser, role:e.target.value})}
                                >
                                    <option value="teacher">Teacher</option>
                                    <option value="member">Member</option>
                                </select>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
                            <button onClick={()=>setIsModalOpen(false)} className="px-4 py-2 border rounded-lg">Hủy</button>
                            <button onClick={handleSaveUser} className="px-4 py-2 bg-[#5a4d8c] text-white rounded-lg font-bold flex items-center gap-1">
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
