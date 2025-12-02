
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ClipboardList, Clock, AlertCircle, CheckCircle,
    Timer, Award, ArrowRight, FileText, Search
} from 'lucide-react';

export default function MemberTests() {
    const navigate = useNavigate();

    // Dữ liệu giả định
    const [tests] = useState([
        {
            id: 1,
            title: "Kiểm tra giữa kỳ: Reading & Listening",
            subject: "IELTS Foundation",
            duration: "60 phút",
            questions: 40,
            deadline: "2024-03-20",
            status: "completed",
            score: 8.5,
            maxScore: 9.0,
            submittedDate: "2024-03-15"
        },
        {
            id: 2,
            title: "Unit 3: Grammar & Vocabulary",
            subject: "English for Work",
            duration: "45 phút",
            questions: 30,
            deadline: "2024-03-25",
            status: "pending", // Chưa làm
            score: null,
            maxScore: 100,
            submittedDate: null
        },
        {
            id: 3,
            title: "Bài thi thử TOEIC Full Test",
            subject: "TOEIC Intensive",
            duration: "120 phút",
            questions: 200,
            deadline: "2024-03-10",
            status: "overdue", // Quá hạn
            score: null,
            maxScore: 990,
            submittedDate: null
        }
    ]);

    const [filter, setFilter] = useState('all');

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
            case 'pending': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
            case 'overdue': return 'bg-red-50 text-red-500 border-red-100';
            default: return 'bg-gray-50 text-gray-500';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'completed': return 'Đã hoàn thành';
            case 'pending': return 'Chưa làm bài';
            case 'overdue': return 'Quá hạn';
            default: return '';
        }
    };

    const filteredTests = filter === 'all' ? tests : tests.filter(t => t.status === filter);

    return (
        <div className="w-full space-y-8 pb-10">
            {/* 1. HEADER - Style đồng bộ */}
            <div className="relative overflow-hidden bg-gradient-to-r from-indigo-50/90 to-purple-50/90 backdrop-blur-xl p-8 rounded-3xl border border-white/60 shadow-sm">
                {/* Decor */}
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-200/30 rounded-full blur-[60px]"></div>

                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h1 className="text-3xl font-extrabold text-[#5a4d8c] mb-2">Bài kiểm tra & Đánh giá</h1>
                        <p className="text-gray-600">Theo dõi điểm số và hoàn thành các bài kiểm tra định kỳ.</p>
                    </div>

                    {/* Stats Box */}
                    <div className="flex gap-4 bg-white/60 backdrop-blur-md p-3 rounded-2xl border border-white/50 shadow-sm">
                        <div className="text-center px-2">
                            <div className="text-2xl font-bold text-[#5a4d8c]">8.5</div>
                            <div className="text-[10px] uppercase text-gray-500 font-bold">Điểm TB</div>
                        </div>
                        <div className="w-px bg-gray-200"></div>
                        <div className="text-center px-2">
                            <div className="text-2xl font-bold text-emerald-600">{tests.filter(t => t.status === 'completed').length}</div>
                            <div className="text-[10px] uppercase text-gray-500 font-bold">Đã làm</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. FILTERS */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 flex gap-1">
                    {[
                        { key: 'all', label: 'Tất cả' },
                        { key: 'pending', label: 'Sắp tới' },
                        { key: 'completed', label: 'Đã có điểm' },
                        { key: 'overdue', label: 'Quá hạn' }
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setFilter(tab.key)}
                            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ${filter === tab.key
                                    ? "bg-[#8c78ec] text-white shadow-md shadow-purple-200"
                                    : "text-gray-500 hover:bg-gray-50 hover:text-[#5a4d8c]"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* 3. TEST GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTests.map((test) => (
                    <div
                        key={test.id}
                        className="group bg-white rounded-3xl p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 transition-all duration-300 flex flex-col relative"
                    >
                        {/* Status Badge */}
                        <div className="flex justify-between items-start mb-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${test.status === 'completed' ? 'bg-emerald-100 text-emerald-600' :
                                    test.status === 'overdue' ? 'bg-red-100 text-red-500' : 'bg-indigo-100 text-indigo-600'
                                }`}>
                                {test.status === 'completed' ? <Award size={24} /> : <ClipboardList size={24} />}
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(test.status)}`}>
                                {getStatusLabel(test.status)}
                            </span>
                        </div>

                        {/* Content */}
                        <h3 className="text-lg font-bold text-gray-800 mb-1 group-hover:text-[#8c78ec] transition-colors">
                            {test.title}
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">{test.subject}</p>

                        {/* Info Rows */}
                        <div className="space-y-3 mb-6">
                            <div className="flex items-center text-sm text-gray-600 gap-3">
                                <Clock size={16} className="text-gray-400" />
                                <span>Thời gian: <span className="font-semibold">{test.duration}</span></span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600 gap-3">
                                <FileText size={16} className="text-gray-400" />
                                <span>Số câu hỏi: <span className="font-semibold">{test.questions} câu</span></span>
                            </div>
                            <div className="flex items-center text-sm text-gray-600 gap-3">
                                <AlertCircle size={16} className="text-gray-400" />
                                <span>Hạn chót: <span className="font-semibold">{test.deadline}</span></span>
                            </div>
                        </div>

                        {/* Footer Action */}
                        <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                            {test.status === 'completed' ? (
                                <div className="flex flex-col">
                                    <span className="text-xs text-gray-400 font-medium uppercase">Điểm số</span>
                                    <span className="text-2xl font-extrabold text-emerald-600">
                                        {test.score}<span className="text-sm text-gray-400 font-normal">/{test.maxScore}</span>
                                    </span>
                                </div>
                            ) : (
                                <div className="text-xs text-gray-400">
                                    {test.status === 'overdue' ? 'Đã đóng' : 'Chưa bắt đầu'}
                                </div>
                            )}

                            <button
                                onClick={() => navigate(`/member/test/${test.id}`)}
                                disabled={test.status === 'overdue'}
                                className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${test.status === 'completed'
                                        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        : test.status === 'overdue'
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-[#8c78ec] text-white hover:bg-[#7a66d3] shadow-lg shadow-indigo-200 hover:-translate-y-1'
                                    }`}
                            >
                                {test.status === 'completed' ? 'Xem lại' : 'Làm bài'}
                                {test.status !== 'overdue' && <ArrowRight size={16} />}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {filteredTests.length === 0 && (
                <div className="text-center py-16">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                        <ClipboardList size={32} />
                    </div>
                    <h3 className="text-gray-500 font-medium">Không tìm thấy bài kiểm tra nào</h3>
                </div>
            )}
        </div>
    );
}