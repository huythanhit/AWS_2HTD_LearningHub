import React, { useState, useEffect } from 'react';
import { 
    User, Lock, Camera, Save, Mail, Phone, 
    Shield, CheckCircle, AlertCircle 
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { getMyProfile, updateMyProfile, uploadImage } from '../../services/profileService';
import { forgotPassword, resetPassword } from '../../services/authService';

export default function MemberSettings() {
    // --- STATE ---
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'security'
    const [isLoading, setIsLoading] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [notification, setNotification] = useState(null); // { type: 'success' | 'error', message: '' }
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [avatarFile, setAvatarFile] = useState(null); // File ảnh mới chưa upload

    // Thông tin học viên - lấy từ context hoặc API
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phone: '',
        bio: '',
        avatar: null
    });

    // State đổi mật khẩu (luồng quên mật khẩu)
    const [passData, setPassData] = useState({
        step: 'request', // 'request' | 'verify' - Bước 1: gửi code, Bước 2: nhập code + mật khẩu mới
        code: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [codeSent, setCodeSent] = useState(false);

    // Load thông tin user từ API
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                setLoadingProfile(true);
                const profileData = await getMyProfile();
                setFormData({
                    fullName: profileData.fullName || '',
                    email: profileData.email || '',
                    phone: profileData.phone || '',
                    bio: profileData.bio || '',
                    avatar: profileData.avatar || null
                });
            } catch (error) {
                console.error('Error fetching profile:', error);
                // Fallback về thông tin từ context nếu API lỗi
                if (user) {
                    setFormData({
                        fullName: user.userName || '',
                        email: user.email || '',
                        phone: '',
                        bio: '',
                        avatar: null
                    });
                }
            } finally {
                setLoadingProfile(false);
            }
        };

        fetchProfile();
    }, [user]);

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
        if (!file) return;

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            showNotify('error', 'Vui lòng chọn file ảnh hợp lệ (JPEG, PNG, GIF, WebP)');
            return;
        }

        // Validate file size (max 500MB theo API mới)
        const maxSize = 500 * 1024 * 1024; // 500MB
        if (file.size > maxSize) {
            showNotify('error', 'Kích thước file không được vượt quá 500MB');
            return;
        }

        // Lưu file để upload sau khi bấm Lưu
        setAvatarFile(file);
        
        // Hiển thị preview ngay (local URL)
        const imageUrl = URL.createObjectURL(file);
        setFormData({ ...formData, avatar: imageUrl });
    };

    const handleSaveProfile = async () => {
        setIsLoading(true);
        setUploadingAvatar(false);
        
        try {
            let avatarUrl = formData.avatar;
            
            // Nếu có file ảnh mới, upload trước
            if (avatarFile) {
                setUploadingAvatar(true);
                try {
                    const uploadResult = await uploadImage(avatarFile);
                    avatarUrl = uploadResult.urls?.[0];
                    
                    if (!avatarUrl) {
                        throw new Error('Không nhận được URL ảnh từ server');
                    }
                    
                    // Giải phóng object URL cũ
                    if (formData.avatar && formData.avatar.startsWith('blob:')) {
                        URL.revokeObjectURL(formData.avatar);
                    }
                    
                    setFormData({ ...formData, avatar: avatarUrl });
                    setAvatarFile(null); // Xóa file sau khi upload thành công
                } catch (uploadError) {
                    setUploadingAvatar(false);
                    showNotify('error', uploadError.message || 'Upload ảnh thất bại');
                    return; // Dừng lại nếu upload thất bại
                } finally {
                    setUploadingAvatar(false);
                }
            }
            
            // Update profile với thông tin mới
            const updated = await updateMyProfile({
                fullName: formData.fullName,
                phone: formData.phone,
                bio: formData.bio,
                ...(avatarUrl && { avatar: avatarUrl }) // Chỉ gửi avatar nếu có
            });
            
            // Cập nhật lại formData với dữ liệu từ server
            setFormData({
                ...formData,
                fullName: updated.fullName || formData.fullName,
                phone: updated.phone || formData.phone,
                bio: updated.bio || formData.bio,
                avatar: updated.avatar || formData.avatar
            });
            
            showNotify('success', 'Thông tin cá nhân đã được lưu!');
        } catch (error) {
            showNotify('error', error.message || 'Lưu thông tin thất bại');
        } finally {
            setIsLoading(false);
        }
    };

    // Bước 1: Gửi mã code về email
    const handleRequestPasswordReset = async () => {
        if (!formData.email) {
            showNotify('error', 'Email không tồn tại');
            return;
        }

        setIsLoading(true);
        try {
            await forgotPassword(formData.email);
            setCodeSent(true);
            setPassData({ ...passData, step: 'verify' });
            showNotify('success', 'Mã xác thực đã được gửi về email của bạn!');
        } catch (error) {
            showNotify('error', error.message || 'Không thể gửi mã xác thực');
        } finally {
            setIsLoading(false);
        }
    };

    // Bước 2: Xác nhận code và đặt mật khẩu mới
    const handleResetPassword = async () => {
        if (!passData.code) {
            showNotify('error', 'Vui lòng nhập mã xác thực');
            return;
        }

        if (!passData.newPassword) {
            showNotify('error', 'Vui lòng nhập mật khẩu mới');
            return;
        }

        if (passData.newPassword !== passData.confirmPassword) {
            showNotify('error', 'Mật khẩu xác nhận không khớp!');
            return;
        }

        if (passData.newPassword.length < 6) {
            showNotify('error', 'Mật khẩu mới phải có ít nhất 6 ký tự.');
            return;
        }

        setIsLoading(true);
        try {
            await resetPassword({
                email: formData.email,
                code: passData.code,
                newPassword: passData.newPassword
            });
            
            setPassData({ step: 'request', code: '', newPassword: '', confirmPassword: '' });
            setCodeSent(false);
            showNotify('success', 'Đổi mật khẩu thành công!');
        } catch (error) {
            showNotify('error', error.message || 'Đổi mật khẩu thất bại');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelPasswordReset = () => {
        setPassData({ step: 'request', code: '', newPassword: '', confirmPassword: '' });
        setCodeSent(false);
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
                            {loadingProfile ? (
                                <div className="text-center py-8 text-gray-500">
                                    Đang tải thông tin...
                                </div>
                            ) : (
                                <>
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
                                        <input 
                                            type="file" 
                                            className="hidden" 
                                            accept="image/*" 
                                            onChange={handleAvatarChange}
                                            disabled={isLoading || uploadingAvatar}
                                        />
                                    </label>
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 text-lg">{formData.fullName}</h3>
                                    <p className="text-sm text-gray-500 mb-2">Học viên chính thức</p>
                                    <label className={`text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 transition font-medium text-gray-600 cursor-pointer ${(isLoading || uploadingAvatar) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                                        {avatarFile ? 'Ảnh đã chọn (chưa lưu)' : 'Tải ảnh mới'}
                                        <input 
                                            type="file" 
                                            className="hidden" 
                                            accept="image/*" 
                                            onChange={handleAvatarChange}
                                            disabled={isLoading || uploadingAvatar}
                                        />
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
                                    disabled={isLoading || uploadingAvatar}
                                    className="px-6 py-2.5 bg-[#5a4d8c] text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-[#483d73] hover:-translate-y-1 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
                                >
                                    {uploadingAvatar ? 'Đang upload ảnh...' : isLoading ? 'Đang lưu...' : <><Save size={18}/> Lưu thay đổi</>}
                                </button>
                            </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* --- TAB: SECURITY --- */}
                    {activeTab === 'security' && (
                        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 animate-fade-in-up">
                            <h2 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                                <Lock className="text-[#5a4d8c]" size={20} /> Đổi mật khẩu
                            </h2>

                            {passData.step === 'request' ? (
                                // Bước 1: Gửi mã code về email
                                <div className="max-w-md space-y-5">
                                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                                        <p className="text-sm text-blue-800">
                                            <strong>Lưu ý:</strong> Chúng tôi sẽ gửi mã xác thực về email <strong>{formData.email}</strong> của bạn. 
                                            Vui lòng kiểm tra hộp thư và nhập mã để đặt mật khẩu mới.
                                        </p>
                                    </div>

                                    <div className="pt-4">
                                        <button 
                                            onClick={handleRequestPasswordReset}
                                            disabled={isLoading || !formData.email}
                                            className="w-full px-6 py-2.5 bg-[#5a4d8c] text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-[#483d73] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {isLoading ? 'Đang gửi...' : 'Gửi mã xác thực về email'}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                // Bước 2: Nhập code + mật khẩu mới
                                <div className="max-w-md space-y-5">
                                    {codeSent && (
                                        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                                            <p className="text-sm text-green-800">
                                                <strong>✓ Mã xác thực đã được gửi!</strong> Vui lòng kiểm tra email <strong>{formData.email}</strong> và nhập mã bên dưới.
                                            </p>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-gray-600">Mã xác thực</label>
                                        <input 
                                            type="text" 
                                            name="code"
                                            value={passData.code}
                                            onChange={handlePassChange}
                                            className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#5a4d8c] focus:ring-2 focus:ring-indigo-100 outline-none text-sm transition"
                                            placeholder="Nhập mã 6 chữ số"
                                            maxLength={6}
                                        />
                                        <p className="text-xs text-gray-400">Mã xác thực được gửi về email của bạn</p>
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

                                    <div className="pt-4 flex gap-3">
                                        <button 
                                            onClick={handleCancelPasswordReset}
                                            disabled={isLoading}
                                            className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium text-sm hover:bg-gray-50 transition-all disabled:opacity-50"
                                        >
                                            Hủy
                                        </button>
                                        <button 
                                            onClick={handleResetPassword}
                                            disabled={isLoading}
                                            className="flex-1 px-6 py-2.5 bg-[#5a4d8c] text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-200 hover:bg-[#483d73] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {isLoading ? 'Đang xử lý...' : 'Đặt mật khẩu mới'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}