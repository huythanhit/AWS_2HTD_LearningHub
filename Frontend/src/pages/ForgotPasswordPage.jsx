import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { forgotPassword, resetPassword } from '../services/authService';
import { EyeIcon, EyeOffIcon, ArrowLeftIcon, lightestBg, primaryBg, primaryText, hoverBg } from './LoginPage';

export default function ForgotPasswordPage() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    
    // State cho bước 1: Nhập email
    const [email, setEmail] = useState('');
    const [step, setStep] = useState('email'); // 'email' hoặc 'verify'
    const [isLoading, setIsLoading] = useState(false);
    
    // State cho bước 2: Xác thực code và mật khẩu mới
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    
    // Lấy email từ query params nếu có (từ trang login)
    useEffect(() => {
        const emailParam = searchParams.get('email');
        if (emailParam) {
            setEmail(emailParam);
        }
    }, [searchParams]);

    // Bước 1: Gửi mã xác thực về email
    const handleSendCode = async (e) => {
        e.preventDefault();
        
        if (!email) {
            showNotify('error', 'Vui lòng nhập email');
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            showNotify('error', 'Email không hợp lệ');
            return;
        }

        setIsLoading(true);
        try {
            await forgotPassword(email);
            setStep('verify');
            showNotify('success', 'Mã xác thực đã được gửi về email của bạn!');
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'Không thể gửi mã xác thực';
            showNotify('error', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // Bước 2: Xác nhận code và đặt mật khẩu mới
    const handleResetPassword = async (e) => {
        e.preventDefault();

        // Validation
        if (!code) {
            showNotify('error', 'Vui lòng nhập mã xác thực');
            return;
        }

        if (!newPassword) {
            showNotify('error', 'Vui lòng nhập mật khẩu mới');
            return;
        }

        if (newPassword.length < 6) {
            showNotify('error', 'Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }

        if (newPassword !== confirmPassword) {
            showNotify('error', 'Mật khẩu xác nhận không khớp');
            return;
        }

        setIsLoading(true);
        try {
            await resetPassword({
                email,
                code,
                newPassword
            });
            showNotify('success', 'Đặt lại mật khẩu thành công! Đang chuyển đến trang đăng nhập...');
            
            // Chuyển đến trang đăng nhập sau 1.5 giây
            setTimeout(() => {
                navigate('/auth/login', { 
                    state: { 
                        email: email,
                        message: 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới.' 
                    } 
                });
            }, 1500);
        } catch (error) {
            const errorMessage = error.response?.data?.message || error.message || 'Không thể đặt lại mật khẩu';
            showNotify('error', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    // Helper function để hiển thị thông báo
    const showNotify = (type, message) => {
        if (window.showGlobalPopup) {
            window.showGlobalPopup({ type, message });
        } else {
            alert(message);
        }
    };

    return (
        <div className={`min-h-screen flex items-center justify-center p-4 ${lightestBg}`}>
            {/* Nút Quay Lại */}
            <Link 
                to="/auth/login"
                className={`fixed top-4 left-4 md:top-8 md:left-8 p-3 rounded-full ${primaryText} bg-white/70 backdrop-blur-sm hover:bg-white transition shadow-lg z-10`}
                aria-label="Quay lại trang đăng nhập"
            >
                <ArrowLeftIcon className="w-6 h-6" />
            </Link>

            <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden transform transition-all">
                <div className="p-8 md:p-12">
                    <div className="mb-8 text-center">
                        <h1 className={`text-3xl font-extrabold ${primaryText} mb-2`}>
                            {step === 'email' ? 'Quên mật khẩu' : 'Đặt lại mật khẩu'}
                        </h1>
                        <p className="text-gray-500 text-sm">
                            {step === 'email' 
                                ? 'Nhập email của bạn để nhận mã xác thực' 
                                : `Mã xác thực đã được gửi đến ${email}`}
                        </p>
                    </div>

                    {step === 'email' ? (
                        // Bước 1: Nhập email
                        <form onSubmit={handleSendCode} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition outline-none bg-gray-50 focus:bg-white"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    disabled={isLoading}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg ${primaryBg} ${hoverBg} transition transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {isLoading ? 'Đang gửi...' : 'Gửi mã xác thực'}
                            </button>

                            <div className="text-center">
                                <Link 
                                    to="/auth/login" 
                                    className={`text-sm ${primaryText} hover:underline`}
                                >
                                    Quay lại đăng nhập
                                </Link>
                            </div>
                        </form>
                    ) : (
                        // Bước 2: Xác thực code và đặt mật khẩu mới
                        <form onSubmit={handleResetPassword} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Mã xác thực
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition outline-none bg-gray-50 focus:bg-white"
                                    placeholder="Nhập mã xác thực"
                                    value={code}
                                    onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                                    maxLength="6"
                                    required
                                    disabled={isLoading}
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Nhập mã 6 chữ số đã được gửi đến email của bạn
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Mật khẩu mới
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition outline-none bg-gray-50 focus:bg-white"
                                        placeholder="••••••••"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        disabled={isLoading}
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 flex items-center justify-center w-12 text-gray-400 hover:text-gray-600 focus:outline-none z-10"
                                        onClick={() => setShowPassword(!showPassword)}
                                        aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                                    >
                                        {showPassword ? (
                                            <EyeOffIcon className="w-5 h-5" />
                                        ) : (
                                            <EyeIcon className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Xác nhận mật khẩu mới
                                </label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition outline-none bg-gray-50 focus:bg-white"
                                        placeholder="••••••••"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        disabled={isLoading}
                                        minLength={6}
                                    />
                                    <button
                                        type="button"
                                        className="absolute inset-y-0 right-0 flex items-center justify-center w-12 text-gray-400 hover:text-gray-600 focus:outline-none z-10"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOffIcon className="w-5 h-5" />
                                        ) : (
                                            <EyeIcon className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg ${primaryBg} ${hoverBg} transition transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {isLoading ? 'Đang xử lý...' : 'Lưu mật khẩu'}
                            </button>

                            <div className="text-center space-y-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setStep('email');
                                        setCode('');
                                        setNewPassword('');
                                        setConfirmPassword('');
                                    }}
                                    className={`text-sm ${primaryText} hover:underline block w-full`}
                                    disabled={isLoading}
                                >
                                    Gửi lại mã xác thực
                                </button>
                                <Link 
                                    to="/auth/login" 
                                    className={`text-sm ${primaryText} hover:underline block`}
                                >
                                    Quay lại đăng nhập
                                </Link>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
