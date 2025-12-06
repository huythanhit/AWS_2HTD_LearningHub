import React from 'react';
import { FaMapMarkerAlt, FaPhone, FaEnvelope, FaClock } from 'react-icons/fa';

const Footer = () => {
    const darkFooterBg = 'bg-[#443c68]';
    const primaryColorHex = '#8c78ec';

    return (
        <footer className={`${darkFooterBg} text-[#d1c4e9] py-8 px-4 sm:px-6`}>
            <div className="max-w-7xl mx-auto">

                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 border-b border-gray-600 pb-10">

                    {/* Cột 1 */}
                    <div className="space-y-4">
                        <h4 className="text-3xl font-extrabold mb-4" style={{ color: primaryColorHex }}>
                            2HTD LearningHub
                        </h4>
                        <p className="text-sm leading-relaxed">
                            Nền tảng học tiếng Anh trực tuyến tiên tiến, cung cấp các khóa học chuyên biệt từ cơ bản đến nâng cao.
                        </p>
                    </div>

                    {/* Cột 2: Thông tin liên lạc */}
                    <div>
                        <h5 className="text-lg font-bold text-white mb-6 relative pb-3">
                            Thông Tin Liên Lạc
                            <span className="block w-10 h-1 absolute left-0 bottom-0 rounded-full" style={{ backgroundColor: primaryColorHex }}></span>
                        </h5>
                        <ul className="space-y-4 text-sm">

                            <li className="flex items-start group">
                                <FaPhone className="mt-1 mr-3 flex-shrink-0" style={{ color: primaryColorHex }} />
                                <a
                                    href="tel:+84987654321"
                                    className="transition duration-300 group-hover:text-white hover:underline decoration-white underline-offset-2"
                                >
                                    (+84) 987 654 321
                                </a>
                            </li>

                            <li className="flex items-start group">
                                <FaEnvelope className="mt-1 mr-3 flex-shrink-0" style={{ color: primaryColorHex }} />
                                <a
                                    href="mailto:support@2htdhub.vn"
                                    className="transition duration-300 group-hover:text-white hover:underline decoration-white underline-offset-2"
                                >
                                    support@2htdhub.vn
                                </a>
                            </li>

                            <li className="flex items-start group">
                                <FaClock className="mt-1 mr-3 flex-shrink-0" style={{ color: primaryColorHex }} />
                                <span className="group-hover:text-white hover:underline decoration-white underline-offset-2 transition duration-300">
                                    Thứ Hai - Thứ Sáu: 8:00 - 17:00
                                </span>
                            </li>

                        </ul>
                    </div>

                    {/* Cột 3: Về Website */}
                    <div>
                        <h5 className="text-lg font-bold text-white mb-6 relative pb-3">
                            Về Website
                            <span className="block w-10 h-1 absolute left-0 bottom-0 rounded-full" style={{ backgroundColor: primaryColorHex }}></span>
                        </h5>

                        <ul className="space-y-3 text-sm">

                            <li><a href="#" className="hover:text-white hover:underline decoration-white underline-offset-2 transition duration-300">Giới thiệu</a></li>
                            <li><a href="#" className="hover:text-white hover:underline decoration-white underline-offset-2 transition duration-300">Chính sách bảo mật</a></li>

                        </ul>
                    </div>

                    {/* Cột 4: Địa Chỉ */}
                    <div>
                        <h5 className="text-lg font-bold text-white mb-6 relative pb-3">
                            Địa Chỉ
                            <span className="block w-10 h-1 absolute left-0 bottom-0 rounded-full" style={{ backgroundColor: primaryColorHex }}></span>
                        </h5>

                        <p className="flex items-start text-sm mb-6 group">
                            <FaMapMarkerAlt className="mt-1 mr-3 flex-shrink-0" style={{ color: primaryColorHex }} />
                            <span className="group-hover:text-white hover:underline decoration-white underline-offset-2 transition duration-300">
                                Tầng 10, Tòa nhà L.H, Quận 1, TP. Hồ Chí Minh, Việt Nam.
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
