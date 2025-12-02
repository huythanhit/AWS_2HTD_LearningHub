import React, { useState } from 'react';
import { 
    Save, Lock, Bell, User, Globe, 
    Shield, Mail, Camera, AlertCircle 
} from 'lucide-react';

export default function AdminSettings() {
    // --- STATE ---
    const [activeTab, setActiveTab] = useState('general');
    const [isLoading, setIsLoading] = useState(false);

    // Mock Data State
    const [profile, setProfile] = useState({
        siteName: 'Trung Tâm Anh Ngữ Admin',
        contactEmail: 'admin@englishcenter.com',
        phone: '0909 123 456',
        language: 'vi',
        bio: 'Quản trị viên hệ thống.'
    });

    const [security, setSecurity] = useState({
        currentPass: '',
        newPass: '',
        confirmPass: ''
    });

    const [notifications, setNotifications] = useState({
        emailAlert: true,
        smsAlert: false,
        newStudentAlert: true,
        systemUpdateAlert: true
    });

    // --- HANDLERS ---
    const handleSave = () => {
        setIsLoading(true);
        // Giả lập API call
        setTimeout(() => {
            setIsLoading(false);
            alert('Đã lưu thay đổi thành công!');
        }, 1000);
    };

    // --- RENDER HELPERS ---
    const TabButton = ({ id, label, icon: Icon }) => (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl transition-all duration-300 ${
                activeTab === id 
                ? 'bg-[#5a4d8c] text-white shadow-md shadow-indigo-200 translate-x-1' 
                : 'text-gray-500 hover:bg-gray-100 hover:text-[#5a4d8c]'
            }`}
        >
            <Icon size={18} />
            <span className="font-medium text-sm">{label}</span>
        </button>
    );

    return (
        <div className="p-8 min-h-screen bg-gray-50/50">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-gray-800">Cài đặt hệ thống</h1>
                <p className="text-sm text-gray-500 mt-1">Quản lý thông tin website, bảo mật và cấu hình thông báo.</p>
            </div>

            <div className="flex flex-col lg:flex-row gap-8">
                {/* LEFT SIDEBAR (Tabs) */}
                <div className="w-full lg:w-64 flex-shrink-0">
                    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 sticky top-4">
                        <div className="space-y-1">
                            <TabButton id="general" label="Thông tin chung" icon={Globe} />
                            <TabButton id="security" label="Bảo mật & Mật khẩu" icon={Shield} />
                            <TabButton id="notifications" label="Cấu hình thông báo" icon={Bell} />
                        </div>
                    </div>
                </div>

                {/* RIGHT CONTENT */}
                <div className="flex-1">
                    {/* TAB: GENERAL */}
                    {activeTab === 'general' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in-up">
                            <div className="p-6 border-b border-gray-100">
                                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                    <User size={20} className="text-[#5a4d8c]" /> 
                                    Thông tin chung
                                </h2>
                            </div>
                            
                            <div className="p-6 space-y-6">
                                {/* Avatar Section */}
                                <div className="flex items-center gap-6">
                                    <div className="relative group cursor-pointer">
                                        <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center text-[#5a4d8c] text-2xl font-bold overflow-hidden border-2 border-white shadow-md">
                                            AD
                                        </div>
                                        <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Camera size={20} className="text-white" />
                                        </div>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-800">Ảnh đại diện</h3>
                                        <p className="text-xs text-gray-500 mb-2">Chấp nhận file: .png, .jpg (Tối đa 2MB)</p>
                                        <button className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition">Thay đổi</button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-600">Tên hiển thị Website</label>
                                        <input 
                                            type="text" 
                                            value={profile.siteName}
                                            onChange={(e) => setProfile({...profile, siteName: e.target.value})}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-[#5a4d8c] outline-none text-sm transition"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-600">Email liên hệ</label>
                                        <input 
                                            type="email" 
                                            value={profile.contactEmail}
                                            onChange={(e) => setProfile({...profile, contactEmail: e.target.value})}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-[#5a4d8c] outline-none text-sm transition"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-600">Số điện thoại</label>
                                        <input 
                                            type="text" 
                                            value={profile.phone}
                                            onChange={(e) => setProfile({...profile, phone: e.target.value})}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-[#5a4d8c] outline-none text-sm transition"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-600">Ngôn ngữ mặc định</label>
                                        <select 
                                            value={profile.language}
                                            onChange={(e) => setProfile({...profile, language: e.target.value})}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-[#5a4d8c] outline-none text-sm bg-white"
                                        >
                                            <option value="vi">Tiếng Việt</option>
                                            <option value="en">English</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: SECURITY */}
                    {activeTab === 'security' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in-up">
                             <div className="p-6 border-b border-gray-100">
                                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                    <Lock size={20} className="text-[#5a4d8c]" /> 
                                    Đổi mật khẩu
                                </h2>
                            </div>
                            <div className="p-6 max-w-lg space-y-5">
                                <div className="p-3 bg-yellow-50 text-yellow-700 text-sm rounded-lg flex gap-2 items-start">
                                    <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                                    <span>Mật khẩu nên có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số để đảm bảo an toàn.</span>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-600">Mật khẩu hiện tại</label>
                                    <input type="password" placeholder="••••••••" className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-[#5a4d8c] outline-none text-sm" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-600">Mật khẩu mới</label>
                                    <input type="password" placeholder="••••••••" className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-[#5a4d8c] outline-none text-sm" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-600">Xác nhận mật khẩu mới</label>
                                    <input type="password" placeholder="••••••••" className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-[#5a4d8c] outline-none text-sm" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* TAB: NOTIFICATIONS */}
                    {activeTab === 'notifications' && (
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in-up">
                            <div className="p-6 border-b border-gray-100">
                                <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                                    <Bell size={20} className="text-[#5a4d8c]" /> 
                                    Cài đặt thông báo
                                </h2>
                            </div>
                            <div className="p-6 space-y-6">
                                {[
                                    { id: 'emailAlert', label: 'Thông báo qua Email', desc: 'Nhận email khi có hoạt động quan trọng.' },
                                    { id: 'newStudentAlert', label: 'Học viên mới đăng ký', desc: 'Thông báo khi có user mới tạo tài khoản.' },
                                    { id: 'systemUpdateAlert', label: 'Cập nhật hệ thống', desc: 'Nhận thông tin về các bản cập nhật phần mềm.' },
                                ].map((item) => (
                                    <div key={item.id} className="flex items-center justify-between pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                                        <div>
                                            <h4 className="font-semibold text-gray-800 text-sm">{item.label}</h4>
                                            <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input 
                                                type="checkbox" 
                                                checked={notifications[item.id]} 
                                                onChange={() => setNotifications({...notifications, [item.id]: !notifications[item.id]})}
                                                className="sr-only peer" 
                                            />
                                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#5a4d8c]"></div>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Footer Actions */}
                    <div className="mt-6 flex justify-end">
                         <button 
                            onClick={handleSave} 
                            disabled={isLoading}
                            className={`px-6 py-2.5 rounded-xl bg-[#5a4d8c] text-white text-sm font-bold shadow-lg shadow-indigo-200 transition flex items-center gap-2 ${isLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-[#483d73] hover:-translate-y-1'}`}
                        >
                            {isLoading ? 'Đang lưu...' : <><Save size={18}/> Lưu thay đổi</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}