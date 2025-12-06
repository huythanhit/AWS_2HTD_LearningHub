import React, { useState, useEffect } from "react";
import {
  Search, Plus, LayoutGrid, List, X, Edit, Filter,
  BookOpen, Video, FileText, Clock, Calendar, CheckCircle, Save,
  Trash2 
} from "lucide-react";

import {
  getAdminCourses,
  createCourse,
  deleteCourse,
  assignTeacherToCourse,
  removeTeacherFromCourse,
  getAdminUsers,
  getCourseTeachers,
  updateCourse,
  getTeacherCourseLectures,
  updateCourseLecture,
  deleteCourseLecture 
} from "../../services/adminService";
import { courseValidationSchema, validateSchema } from "../../validation/adminValidators";

export default function AdminCourses() {
  // --- STATE ---
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modals State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Lecture Modal State
  const [isLecturesModalOpen, setIsLecturesModalOpen] = useState(false);
  const [courseLectures, setCourseLectures] = useState([]);
  const [lecturesLoading, setLecturesLoading] = useState(false);
  const [viewingContext, setViewingContext] = useState(null); // { teacherName, courseTitle, courseId }
const [lectureSearchTerm, setLectureSearchTerm] = useState(""); // [MỚI] Tìm kiếm bài giảng
  const [lectureStatusFilter, setLectureStatusFilter] = useState("all");

  // Edit Lecture Modal State
  const [isEditLectureModalOpen, setIsEditLectureModalOpen] = useState(false);
  const [editingLecture, setEditingLecture] = useState(null);

  const [assignCourseId, setAssignCourseId] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState("");

  const [newCourse, setNewCourse] = useState({ title: "", slug: "", shortDescription: "", description: "", published: false });
  const [newCourseErrors, setNewCourseErrors] = useState({});
  const [editingCourseErrors, setEditingCourseErrors] = useState({});

  // try to map backend validation errors into field -> message object
  const extractFieldErrorsFromApi = (err) => {
    const out = {};
    const data = err?.response?.data || err?.response || null;
    if (!data) return out;

    // If API returns structured errors
    if (data.errors && typeof data.errors === 'object') {
      Object.entries(data.errors).forEach(([k, v]) => {
        if (Array.isArray(v)) out[k] = v.join(' ');
        else out[k] = String(v);
      });
      return out;
    }

    // If message contains field names, map them heuristically
    const msg = (data.message || data.msg || data.error || '').toString();
    if (!msg) return out;
    const lower = msg.toLowerCase();
    if (lower.includes('slug')) out.slug = msg;
    if (lower.includes('title') || lower.includes('tên') || lower.includes('name')) out.title = msg;
    // fallback: if message mentions both fields explicitly like "slug và title"
    if (lower.includes('slug') && (lower.includes('title') || lower.includes('tên'))) {
      out.slug = msg; out.title = msg;
    }
    return out;
  };
  const [editingCourse, setEditingCourse] = useState(null);
  const [editingOriginal, setEditingOriginal] = useState(null);

  // --- HELPERS ---
  const formatDuration = (seconds) => {
    if (!seconds && seconds !== 0) return "00:00";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // --- FETCH DATA ---
  const fetchTeachers = async () => {
    try {
      const res = await getAdminUsers(1, 200);
      setTeachers((res.users || []).filter(u => (u.role_name || "").toLowerCase() === "teacher"));
    } catch (err) { console.error(err); }
  };

  const loadCourses = async () => {
    setLoading(true);
    try {
      const coursesData = await getAdminCourses();
      const merged = await Promise.all(coursesData.map(async (c) => {
        if (Array.isArray(c.teachers) && c.teachers.length > 0) return c;
        try { const t = await getCourseTeachers(c.courseId); return { ...c, teachers: Array.isArray(t) ? t : [] }; }
        catch { return { ...c, teachers: [] }; }
      }));
      setCourses(merged);
    } catch (err) { setCourses([]); } finally { setLoading(false); }
  };

  useEffect(() => { loadCourses(); fetchTeachers(); }, []);

  // open create modal helper: reset form and errors
  const openCreateModalCourse = () => {
    setNewCourse({ title: "", slug: "", shortDescription: "", description: "", published: false });
    setNewCourseErrors({});
    setIsCreateModalOpen(true);
  };

  // --- HANDLERS ---
  const handleViewLectures = async (courseId, teacherId, teacherName, courseTitle) => {
    setViewingContext({ teacherName, courseTitle, courseId });
    setLectureSearchTerm("");
    setLectureStatusFilter("all");
    setIsLecturesModalOpen(true);
    setLecturesLoading(true);
    setCourseLectures([]);

    try {
      const data = await getTeacherCourseLectures(teacherId, courseId);
      const sortedLectures = (data.lectures || []).sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
      setCourseLectures(sortedLectures);
    } catch (err) { window.showGlobalPopup ? window.showGlobalPopup({ type: 'error', message: 'Không thể tải danh sách bài giảng.' }) : alert('Không thể tải danh sách bài giảng.'); } finally { setLecturesLoading(false); }
  };

  // Open Edit Lecture Modal
  const openEditLectureModal = (lecture) => {
    setEditingLecture({
      lectureId: lecture.lectureId,
      courseId: viewingContext?.courseId, // Lấy courseId từ context đang xem
      title: lecture.title,
      contentType: lecture.contentType,
      s3Key: lecture.s3Key,
      durationSeconds: lecture.durationSeconds,
      orderIndex: lecture.orderIndex,
      published: lecture.published
    });
    setIsEditLectureModalOpen(true);
  };

  // Update Lecture
  const handleUpdateLecture = async () => {
    if (!editingLecture.title || !editingLecture.lectureId) {
      if (window.showGlobalPopup) window.showGlobalPopup({ type: 'error', message: 'Thiếu thông tin.' }); else alert('Thiếu thông tin.');
      return;
    }
    try {
      const res = await updateCourseLecture(editingLecture.courseId, editingLecture.lectureId, editingLecture);
      const updatedLecture = res.lecture;
      // Cập nhật state local
      setCourseLectures(prev => prev.map(l => l.lectureId === updatedLecture.lectureId ? updatedLecture : l).sort((a, b) => a.orderIndex - b.orderIndex));
      setIsEditLectureModalOpen(false); setEditingLecture(null);
      if (window.showGlobalPopup) window.showGlobalPopup({ type: 'success', message: 'Cập nhật bài giảng thành công!' }); else alert('Cập nhật bài giảng thành công!');
    } catch (err) { alert("Lỗi cập nhật: " + err.message); }
  };

  // [MỚI] Delete Lecture Logic
  const handleDeleteLecture = async (lectureId) => {
    const ok = window.showGlobalConfirm ? await window.showGlobalConfirm("Bạn có chắc chắn muốn xóa bài giảng này không? Hành động này không thể hoàn tác.") : confirm("Bạn có chắc chắn muốn xóa bài giảng này không? Hành động này không thể hoàn tác.");
    if (!ok) return;

    const currentCourseId = viewingContext?.courseId;
    if (!currentCourseId) { alert("Lỗi: Không tìm thấy Course ID"); return; }

    try {
      await deleteCourseLecture(currentCourseId, lectureId);

      // Xóa khỏi danh sách đang hiển thị ngay lập tức
      setCourseLectures(prev => prev.filter(l => l.lectureId !== lectureId));
      if (window.showGlobalPopup) window.showGlobalPopup({ type: 'success', message: 'Đã xóa bài giảng thành công!' }); else alert('Đã xóa bài giảng thành công!');
    } catch (err) {
      console.error(err);
      if (window.showGlobalPopup) window.showGlobalPopup({ type: 'error', message: 'Không thể xóa bài giảng. Vui lòng thử lại.' }); else alert('Không thể xóa bài giảng. Vui lòng thử lại.');
    }
  };


  // ... (Giữ nguyên CRUD Course handlers) ...
  const handleCreateCourse = async () => {
    // run validation
    const errors = await validateSchema(courseValidationSchema, newCourse);
    if (Object.keys(errors).length) {
      setNewCourseErrors(errors);
      return;
    }
    setNewCourseErrors({});

    try {
      const created = await createCourse(newCourse);

      // created lúc này là object "course" từ API
      // Thêm vào đầu danh sách và giữ nguyên các trường mặc định (như teachers = [])
      setCourses([ { ...created, teachers: [] }, ...courses]);

      setIsCreateModalOpen(false);

      // Reset form về rỗng
      setNewCourse({ title: "", slug: "", shortDescription: "", description: "", published: false });
      if (window.showGlobalPopup) window.showGlobalPopup({ type: 'success', message: 'Tạo khóa học thành công!' }); else alert('Tạo khóa học thành công!');
    } catch (err) {
      console.error(err);
      const fieldErrors = extractFieldErrorsFromApi(err);
      if (Object.keys(fieldErrors).length) {
        // show inline errors in create modal
        setNewCourseErrors(fieldErrors);
        return;
      }
      const msg = err.response?.data?.message || err.message || 'Lỗi tạo khóa học';
      if (window.showGlobalPopup) window.showGlobalPopup({ type: 'error', message: 'Lỗi tạo khóa học: ' + msg }); else alert('Lỗi tạo khóa học: ' + msg);
    }
  };
  const handleDeleteCourse = async (courseId) => {
    // 1. Hộp thoại xác nhận (Confirm Dialog)
    const isConfirmed = window.showGlobalConfirm ? await window.showGlobalConfirm(
      "⚠️ CẢNH BÁO: Bạn có chắc chắn muốn xóa khóa học này không?\n\nHành động này sẽ xóa vĩnh viễn khóa học và các dữ liệu liên quan. Bạn không thể hoàn tác."
    ) : window.confirm(
      "⚠️ CẢNH BÁO: Bạn có chắc chắn muốn xóa khóa học này không?\n\nHành động này sẽ xóa vĩnh viễn khóa học và các dữ liệu liên quan. Bạn không thể hoàn tác."
    );

    // Nếu người dùng bấm "Cancel" -> Dừng lại
    if (!isConfirmed) return;

    try {
      // 2. Gọi API xóa
      await deleteCourse(courseId);

      // 3. Cập nhật danh sách hiển thị (loại bỏ khóa học vừa xóa)
      setCourses((prevCourses) => prevCourses.filter((c) => c.courseId !== courseId));

      // 4. Thông báo thành công
      if (window.showGlobalPopup) window.showGlobalPopup({ type: 'success', message: 'Đã xóa khóa học thành công!' }); else alert('Đã xóa khóa học thành công!');
    } catch (err) {
      console.error("DELETE COURSE ERROR:", err);
      // Hiển thị lỗi từ backend nếu có message, hoặc lỗi chung
      const msg = err.response?.data?.message || err.message || 'Vui lòng thử lại sau.';
      if (window.showGlobalPopup) window.showGlobalPopup({ type: 'error', message: 'Xóa thất bại: ' + msg }); else alert('Xóa thất bại: ' + msg);
    }
  };
  const handleAssignTeacher = async () => {
    if (!selectedTeacher || !assignCourseId) return;
    // Validate: if course already has a teacher, show validation and do not assign
    const course = courses.find(c => c.courseId === assignCourseId);
    if (course && Array.isArray(course.teachers) && course.teachers.length > 0) {
      if (window.showGlobalPopup) window.showGlobalPopup({ type: 'error', message: 'Lớp học đã có giảng viên.' }); else alert('Lớp học đã có giảng viên.');
      return;
    }

    try {
      await assignTeacherToCourse(assignCourseId, selectedTeacher);
      await loadCourses();
      setIsAssignModalOpen(false);
      setSelectedTeacher("");
      setAssignCourseId(null);
      if (window.showGlobalPopup) window.showGlobalPopup({ type: 'success', message: 'Gán giảng viên thành công' }); else alert('Gán giảng viên thành công');
    } catch (err) {
      console.error('ASSIGN TEACHER ERROR', err);
      const msg = err.response?.data?.message || err.message || 'Vui lòng thử lại.';
      if (window.showGlobalPopup) window.showGlobalPopup({ type: 'error', message: 'Gán thất bại: ' + msg }); else alert('Gán thất bại: ' + msg);
    }
  };

  const handleRemoveTeacher = async (cid, tid) => {
    const ok = window.showGlobalConfirm
      ? await window.showGlobalConfirm('Bạn có chắc chắn muốn gỡ giảng viên khỏi khóa học này? Hành động này sẽ gỡ liên kết giữa GV và khóa học.')
      : confirm('Bạn có chắc chắn muốn gỡ giảng viên khỏi khóa học này?');
    if (!ok) return;

    try {
      await removeTeacherFromCourse(cid, tid);
      await loadCourses();
      if (window.showGlobalPopup) window.showGlobalPopup({ type: 'success', message: 'Gỡ giảng viên thành công!' }); else alert('Gỡ giảng viên thành công!');
    } catch (err) {
      console.error('REMOVE TEACHER ERROR', err);
      const msg = err.response?.data?.message || err.message || 'Vui lòng thử lại.';
      if (window.showGlobalPopup) window.showGlobalPopup({ type: 'error', message: 'Gỡ thất bại: ' + msg }); else alert('Gỡ thất bại: ' + msg);
    }
  };
  const openEditModal = (c) => { setEditingOriginal(c); setEditingCourse({ ...c }); setIsEditModalOpen(true); };
  // clear edit form errors when opening edit modal
  const openEditModalWithClear = (c) => { setEditingOriginal(c); setEditingCourse({ ...c }); setEditingCourseErrors({}); setIsEditModalOpen(true); };
  const handleUpdateCourse = async () => {
    if (!editingCourse || !editingCourse.courseId) return;

    // validate editingCourse before submitting
    const errors = await validateSchema(courseValidationSchema, editingCourse);
    if (Object.keys(errors).length) {
      setEditingCourseErrors(errors);
      return;
    }
    setEditingCourseErrors({});

    try {
      // Gọi service cập nhật
      const updatedCourse = await updateCourse(editingCourse.courseId, editingCourse);

      // Cập nhật lại danh sách courses ở client (Không cần gọi API loadCourses lại)
      setCourses((prevCourses) =>
        prevCourses.map((c) => {
          if (c.courseId === updatedCourse.courseId) {
            // Giữ lại thông tin teachers cũ vì API update course thường không trả về teachers
            return { ...updatedCourse, teachers: c.teachers || [] };
          }
          return c;
        })
      );

      setIsEditModalOpen(false);
      if (window.showGlobalPopup) window.showGlobalPopup({ type: 'success', message: 'Cập nhật khóa học thành công!' }); else alert('Cập nhật khóa học thành công!');
    } catch (err) {
      console.error(err);
      const fieldErrors = extractFieldErrorsFromApi(err);
      if (Object.keys(fieldErrors).length) {
        setEditingCourseErrors(fieldErrors);
        return;
      }
      if (window.showGlobalPopup) window.showGlobalPopup({ type: 'error', message: 'Lỗi cập nhật: ' + err.message }); else alert('Lỗi cập nhật: ' + err.message);
    }
  };

  // Filter
  const filteredCourses = courses.filter((course) => {
    const s = (searchTerm || "").toLowerCase();
    const match = (course.title || "").toLowerCase().includes(s);
    if (statusFilter === "published") return match && course.published;
    if (statusFilter === "draft") return match && !course.published;
    return match;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans animate-fade-in-up">
      {/* Header, Toolbar, Views (Giữ nguyên UI) */}
      <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
        <div><h1 className="text-2xl font-bold text-gray-800">Quản lý Khóa học</h1><p className="text-gray-500 text-sm">Quản lý danh sách khóa học hệ thống.</p></div>
        <button onClick={openCreateModalCourse} className="flex items-center gap-2 px-5 py-2.5 bg-[#5a4d8c] text-white font-medium rounded-xl hover:bg-[#483d73] shadow-lg"><Plus size={20} /> Tạo khóa học</button>
      </div>
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col lg:flex-row gap-4 justify-between items-center">
        <div className="relative flex-1 w-full lg:w-auto"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} /><input type="text" placeholder="Tìm tên khóa học..." className="w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm focus:outline-none focus:border-[#5a4d8c]" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
        <div className="flex gap-2 w-full lg:w-auto">
          <div className="relative w-full"><Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} /><select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full pl-9 pr-4 py-2.5 rounded-lg border text-sm appearance-none cursor-pointer"><option value="all">Tất cả</option><option value="published">Published</option><option value="draft">Draft</option></select></div>
          <div className="flex bg-gray-100 p-1 rounded-lg shrink-0"><button onClick={() => setViewMode("grid")} className={`p-2 rounded ${viewMode === "grid" ? "bg-white text-[#5a4d8c] shadow" : "text-gray-500"}`}><LayoutGrid size={20} /></button><button onClick={() => setViewMode("table")} className={`p-2 rounded ${viewMode === "table" ? "bg-white text-[#5a4d8c] shadow" : "text-gray-500"}`}><List size={20} /></button></div>
        </div>
      </div>

      {/* Grid View */}
      {!loading && viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {filteredCourses.map(c => (
            <div key={c.courseId} className="bg-white rounded-2xl border shadow-sm hover:shadow-lg transition flex flex-col h-full overflow-hidden">
              <div className={`h-32 p-4 flex justify-between text-white ${c.published ? "bg-gradient-to-r from-purple-500 to-indigo-600" : "bg-gradient-to-r from-gray-500 to-gray-600"}`}>
                <span className="font-bold truncate pr-2">{c.slug}</span>
                <span className={`text-xs px-2 py-1 rounded h-fit ${c.published ? "bg-white/20" : "bg-yellow-500"}`}>{c.published ? "Published" : "Draft"}</span>
              </div>
              <div className="p-4 flex flex-col flex-1">
                <h3 className="font-bold text-gray-800 mb-1">{c.title}</h3>
                <p className="text-sm text-gray-500 mb-3 line-clamp-2 flex-1">{c.shortDescription}</p>
                {c.teachers?.length > 0 ? (
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mb-3">
                    <div className="flex justify-between mb-2"><span className="text-xs font-bold text-gray-700">GV: {c.teachers[0].fullName}</span><button onClick={() => handleRemoveTeacher(c.courseId, c.teachers[0].teacherId)} className="text-xs text-red-500 font-bold">X</button></div>
                    <button onClick={() => handleViewLectures(c.courseId, c.teachers[0].teacherId, c.teachers[0].fullName, c.title)} className="w-full flex justify-center items-center gap-1 py-1.5 text-xs font-medium text-[#5a4d8c] bg-white border border-[#5a4d8c]/30 rounded hover:bg-[#5a4d8c] hover:text-white transition"><BookOpen size={14} /> Xem bài giảng</button>
                  </div>
                ) : <div className="text-center text-xs text-gray-400 bg-gray-50 p-2 rounded mb-3">- Chưa gán GV -</div>}
                <div className="grid grid-cols-3 gap-2 mt-auto text-xs font-medium">
                    <button onClick={() => openEditModalWithClear(c)} className="py-2 bg-green-50 text-green-700 rounded hover:bg-green-100">Sửa</button>
                  <button onClick={() => handleDeleteCourse(c.courseId)} className="py-2 bg-red-50 text-red-700 rounded hover:bg-red-100">Xóa</button>
                  <button onClick={() => { setAssignCourseId(c.courseId); setIsAssignModalOpen(true) }} className="py-2 bg-blue-50 text-blue-700 rounded hover:bg-blue-100">Gán GV</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {/* Table View */}
      {!loading && viewMode === "table" && (
        <div className="bg-white rounded-2xl shadow border overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-left text-sm text-gray-700"><thead className="bg-gray-50 text-gray-500 uppercase font-semibold text-xs"><tr><th className="p-4">Khóa học</th><th className="p-4">Trạng thái</th><th className="p-4">Giảng viên</th><th className="p-4 text-center">Hành động</th></tr></thead><tbody className="divide-y">{filteredCourses.map(c => (<tr key={c.courseId} className="hover:bg-gray-50"><td className="p-4 font-bold text-gray-800"><div>{c.title}</div><div className="text-xs text-gray-400 font-normal">{c.slug}</div></td><td className="p-4">{c.published ? <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">Published</span> : <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded text-xs">Draft</span>}</td><td className="p-4">{c.teachers?.length > 0 ? (<div className="flex flex-col gap-1 items-start"><div className="flex items-center gap-2"><span className="font-medium text-xs">{c.teachers[0].fullName}</span><button onClick={() => handleRemoveTeacher(c.courseId, c.teachers[0].teacherId)} className="text-red-500 text-xs font-bold">X</button></div><button onClick={() => handleViewLectures(c.courseId, c.teachers[0].teacherId, c.teachers[0].fullName, c.title)} className="text-[#5a4d8c] text-xs flex items-center gap-1 hover:underline"><BookOpen size={12} /> Chi tiết bài giảng</button></div>) : <span className="text-gray-400 italic text-xs">- Chưa gán -</span>}</td><td className="p-4 text-center"><div className="flex justify-center gap-2"><button onClick={() => handleDeleteCourse(c.courseId)} className="px-2 py-1 bg-red-50 text-red-600 rounded text-xs">Xóa</button><button onClick={() => openEditModal(c)} className="px-2 py-1 bg-green-50 text-green-600 rounded text-xs">Sửa</button><button onClick={() => { setAssignCourseId(c.courseId); setIsAssignModalOpen(true) }} className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs">Gán</button></div></td></tr>))}</tbody></table></div></div>
      )}

      {/* --- CÁC MODAL COURSE (Giữ nguyên) --- */}
     {/* --- MODAL CREATE --- */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] animate-fade-in-up">
             
             {/* Header */}
             <div className="px-6 py-4 border-b flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-800">Tạo khóa học mới</h3>
                <button onClick={() => setIsCreateModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
             </div>

             {/* Body - Có thanh cuộn */}
             <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
                 
                 {/* Title */}
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên khóa học</label>
                    <input 
                        className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-[#5a4d8c]/50 outline-none" 
                        placeholder="Nhập tên khóa học..." 
                        value={newCourse.title} 
                        onChange={e => { setNewCourse({...newCourse, title: e.target.value}); setNewCourseErrors(prev=>({...prev, title: undefined})); }} 
                    />
                    {newCourseErrors.title && <p className="text-xs text-red-500 mt-1">{newCourseErrors.title}</p>}
                 </div>

                 {/* Slug */}
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Slug (Đường dẫn - tùy chọn)</label>
                    <input 
                        className="w-full border border-gray-300 p-2.5 rounded-lg bg-gray-50 text-sm" 
                        placeholder="tu-dong-tao-neu-de-trong" 
                        value={newCourse.slug} 
                        onChange={e => { setNewCourse({...newCourse, slug: e.target.value}); setNewCourseErrors(prev=>({...prev, slug: undefined})); }} 
                    />
                    {newCourseErrors.slug && <p className="text-xs text-red-500 mt-1">{newCourseErrors.slug}</p>}
                 </div>

                 {/* Short Description */}
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mô tả ngắn</label>
                    <textarea 
                        className="w-full border border-gray-300 p-2.5 rounded-lg h-20 text-sm focus:ring-2 focus:ring-[#5a4d8c]/50 outline-none" 
                        placeholder="Giới thiệu sơ lược về khóa học..." 
                        value={newCourse.shortDescription} 
                        onChange={e => { setNewCourse({...newCourse, shortDescription: e.target.value}); setNewCourseErrors(prev=>({...prev, shortDescription: undefined})); }} 
                    />
                    {newCourseErrors.shortDescription && <p className="text-xs text-red-500 mt-1">{newCourseErrors.shortDescription}</p>}
                 </div>

                 {/* Full Description */}
                 <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mô tả chi tiết</label>
                    <textarea 
                        className="w-full border border-gray-300 p-2.5 rounded-lg h-28 text-sm focus:ring-2 focus:ring-[#5a4d8c]/50 outline-none" 
                        placeholder="Nội dung chi tiết..." 
                        value={newCourse.description} 
                        onChange={e => { setNewCourse({...newCourse, description: e.target.value}); setNewCourseErrors(prev=>({...prev, description: undefined})); }} 
                    />
                    {newCourseErrors.description && <p className="text-xs text-red-500 mt-1">{newCourseErrors.description}</p>}
                 </div>
                 {/* [MỚI] Published Checkbox */}
                 <div className="pt-2">
                    <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition">
                      <input 
                        type="checkbox" 
                        className="w-5 h-5 text-[#5a4d8c] rounded focus:ring-[#5a4d8c]" 
                        checked={newCourse.published} 
                        onChange={e => setNewCourse({...newCourse, published: e.target.checked})}
                      />
                      <div className="flex flex-col">
                        <span className="font-bold text-sm text-gray-700">Công khai (Published)</span>
                        <span className="text-xs text-gray-500">Hiển thị khóa học ngay sau khi tạo</span>
                      </div>
                    </label>
                 </div>

             </div>

             {/* Footer */}
             <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3 rounded-b-xl">
                <button onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 font-medium text-gray-700">Hủy</button>
                <button onClick={handleCreateCourse} className="px-4 py-2 bg-[#5a4d8c] text-white rounded-lg hover:bg-[#483d73] font-medium shadow-lg shadow-indigo-200">Tạo mới</button>
             </div>
          </div>
        </div>
      )}
      {isAssignModalOpen && (<div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50"><div className="bg-white p-6 rounded-lg w-[400px] space-y-3"><h3>Gán GV</h3><select className="w-full border p-2" value={selectedTeacher} onChange={e => setSelectedTeacher(e.target.value)}><option value="">--Chọn GV--</option>{teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}</select><div className="flex justify-end gap-2"><button onClick={() => setIsAssignModalOpen(false)}>Hủy</button><button onClick={handleAssignTeacher} className="bg-blue-600 text-white px-3 py-1 rounded">Lưu</button></div></div></div>)}
     {/* --- MODAL EDIT COURSE --- */}
      {isEditModalOpen && editingCourse && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh] animate-fade-in-up">
            
            {/* Header Modal */}
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-800">Cập nhật khóa học</h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>

            {/* Body Modal - Có scroll nếu dài */}
            <div className="p-6 space-y-4 overflow-y-auto custom-scrollbar">
              
              {/* Tên khóa học */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên khóa học</label>
                <input 
                  className="w-full border border-gray-300 p-2.5 rounded-lg focus:ring-2 focus:ring-[#5a4d8c]/50 outline-none" 
                  value={editingCourse.title} 
                  onChange={e => { setEditingCourse({...editingCourse, title: e.target.value}); setEditingCourseErrors(prev=>({...prev, title: undefined})); }}
                />
                {editingCourseErrors.title && <p className="text-xs text-red-500 mt-1">{editingCourseErrors.title}</p>}
              </div>

              {/* Slug */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Slug (Đường dẫn)</label>
                <input 
                  className="w-full border border-gray-300 p-2.5 rounded-lg bg-gray-50 text-sm" 
                  value={editingCourse.slug} 
                  onChange={e => { setEditingCourse({...editingCourse, slug: e.target.value}); setEditingCourseErrors(prev=>({...prev, slug: undefined})); }}
                />
                {editingCourseErrors.slug && <p className="text-xs text-red-500 mt-1">{editingCourseErrors.slug}</p>}
              </div>

              {/* Mô tả ngắn */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mô tả ngắn</label>
                <textarea 
                  className="w-full border border-gray-300 p-2.5 rounded-lg h-20 text-sm focus:ring-2 focus:ring-[#5a4d8c]/50 outline-none" 
                  value={editingCourse.shortDescription || ""} 
                  onChange={e => { setEditingCourse({...editingCourse, shortDescription: e.target.value}); setEditingCourseErrors(prev=>({...prev, shortDescription: undefined})); }}
                />
                {editingCourseErrors.shortDescription && <p className="text-xs text-red-500 mt-1">{editingCourseErrors.shortDescription}</p>}
              </div>

              {/* Mô tả chi tiết */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mô tả chi tiết</label>
                <textarea 
                  className="w-full border border-gray-300 p-2.5 rounded-lg h-28 text-sm focus:ring-2 focus:ring-[#5a4d8c]/50 outline-none" 
                  value={editingCourse.description || ""} 
                  onChange={e => { setEditingCourse({...editingCourse, description: e.target.value}); setEditingCourseErrors(prev=>({...prev, description: undefined})); }}
                />
                {editingCourseErrors.description && <p className="text-xs text-red-500 mt-1">{editingCourseErrors.description}</p>}
              </div>

            

              {/* Trạng thái Published */}
              <div className="pt-2">
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition">
                  <input 
                    type="checkbox" 
                    className="w-5 h-5 text-[#5a4d8c] rounded focus:ring-[#5a4d8c]" 
                    checked={editingCourse.published} 
                    onChange={e => setEditingCourse({...editingCourse, published: e.target.checked})}
                  />
                  <div className="flex flex-col">
                    <span className="font-bold text-sm text-gray-700">Công khai (Published)</span>
                    <span className="text-xs text-gray-500">Hiển thị khóa học này cho học viên</span>
                  </div>
                </label>
              </div>

            </div>

            {/* Footer Buttons */}
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3 rounded-b-xl">
              <button onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 font-medium text-gray-700 transition">Hủy</button>
              <button onClick={handleUpdateCourse} className="px-4 py-2 bg-[#5a4d8c] text-white rounded-lg hover:bg-[#483d73] font-medium flex items-center gap-2 transition shadow-lg shadow-indigo-200">
                <Save size={18}/> Lưu thay đổi
              </button>
            </div>

          </div>
        </div>
      )}

{/* --- MODAL DANH SÁCH BÀI GIẢNG --- */}
      {isLecturesModalOpen && viewingContext && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="px-6 py-4 border-b bg-white flex justify-between items-center shrink-0">
              <div>
                <h3 className="text-xl font-bold text-gray-800">Danh sách bài giảng</h3>
                <div className="flex items-center gap-2 text-sm mt-1 text-gray-600">
                    <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded font-medium">{viewingContext.courseTitle}</span>
                    <span>•</span>
                    <span className="font-medium">GV: {viewingContext.teacherName}</span>
                </div>
              </div>
              <button onClick={() => setIsLecturesModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition"><X size={24} /></button>
            </div>

            {/* [MỚI] Toolbar: Search & Filter */}
            <div className="px-6 py-3 bg-gray-50 border-b flex flex-col sm:flex-row gap-3 justify-between items-center shrink-0">
                {/* Search Box */}
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Tìm bài giảng..." 
                        className="w-full pl-9 pr-4 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#5a4d8c]/20 focus:border-[#5a4d8c]"
                        value={lectureSearchTerm}
                        onChange={(e) => setLectureSearchTerm(e.target.value)}
                    />
                </div>

                {/* Status Filter */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-48">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <select 
                            className="w-full pl-9 pr-8 py-2 rounded-lg border border-gray-200 text-sm appearance-none cursor-pointer hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#5a4d8c]/20 focus:border-[#5a4d8c]"
                            value={lectureStatusFilter}
                            onChange={(e) => setLectureStatusFilter(e.target.value)}
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="published">Đã xuất bản (Published)</option>
                            <option value="draft">Bản nháp (Draft)</option>
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                            <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Body Table */}
            <div className="flex-1 overflow-y-auto bg-white p-0 custom-scrollbar">
              {lecturesLoading ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#5a4d8c] mb-2"></div>
                    <p>Đang tải dữ liệu...</p>
                </div>
              ) : (
                <>
                {/* Logic lọc dữ liệu */}
                {(() => {
                    const filteredLectures = courseLectures.filter(lec => {
                        const s = lectureSearchTerm.toLowerCase();
                        const matchName = lec.title?.toLowerCase().includes(s);
                        
                        if (lectureStatusFilter === 'published') return matchName && lec.published;
                        if (lectureStatusFilter === 'draft') return matchName && !lec.published;
                        return matchName;
                    });

                    if (filteredLectures.length === 0) {
                        return (
                            <div className="flex flex-col items-center justify-center py-20 text-gray-400 opacity-60">
                                <Search size={64} strokeWidth={1} className="mb-4" />
                                <p className="text-lg">Không tìm thấy bài giảng nào phù hợp</p>
                            </div>
                        );
                    }

                    return (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold sticky top-0 z-10 shadow-sm">
                                <tr>
                                <th className="p-4 w-16 text-center">STT</th>
                                <th className="p-4">Tên bài giảng</th>
                                <th className="p-4 w-32">Loại</th>
                                <th className="p-4 w-28">Thời lượng</th>
                                <th className="p-4 w-28 text-center">Trạng thái</th>
                                <th className="p-4 w-32 text-center">Hành động</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y text-sm text-gray-700">
                                {filteredLectures.map((lec, index) => (
                                <tr key={lec.lectureId} className="hover:bg-gray-50 transition-colors group">
                                    <td className="p-4 text-center font-medium text-gray-500">{index + 1}</td>
                                    <td className="p-4">
                                        <div className="font-semibold text-gray-800">{lec.title}</div>
                                        <div className="text-xs text-gray-400 truncate max-w-[200px]">{lec.s3Key || "No Content"}</div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            {lec.contentType === 'video' ? <Video size={16} className="text-blue-500" /> : <FileText size={16} className="text-orange-500" />}
                                            <span className="capitalize text-gray-600">{lec.contentType}</span>
                                        </div>
                                    </td>
                                    <td className="p-4 font-mono text-gray-600">
                                        <div className="flex items-center gap-1.5">
                                            <Clock size={14} className="text-gray-400" />
                                            {formatDuration(lec.durationSeconds)}
                                        </div>
                                    </td>
                                    <td className="p-4 text-center">
                                        {lec.published ? 
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium border border-green-100">
                                                Published
                                            </span> : 
                                            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 text-xs font-medium border border-gray-200">
                                                Draft
                                            </span>
                                        }
                                    </td>
                                    <td className="p-4 text-center">
                                        <div className="flex items-center justify-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => openEditLectureModal(lec)} className="p-2 text-gray-500 hover:text-[#5a4d8c] hover:bg-[#5a4d8c]/10 rounded-lg transition" title="Chỉnh sửa">
                                            <Edit size={16} />
                                            </button>
                                            <button onClick={() => handleDeleteLecture(lec.lectureId)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Xóa">
                                            <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                                ))}
                            </tbody>
                        </table>
                    );
                })()}
                </>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end text-sm">
                <button onClick={() => setIsLecturesModalOpen(false)} className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-100 transition shadow-sm">Đóng</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL EDIT BÀI GIẢNG (Giữ nguyên) --- */}
      {isEditLectureModalOpen && editingLecture && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden animate-fade-in-up">
            <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center"><h3 className="text-lg font-bold text-gray-800">Chỉnh sửa bài giảng</h3><button onClick={() => setIsEditLectureModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button></div>
            <div className="p-6 space-y-4">
              <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tên bài giảng</label><input type="text" className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#5a4d8c] transition" value={editingLecture.title} onChange={(e) => setEditingLecture({ ...editingLecture, title: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Thứ tự (Order)</label><input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#5a4d8c]" value={editingLecture.orderIndex} onChange={(e) => setEditingLecture({ ...editingLecture, orderIndex: parseInt(e.target.value) || 0 })} /></div>
                <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Thời lượng (giây)</label><input type="number" className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#5a4d8c]" value={editingLecture.durationSeconds} onChange={(e) => setEditingLecture({ ...editingLecture, durationSeconds: parseInt(e.target.value) || 0 })} /></div>
              </div>
              <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">S3 Key</label><input type="text" className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-gray-50 text-gray-600 focus:outline-none focus:bg-white focus:border-[#5a4d8c]" value={editingLecture.s3Key} onChange={(e) => setEditingLecture({ ...editingLecture, s3Key: e.target.value })} /></div>
              <div><label className="block text-xs font-bold text-gray-500 uppercase mb-1">Loại nội dung</label><select className="w-full border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#5a4d8c] bg-white" value={editingLecture.contentType} onChange={(e) => setEditingLecture({ ...editingLecture, contentType: e.target.value })}><option value="video">Video</option><option value="text">Text / Document</option><option value="quiz">Quiz</option></select></div>
              <div className="pt-2"><label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition"><input type="checkbox" className="w-5 h-5 text-[#5a4d8c] rounded focus:ring-[#5a4d8c]" checked={editingLecture.published} onChange={(e) => setEditingLecture({ ...editingLecture, published: e.target.checked })} /><div><span className="font-bold text-sm text-gray-700 block">Xuất bản (Published)</span></div></label></div>
            </div>
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3"><button onClick={() => setIsEditLectureModalOpen(false)} className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 font-medium text-gray-700">Hủy bỏ</button><button onClick={handleUpdateLecture} className="px-4 py-2 bg-[#5a4d8c] text-white rounded-lg hover:bg-[#483d73] font-medium flex items-center gap-2"><Save size={18} /> Lưu thay đổi</button></div>
          </div>
        </div>
      )}

    </div>
  );
}