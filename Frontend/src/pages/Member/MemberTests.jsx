
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ClipboardList, Clock, AlertCircle, CheckCircle,
    Timer, Award, ArrowRight, FileText, Search
} from 'lucide-react';

import { getPublicExams } from '../../services/memberService';
import { getMySubmissions } from '../../services/memberService';

export default function MemberTests() {
    const navigate = useNavigate();

    // Remote exams state
    const [tests, setTests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [filter, setFilter] = useState('all');
    // submissions history
    const [submissions, setSubmissions] = useState([]);
    const [subLoading, setSubLoading] = useState(false);
    const [subError, setSubError] = useState(null);

    useEffect(() => {
        let mounted = true;
        async function load() {
            setLoading(true);
            setError(null);
            try {
                const data = await getPublicExams();
                if (!mounted) return;
                // Map API fields to UI-friendly shape
                const mapped = data.map((it) => ({
                    id: it.id,
                    title: it.title,
                    description: it.description || '',
                    duration: it.duration_minutes ? `${it.duration_minutes} phút` : null,
                    passing_score: it.passing_score ?? null,
                    randomize_questions: !!it.randomize_questions,
                    published: !!it.published,
                    created_at: it.created_at,
                    updated_at: it.updated_at,
                    // UI-only fields
                    status: it.published ? 'available' : 'draft',
                    // unknown fields in public API: questions, score, maxScore
                    questions: null,
                    score: null,
                    maxScore: null,
                }));
                setTests(mapped);
            } catch (err) {
                setError(err.message || String(err));
            } finally {
                setLoading(false);
            }
        }
            // load submissions history in parallel
            (async function loadSubs() {
                setSubLoading(true);
                setSubError(null);
                try {
                    const data = await getMySubmissions();
                    if (!mounted) return;
                    setSubmissions(data);
                } catch (err) {
                    if (!mounted) return;
                    setSubError(err.message || String(err));
                } finally {
                    if (mounted) setSubLoading(false);
                }
            })();
        load();
        return () => { mounted = false; };
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'available': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
            case 'draft': return 'bg-yellow-50 text-yellow-700 border-yellow-100';
            default: return 'bg-gray-50 text-gray-500';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'available': return 'Đã xuất bản';
            case 'draft': return 'Bản nháp';
            default: return '';
        }
    };

    // Build lookup of submissions by examId
    const submissionsByExam = (submissions || []).reduce((acc, s) => {
        if (!s || !s.examId) return acc;
        if (!acc[s.examId]) acc[s.examId] = [];
        acc[s.examId].push(s);
        return acc;
    }, {});

    let filteredTests = tests;
    if (filter === 'unattempted') {
        filteredTests = tests.filter(t => !submissionsByExam[t.id]);
    } else if (filter === 'all') {
        filteredTests = tests;
    } else {
        // for 'history' and 'scored' we won't show tests grid
        filteredTests = [];
    }

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
                            <div className="text-2xl font-bold text-[#5a4d8c]">0</div>
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
                        { key: 'history', label: 'Lịch sử' },
                        { key: 'unattempted', label: 'Bài chưa làm' },
                        { key: 'scored', label: 'Đã có điểm' }
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
            {loading && <div className="text-center py-8">Đang tải danh sách bài kiểm tra...</div>}
            {error && <div className="text-center py-8 text-red-500">Lỗi tải: {error}</div>}
            {filter !== 'history' && filter !== 'scored' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTests.map((test) => (
                    <div
                        key={test.id}
                        className="group bg-gradient-to-br from-[#fbf7ff] to-[#f6eefc] rounded-3xl p-6 border border-purple-100 shadow-sm hover:shadow-xl hover:shadow-purple-100/50 transition-all duration-300 flex flex-col relative"
                    >
                        {/* Status Badge */}
                        <div className="flex justify-between items-start mb-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${test.status === 'available' ? 'bg-indigo-100 text-indigo-600' : 'bg-yellow-100 text-yellow-700'}`}>
                                {test.status === 'available' ? <ClipboardList size={24} /> : <Award size={24} />}
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusColor(test.status)}`}>
                                {getStatusLabel(test.status)}
                            </span>
                        </div>

                        {/* Content */}
                        <h3 className="text-lg font-bold text-gray-800 mb-1 group-hover:text-[#8c78ec] transition-colors">
                            {test.title}
                        </h3>
                        {test.description && <p className="text-sm text-gray-500 mb-4 line-clamp-3">{test.description}</p>}

                        {/* Info Rows */}
                        <div className="space-y-3 mb-6">
                            <div className="flex items-center text-sm text-gray-600 gap-3">
                                <Clock size={16} className="text-gray-400" />
                                <span>Thời gian: <span className="font-semibold">{test.duration}</span></span>
                            </div>
                            {test.duration && (
                                <div className="flex items-center text-sm text-gray-600 gap-3">
                                    <Clock size={16} className="text-gray-400" />
                                    <span>Thời gian: <span className="font-semibold">{test.duration}</span></span>
                                </div>
                            )}

                            {test.questions !== null && (
                                <div className="flex items-center text-sm text-gray-600 gap-3">
                                    <FileText size={16} className="text-gray-400" />
                                    <span>Số câu hỏi: <span className="font-semibold">{test.questions} câu</span></span>
                                </div>
                            )}

                            {test.passing_score !== null && (
                                <div className="flex items-center text-sm text-gray-600 gap-3">
                                    <AlertCircle size={16} className="text-gray-400" />
                                    <span>Điểm đạt: <span className="font-semibold">{test.passing_score}%</span></span>
                                </div>
                            )}
                        </div>

                        {/* Footer Action */}
                        <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between">
                            {test.status === 'available' && test.score ? (
                                <div className="flex flex-col">
                                    <span className="text-xs text-gray-400 font-medium uppercase">Điểm số</span>
                                    <span className="text-2xl font-extrabold text-emerald-600">
                                        {test.score}<span className="text-sm text-gray-400 font-normal">/{test.maxScore}</span>
                                    </span>
                                </div>
                            ) : (
                                <div className="text-xs text-gray-400">{test.status === 'available' ? 'Sẵn sàng' : 'Không công khai'}</div>
                            )}

                            <button
                                onClick={() => navigate(`/member/test/${test.id}`)}
                                disabled={test.status !== 'available'}
                                className={`px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${test.status === 'completed'
                                        ? 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        : test.status === 'available'
                                            ? 'bg-[#8c78ec] text-white hover:bg-[#7a66d3] shadow-lg shadow-indigo-200 hover:-translate-y-1'
                                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                {'Làm bài'}
                                {test.status === 'available' && <ArrowRight size={16} />}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            )}

            {/* 4. SUBMISSIONS HISTORY (shows when filter is all/history/scored) */}
            {(filter === 'history' || filter === 'scored' || filter === 'all') && (
                <div className="mt-8">
                    <h2 className="text-xl font-bold mb-4">Lịch sử bài làm</h2>
                    {subLoading && <div className="text-sm text-gray-500">Đang tải lịch sử...</div>}
                    {subError && <div className="text-sm text-red-500">Lỗi tải lịch sử: {subError}</div>}

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(() => {
                            const list = filter === 'scored' ? submissions.filter(s => s.submittedAt) : submissions;
                            if (!list || list.length === 0) return <div className="text-sm text-gray-500">Không có lịch sử phù hợp.</div>;
                            return list.map((s) => (
                                <div key={s.submissionId} className="bg-gradient-to-br from-[#fbf7ff] to-[#f6eefc] p-4 rounded-xl border border-purple-100 shadow-sm">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="text-sm text-gray-500">{s.examTitle}</div>
                                            <div className="font-bold">{s.totalScore ?? '-'} điểm</div>
                                        </div>
                                        <div className="text-xs text-gray-400">{s.status}</div>
                                    </div>
                                    <div className="text-xs text-gray-500 mb-3">
                                        <div>Bắt đầu: {s.startedAt ? new Date(s.startedAt).toLocaleString() : '-'}</div>
                                        <div>Nộp: {s.submittedAt ? new Date(s.submittedAt).toLocaleString() : '-'}</div>
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        {s.status === 'in_progress' ? (
                                            <button onClick={() => navigate(`/member/test/${s.examId}?submissionId=${s.submissionId}`)} className="px-3 py-2 bg-[#8c78ec] text-white rounded-lg">Tiếp tục</button>
                                        ) : (
                                            <button onClick={() => navigate(`/member/submission/${s.submissionId}`)} className="px-3 py-2 border rounded-lg">Xem kết quả</button>
                                        )}
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>
                </div>
            )}

            {/* Empty State (only for test grid views) */}
            {filter !== 'history' && filter !== 'scored' && filteredTests.length === 0 && (
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