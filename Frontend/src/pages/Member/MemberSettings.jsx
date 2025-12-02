import React, { useState } from 'react';
import { 
    User, Lock, Camera, Save, Mail, Phone, 
    Shield, CheckCircle, AlertCircle 
} from 'lucide-react';

export default function MemberSettings() {
    // --- STATE ---
    const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security'
    const [isLoading, setIsLoading] = useState(false);
    const [notification, setNotification] = useState(null); // { type: 'success' | 'error', message: '' }

    // Mock Data: Thông tin học viên
    const [formData, setFormData] = useState({
        fullName: 'Nguyễn Văn Học Viên',
        email: 'student@example.com',
        phone: '0987 654 321',
        bio: 'Học viên tích cực tại English Center.',
        avatar: null // Nếu null sẽ hiện placeholder
    });

    // State đổi mật khẩu
    const [passData, setPassData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    // --- HANDLERS ---
    const handleProfileChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handlePassChange = (e) => {
        const { name, value } = e.target;
        setPassData({ ...passData, [name]: value });
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Giả lập upload ảnh (tạo URL tạm thời)
            const imageUrl = URL.createObjectURL(file);
            setFormData({ ...formData, avatar: imageUrl });
            showNotify('success', 'Đã cập nhật ảnh đại diện thành công!');
        }
    };

    const handleSaveProfile = () => {
        setIsLoading(true);
        // Giả lập API call
        setTimeout(() => {
            setIsLoading(false);
            showNotify('success', 'Thông tin cá nhân đã được lưu!');
        }, 800);
    };

    const handleSavePassword = () => {
        if (passData.newPassword !== passData.confirmPassword) {
            showNotify('error', 'Mật khẩu xác nhận không khớp!');
            return;
        }
        if (passData.newPassword.length < 6) {
            showNotify('error', 'Mật khẩu mới phải có ít nhất 6 ký tự.');
            return;
        }

        setIsLoading(true);
        setTimeout(() => {
            setIsLoading(false);
            setPassData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            showNotify('success', 'Đổi mật khẩu thành công!');
        }, 800);
    };

    const showNotify = (type, message) => {
        setNotification({ type, message });
        setTimeout(() => setNotification(null), 3000);
    };

    // --- SUB-COMPONENTS ---
    const TabButton = ({ id, label, icon: Icon }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                activeTab === id 
                ? 'bg-[#5a4d8c] text-white shadow-md shadow-indigo-200' 
                : 'text-gray-500 hover:bg-white hover:text-[#5a4d8c]'
            }`}
        >
            <Icon size={18} />
            {label}
        </button>
    );

    return (
        <div className="max-w-5xl mx-auto p-6 min-h-screen">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Cài đặt tài khoản</h1>
                <p className="text-gray-500 text-sm mt-1">Quản lý thông tin cá nhân và bảo mật tài khoản của bạn.</p>
            </div>

            {/* Notification Toast */}
            {notification && (
                <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-fade-in-down ${
                    notification.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                    {notification.type === 'success' ? <CheckCircle size={20}/> : <AlertCircle size={20}/>}
                    <span className="font-medium text-sm">{notification.message}</span>
                </div>
            )}

            <div className="flex flex-col md:flex-row gap-8">
                {/* SIDEBAR TABS */}
                <div className="w-full md:w-64 flex-shrink-0">
                    <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
                        <TabButton id="profile" label="Hồ sơ cá nhân" icon={User} />
                        <TabButton id="security" label="Mật khẩu & Bảo mật" icon={Shield} />
                    </div>
                </div>

                {/* CONTENT AREA */}
                <div className="flex-1">
                    {/* --- TAB: PROFILE --- */}
                    {activeTab === 'profile' && (
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 animate-fade-in-up">
                            <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                                <User className="text-[#5a4d8c]" size={20} /> Thông tin chung
                            </h2>

                            {/* Avatar Section */}
                            <div className="flex items-center gap-6 mb-8 pb-8 border-b border-gray-50">
                                <div className="relative group">
                                    <div className="w-24 h-24 rounded-full bg-indigo-50 border-4 border-white shadow-md overflow-hidden flex items-center justify-center">
                                        {formData.avatar ? (
                                            <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-3xl font-bold text-[#5a4d8c]">
                                                {formData.fullName.charAt(0)}
                                            </span>
                                        )}
                                    </div>
                                    <label className="absolute bottom-0 right-0 bg-[#5a4d8c] text-white p-2 rounded-full cursor-pointer hover:bg-[#483d73] transition shadow-sm" title="Đổi ảnh đại diện">
                                        <Camera size={16} />
                                        <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                                    </label>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 text-lg">{formData.fullName}</h3>
                                    <p className="text-sm text-gray-500 mb-2">Học viên chính thức</p>
                                    <label className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition cursor-pointer font-medium text-gray-600">
                                        Tải ảnh mới
                                        <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                                    </label>
                                </div>
                            </div>

                            {/* Form Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-600 flex items-center gap-1.5">
                                        <User size={14}/> Họ và tên
                                    </label>
                                    <input 
                                        type="text" 
                                        name="fullName"
                                        value={formData.fullName} 
                                        onChange={handleProfileChange}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#5a4d8c] focus:ring-2 focus:ring-indigo-100 outline-none text-sm transition"
                                    />
                                </div>
                                
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-600 flex items-center gap-1.5">
                                        <Mail size={14}/> Email
                                    </label>
                                    <input 
                                        type="email" 
                                        name="email"
                                        value={formData.email} 
                                        onChange={handleProfileChange}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#5a4d8c] focus:ring-2 focus:ring-indigo-100 outline-none text-sm transition bg-gray-50 text-gray-500 cursor-not-allowed"
                                        readOnly
                                        title="Không thể thay đổi email đăng nhập"
                                    />
                                    <p className="text-xs text-gray-400">*Email đăng nhập không thể thay đổi</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-600 flex items-center gap-1.5">
                                        <Phone size={14}/> Số điện thoại
                                    </label>
                                    <input 
                                        type="tel" 
                                        name="phone"
                                        value={formData.phone} 
                                        onChange={handleProfileChange}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#5a4d8c] focus:ring-2 focus:ring-indigo-100 outline-none text-sm transition"
                                    />
                                </div>
                            </div>

                            <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
                                <button 
                                    onClick={handleSaveProfile}
                                    disabled={isLoading}
                                    className="px-6 py-2.5 bg-[#5a4d8c] text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-[#483d73] hover:-translate-y-1 transition-all flex items-center gap-2"
                                >
                                    {isLoading ? 'Đang lưu...' : <><Save size={18}/> Lưu thay đổi</>}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* --- TAB: SECURITY --- */}
                    {activeTab === 'security' && (
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 animate-fade-in-up">
                            <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                                <Lock className="text-[#5a4d8c]" size={20} /> Đổi mật khẩu
                            </h2>

                            <div className="max-w-md space-y-5">
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-600">Mật khẩu hiện tại</label>
                                    <div className="relative">
                                        <input 
                                            type="password" 
                                            name="currentPassword"
                                            value={passData.currentPassword}
                                            onChange={handlePassChange}
                                            className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-gray-200 focus:border-[#5a4d8c] focus:ring-2 focus:ring-indigo-100 outline-none text-sm transition"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-600">Mật khẩu mới</label>
                                    <input 
                                        type="password" 
                                        name="newPassword"
                                        value={passData.newPassword}
                                        onChange={handlePassChange}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#5a4d8c] focus:ring-2 focus:ring-indigo-100 outline-none text-sm transition"
                                        placeholder="••••••••"
                                    />
                                    <p className="text-xs text-gray-400">Tối thiểu 6 ký tự</p>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-600">Xác nhận mật khẩu mới</label>
                                    <input 
                                        type="password" 
                                        name="confirmPassword"
                                        value={passData.confirmPassword}
                                        onChange={handlePassChange}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#5a4d8c] focus:ring-2 focus:ring-indigo-100 outline-none text-sm transition"
                                        placeholder="••••••••"
                                    />
                                </div>

                                <div className="pt-4">
                                    <button 
                                        onClick={handleSavePassword}
                                        disabled={isLoading}
                                        className="w-full px-6 py-2.5 bg-[#5a4d8c] text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-[#483d73] transition-all flex items-center justify-center gap-2"
                                    >
                                        {isLoading ? 'Đang xử lý...' : 'Cập nhật mật khẩu'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}