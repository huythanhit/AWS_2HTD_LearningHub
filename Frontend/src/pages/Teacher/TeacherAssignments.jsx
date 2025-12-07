import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { 
    FileText, Plus, Trash, Save, CheckCircle, 
    Clock, AlertCircle, X, Search, MoreVertical,
    Calendar, Users, ChevronRight, LayoutList, PenTool
} from 'lucide-react';
import { 
    getExams, createExam, updateExam, createQuestion, 
    getExamQuestions, createExamQuestion, updateExamQuestion, deleteExamQuestion,
    publishExam, deleteExam, getTeacherCourses
} from '../../services/teacherService';

export default function TeacherAssignments() {
    // --- STATE & DATA ---
    const [view, setView] = useState('list'); // 'list' | 'create' | 'edit'
    const [editingExamId, setEditingExamId] = useState(null); // ID của đề thi đang edit
    const [filterClass, setFilterClass] = useState('All');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [openMenuId, setOpenMenuId] = useState(null); // ID của card đang mở menu

    // Dữ liệu Lớp học từ API
    const [classes, setClasses] = useState([]);

    // Dữ liệu Bài tập từ API
    const [assignments, setAssignments] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');

    // Format ngày tháng đẹp
    const formatDate = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date.toLocaleDateString('vi-VN', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Load classes từ API
    useEffect(() => {
        const fetchClasses = async () => {
            try {
                const coursesData = await getTeacherCourses();
                const mappedClasses = (Array.isArray(coursesData) ? coursesData : []).map((course) => ({
                    id: course.courseId,
                    name: course.title || course.name
                }));
                setClasses(mappedClasses);
            } catch (error) {
                console.error('Error fetching classes:', error);
            }
        };
        fetchClasses();
    }, []);

    // Fetch dữ liệu đề thi từ API
    useEffect(() => {
        const fetchExams = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await getExams();
                
                // API trả về mảng trực tiếp trong result.data
                const examsArray = Array.isArray(response) ? response : [];
                
                // Map dữ liệu từ API sang format của component
                const mappedAssignments = examsArray.map((exam) => ({
                    id: exam.id,
                    title: exam.title,
                    classId: exam.course_id || null,
                    className: exam.course_id ? 'Đã giao lớp' : 'Chưa giao (Ngân hàng đề)',
                    duration: exam.duration_minutes || 0,
                    questionsCount: 0, // API không có thông tin số câu hỏi, sẽ cập nhật sau
                    status: exam.published ? 'Active' : 'Draft',
                    published: exam.published || false,
                    dueDate: null,
                    description: exam.description || '',
                    passingScore: exam.passing_score || 0,
                    randomizeQuestions: exam.randomize_questions || false,
                    createdAt: exam.created_at,
                    updatedAt: exam.updated_at
                }));
                
                setAssignments(mappedAssignments);
            } catch (err) {
                setError(err.message || 'Không thể tải danh sách đề thi');
                console.error('Error fetching exams:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchExams();
    }, []);

    // State cho Form tạo mới
    const [newExam, setNewExam] = useState({
        title: '',
        description: '',
        duration: 45,
        passingScore: 70,
        randomizeQuestions: false,
        classId: '', // Lớp được gán
        dueDate: '',
        questions: [
            { id: 1, text: '', options: ['', '', '', ''], correct: 0 }
        ]
    });

    // --- LOGIC HANDLERS ---

    const handleCreateClick = () => {
        setEditingExamId(null);
        setNewExam({
            title: '',
            description: '',
            duration: 45,
            passingScore: 70,
            randomizeQuestions: false,
            classId: '',
            dueDate: '',
            questions: [{ id: 1, text: '', options: ['', '', '', ''], correct: 0 }]
        });
        setView('create');
    };

    const handleEditClick = async (exam) => {
        setEditingExamId(exam.id);
        setNewExam({
            title: exam.title || '',
            description: exam.description || '',
            duration: exam.duration || 45,
            passingScore: exam.passingScore || 70,
            randomizeQuestions: exam.randomizeQuestions || false,
            classId: exam.classId || '',
            dueDate: exam.dueDate || '',
            questions: [] // Sẽ load từ API
        });
        setView('edit');

        // Load câu hỏi từ API
        try {
            const questionsData = await getExamQuestions(exam.id);
            const mappedQuestions = questionsData.map((q, index) => ({
                id: q.questionId,
                examQuestionId: q.examQuestionId,
                text: q.body || '',
                options: q.choices ? q.choices.map(choice => choice.text || '') : ['', '', '', ''],
                correct: q.choices ? q.choices.findIndex(choice => choice.isCorrect === true) : 0
            }));
            
            // Nếu không có câu hỏi, thêm một câu hỏi trống
            if (mappedQuestions.length === 0) {
                mappedQuestions.push({ id: Date.now(), text: '', options: ['', '', '', ''], correct: 0 });
            }
            
            setNewExam(prev => ({
                ...prev,
                questions: mappedQuestions
            }));
        } catch (error) {
            console.error('Error loading questions:', error);
            // Nếu lỗi, vẫn hiển thị form với câu hỏi trống
            setNewExam(prev => ({
                ...prev,
                questions: [{ id: Date.now(), text: '', options: ['', '', '', ''], correct: 0 }]
            }));
        }
    };

    const handleAddQuestion = () => {
        setNewExam(prev => ({
            ...prev,
            questions: [...prev.questions, { 
                id: prev.questions.length + 1, 
                text: '', 
                options: ['', '', '', ''], 
                correct: 0 
            }]
        }));
    };

    const handleQuestionChange = (index, field, value) => {
        const updatedQuestions = [...newExam.questions];
        updatedQuestions[index][field] = value;
        setNewExam({ ...newExam, questions: updatedQuestions });
    };

    const handleOptionChange = (qIndex, oIndex, value) => {
        const updatedQuestions = [...newExam.questions];
        updatedQuestions[qIndex].options[oIndex] = value;
        setNewExam({ ...newExam, questions: updatedQuestions });
    };

    const handleRemoveQuestion = async (index) => {
        if (newExam.questions.length === 1) return;
        
        const question = newExam.questions[index];
        
        // Nếu câu hỏi đã có trong database (có examQuestionId), xóa từ API
        if (editingExamId && question.examQuestionId && question.id) {
            try {
                await deleteExamQuestion(editingExamId, question.id);
            } catch (error) {
                console.error('Error deleting question:', error);
                toast.error('Không thể xóa câu hỏi: ' + (error.message || 'Lỗi không xác định'));
                return; // Không xóa khỏi UI nếu API lỗi
            }
        }
        
        // Xóa khỏi UI
        const updated = newExam.questions.filter((_, i) => i !== index);
        setNewExam({ ...newExam, questions: updated });
    };

    const handleSaveExam = async () => {
        if (!newExam.title) {
            toast.warning("Vui lòng nhập tên đề thi!");
            return;
        }
        
        try {
            // Tạo payload cho API
            // Luôn gửi courseId là null (theo yêu cầu backend)
            const examPayload = {
                courseId: null,
                title: newExam.title,
                description: newExam.description || '',
                durationMinutes: newExam.duration,
                passingScore: newExam.passingScore || 70,
                randomizeQuestions: newExam.randomizeQuestions || false
            };

            let updatedExam;
            const selectedClass = classes.find(c => c.id === newExam.classId);

            // Nếu đang edit, gọi API PUT
            if (editingExamId) {
                updatedExam = await updateExam(editingExamId, examPayload);
            } else {
                // Nếu đang tạo mới, gọi API POST
                updatedExam = await createExam(examPayload);
            }
            
            // Map dữ liệu từ API response để cập nhật UI
            const examData = {
                id: updatedExam.id || editingExamId || Date.now(),
                title: updatedExam.title || newExam.title,
                classId: updatedExam.course_id || newExam.classId || null,
                className: selectedClass ? selectedClass.name : 'Chưa giao (Ngân hàng đề)',
                duration: updatedExam.duration_minutes || newExam.duration,
                questionsCount: newExam.questions.length,
                status: updatedExam.published ? 'Active' : 'Draft',
                published: updatedExam.published || false,
                dueDate: newExam.dueDate || null,
                description: updatedExam.description || newExam.description,
                passingScore: updatedExam.passing_score || newExam.passingScore,
                randomizeQuestions: updatedExam.randomize_questions || newExam.randomizeQuestions,
                createdAt: updatedExam.created_at,
                updatedAt: updatedExam.updated_at
            };

            // Cập nhật UI
            if (editingExamId) {
                // Cập nhật đề thi đã có
                setAssignments(prevAssignments => 
                    prevAssignments.map(item => 
                        item.id === editingExamId ? examData : item
                    )
                );
            } else {
                // Thêm đề thi mới
                setAssignments([examData, ...assignments]);
            }

            // Lấy examId từ response (nếu tạo mới) hoặc từ editingExamId (nếu chỉnh sửa)
            const examIdToUse = updatedExam.id || editingExamId;

            // Xử lý câu hỏi: phân biệt câu hỏi mới và câu hỏi đã có
            if (examIdToUse) {
                for (const q of newExam.questions) {
                    // Bỏ qua câu hỏi trống
                    if (!q.text || q.text.trim() === '') continue;
                    
                    // Lọc đáp án hợp lệ
                    const validOptions = q.options.filter(opt => opt && opt.trim() !== '');
                    if (validOptions.length < 2) continue; // Cần ít nhất 2 đáp án
                    
                    const payload = {
                        title: `Câu hỏi: ${q.text}`,
                        body: q.text,
                        type: "multiple_choice",
                        difficulty: 2,
                        tags: ["exam", "teacher_created"],
                        choices: validOptions.map((opt, oIndex) => ({
                            text: opt,
                            value: String.fromCharCode(65 + oIndex), // A, B, C, D...
                            isCorrect: q.correct === oIndex,
                        })),
                    };

                    // Nếu câu hỏi đã có (có examQuestionId và questionId), cập nhật
                    if (editingExamId && q.examQuestionId && q.id) {
                        try {
                            await updateExamQuestion(examIdToUse, q.id, payload);
                        } catch (error) {
                            console.error('Error updating question:', error);
                            // Tiếp tục với các câu hỏi khác
                        }
                    } else {
                        // Câu hỏi mới, tạo mới
                        try {
                            await createExamQuestion(examIdToUse, payload);
                        } catch (error) {
                            console.error('Error creating question:', error);
                            // Tiếp tục với các câu hỏi khác
                        }
                    }
                }
            }

            toast.success(editingExamId ? "Cập nhật đề thi thành công!" : "Lưu đề thi thành công!");
            setView('list');
            setEditingExamId(null);
        } catch (error) {
            console.error("Error when saving exam/questions:", error);
            toast.error(error.message || "Có lỗi xảy ra khi lưu đề thi / câu hỏi");
        }
    };

    // Handler để publish/unpublish đề thi
    const handlePublishExam = async (examId, currentStatus) => {
        try {
            const newPublishedStatus = currentStatus === 'Draft' ? true : false;
            
            // Gọi API publish/unpublish
            const updatedExam = await publishExam(examId, newPublishedStatus);
            
            // Cập nhật state
            setAssignments(prevAssignments => 
                prevAssignments.map(item => 
                    item.id === examId 
                        ? {
                            ...item,
                            status: newPublishedStatus ? 'Active' : 'Draft',
                            published: newPublishedStatus
                          }
                        : item
                )
            );
            
            toast.success(newPublishedStatus 
                ? "Đã giao đề thi thành công!" 
                : "Đã hủy giao đề thi thành công!"
            );
        } catch (error) {
            console.error("Error when publishing exam:", error);
            toast.error(error.message || "Có lỗi xảy ra khi thay đổi trạng thái đề thi");
        }
    };

    // Handler để xóa đề thi
    const handleDeleteExam = async (examId) => {
        if (!window.confirm("Bạn có chắc chắn muốn xóa đề thi này? Hành động này không thể hoàn tác.")) {
            return;
        }

        try {
            await deleteExam(examId);
            
            // Xóa đề thi khỏi state
            setAssignments(prevAssignments => 
                prevAssignments.filter(item => item.id !== examId)
            );
            
            toast.success("Xóa đề thi thành công!");
        } catch (error) {
            console.error("Error when deleting exam:", error);
            toast.error(error.message || "Có lỗi xảy ra khi xóa đề thi");
        }
    };

    // --- RENDER HELPERS ---
    const getStatusStyle = (status) => {
        switch(status) {
            case 'Active': return 'bg-green-100 text-green-700 border-green-200';
            case 'Draft': return 'bg-gray-100 text-gray-600 border-gray-200';
            case 'Ended': return 'bg-red-100 text-red-600 border-red-200';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    // --- VIEW: CREATE/EDIT (BUILDER) ---
    if (view === 'create' || view === 'edit') {
        const isEditing = view === 'edit';
        return (
            <div className="min-h-screen bg-gray-50 p-6 font-sans animate-fade-in-up">
                {/* Header Builder */}
                <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-3">
                        <button 
                            onClick={() => {
                                setView('list');
                                setEditingExamId(null);
                            }} 
                            className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition"
                        >
                            <X size={24} />
                        </button>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">
                                {isEditing ? 'Chỉnh sửa đề thi' : 'Trình soạn thảo đề thi'}
                            </h2>
                            <p className="text-sm text-gray-500">
                                {isEditing ? 'Cập nhật thông tin đề thi' : 'Tạo câu hỏi và giao bài cho lớp học'}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button 
                            onClick={() => {
                                setView('list');
                                setEditingExamId(null);
                            }}
                            className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition"
                        >
                            Hủy
                        </button>
                        <button 
                            onClick={handleSaveExam}
                            className="px-6 py-2 bg-[#5a4d8c] text-white font-medium rounded-lg shadow-md hover:bg-[#483d73] transition flex items-center gap-2"
                        >
                            <Save size={18} /> {isEditing ? 'Lưu thay đổi' : 'Hoàn tất & Giao bài'}
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* LEFT COLUMN: Cấu hình chung */}
                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-6">
                            <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <LayoutList size={20} className="text-[#5a4d8c]" /> Thông tin chung
                            </h3>
                            
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Tên đề thi <span className="text-red-500">*</span></label>
                                    <input 
                                        type="text" 
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#5a4d8c] outline-none transition"
                                        placeholder="VD: Kiểm tra giữa kỳ..."
                                        value={newExam.title}
                                        onChange={(e) => setNewExam({...newExam, title: e.target.value})}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Mô tả đề thi</label>
                                    <textarea 
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#5a4d8c] outline-none transition resize-none"
                                        placeholder="Nhập mô tả về đề thi..."
                                        rows="3"
                                        value={newExam.description}
                                        onChange={(e) => setNewExam({...newExam, description: e.target.value})}
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Giao cho lớp (Publish)</label>
                                    <select 
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#5a4d8c] outline-none transition bg-white"
                                        value={newExam.classId}
                                        onChange={(e) => setNewExam({...newExam, classId: e.target.value})}
                                    >
                                        <option value="">-- Chỉ lưu kho (Không giao ngay) --</option>
                                        {classes.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-gray-400 mt-1">Chọn lớp để đề thi được hiển thị ngay cho học viên.</p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Thời gian (phút)</label>
                                        <div className="relative">
                                            <Clock size={16} className="absolute left-3 top-3 text-gray-400" />
                                            <input 
                                                type="number" 
                                                min="1"
                                                className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#5a4d8c] outline-none transition"
                                                value={newExam.duration}
                                                onChange={(e) => setNewExam({...newExam, duration: Number(e.target.value)})}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-1">Điểm đạt (%)</label>
                                        <input 
                                            type="number" 
                                            min="0"
                                            max="100"
                                            className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#5a4d8c] outline-none transition"
                                            value={newExam.passingScore}
                                            onChange={(e) => setNewExam({...newExam, passingScore: Number(e.target.value)})}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Hạn nộp</label>
                                    <input 
                                        type="date" 
                                        className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-[#5a4d8c] outline-none transition"
                                        value={newExam.dueDate}
                                        onChange={(e) => setNewExam({...newExam, dueDate: e.target.value})}
                                    />
                                </div>

                                <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-lg border border-purple-100">
                                    <input 
                                        type="checkbox" 
                                        id="randomizeQuestions"
                                        className="w-5 h-5 text-[#5a4d8c] border-gray-300 rounded focus:ring-[#5a4d8c] cursor-pointer"
                                        checked={newExam.randomizeQuestions}
                                        onChange={(e) => setNewExam({...newExam, randomizeQuestions: e.target.checked})}
                                    />
                                    <label htmlFor="randomizeQuestions" className="flex-1 cursor-pointer">
                                        <span className="text-sm font-semibold text-gray-700 block">Xáo trộn câu hỏi</span>
                                        <span className="text-xs text-gray-500">Khi bật, thứ tự câu hỏi sẽ được xáo trộn ngẫu nhiên cho mỗi học viên</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: Question Builder */}
                    <div className="lg:col-span-2 space-y-6">
                        {newExam.questions.map((q, qIndex) => (
                            <div key={q.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative group transition hover:shadow-md">
                                <div className="flex justify-between items-start mb-4">
                                    <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-md text-xs font-bold">Câu hỏi {qIndex + 1}</span>
                                    <button 
                                        onClick={() => handleRemoveQuestion(qIndex)}
                                        className="text-gray-400 hover:text-red-500 transition p-1"
                                    >
                                        <Trash size={18} />
                                    </button>
                                </div>

                                {/* Nội dung câu hỏi */}
                                <div className="mb-4">
                                    <input 
                                        type="text" 
                                        className="w-full text-lg font-medium border-b border-gray-200 pb-2 focus:border-[#5a4d8c] outline-none transition placeholder-gray-300"
                                        placeholder="Nhập nội dung câu hỏi tại đây..."
                                        value={q.text}
                                        onChange={(e) => handleQuestionChange(qIndex, 'text', e.target.value)}
                                    />
                                </div>

                                {/* Các đáp án */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {q.options.map((opt, oIndex) => (
                                        <div key={oIndex} className={`flex items-center gap-3 p-3 rounded-lg border ${q.correct === oIndex ? 'border-green-200 bg-green-50' : 'border-gray-100 bg-white'}`}>
                                            <input 
                                                type="radio" 
                                                name={`question-${q.id}`} 
                                                className="w-4 h-4 text-green-600 focus:ring-green-500 cursor-pointer"
                                                checked={q.correct === oIndex}
                                                onChange={() => handleQuestionChange(qIndex, 'correct', oIndex)}
                                            />
                                            <input 
                                                type="text" 
                                                className="flex-1 bg-transparent outline-none text-sm"
                                                placeholder={`Đáp án ${String.fromCharCode(65 + oIndex)}`}
                                                value={opt}
                                                onChange={(e) => handleOptionChange(qIndex, oIndex, e.target.value)}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        <button 
                            onClick={handleAddQuestion}
                            className="w-full py-4 border-2 border-dashed border-gray-300 rounded-2xl text-gray-500 font-medium hover:border-[#5a4d8c] hover:text-[#5a4d8c] hover:bg-purple-50 transition flex flex-col items-center gap-2"
                        >
                            <Plus size={24} />
                            <span>Thêm câu hỏi mới</span>
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // --- VIEW: LIST (DEFAULT) ---
    return (
        <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Ngân hàng Đề thi & Bài tập</h2>
                    <p className="text-gray-500">Quản lý, soạn thảo và giao bài tập cho các lớp.</p>
                </div>
                <button 
                    onClick={handleCreateClick}
                    className="bg-[#5a4d8c] text-white px-5 py-2.5 rounded-xl font-medium shadow-md shadow-purple-100 hover:bg-[#483d73] transition flex items-center gap-2"
                >
                    <Plus size={20} /> Tạo đề thi mới
                </button>
            </div>

            {/* Filters & Search */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm đề thi theo tên hoặc mô tả..." 
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 outline-none focus:border-[#5a4d8c] focus:ring-2 focus:ring-purple-100 transition"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-500 whitespace-nowrap">Lọc theo lớp:</span>
                    <select 
                        className="px-3 py-2 rounded-lg border border-gray-200 outline-none focus:border-[#5a4d8c] focus:ring-2 focus:ring-purple-100 text-sm transition"
                        value={filterClass}
                        onChange={(e) => setFilterClass(e.target.value)}
                    >
                        <option value="All">Tất cả các lớp</option>
                        {classes.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#5a4d8c] mb-4"></div>
                        <p className="text-gray-500">Đang tải danh sách đề thi...</p>
                    </div>
                </div>
            )}

            {/* Error State */}
            {error && !loading && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
                    <AlertCircle className="text-red-500" size={24} />
                    <div>
                        <p className="text-red-700 font-semibold">Lỗi khi tải dữ liệu</p>
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                </div>
            )}

            {/* Assignments Grid */}
            {!loading && !error && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {assignments
                    .filter(a => {
                        const matchesSearch = !searchQuery || 
                            a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (a.description && a.description.toLowerCase().includes(searchQuery.toLowerCase()));
                        const matchesClass = filterClass === 'All' || a.classId === filterClass;
                        return matchesSearch && matchesClass;
                    })
                    .map((item) => (
                    <div 
                        key={item.id} 
                        onClick={() => handleEditClick(item)}
                        className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl hover:border-[#5a4d8c]/20 transition-all duration-300 flex flex-col h-full group cursor-pointer"
                    >
                        
                        {/* Card Header */}
                        <div className="flex justify-between items-start mb-4">
                            <div className="p-3 bg-gradient-to-br from-indigo-50 to-purple-50 text-[#5a4d8c] rounded-xl group-hover:scale-110 transition-transform duration-300">
                                <FileText size={24} />
                            </div>
                            <div className="flex items-center gap-2">
                                <div className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(item.status)} shadow-sm`}>
                                    {item.status === 'Active' ? 'Đang mở' : 'Bản nháp'}
                                </div>
                                <div className="relative">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setOpenMenuId(openMenuId === item.id ? null : item.id);
                                        }}
                                        className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        <MoreVertical size={18} className="text-gray-500" />
                                    </button>
                                    
                                    {/* Dropdown Menu */}
                                    {openMenuId === item.id && (
                                        <>
                                            <div 
                                                className="fixed inset-0 z-10" 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setOpenMenuId(null);
                                                }}
                                            ></div>
                                            <div className="absolute right-0 top-8 z-20 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[160px]">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenMenuId(null);
                                                        handleEditClick(item);
                                                    }}
                                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 transition-colors flex items-center gap-2"
                                                >
                                                    <PenTool size={16} className="text-gray-500" />
                                                    Chỉnh sửa
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setOpenMenuId(null);
                                                        handleDeleteExam(item.id);
                                                    }}
                                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                                                >
                                                    <Trash size={16} />
                                                    Xóa
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                            <h3 className="font-bold text-gray-800 text-lg mb-2 line-clamp-2 group-hover:text-[#5a4d8c] transition-colors duration-200">
                                {item.title}
                            </h3>
                            
                            {item.description && (
                                <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                                    {item.description}
                                </p>
                            )}
                            
                            <div className="space-y-2.5 text-sm text-gray-600 mb-4">
                                <div className="flex items-center gap-2">
                                    <Users size={16} className="text-gray-400 flex-shrink-0" />
                                    <span className="truncate">{item.className}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock size={16} className="text-gray-400 flex-shrink-0" />
                                    <span className="font-medium">{item.duration} phút</span>
                                    {item.questionsCount > 0 && (
                                        <span className="text-gray-400">• {item.questionsCount} câu hỏi</span>
                                    )}
                                </div>
                                {item.passingScore > 0 && (
                                    <div className="flex items-center gap-2">
                                        <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
                                        <span className="text-gray-600">Điểm đạt: <span className="font-semibold text-green-600">{item.passingScore}%</span></span>
                                    </div>
                                )}
                                {item.randomizeQuestions && (
                                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium">
                                        <span>🔀</span>
                                        <span>Xáo trộn câu hỏi</span>
                                    </div>
                                )}
                                {item.createdAt && (
                                    <div className="flex items-center gap-2 text-xs text-gray-400 pt-1">
                                        <Calendar size={14} />
                                        <span>Tạo: {formatDate(item.createdAt)}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="pt-4 mt-auto border-t border-gray-100">
                            {item.status === 'Draft' ? (
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handlePublishExam(item.id, item.status);
                                    }}
                                    className="w-full py-2.5 bg-[#5a4d8c] text-white font-medium rounded-lg hover:bg-[#483d73] transition-all duration-200 text-sm shadow-sm hover:shadow-md"
                                >
                                    Giao bài
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            // TODO: Implement view results functionality
                                        }}
                                        className="flex-1 py-2.5 bg-gradient-to-r from-gray-50 to-gray-100 text-gray-700 font-medium rounded-lg hover:from-gray-100 hover:to-gray-200 transition-all duration-200 text-sm flex justify-center items-center gap-2 shadow-sm hover:shadow-md"
                                    >
                                        Xem kết quả <ChevronRight size={16} />
                                    </button>
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (window.confirm("Bạn có chắc muốn hủy giao đề thi này?")) {
                                                handlePublishExam(item.id, item.status);
                                            }
                                        }}
                                        className="flex-1 py-2.5 border-2 border-orange-300 text-orange-600 font-medium rounded-lg hover:bg-orange-50 transition-all duration-200 text-sm hover:shadow-md"
                                    >
                                        Hủy giao bài
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}

                {/* Card Tạo nhanh (Add new placeholder) */}
                <button 
                    onClick={handleCreateClick}
                    className="rounded-2xl border-2 border-dashed border-gray-200 p-5 flex flex-col items-center justify-center text-gray-400 hover:border-[#5a4d8c] hover:text-[#5a4d8c] hover:bg-purple-50/50 transition duration-300 min-h-[250px]"
                >
                    <div className="p-4 bg-gray-50 rounded-full mb-3 group-hover:bg-white transition">
                        <PenTool size={32} />
                    </div>
                    <span className="font-semibold">Soạn đề thi mới</span>
                </button>
            </div>
            )}

            {/* Empty State */}
            {!loading && !error && assignments.length === 0 && (
                <div className="text-center py-16">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-gray-100 rounded-full mb-6">
                        <FileText className="text-gray-400" size={48} />
                    </div>
                    <p className="text-gray-600 text-xl font-semibold mb-2">Chưa có đề thi nào</p>
                    <p className="text-gray-400 text-sm mb-8">Hãy tạo đề thi mới để bắt đầu quản lý bài kiểm tra</p>
                    <button 
                        onClick={handleCreateClick}
                        className="bg-[#5a4d8c] text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-purple-200 hover:bg-[#483d73] hover:shadow-xl transition-all duration-200 flex items-center gap-2 mx-auto"
                    >
                        <Plus size={20} /> Tạo đề thi mới
                    </button>
                </div>
            )}

            {/* No Results State */}
            {!loading && !error && assignments.length > 0 && assignments.filter(a => {
                const matchesSearch = !searchQuery || 
                    a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (a.description && a.description.toLowerCase().includes(searchQuery.toLowerCase()));
                const matchesClass = filterClass === 'All' || a.classId === filterClass;
                return matchesSearch && matchesClass;
            }).length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                    <Search className="mx-auto text-gray-300 mb-4" size={48} />
                    <p className="text-gray-600 text-lg font-semibold mb-2">Không tìm thấy đề thi</p>
                    <p className="text-gray-400 text-sm">Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc</p>
                </div>
            )}
        </div>
    );
}

