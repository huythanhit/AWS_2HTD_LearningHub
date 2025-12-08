import React, { useState, useEffect } from 'react';
import { 
    Save, Lock, User, Mail, Phone, Camera,
    CheckCircle, AlertCircle
} from 'lucide-react';
import { getMyProfile, updateMyProfile, uploadImage } from '../../services/profileService';
import { forgotPassword, resetPassword } from '../../services/authService';

export default function TeacherSettings() {
    // --- STATE ---
    const [isLoading, setIsLoading] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [notification, setNotification] = useState(null);
    const [avatarFile, setAvatarFile] = useState(null); // File ảnh mới chưa upload

    // Thông tin giáo viên - lấy từ API
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
                showNotify('error', 'Không thể tải thông tin cá nhân');
            } finally {
                setLoadingProfile(false);
            }
        };

        fetchProfile();
    }, []);

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

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Cài đặt tài khoản</h2>

            {/* Notification Toast */}
            {notification && (
                <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-fade-in-down ${
                    notification.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                    {notification.type === 'success' ? <CheckCircle size={20}/> : <AlertCircle size={20}/>}
                    <span className="font-medium text-sm">{notification.message}</span>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cột trái: Thông tin chung */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                            <User size={20} /> Thông tin cá nhân
                        </h3>

                        {loadingProfile ? (
                            <div className="text-center py-8 text-gray-500">
                                Đang tải thông tin...
                            </div>
                        ) : (
                            <>
                                {/* Avatar Section */}
                                <div className="flex items-center gap-6 mb-6 pb-6 border-b border-gray-50">
                                    <div className="relative group">
                                        <div className="w-24 h-24 rounded-full bg-indigo-50 border-4 border-white shadow-md overflow-hidden flex items-center justify-center">
                                            {formData.avatar ? (
                                                <img src={formData.avatar} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-3xl font-bold text-[#5a4d8c]">
                                                    {formData.fullName.charAt(0) || 'T'}
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
                                        <h4 className="font-bold text-gray-800 text-lg">{formData.fullName || 'Giáo viên'}</h4>
                                        <p className="text-sm text-gray-500 mb-2">Giáo viên chính thức</p>
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

                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1 flex items-center gap-1.5">
                                                <User size={14}/> Họ và tên
                                            </label>
                                            <input 
                                                type="text" 
                                                name="fullName"
                                                value={formData.fullName} 
                                                onChange={handleProfileChange}
                                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#5a4d8c] outline-none transition"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-600 mb-1 flex items-center gap-1.5">
                                                <Phone size={14}/> Số điện thoại
                                            </label>
                                            <input 
                                                type="tel" 
                                                name="phone"
                                                value={formData.phone} 
                                                onChange={handleProfileChange}
                                                className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#5a4d8c] outline-none transition"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1 flex items-center gap-1.5">
                                            <Mail size={14}/> Email
                                        </label>
                                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-gray-50 text-gray-500">
                                            <Mail size={16} />
                                            <span>{formData.email || 'Chưa có email'}</span>
                                        </div>
                                        <p className="text-xs text-gray-400 mt-1">*Email đăng nhập không thể thay đổi</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-600 mb-1">Giới thiệu ngắn</label>
                                        <textarea 
                                            rows="3" 
                                            name="bio"
                                            value={formData.bio} 
                                            onChange={handleProfileChange}
                                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#5a4d8c] outline-none transition resize-none"
                                            placeholder="Nhập giới thiệu về bản thân..."
                                        />
                                    </div>
                                </div>
                                <div className="mt-6 text-right">
                                    <button 
                                        onClick={handleSaveProfile}
                                        disabled={isLoading || uploadingAvatar}
                                        className="bg-[#5a4d8c] text-white px-6 py-2 rounded-lg hover:bg-[#483d73] transition flex items-center gap-2 ml-auto disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        {uploadingAvatar ? 'Đang upload ảnh...' : isLoading ? 'Đang lưu...' : <><Save size={18} /> Lưu thay đổi</>}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Cột phải: Bảo mật */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                            <Lock size={20} /> Đổi mật khẩu
                        </h3>

                        {passData.step === 'request' ? (
                            // Bước 1: Gửi mã code về email
                            <div className="space-y-4">
                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                    <p className="text-sm text-blue-800">
                                        <strong>Lưu ý:</strong> Chúng tôi sẽ gửi mã xác thực về email <strong>{formData.email}</strong> của bạn. 
                                        Vui lòng kiểm tra hộp thư và nhập mã để đặt mật khẩu mới.
                                    </p>
                                </div>

                                <button 
                                    onClick={handleRequestPasswordReset}
                                    disabled={isLoading || !formData.email}
                                    className="w-full bg-[#5a4d8c] text-white px-4 py-2 rounded-lg hover:bg-[#483d73] transition disabled:opacity-70"
                                >
                                    {isLoading ? 'Đang gửi...' : 'Gửi mã xác thực về email'}
                                </button>
                            </div>
                        ) : (
                            // Bước 2: Nhập code + mật khẩu mới
                            <div className="space-y-4">
                                {codeSent && (
                                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                                        <p className="text-sm text-green-800">
                                            <strong>✓ Mã xác thực đã được gửi!</strong> Vui lòng kiểm tra email <strong>{formData.email}</strong> và nhập mã bên dưới.
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Mã xác thực</label>
                                    <input 
                                        type="text" 
                                        name="code"
                                        value={passData.code}
                                        onChange={handlePassChange}
                                        placeholder="Nhập mã 6 chữ số" 
                                        maxLength={6}
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#5a4d8c] outline-none transition"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Mã xác thực được gửi về email của bạn</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Mật khẩu mới</label>
                                    <input 
                                        type="password" 
                                        name="newPassword"
                                        value={passData.newPassword}
                                        onChange={handlePassChange}
                                        placeholder="••••••••" 
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#5a4d8c] outline-none transition"
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Tối thiểu 6 ký tự</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Xác nhận mật khẩu mới</label>
                                    <input 
                                        type="password" 
                                        name="confirmPassword"
                                        value={passData.confirmPassword}
                                        onChange={handlePassChange}
                                        placeholder="••••••••" 
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#5a4d8c] outline-none transition"
                                    />
                                </div>

                                <div className="flex gap-3">
                                    <button 
                                        onClick={handleCancelPasswordReset}
                                        disabled={isLoading}
                                        className="flex-1 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition disabled:opacity-50"
                                    >
                                        Hủy
                                    </button>
                                    <button 
                                        onClick={handleResetPassword}
                                        disabled={isLoading}
                                        className="flex-1 bg-[#5a4d8c] text-white px-4 py-2 rounded-lg hover:bg-[#483d73] transition disabled:opacity-70"
                                    >
                                        {isLoading ? 'Đang xử lý...' : 'Đặt mật khẩu mới'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}