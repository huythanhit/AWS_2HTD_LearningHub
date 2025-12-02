import React from 'react';
import { Save, Lock, User, Mail } from 'lucide-react';

export default function TeacherSettings() {
    return (
        <div className="space-y-6">
             <h2 className="text-2xl font-bold text-gray-800 mb-6">Cài đặt tài khoản</h2>

             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cột trái: Thông tin chung */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                            <User size={20} /> Thông tin cá nhân
                        </h3>
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Họ và tên</label>
                                    <input type="text" defaultValue="Teacher English" className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#5a4d8c] outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Số điện thoại</label>
                                    <input type="text" defaultValue="0987654321" className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#5a4d8c] outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Email</label>
                                <div className="flex items-center gap-2 px-4 py-2 rounded-lg border bg-gray-50 text-gray-500">
                                    <Mail size={16} />
                                    <span>teacher@english.com</span>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Giới thiệu ngắn</label>
                                <textarea rows="3" className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#5a4d8c] outline-none" defaultValue="Giáo viên IELTS 8.0 với 5 năm kinh nghiệm..."></textarea>
                            </div>
                        </div>
                         <div className="mt-6 text-right">
                            <button className="bg-[#5a4d8c] text-white px-6 py-2 rounded-lg hover:bg-[#483d73] transition flex items-center gap-2 ml-auto">
                                <Save size={18} /> Lưu thay đổi
                            </button>
                        </div>
                    </div>
                </div>

                {/* Cột phải: Bảo mật */}
                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                         <h3 className="text-lg font-bold text-gray-700 mb-4 flex items-center gap-2">
                            <Lock size={20} /> Đổi mật khẩu
                        </h3>
                        <div className="space-y-3">
                            <input type="password" placeholder="Mật khẩu hiện tại" className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#5a4d8c] outline-none" />
                            <input type="password" placeholder="Mật khẩu mới" className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#5a4d8c] outline-none" />
                            <input type="password" placeholder="Nhập lại mật khẩu mới" className="w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#5a4d8c] outline-none" />
                        </div>
                        <button className="w-full mt-4 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition">
                            Cập nhật mật khẩu
                        </button>
                    </div>
                </div>
             </div>
        </div>
    );
}