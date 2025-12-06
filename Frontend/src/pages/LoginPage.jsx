import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { login } from '../services/authService'; 


// --- ICONS & ASSETS (Giữ nguyên phần export) ---

// Icon Mắt (Hiện/Ẩn password)
export const EyeIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
        <circle cx="12" cy="12" r="3" />
    </svg>
);
export const EyeOffIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
        <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
        <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
        <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
);

// Icon Google
// Google sign-in removed

// Illustration
export const BookIllustration = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-90" {...props}><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>
);

// Icon Mũi tên trái (Back)
export const ArrowLeftIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
);

// --- CONSTANTS ---
export const lightestBg = 'bg-[#f8f6fb]';
export const primaryBg = 'bg-[#8c78ec]';
export const primaryText = 'text-[#5a4d8c]';
export const hoverBg = 'hover:bg-[#7a66d3]';

// --- COMPONENT ---
export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const response = await login({ email, password });
            const { token, user } = response;
    
            // Lưu thông tin vào localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('role', user.role_name); // Lưu vai trò vào localStorage
            localStorage.setItem('roleId', user.role_id);
            // Xác định đường dẫn chuyển hướng
            let path = '/member'; // Đường dẫn mặc định cho member
            if (user.role_name === 'Admin') {
                path = '/admin'; // Chuyển hướng nếu là Admin
            } else if (user.role_name === 'Teacher') {
                path = '/teacher'; // Chuyển hướng nếu là Teacher
            }
        
            navigate(path); // Thực hiện chuyển hướng
        } catch (error) {
            console.error(error.message);
            alert("Đăng nhập thất bại: " + error.message);
        }
    };

    return (
        <div className={`min-h-screen flex items-center justify-center p-4 ${lightestBg}`}>
            
            {/* Nút Quay Lại Trang Chủ - FIXED ở góc trên trái */}
            <Link 
                to="/" // Đường dẫn trang chủ
                className={`fixed top-4 left-4 md:top-8 md:left-8 p-3 rounded-full ${primaryText} bg-white/70 backdrop-blur-sm hover:bg-white transition shadow-lg z-10`}
                aria-label="Quay lại Trang chủ"
            >
                <ArrowLeftIcon className="w-6 h-6" />
            </Link>

            <div className="w-full max-w-4xl grid md:grid-cols-2 bg-white rounded-3xl shadow-2xl overflow-hidden transform transition-all">

                {/* --- CỘT 1: FORM LOGIN (Order-2 trên Mobile, Order-1 trên Desktop) --- */}
                <div className="p-8 md:p-12 flex flex-col justify-center order-2 md:order-1">
                    <div className="mb-8 text-center md:text-left">
                        <Link to="/" className={`text-2xl font-black ${primaryText} block mb-4`}>
                            LearningHub
                        </Link>
                        <h1 className={`text-3xl font-extrabold ${primaryText} mb-2`}>Chào mừng trở lại!</h1>
                        <p className="text-gray-500 text-sm">Đăng nhập để tiếp tục lộ trình học tập.</p>
                    </div>

                    <form className="space-y-5" onSubmit={handleLogin}>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition outline-none bg-gray-50 focus:bg-white"
                                placeholder="name@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div>
                            <div className="flex justify-between mb-1">
                                <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
                                <a href="#" className={`text-xs font-semibold ${primaryText} hover:underline`}>Quên mật khẩu?</a>
                            </div>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-400 focus:border-transparent transition outline-none bg-gray-50 focus:bg-white"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    className="absolute inset-y-0 right-0 flex items-center px-4 text-gray-400 hover:text-gray-600"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center">
                            <input type="checkbox" id="remember" className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500" />
                            <label htmlFor="remember" className="ml-2 text-sm text-gray-600">Ghi nhớ đăng nhập</label>
                        </div>

                        <button
                            type="submit"
                            className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg ${primaryBg} ${hoverBg} transition transform hover:-translate-y-0.5`}
                        >
                            Đăng Nhập
                        </button>
                    </form>

            {/* Google sign-in removed */}

                    <p className="text-center text-sm text-gray-500 mt-8">
                        Chưa có tài khoản?
                        <Link to="/auth/register" className={`font-semibold ${primaryText} hover:underline ml-1 transition`}>
                            Đăng ký ngay
                        </Link>
                    </p>
                </div>

                {/* --- CỘT 2: BANNER (Đã đồng bộ với RegisterPage) --- */}
                <div className="hidden md:flex flex-col items-center justify-center p-12 bg-gradient-to-br from-[#8c78ec] to-[#5a4d8c] text-white order-1 md:order-2">
                    <BookIllustration />
                    <h2 className="text-3xl font-bold text-center mt-8">Học tập không giới hạn.</h2>
                    <p className="text-center text-purple-200 mt-4 text-sm leading-relaxed max-w-xs">
                        "Kiên trì hôm nay là thành công của ngày mai. Tiếp tục hành trình của bạn ngay bây giờ."
                    </p>
                    <div className="mt-8 space-y-2 text-sm text-purple-100 opacity-80">
                        <p>✓ Truy cập bài giảng mọi lúc, mọi nơi</p>
                        <p>✓ Hệ thống bài tập thông minh</p>
                        <p>✓ Theo dõi tiến độ học tập chi tiết</p>
                    </div>
                </div>

            </div>
        </div>
    );
}