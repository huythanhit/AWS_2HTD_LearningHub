
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { register } from '../services/authService'; // Nhập hàm register

// --- Icons Components ---
const EyeIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
);
const EyeOffIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" /><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.94 13.94 0 0 1-6.59 4.88" /><path d="M5.08 10.73A10.43 10.43 0 0 0 3 12c0 7 3 7 10 7a13.94 13.94 0 0 0 4.88-6.59" /><path d="M3 3l18 18" /></svg>
);
// Google sign-up removed
const BookIllustration = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-90"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" /></svg>
);
const ArrowLeftIcon = (props) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="m12 19-7-7 7-7" /><path d="M19 12H5" /></svg>
);

// --- Styles ---
const primaryText = 'text-[#5a4d8c]';
const primaryBg = 'bg-[#8c78ec]';
const hoverBg = 'hover:bg-[#7a66d3]';
const lightestBg = 'bg-[#f8f6fb]';

export default function RegisterPage() {

    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        email: '',
        password: '',
        confirmPassword: '',
        birthDate: '',
        occupation: 'student',
        role: 'member',
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Cập nhật hàm handleRegister
    const handleRegister = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            alert("Mật khẩu nhập lại không khớp!");
            return;
        }

        try {
            // Gọi hàm đăng ký và truyền dữ liệu
            const response = await register({
                fullName: formData.fullName,
                email: formData.email,
                phoneNumber: formData.phone,
                password: formData.password,
            });

            // Xử lý phản hồi sau khi đăng ký
            console.log("Đăng ký thành công:", response);
            alert("Đăng ký thành công!");

            // Tùy chọn: chuyển hướng đến trang đăng nhập
        } catch (error) {
            console.error(error.message); // Xử lý lỗi
            alert("Đăng ký thất bại: " + error.message);
        }
    };

    return (
        <div className={`min-h-screen flex items-center justify-center p-4 ${lightestBg}`}>

            <Link
                to="/"
                className={`fixed top-4 left-4 md:top-8 md:left-8 p-3 rounded-full ${primaryText} bg-white/70 backdrop-blur-sm hover:bg-white transition shadow-lg z-10`}
            >
                <ArrowLeftIcon className="w-6 h-6" />
            </Link>

            <div className="w-full max-w-4xl grid md:grid-cols-2 bg-white rounded-3xl shadow-2xl overflow-hidden">

                {/* FORM SECTION */}
                <div className="p-8 md:p-12 flex flex-col justify-center order-2 md:order-1">
                    <div className="mb-6 text-center md:text-left">
                        <h1 className={`text-3xl font-extrabold ${primaryText}`}>Đăng ký tài khoản</h1>
                        <p className="text-gray-500 text-sm mt-2">
                            Nhập thông tin của bạn để tham gia LearningHub.
                        </p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-4">

                        {/* Row 1 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Họ và Tên</label>
                                <input
                                    type="text"
                                    name="fullName"
                                    required
                                    value={formData.fullName}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-400 bg-gray-50"
                                    placeholder="Nguyễn Văn A"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Số điện thoại</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    required
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-400 bg-gray-50"
                                    placeholder="09xx xxx xxx"
                                />
                            </div>
                        </div>

                        {/* Row 2 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                name="email"
                                required
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-400 bg-gray-50"
                                placeholder="name@example.com"
                            />
                        </div>

                        {/* Row 3 */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
                                <input
                                    type="date"
                                    name="birthDate"
                                    required
                                    value={formData.birthDate}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-400 bg-gray-50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nghề nghiệp</label>
                                <select
                                    name="occupation"
                                    value={formData.occupation}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-400 bg-gray-50"
                                >
                                    <option value="student">Học sinh</option>
                                    <option value="college_student">Sinh viên</option>
                                    <option value="worker">Đi làm</option>
                                    <option value="lecturer">Giảng viên</option>
                                    <option value="other">Khác</option>
                                </select>
                            </div>
                        </div>

                        {/* Row: ROLE CHỌN LOẠI TÀI KHOẢN */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Đăng ký dưới dạng
                            </label>

                            <div className="flex items-center gap-6 bg-gray-50 p-3 rounded-xl border border-gray-200">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="role"
                                        value="member"
                                        checked={formData.role === "member"}
                                        onChange={handleChange}
                                        className="w-4 h-4 text-purple-600"
                                    />
                                    <span>Học viên</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="role"
                                        value="teacher"
                                        checked={formData.role === "teacher"}
                                        onChange={handleChange}
                                        className="w-4 h-4 text-purple-600"
                                    />
                                    <span>Giảng viên</span>
                                </label>
                            </div>
                        </div>

                        {/* Row 4 - Password */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Mật khẩu</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        required
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-400 bg-gray-50"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 px-3 text-gray-400"
                                    >
                                        {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nhập lại mật khẩu</label>
                                <div className="relative">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        name="confirmPassword"
                                        required
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:ring-2 focus:ring-purple-400 bg-gray-50"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute inset-y-0 right-0 px-3 text-gray-400"
                                    >
                                        {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Terms */}
                        <div className="flex items-center text-sm pt-2">
                            <input type="checkbox" id="terms" className="w-4 h-4 text-purple-600" required />
                            <label htmlFor="terms" className="ml-2 text-gray-600">
                                Tôi đồng ý với <a href="#" className={`${primaryText} font-semibold`}>Điều khoản sử dụng</a>
                            </label>
                        </div>

                        <button
                            type="submit"
                            className={`w-full py-3.5 rounded-xl font-bold text-white shadow-lg ${primaryBg} ${hoverBg} mt-2`}
                        >
                            Đăng Ký Ngay
                        </button>
                    </form>

                    {/* Google sign-up removed */}

                    <p className="text-center text-sm text-gray-500 mt-6">
                        Đã có tài khoản?
                        <Link to="/auth/login" className={`font-semibold ${primaryText} ml-1`}>
                            Đăng nhập tại đây
                        </Link>
                    </p>
                </div>

                {/* RIGHT BANNER */}
                <div className="hidden md:flex flex-col items-center justify-center p-12 bg-gradient-to-br from-[#8c78ec] to-[#5a4d8c] text-white order-1 md:order-2">
                    <BookIllustration />
                    <h2 className="text-3xl font-bold text-center mt-8">Chào mừng bạn mới!</h2>
                    <p className="text-center text-purple-200 mt-4 text-sm leading-relaxed max-w-xs">
                        "Học tập là hạt giống của kiến thức, kiến thức là hạt giống của hạnh phúc."
                    </p>
                    <div className="mt-8 space-y-2 text-sm text-purple-100 opacity-80">
                        <p>✓ Lộ trình học cá nhân hóa</p>
                        <p>✓ Kho tài liệu không giới hạn</p>
                        <p>✓ Cộng đồng học viên tích cực</p>
                    </div>
                </div>

            </div>
        </div>
    );
}