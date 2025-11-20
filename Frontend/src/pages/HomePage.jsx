import React from 'react';

export default function HomePage() {
    const primaryColor = 'text-[#5a4d8c]';
    const primaryBg = 'bg-[#8c78ec]';
    const lightestBg = 'bg-[#f8f6fb]';
    const lightBg = 'bg-[#f0eaf9]';

    const courses = [
        { title: "IELTS A-Z (Band 7.0+)", bg: "bg-purple-200", desc: "Khóa học toàn diện giúp bạn chinh phục Band 7.0+ trong kỳ thi IELTS." },
        { title: "English for Work", bg: "bg-blue-200", desc: "Tiếng Anh chuyên ngành và giao tiếp công sở, sẵn sàng cho công việc." },
        { title: "Toeic & Kỹ năng", bg: "bg-green-200", desc: "Ôn luyện Toeic cấp tốc, bổ sung kỹ năng nghe nói phản xạ." }
    ];

    const blogPosts = [
        { title: "Bí quyết đạt Speaking Band 8.0", desc: "Các chiến thuật luyện nói hiệu quả nhất từ chuyên gia." },
        { title: "Tự học từ vựng IELTS 5000", desc: "Danh sách từ vựng quan trọng và cách ghi nhớ lâu dài." },
        { title: "Phân tích cấu trúc đề thi mới", desc: "Cập nhật các thay đổi mới nhất trong cấu trúc bài thi IELTS." }
    ];

    return (
        <div className={`min-h-screen ${lightestBg} font-sans`}>
            {/* -------------------- HERO SECTION -------------------- */}
            <section className={`px-[5%] py-16 sm:py-20 ${lightBg}`}>
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between">
                    <div className="md:w-1/2 text-center md:text-left mb-10 md:mb-0">
                        <h1 className="text-4xl sm:text-4xl md:text-5xl font-extrabold leading-tight mb-4 text-gray-900">
                            Học Tiếng Anh Đột Phá <br className="hidden md:inline" /> Cùng <span className={primaryColor}>2HTD LearningHub</span>
                        </h1>
                        <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto md:mx-0">
                            Thúc đẩy tiếng Anh lên tầm cao mới, trang bị đầy đủ kiến thức luyện đề để ứng tuyển và chinh phục các kỳ thi quốc tế như IELTS.
                        </p>
                        <a href="#"
                            className={`inline-block py-3 px-8 ${primaryBg} text-white text-lg font-bold rounded-xl hover:bg-[#7a6acd] transition duration-300 shadow-lg shadow-indigo-300/50`}
                        >
                            Khám Phá Khóa Học
                        </a>
                    </div>
                    <div className="md:w-5/12 max-w-sm sm:max-w-md mx-auto md:mx-0">
                        <img
                            src="https://img.freepik.com/premium-vector/learn-english-concept_118813-8544.jpg?w=2000"
                            alt="Student illustration with laptop"
                            className="w-full h-auto rounded-2xl shadow-xl"
                        />
                    </div>
                </div>
            </section>

            {/* -------------------- COURSES SECTION -------------------- */}
            <section className="px-[5%] py-16">
                <div className="max-w-7xl mx-auto">
                    <h2 className={`text-3xl font-bold text-gray-800 mb-12 w-fit mx-auto border-b-2 border-purple-200 pb-2`}>
                        Khóa học nổi bật
                    </h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {courses.map((course, index) => (
                            <div
                                key={index}
                                className="p-6 rounded-3xl shadow-xl hover:shadow-2xl transition duration-300 cursor-pointer bg-white border-t-4 border-[#8c78ec] transform hover:-translate-y-1"
                            >
                                <div className={`w-full h-40 rounded-xl ${course.bg} mb-5 flex items-center justify-center`}>
                                    <svg className="w-12 h-12 text-purple-700 opacity-60" fill="currentColor" viewBox="0 0 20 20"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z"></path><path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"></path></svg>
                                </div>
                                <h3 className="font-extrabold text-xl text-gray-800 mb-2">{course.title}</h3>
                                <p className="text-gray-500 text-sm">{course.desc}</p>
                                <button className={`mt-4 w-full py-2 ${primaryBg} text-white font-medium rounded-xl hover:bg-[#7a6acd] transition`}>
                                    Xem chi tiết
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* -------------------- TEST SECTION -------------------- */}
            <section className={`px-[5%] py-16`}>
                <div className="max-w-7xl mx-auto">
                    {/* Tiêu đề đã responsive (w-fit mx-auto) */}
                    <h2 className={`text-3xl font-bold text-gray-800 mb-12 w-fit mx-auto border-b-2 border-purple-200 pb-2`}>
                        Luyện đề & Test đầu vào
                    </h2>
                    {/* Grid: md:grid-cols-2 đã responsive */}
                    <div className="grid md:grid-cols-2 gap-8">
                        <div
                            className="p-8 rounded-2xl shadow-2xl bg-white hover:shadow-purple-300 transition duration-300 border-l-4 border-purple-600 cursor-pointer transform hover:-translate-y-1"
                        >
                            <h3 className="text-2xl font-bold text-gray-700 mb-3 flex items-center">
                                <svg className="w-6 h-6 mr-2 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"></path></svg>
                                Luyện đề Chuyên sâu
                            </h3>
                            <p className="text-gray-500 mt-2 mb-6">Hệ thống câu hỏi luyện tập theo từng chủ đề, có đáp án và giải thích chi tiết, giúp bạn nắm vững kiến thức.</p>
                            <button className={`w-full py-3 ${primaryBg} text-white font-bold rounded-xl hover:bg-[#7a6acd] transition shadow-md`}>
                                Bắt đầu luyện ngay
                            </button>
                        </div>

                        <div
                            className="p-8 rounded-2xl shadow-2xl bg-white hover:shadow-purple-300 transition duration-300 border-l-4 border-blue-600 cursor-pointer transform hover:-translate-y-1"
                        >
                            <h3 className="text-2xl font-bold text-gray-700 mb-3 flex items-center">
                                <svg className="w-6 h-6 mr-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                                Thi thử Đầu vào Miễn phí
                            </h3>
                            <p className="text-gray-500 mt-2 mb-6">Đề thi mô phỏng kỳ thi thật giúp bạn đánh giá chính xác trình độ hiện tại, có kết quả tức thì.</p>
                            <button className="w-full py-3 border-2 border-purple-600 text-purple-600 font-bold rounded-xl hover:bg-purple-50 transition shadow-md">
                                Làm bài test
                            </button>
                        </div>
                    </div>
                </div>
            </section>
           

          {/* -------------------- BLOG SECTION -------------------- */}
            <section className="px-[5%] py-16">
                <div className="max-w-7xl mx-auto">
                    <h2 className={`text-3xl font-bold text-gray-800 mb-12 w-fit mx-auto border-b-2 border-purple-200 pb-2`}>
                        Bài viết mới nhất
                    </h2>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {blogPosts.map((post, i) => (
                            <div
                                key={i}
                                className="p-4 rounded-xl shadow-lg hover:shadow-2xl transition duration-300 bg-white cursor-pointer transform hover:-translate-y-1"
                            >
                                <img
                                    src={`https://placehold.co/400x200/e9d5ff/8B5CF6?text=Blog+Post+${i + 1}`}
                                    alt={`Blog post thumbnail ${i + 1}`}
                                    className="h-40 w-full object-cover rounded-lg mb-4"
                                />
                                <h3 className="font-extrabold text-lg text-gray-800 mb-1 hover:text-purple-600 transition">{post.title}</h3>
                                <p className="text-gray-500 text-sm">{post.desc}</p>
                                <a href="#" className={`text-sm font-semibold ${primaryColor} mt-3 inline-block hover:underline`}>
                                    Đọc thêm &rarr;
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </div>
    );
}