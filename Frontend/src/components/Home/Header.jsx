
import React, { useState } from 'react';
import { Menu, X, GraduationCap } from 'lucide-react';
import { Link, useNavigate, useLocation } from "react-router-dom";

export default function Header({ primaryColor = 'text-purple-800', primaryBg = 'bg-purple-600' }) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    // Thay "Blog" bằng "Lộ trình học" (giữ nguyên animation/UI)
    const navItems = [
        { label: "Home", to: "/" },
        { label: "Khóa học", to: "/", target: "khoa-hoc" },
        { label: "Luyện đề", to: "/", target: "luyen-de" },
        { label: "Test đầu vào", to: "/", target: "test-dau-vao" },
        { label: "Lộ trình học", to: "/", target: "lo-trinh" } // <-- changed
    ];

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    const scrollToId = (id) => {
        if (!id) return;
        const el = document.getElementById(id);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    const handleNavClick = (item) => {
        // if nav item points to a section on HomePage
        if (item.target) {
            if (location.pathname === '/') {
                // already on homepage -> scroll immediately
                scrollToId(item.target);
            } else {
                // navigate to homepage and pass state so HomePage will scroll
                navigate('/', { state: { scrollTo: item.target } });
            }
            // close mobile menu if open
            setIsMenuOpen(false);
            return;
        }
        // fallback: regular link
        navigate(item.to);
        setIsMenuOpen(false);
    };

    return (
        <header className="flex justify-between items-center py-4 px-[5%] bg-white shadow-md z-50 relative">
            <div className="max-w-7xl mx-auto w-full flex justify-between items-center">

                {/* Logo */}
                <Link
                    to="/"
                    className={`text-2xl font-extrabold flex items-center gap-2 ${primaryColor} transition-colors duration-200`}
                >
                    <GraduationCap size={28} className="text-purple-700" />
                    2HTD LearningHub
                </Link>

                {/* Desktop Navigation */}
                <nav className="hidden md:flex gap-8 items-center">
                    {navItems.map((item, index) => (
                        <button
                            key={index}
                            onClick={() => handleNavClick(item)}
                            className="text-lg font-medium text-gray-600 hover:text-purple-600 hover:underline underline-offset-4 decoration-purple-600 transition duration-200"
                        >
                            {item.label}
                        </button>
                    ))}
                </nav>

                {/* Desktop Auth Buttons */}
                <div className="hidden md:flex gap-4">
                    <Link
                        to="/auth/login"
                        className="px-5 py-2 rounded-xl font-semibold border-2 border-purple-500 text-purple-500 hover:bg-purple-50 transition duration-200"
                    >
                        Login
                    </Link>
                    <Link
                        to="/auth/register"
                        className={`px-5 py-2 rounded-xl font-semibold ${primaryBg} text-white hover:opacity-90 transition duration-200 shadow-md`}
                    >
                        Register
                    </Link>
                </div>

                {/* Mobile Menu Button */}
                <button
                    className="md:hidden text-gray-600 focus:outline-none"
                    onClick={toggleMenu}
                >
                    {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
                </button>
            </div>

            {/* Mobile Navigation Overlay */}
            {isMenuOpen && (
                <div className="absolute top-full left-0 w-full bg-white shadow-lg flex flex-col p-5 gap-4 md:hidden animate-in slide-in-from-top-5">
                    {navItems.map((item, index) => (
                        <button
                            key={index}
                            onClick={() => handleNavClick(item)}
                            className="block py-2 text-lg font-medium text-gray-700 hover:text-purple-600 hover:bg-purple-50 rounded-lg px-4 transition text-left"
                        >
                            {item.label}
                        </button>
                    ))}

                    <div className="pt-4 space-y-3 border-t border-gray-100">
                        <Link
                            to="/auth/login"
                            onClick={() => setIsMenuOpen(false)}
                            className="block w-full text-center py-2 rounded-xl font-semibold border-2 border-purple-500 text-purple-500 hover:bg-purple-50 transition"
                        >
                            Login
                        </Link>

                        <Link
                            to="/auth/register"
                            onClick={() => setIsMenuOpen(false)}
                            className={`block w-full text-center py-2 rounded-xl font-semibold ${primaryBg} text-white hover:opacity-90 transition`}
                        >
                            Register
                        </Link>
                    </div>
                </div>
            )}
        </header>
    );
}
