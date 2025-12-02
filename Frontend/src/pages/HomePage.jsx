import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export default function HomePage() {
    const primaryColor = 'text-[#5a4d8c]';
    const primaryBg = 'bg-[#8c78ec]';
    const lightestBg = 'bg-[#f8f6fb]';
    const lightBg = 'bg-[#f0eaf9]';

    const location = useLocation();

    const courses = [
        {
            id: 1,
            title: "IELTS A-Z (Band 7.0+)",
            desc: "Khóa học toàn diện giúp bạn chinh phục Band 7.0+ trong kỳ thi IELTS.",
            image: "https://images.unsplash.com/photo-1488190211105-8b0e65b80b4e?w=500&h=300&fit=crop",
            level: "Intermediate - Advanced",
            duration: "12 tuần",
            students: "2,450+",
            rating: 4.8,
            price: "1,200,000₫",
            features: ["Đề thi chuẩn", "Giáo viên native", "Certificate"]
        },
        {
            id: 2,
            title: "English for Work",
            desc: "Tiếng Anh chuyên ngành và giao tiếp công sở, sẵn sàng cho công việc.",
            image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=500&h=300&fit=crop",
            level: "Beginner - Intermediate",
            duration: "8 tuần",
            students: "1,820+",
            rating: 4.7,
            price: "900,000₫",
            features: ["Kỹ năng CV", "Interview prep", "Networking"]
        },
        {
            id: 3,
            title: "Toeic & Kỹ năng",
            desc: "Ôn luyện Toeic cấp tốc, bổ sung kỹ năng nghe nói phản xạ.",
            image: "https://images.unsplash.com/photo-1516321318423-f06f70674e90?w=500&h=300&fit=crop",
            level: "All Levels",
            duration: "10 tuần",
            students: "1,650+",
            rating: 4.6,
            price: "1,000,000₫",
            features: ["Đề Toeic", "Luyện nghe", "Giải thích chi tiết"]
        }
    ];

    const learningPath = [
        {
            level: "Level 1",
            title: "Beginner → Pre-Intermediate",
            duration: "6 tuần",
            desc: "Xây nền ngữ pháp – từ vựng – phát âm cơ bản.",
            skills: ["Ngữ pháp cơ bản", "Từ vựng 500+", "Phát âm chuẩn"],
            icon: "🌱",
            color: "from-blue-400 to-blue-600"
        },
        {
            level: "Level 2",
            title: "Pre-Intermediate → Intermediate",
            duration: "8 tuần",
            desc: "Giao tiếp tự tin, phản xạ nhanh qua các chủ đề thực tế.",
            skills: ["Giao tiếp hàng ngày", "Nghe hiểu", "Nói tự do"],
            icon: "🚀",
            color: "from-purple-400 to-purple-600"
        },
        {
            level: "Level 3",
            title: "Intermediate → Upper-Intermediate",
            duration: "10 tuần",
            desc: "Phát triển kỹ năng nghe – nói nâng cao, viết luận chuẩn.",
            skills: ["Luận viết", "Nghe chuyên sâu", "Thuyết trình"],
            icon: "📚",
            color: "from-green-400 to-green-600"
        },
        {
            level: "Level 4",
            title: "IELTS Intensive (Band 7.0+)",
            duration: "12 tuần",
            desc: "Luyện đề chuyên sâu, chiến thuật tăng band thần tốc.",
            skills: ["Đề thi chuẩn", "Kỹ thuật làm bài", "Band 7.0+"],
            icon: "🏆",
            color: "from-yellow-400 to-orange-600"
        },
    ];

    // Scroll helper: scroll to element by id with small delay to ensure layout mounted
    const scrollToId = (id) => {
        if (!id) return;
        const el = document.getElementById(id);
        if (el) {
            setTimeout(() => {
                el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                // remove navigation state to avoid repeated auto-scrolls
                try {
                    window.history.replaceState({}, document.title, window.location.pathname + window.location.search + window.location.hash);
                } catch (err) { /* ignore */ }
            }, 80);
        }
    };

    // When navigated from Header with state.scrollTo OR with hash -> scroll to that section
    useEffect(() => {
        const targetFromState = location.state && location.state.scrollTo;
        if (targetFromState) {
            scrollToId(targetFromState);
            return;
        }
        if (location.hash) {
            const hashId = location.hash.replace('#', '');
            scrollToId(hashId);
        }
    }, [location]);

    return (
        <div className={`min-h-screen ${lightestBg} font-sans`}>

            {/* -------------------- HERO -------------------- */}
            <section className={`px-[5%] py-16 sm:py-20 ${lightBg}`}>
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between">
                    
                    <div className="md:w-1/2 text-center md:text-left mb-10 md:mb-0 animate-fadeInUp">
                        <h1 className="text-4xl sm:text-4xl md:text-5xl font-extrabold leading-tight mb-4 text-gray-900">
                            Học Tiếng Anh Đột Phá <br />
                            Cùng <span className={primaryColor}>2HTD LearningHub</span>
                        </h1>
                        <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto md:mx-0">
                            Trang bị kiến thức toàn diện, luyện đề chuẩn quốc tế giúp bạn đạt mục tiêu tiếng Anh nhanh nhất.
                        </p>
                        <a
                            href="#"
                            className={`inline-block py-3 px-8 ${primaryBg} text-white text-lg font-bold rounded-xl hover:bg-[#7a6acd] transition duration-300 shadow-lg shadow-indigo-300/50`}
                        >
                            Khám Phá Khóa Học
                        </a>
                    </div>

                    <div className="md:w-5/12 max-w-sm sm:max-w-md mx-auto md:mx-0 animate-fadeIn">
                        <img
                            src="https://img.freepik.com/premium-vector/learn-english-concept_118813-8544.jpg?w=2000"
                            alt="Student illustration"
                            className="w-full h-auto rounded-2xl shadow-xl"
                        />
                    </div>
                </div>
            </section>

    {/* -------------------- COURSES (UPDATED) -------------------- */}
          <section id="khoa-hoc" className="px-[5%] py-20">
                <div className="max-w-7xl mx-auto">
                    {/* Section Header */}
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Khóa Học Nổi Bật
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Được thiết kế bởi các giáo viên hàng đầu, cung cấp kiến thức thực tiễn và kỹ năng áp dụng ngay
                        </p>
                        <div className="w-20 h-1 bg-gradient-to-r from-[#8c78ec] to-[#5a4d8c] mx-auto mt-4"></div>
                    </div>
                {/* Courses Grid */}

                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {courses.map((course) => (
                            <div
                                key={course.id}
                                className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition duration-300 transform hover:-translate-y-2 group cursor-pointer"
                            >

                                {/* Image Container */}
                                <div className="relative overflow-hidden h-48 bg-gradient-to-br from-[#8c78ec] to-[#5a4d8c]">
                                    <img
                                        src={course.image}
                                        alt={course.title}
                                        className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                                    />
                                    {/* Overlay */}
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition duration-300"></div>
                                    {/* Rating Badge */}
                                    <div className="absolute top-4 right-4 bg-white bg-opacity-90 backdrop-blur px-3 py-1 rounded-full flex items-center gap-1">
                                        <span className="text-yellow-500">⭐</span>
                                        <span className="font-bold text-sm text-gray-800">{course.rating}</span>
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    {/* Level Badge */}
                                    <div className="inline-block bg-[#f0eaf9] text-[#5a4d8c] text-xs font-bold px-3 py-1 rounded-full mb-3">
                                        {course.level}
                                    </div>

                                    {/* Title */}
                                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                                        {course.title}
                                    </h3>

                                    {/* Description */}
                                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                                        {course.desc}
                                    </p>

                                    {/* Stats */}
                                    <div className="flex items-center justify-between text-sm text-gray-600 mb-4 pb-4 border-b border-gray-200">
                                        <div className="flex items-center gap-1">
                                            <span>👥</span>
                                            <span className="font-semibold">{course.students}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span>⏱️</span>
                                            <span className="font-semibold">{course.duration}</span>
                                        </div>
                                    </div>

                                    {/* Features */}
                                    <div className="flex flex-wrap gap-2 mb-5">
                                        {course.features.map((feature, idx) => (
                                            <span key={idx} className="bg-blue-50 text-blue-700 text-xs font-semibold px-2 py-1 rounded">
                                                ✓ {feature}
                                            </span>
                                        ))}
                                    </div>

                                    {/* Price & Button */}
                                    <div className="flex items-center justify-between gap-3">
                                        <div>
                                            <p className="text-xs text-gray-600">Giá khóa học</p>
                                            <p className="text-2xl font-bold text-[#8c78ec]">
                                                {course.price}
                                            </p>
                                        </div>
                                        <button className={`flex-1 py-3 ${primaryBg} text-white font-bold rounded-xl hover:bg-[#7a6acd] transition shadow-md hover:shadow-lg text-center`}>
                                            Xem Chi Tiết
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* View All Courses Button */}
                    <div className="text-center mt-12">
                        <button className="py-3 px-10 border-2 border-[#8c78ec] text-[#8c78ec] font-bold rounded-xl hover:bg-[#f0eaf9] transition">
                            Xem Tất Cả Khóa Học (50+) →
                        </button>
                    </div>
                </div>
            </section>


            {/* -------------------- LUYỆN ĐỀ -------------------- */}
            <section id="luyen-de" className="px-[5%] py-20 bg-white">
                <div className="max-w-7xl mx-auto">
                    {/* Section Header */}
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Luyện Đề Chuyên Sâu
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Bộ đề thi chuẩn quốc tế, được biên soạn bởi các chuyên gia IELTS hàng đầu
                        </p>
                        <div className="w-20 h-1 bg-gradient-to-r from-[#8c78ec] to-[#5a4d8c] mx-auto mt-4"></div>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-8 items-center">
                        {/* Left - Image */}
                        <div className="order-2 lg:order-1">
                            <img
                                src="https://tse3.mm.bing.net/th/id/OIP.C2bnPk2V8GJnfjZTfnMxtAHaFj?pid=ImgDet&w=157.99999999999997&h=135.08999999999997&c=7&dpr=1.5&o=7&rm=3"
                                alt="Practice Illustration"
                                className="w-full rounded-2xl shadow-xl hover:shadow-2xl transition duration-300"
                            />
                        </div>

                        {/* Right - Content */}
                        <div className="order-1 lg:order-2">
                            <h3 className="text-3xl font-bold text-gray-900 mb-6">
                                Bộ đề luyện thi theo từng kỹ năng
                            </h3>

                            {/* Features List */}
                            <div className="space-y-4 mb-8">
                                <div className="flex items-start gap-4 p-4 bg-[#f8f6fb] rounded-xl hover:bg-[#f0eaf9] transition">
                                    <div className="text-2xl mt-1">👂</div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 mb-1">Listening - Nghe chuẩn Cambridge</h4>
                                        <p className="text-gray-600 text-sm">1000+ bài nghe thực chiến, có script và giải thích từng phần</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-4 bg-[#f8f6fb] rounded-xl hover:bg-[#f0eaf9] transition">
                                    <div className="text-2xl mt-1">📖</div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 mb-1">Reading - Theo từng dạng câu hỏi</h4>
                                        <p className="text-gray-600 text-sm">800+ passage với đáp án chi tiết, phân tích sâu chiến lược làm bài</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-4 bg-[#f8f6fb] rounded-xl hover:bg-[#f0eaf9] transition">
                                    <div className="text-2xl mt-1">✍️</div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 mb-1">Writing - Sample & Giải thích chi tiết</h4>
                                        <p className="text-gray-600 text-sm">500+ bài mẫu, band 6-9, có feedback chỉnh sửa từng lỗi</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-4 bg-[#f8f6fb] rounded-xl hover:bg-[#f0eaf9] transition">
                                    <div className="text-2xl mt-1">🎤</div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 mb-1">Speaking - Chủ đề trending & Câu trả lời mẫu</h4>
                                        <p className="text-gray-600 text-sm">600+ topic với câu trả lời hoàn chỉnh, âm thanh chuẩn từ native speakers</p>
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-4 mb-8 p-4 bg-gradient-to-r from-[#8c78ec] to-[#5a4d8c] rounded-xl text-white">
                                <div className="text-center">
                                    <p className="text-3xl font-bold">3000+</p>
                                    <p className="text-sm opacity-90">Đề thi</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-3xl font-bold">100%</p>
                                    <p className="text-sm opacity-90">Chuẩn quốc tế</p>
                                </div>
                                <div className="text-center">
                                    <p className="text-3xl font-bold">24/7</p>
                                    <p className="text-sm opacity-90">Hỗ trợ</p>
                                </div>
                            </div>

                            {/* CTA Button */}
                            <button className={`w-full py-4 ${primaryBg} text-white font-bold text-lg rounded-xl hover:bg-[#7a6acd] transition shadow-lg hover:shadow-xl`}>
                                🚀 Bắt đầu luyện ngay
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* -------------------- TEST ĐẦU VÀO -------------------- */}
            <section id="test-dau-vao" className="px-[5%] py-20 bg-gradient-to-br from-[#f8f6fb] to-[#f0eaf9]">
                <div className="max-w-7xl mx-auto">
                    {/* Section Header */}
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-gray-900 mb-4">
                            Thi Thử Đầu Vào Miễn Phí
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Đánh giá trình độ thực tế, nhận lộ trình học phù hợp trong vòng 25 phút
                        </p>
                        <div className="w-20 h-1 bg-gradient-to-r from-[#8c78ec] to-[#5a4d8c] mx-auto mt-4"></div>
                    </div>

                    <div className="grid lg:grid-cols-2 gap-8 items-center">
                        {/* Left - Content */}
                        <div>
                            <h3 className="text-3xl font-bold text-gray-900 mb-6">
                                Kiểm tra trình độ chỉ trong 25 phút
                            </h3>

                            {/* What You Get */}
                            <div className="mb-8">
                                <h4 className="text-lg font-bold text-gray-900 mb-4">Bạn sẽ nhận được:</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">✓</div>
                                        <span className="text-gray-700 font-semibold">Đề thi mô phỏng chuẩn quốc tế (IDP, BC)</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">✓</div>
                                        <span className="text-gray-700 font-semibold">Kiểm tra 4 kỹ năng chính (L-R-W-S)</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">✓</div>
                                        <span className="text-gray-700 font-semibold">Kết quả chấm tự động có ngay</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">✓</div>
                                        <span className="text-gray-700 font-semibold">Lộ trình học được đề xuất tùy trình độ</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">✓</div>
                                        <span className="text-gray-700 font-semibold">Tư vấn miễn phí từ giáo viên IELTS</span>
                                    </div>
                                </div>
                            </div>

                            {/* Test Details */}
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="p-4 bg-white rounded-xl border-l-4 border-[#8c78ec] shadow-md">
                                    <p className="text-gray-600 text-sm mb-1">Thời gian thi</p>
                                    <p className="text-2xl font-bold text-[#8c78ec]">25 phút</p>
                                </div>
                                <div className="p-4 bg-white rounded-xl border-l-4 border-[#8c78ec] shadow-md">
                                    <p className="text-gray-600 text-sm mb-1">Số câu hỏi</p>
                                    <p className="text-2xl font-bold text-[#8c78ec]">40 câu</p>
                                </div>
                                <div className="p-4 bg-white rounded-xl border-l-4 border-[#8c78ec] shadow-md">
                                    <p className="text-gray-600 text-sm mb-1">Độ khó</p>
                                    <p className="text-2xl font-bold text-[#8c78ec]">Chuẩn IELTS</p>
                                </div>
                                <div className="p-4 bg-white rounded-xl border-l-4 border-[#8c78ec] shadow-md">
                                    <p className="text-gray-600 text-sm mb-1">Giá</p>
                                    <p className="text-2xl font-bold text-green-600">Miễn phí</p>
                                </div>
                            </div>

                            {/* CTA Button */}
                            <button className="w-full py-4 bg-gradient-to-r from-[#8c78ec] to-[#5a4d8c] text-white font-bold text-lg rounded-xl hover:opacity-90 transition shadow-lg hover:shadow-xl">
                                📝 Làm bài test ngay
                            </button>

                            <p className="text-center text-gray-600 text-sm mt-4">
                                Không cần đăng ký, hoàn toàn miễn phí
                            </p>
                        </div>

                        {/* Right - Image */}
                        <div className="order-first lg:order-last">
                            <img
                                src="https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=400&fit=crop"
                                alt="Test Illustration"
                                className="w-full rounded-2xl shadow-xl hover:shadow-2xl transition duration-300"
                            />
                            
                            {/* Success Badge */}
                            <div className="mt-6 p-4 bg-white rounded-xl shadow-lg border-l-4 border-green-500">
                                <div className="flex items-center gap-3">
                                    <div className="text-3xl">✨</div>
                                    <div>
                                        <p className="font-bold text-gray-900">95%+ học viên</p>
                                        <p className="text-sm text-gray-600">đã đạt mục tiêu band</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>


            {/* -------------------- LỘ TRÌNH HỌC (TIMELINE) -------------------- */}
            <section id="lo-trinh" className="px-[5%] py-20 bg-white">
                <div className="max-w-7xl mx-auto">
                    <h2 className="text-3xl font-bold text-gray-800 mb-4 w-fit mx-auto border-b-2 border-purple-200 pb-2">
                        Lộ trình học rõ ràng từng bước
                    </h2>
                    <p className="text-center text-gray-600 mb-16">Từ Beginner đến Band 7.0+ - Hành trình chinh phục tiếng Anh của bạn</p>

                    {/* Timeline Container */}
                    <div className="relative">
                        {/* Vertical Line */}
                        <div className="hidden lg:block absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-blue-400 via-purple-400 to-orange-400"></div>

                        {/* Timeline Items */}
                        <div className="space-y-12 lg:space-y-20">
                            {learningPath.map((step, i) => (
                                <div key={i} className={`flex flex-col lg:flex-row gap-8 items-center ${i % 2 === 0 ? "lg:flex-row-reverse" : ""}`}>
                                    
                                    {/* Content */}
                                    <div className="w-full lg:w-1/2">
                                        <div className={`bg-gradient-to-br ${step.color} p-8 rounded-2xl shadow-xl hover:shadow-2xl transition transform hover:-translate-y-1 cursor-pointer text-white`}>
                                            {/* Level Badge */}
                                            <div className="inline-block bg-white bg-opacity-20 px-4 py-1 rounded-full text-sm font-bold mb-3">
                                                {step.level}
                                            </div>

                                            {/* Icon & Title */}
                                            <div className="flex items-center gap-3 mb-3">
                                                <span className="text-4xl">{step.icon}</span>
                                                <h3 className="text-2xl font-bold">{step.title}</h3>
                                            </div>

                                            {/* Duration */}
                                            <p className="text-sm font-semibold mb-3 opacity-90">⏱️ Thời gian: {step.duration}</p>

                                            {/* Description */}
                                            <p className="mb-4 text-base leading-relaxed">{step.desc}</p>

                                            {/* Skills */}
                                            <div className="flex flex-wrap gap-2">
                                                {step.skills.map((skill, idx) => (
                                                    <span key={idx} className="bg-white bg-opacity-20 px-3 py-1 rounded-full text-sm font-semibold">
                                                        ✓ {skill}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Timeline Circle - Hidden on Mobile */}
                                    <div className="hidden lg:flex w-1/2 justify-center">
                                        <div className={`w-20 h-20 bg-gradient-to-br ${step.color} rounded-full flex items-center justify-center shadow-lg border-4 border-white text-3xl z-10`}>
                                            {step.icon}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* CTA Button */}
                    <div className="mt-16 text-center">
                        <button className={`py-4 px-10 ${primaryBg} text-white text-lg font-bold rounded-xl hover:bg-[#7a6acd] transition shadow-lg`}>
                            Bắt đầu lộ trình học của bạn ngay
                        </button>
                    </div>
                </div>
            </section>

        </div>
    );
}