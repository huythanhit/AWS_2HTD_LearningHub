import React, { useState, useEffect, useRef } from 'react';
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
import { userValidationSchema, validateSchema } from "../../validation/adminValidators";

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
    const [userErrors, setUserErrors] = useState({});
    const fullNameRef = useRef(null);
    const emailRef = useRef(null);
    const phoneRef = useRef(null);
    const passwordRef = useRef(null);
    const roleRef = useRef(null);

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
        setUserErrors({});
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
        setUserErrors({});
        setIsModalOpen(true);
    };

    // --- SAVE USER ---
    function extractFieldErrorsFromApi(err) {
        const data = err?.data || err?.response?.data;
        const out = {};
        if (!data) return out;

        // Common API shapes: { errors: { field: ["msg"] } }
        if (data.errors && typeof data.errors === 'object') {
            Object.entries(data.errors).forEach(([k, v]) => {
                if (Array.isArray(v)) out[k] = v.join(' ');
                else if (typeof v === 'string') out[k] = v;
            });
            return out;
        }

        // Another possible shape: { message: 'Validation error', details: { field: 'msg' } }
        if (data.details && typeof data.details === 'object') {
            Object.entries(data.details).forEach(([k, v]) => { out[k] = typeof v === 'string' ? v : JSON.stringify(v); });
            return out;
        }

        return out;
    }

    const handleSaveUser = async () => {
        // Basic client-side required checks first (prevents hitting API and showing generic popup)
        const reqErrors = {};
        const isCreate = !currentUser?.id;
        if (isCreate) {
            if (!currentUser.full_name || !currentUser.full_name.toString().trim()) reqErrors.full_name = 'Vui lòng nhập họ và tên';
            if (!currentUser.email || !currentUser.email.toString().trim()) reqErrors.email = 'Vui lòng nhập email';
            if (!currentUser.phone || !currentUser.phone.toString().trim()) reqErrors.phone = 'Vui lòng nhập số điện thoại';
            if (!currentUser.password || !currentUser.password.toString().trim()) reqErrors.password = 'Vui lòng nhập mật khẩu';
            if (!currentUser.role || !currentUser.role.toString().trim()) reqErrors.role = 'Vui lòng chọn role';
        } else {
            // for updates, only basic checks for fields that are present
            if (currentUser.full_name === undefined || currentUser.full_name === null || currentUser.full_name.toString().trim() === '') reqErrors.full_name = 'Vui lòng nhập họ và tên';
        }

        if (Object.keys(reqErrors).length) {
            setUserErrors(reqErrors);
            // focus first invalid field
            const order = ['full_name', 'email', 'phone', 'password', 'role'];
            const firstKey = order.find(k => reqErrors[k]);
            const refMap = {
                full_name: fullNameRef,
                email: emailRef,
                phone: phoneRef,
                password: passwordRef,
                role: roleRef
            };
            if (firstKey && refMap[firstKey] && refMap[firstKey].current) {
                // small timeout to ensure modal is rendered/focusable
                setTimeout(() => {
                    try { refMap[firstKey].current.focus(); } catch (e) { /* ignore */ }
                }, 10);
            }
            return;
        }

        // run schema validation (for more complex rules) and map errors if any
        const errors = await validateSchema(userValidationSchema, currentUser, { isCreate });
        if (Object.keys(errors).length) {
            setUserErrors(errors);
            // focus first invalid field
            const order = ['full_name', 'email', 'phone', 'password', 'role'];
            const firstKey = order.find(k => errors[k]);
            const refMap = {
                full_name: fullNameRef,
                email: emailRef,
                phone: phoneRef,
                password: passwordRef,
                role: roleRef
            };
            if (firstKey && refMap[firstKey] && refMap[firstKey].current) {
                // small timeout to ensure modal is rendered/focusable
                setTimeout(() => {
                    try { refMap[firstKey].current.focus(); } catch (e) { /* ignore */ }
                }, 10);
            }
            return;
        }
        setUserErrors({});

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
            // show success popup after create/update
            if (window.showGlobalPopup) {
                window.showGlobalPopup({ type: 'success', message: currentUser.id ? 'Cập nhật user thành công!' : 'Tạo user thành công!' });
            } else {
                alert(currentUser.id ? 'Cập nhật user thành công!' : 'Tạo user thành công!');
            }
        } catch (err) {
            // Try to map server-side validation errors into inline field errors
            const apiErrors = extractFieldErrorsFromApi(err);
            // Map API field names to client field names if necessary
            const mapped = {};
            Object.entries(apiErrors).forEach(([k, v]) => {
                let field = k;
                if (k === 'fullName' || k === 'full_name') field = 'full_name';
                if (k === 'password') field = 'password';
                if (k === 'role') field = 'role';
                if (k === 'email') field = 'email';
                if (k === 'phone') field = 'phone';
                mapped[field] = v;
            });

            if (Object.keys(mapped).length) {
                setUserErrors(mapped);
                // focus first invalid
                const order = ['full_name', 'email', 'phone', 'password', 'role'];
                const firstKey = order.find(k => mapped[k]);
                const refMap = { full_name: fullNameRef, email: emailRef, phone: phoneRef, password: passwordRef, role: roleRef };
                if (firstKey && refMap[firstKey] && refMap[firstKey].current) {
                    setTimeout(() => { try { refMap[firstKey].current.focus(); } catch(e){} }, 10);
                }
                return;
            }

            if (window.showGlobalPopup) window.showGlobalPopup({ type: 'error', message: 'Lỗi: ' + err.message }); else alert('Lỗi: ' + err.message);
        }
    };

    // --- DELETE USER ---
    const handleDeleteUser = async (userId) => {
        const ok = window.showGlobalConfirm ? await window.showGlobalConfirm("Bạn có chắc chắn muốn xóa user này không?") : window.confirm("Bạn có chắc chắn muốn xóa user này không?");
        if (!ok) return;
        try {
            await deleteUser(userId);
            if (window.showGlobalPopup) window.showGlobalPopup({ type: 'success', message: 'Xóa user thành công!' }); else alert('Xóa user thành công!');
            await loadActiveUsers();
            await loadDeletedUsers();
        } catch (err) {
            if (window.showGlobalPopup) window.showGlobalPopup({ type: 'error', message: 'Lỗi khi xóa user: ' + err.message }); else alert('Lỗi khi xóa user: ' + err.message);
        }
    };

    // --- RESTORE USER ---
    const handleRestoreUser = async (userId) => {
        const ok = window.showGlobalConfirm ? await window.showGlobalConfirm("Khôi phục tài khoản này?") : window.confirm("Khôi phục tài khoản này?");
        if (!ok) return;
        try {
            await restoreUser(userId);
            if (window.showGlobalPopup) window.showGlobalPopup({ type: 'success', message: 'Khôi phục user thành công!' }); else alert('Khôi phục user thành công!');
            await loadActiveUsers();
            await loadDeletedUsers();
        } catch (err) {
            if (window.showGlobalPopup) window.showGlobalPopup({ type: 'error', message: 'Lỗi khi khôi phục user: ' + err.message }); else alert('Lỗi khi khôi phục user: ' + err.message);
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
                                    aria-invalid={!!userErrors.full_name}
                                    ref={fullNameRef}
                                    className={`w-full px-3 py-2 rounded-lg ${userErrors.full_name ? 'border-red-300 ring-1 ring-red-300' : 'border'}`}
                                    value={currentUser.full_name}
                                    onChange={(e)=>{ setCurrentUser({...currentUser, full_name:e.target.value}); setUserErrors(prev=>({...prev, full_name: undefined})); }}
                                />
                                {userErrors.full_name && <p className="text-xs text-red-500 mt-1">{userErrors.full_name}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold mb-1">Email</label>
                                <input 
                                    type="email"
                                    aria-invalid={!!userErrors.email}
                                    ref={emailRef}
                                    className={`w-full px-3 py-2 rounded-lg ${userErrors.email ? 'border-red-300 ring-1 ring-red-300' : 'border'}`}
                                    value={currentUser.email}
                                    onChange={(e)=>{ setCurrentUser({...currentUser, email:e.target.value}); setUserErrors(prev=>({...prev, email: undefined})); }}
                                    disabled={currentUser.id}
                                />
                                {userErrors.email && <p className="text-xs text-red-500 mt-1">{userErrors.email}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold mb-1">Số điện thoại</label>
                                <input 
                                    type="text"
                                    aria-invalid={!!userErrors.phone}
                                    ref={phoneRef}
                                    className={`w-full px-3 py-2 rounded-lg ${userErrors.phone ? 'border-red-300 ring-1 ring-red-300' : 'border'}`}
                                    value={currentUser.phone}
                                    onChange={(e)=>{ setCurrentUser({...currentUser, phone:e.target.value}); setUserErrors(prev=>({...prev, phone: undefined})); }}
                                />
                                {userErrors.phone && <p className="text-xs text-red-500 mt-1">{userErrors.phone}</p>}
                            </div>

                            {!currentUser.id && (
                                <div>
                                    <label className="block text-xs font-bold mb-1">Mật khẩu</label>
                                    <input 
                                        type="password"
                                        aria-invalid={!!userErrors.password}
                                        ref={passwordRef}
                                        className={`w-full px-3 py-2 rounded-lg ${userErrors.password ? 'border-red-300 ring-1 ring-red-300' : 'border'}`}
                                        value={currentUser.password}
                                        onChange={(e)=>{ setCurrentUser({...currentUser, password:e.target.value}); setUserErrors(prev=>({...prev, password: undefined})); }}
                                    />
                                    {userErrors.password && <p className="text-xs text-red-500 mt-1">{userErrors.password}</p>}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold mb-1">Role</label>
                                <select 
                                    ref={roleRef}
                                    aria-invalid={!!userErrors.role}
                                    className={`w-full px-3 py-2 rounded-lg ${userErrors.role ? 'border-red-300 ring-1 ring-red-300' : 'border'}`}
                                    value={currentUser.role}
                                    onChange={(e)=>{ setCurrentUser({...currentUser, role:e.target.value}); setUserErrors(prev=>({...prev, role: undefined})); }}
                                >
                                    <option value="teacher">Teacher</option>
                                    <option value="member">Member</option>
                                </select>
                                {userErrors.role && <p className="text-xs text-red-500 mt-1">{userErrors.role}</p>}
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
