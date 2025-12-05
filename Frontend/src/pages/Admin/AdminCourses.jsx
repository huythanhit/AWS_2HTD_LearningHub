// AdminCourses.jsx
import React, { useState, useEffect } from "react";
import { Search, Plus, LayoutGrid, List, X } from "lucide-react";

import {
  getCourses,
  createCourse,
  deleteCourse,
  assignTeacherToCourse,
  removeTeacherFromCourse,
  getAdminUsers,
  getCourseTeachers,
} from "../../services/adminService";

export default function AdminCourses() {
  // state
  const [courses, setCourses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const pageSize = 20;

  const [viewMode, setViewMode] = useState("grid");
  const [searchTerm, setSearchTerm] = useState("");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  const [assignCourseId, setAssignCourseId] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState("");

  const [newCourse, setNewCourse] = useState({
    title: "",
    slug: "",
    shortDescription: "",
    description: "",
    published: true,
  });

  // ------------------------------------------------------------------
  // Fetch teachers (admin users filtered by role)
  // ------------------------------------------------------------------
  const fetchTeachers = async () => {
    try {
      const res = await getAdminUsers(1, 200);
      const list = (res.users || []).filter(
        (u) => (u.role_name || "").toLowerCase() === "teacher"
      );
      setTeachers(list);
    } catch (err) {
      console.error("FETCH TEACHERS ERROR:", err);
    }
  };

  // ------------------------------------------------------------------
  // Load courses: try /api/admin/courses first (may include teachers),
  // fallback to getCourses() + getCourseTeachers per course.
  // This makes FE robust to either API shape.
  // ------------------------------------------------------------------
  const loadCourses = async () => {
    setLoading(true);

    try {
      // 1) Try admin endpoint that (in your earlier message) returned teachers inlined.
      try {
        const resp = await fetch("/api/admin/courses"); // relative path -> same origin
        if (resp.ok) {
          const data = await resp.json();
          // backend might wrap data or might return array directly
          let arr = [];

          if (Array.isArray(data)) arr = data;
          else if (data && Array.isArray(data.data)) arr = data.data;
          else if (data && Array.isArray(data.courses)) arr = data.courses;
          else if (data && Array.isArray(data.result)) arr = data.result;
          else {
            // can't parse as list -> fallthrough to fallback
            arr = null;
          }

          if (Array.isArray(arr)) {
            // normalize ensure teachers field exists (may be teachers: [] or teachers: [{teacherId, fullName}])
            const normalized = arr.map((c) => ({
              ...c,
              teachers: Array.isArray(c.teachers) ? c.teachers : [],
            }));
            setCourses(normalized);
            setLoading(false);
            return; // success using admin endpoint
          }
        }
        // if not ok or not parseable, fall through to fallback
      } catch (err) {
        // network/403/etc => fallback
        console.warn("admin/courses fetch failed, will fallback to per-course teachers:", err);
      }

      // 2) Fallback: getCourses() then for each course call getCourseTeachers(courseId)
      const list = await getCourses(page, pageSize);
      if (!Array.isArray(list)) {
        // If backend returned object with data field, try to extract
        if (list && Array.isArray(list.data)) {
          // e.g. { data: [...] }
          // eslint-disable-next-line
          list = list.data;
        } else if (list && Array.isArray(list.courses)) {
          // e.g. { courses: [...] }
          // eslint-disable-next-line
          list = list.courses;
        } else {
          console.error("Unexpected getCourses response shape:", list);
          setCourses([]);
          setLoading(false);
          return;
        }
      }

      // For each course, call getCourseTeachers and attach teachers[]
      const merged = await Promise.all(
        list.map(async (c) => {
          try {
            const t = await getCourseTeachers(c.courseId);
            // ensure array
            return { ...c, teachers: Array.isArray(t) ? t : [] };
          } catch (err) {
            console.warn("getCourseTeachers failed for", c.courseId, err);
            return { ...c, teachers: [] };
          }
        })
      );

      setCourses(merged);
    } catch (err) {
      console.error("LOAD COURSES ERROR:", err);
      setCourses([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadCourses();
    fetchTeachers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // ------------------------------------------------------------------
  // Create course (keeps previous logic)
  // ------------------------------------------------------------------
  const handleCreateCourse = async () => {
    if (
      !newCourse.title ||
      !newCourse.slug ||
      !newCourse.shortDescription ||
      !newCourse.description
    ) {
      alert("Vui lòng điền đầy đủ thông tin!");
      return;
    }

    const sanitize = (s = "") =>
      s
        .toString()
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9\-]/g, "")
        .replace(/\-+/g, "-");

    let baseSlug = sanitize(newCourse.slug || newCourse.title);
    if (!baseSlug) baseSlug = `course-${Date.now()}`;

    let attempt = 0;
    const maxAttempts = 5;
    let lastError = null;

    while (attempt < maxAttempts) {
      const slugCandidate = attempt === 0 ? baseSlug : `${baseSlug}-${attempt}`;
      const payload = { ...newCourse, slug: slugCandidate, published: true };

      try {
        const createdCourse = await createCourse(payload);
        setCourses((prev) => [{ ...createdCourse, teachers: [] }, ...prev]);
        setIsCreateModalOpen(false);
        setNewCourse({
          title: "",
          slug: "",
          shortDescription: "",
          description: "",
          published: true,
        });
        if (attempt > 0) {
          alert(`Slug trùng, đã tự thay thành "${slugCandidate}" và tạo thành công.`);
        } else {
          alert("Tạo khóa học thành công!");
        }
        return;
      } catch (err) {
        lastError = err;
        const msg = (err && err.message) || "";
        if (/slug/i.test(msg) || (err && err.status === 400)) {
          attempt++;
          continue;
        }
        console.error("CREATE COURSE ERROR RAW:", err);
        alert("Không thể tạo khóa học: " + msg);
        return;
      }
    }

    console.error("CREATE COURSE ERROR RAW:", lastError);
    alert("Tạo khóa học thất bại (slug trùng nhiều lần). Vui lòng chọn slug khác.");
  };

  // ------------------------------------------------------------------
  // Delete course
  // ------------------------------------------------------------------
  const handleDeleteCourse = async (courseId) => {
    if (!confirm("Bạn có chắc muốn xóa khóa học này?")) return;

    try {
      await deleteCourse(courseId);
      setCourses((prev) => prev.filter((c) => c.courseId !== courseId));
      alert("Xóa khóa học thành công!");
    } catch (err) {
      console.error("DELETE COURSE ERROR:", err);
      alert("Không thể xóa khóa học!");
    }
  };

  // ------------------------------------------------------------------
  // Assign teacher
  // ------------------------------------------------------------------
  const handleAssignTeacher = async () => {
    if (!selectedTeacher || !assignCourseId) {
      alert("Vui lòng chọn giảng viên!");
      return;
    }

    try {
      const assignment = await assignTeacherToCourse(assignCourseId, selectedTeacher);
      // assignment is expected { courseId, teacherId } (check your backend)
      const teacherInfo = teachers.find((t) => t.id === assignment.teacherId);

      setCourses((prev) =>
        prev.map((course) => {
          if (course.courseId === assignment.courseId) {
            // set teachers array with normalized fields { teacherId, fullName }
            return {
              ...course,
              teachers: [
                {
                  teacherId: assignment.teacherId,
                  fullName: teacherInfo ? teacherInfo.full_name : (teacherInfo?.fullName ?? "")
                },
              ],
            };
          }
          return course;
        })
      );

      alert("Gán giảng viên thành công!");
      setIsAssignModalOpen(false);
      setSelectedTeacher("");
      setAssignCourseId(null);
    } catch (err) {
      console.error("ASSIGN TEACHER ERROR:", err);
      alert("Không thể gán giảng viên!");
    }
  };

  // ------------------------------------------------------------------
  // Remove teacher
  // ------------------------------------------------------------------
  const handleRemoveTeacher = async (courseId, teacherId) => {
    if (!confirm("Bạn có chắc muốn xóa giảng viên khỏi khóa học này?")) return;

    try {
      await removeTeacherFromCourse(courseId, teacherId);

      setCourses((prev) =>
        prev.map((course) => {
          if (course.courseId === courseId) {
            return { ...course, teachers: [] };
          }
          return course;
        })
      );

      alert("Xóa giảng viên thành công!");
    } catch (err) {
      console.error("REMOVE TEACHER ERROR:", err);
      alert("Không thể xóa giảng viên!");
    }
  };

  // ------------------------------------------------------------------
  // Filtered list
  // ------------------------------------------------------------------
  const filteredCourses = courses.filter((course) =>
    (course.title || "").toLowerCase().includes((searchTerm || "").toLowerCase())
  );

  // ------------------------------------------------------------------
  // Render
  // ------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans animate-fade-in-up">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Quản lý Khóa học</h1>
          <p className="text-gray-500 text-sm">Quản lý danh sách khóa học từ hệ thống.</p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#5a4d8c] text-white font-medium rounded-xl hover:bg-[#483d73] transition shadow-lg"
        >
          <Plus size={20} /> Tạo khóa học mới
        </button>
      </div>

      {/* SEARCH + VIEW */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col lg:flex-row gap-4 justify-between items-center">
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Tìm tên khóa học..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#5a4d8c]"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex bg-gray-100 p-1 rounded-lg">
          <button onClick={() => setViewMode("grid")} className={`p-2 rounded-md ${viewMode === "grid" ? "bg-white text-[#5a4d8c]" : "text-gray-500"}`}>
            <LayoutGrid size={20} />
          </button>
          <button onClick={() => setViewMode("table")} className={`p-2 rounded-md ${viewMode === "table" ? "bg-white text-[#5a4d8c]" : "text-gray-500"}`}>
            <List size={20} />
          </button>
        </div>
      </div>

      {loading && <div className="text-center text-gray-600 py-10">Đang tải dữ liệu...</div>}

      {/* GRID VIEW */}
      {!loading && viewMode === "grid" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {filteredCourses.map((course) => (
            <div key={course.courseId} className="bg-white rounded-2xl border shadow-sm hover:shadow-lg transition overflow-hidden">
              <div className="h-40 bg-gradient-to-br from-purple-400 to-indigo-600 p-4 flex justify-between text-white">
                <span className="font-bold text-sm">{course.slug}</span>
                <span className="px-2 py-1 bg-white/20 rounded text-xs">{course.published ? "Published" : "Draft"}</span>
              </div>
              <div className="p-5">
                <h3 className="font-bold text-gray-800 text-lg mb-1">{course.title}</h3>
                <p className="text-sm text-gray-500 mb-2">{course.shortDescription || "Không có mô tả"}</p>

                {course.teachers && course.teachers.length > 0 ? (
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-gray-600">
                      <strong>Giảng viên:</strong> {course.teachers[0].fullName}
                    </p>
                    <button onClick={() => handleRemoveTeacher(course.courseId, course.teachers[0].teacherId)} className="px-2 py-1 text-xs text-red-600 bg-red-50 rounded hover:bg-red-600 hover:text-white transition">
                      Xóa
                    </button>
                  </div>
                ) : (
                  <div className="text-gray-400 italic text-sm mb-2">- Chưa gán -</div>
                )}

                <div className="flex flex-col gap-2">
                  <button className="w-full py-2 text-sm font-medium text-[#5a4d8c] bg-purple-50 rounded-lg">Xem chi tiết</button>
                  <button onClick={() => handleDeleteCourse(course.courseId)} className="w-full py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg">Xóa khóa học</button>
                  <button onClick={() => { setAssignCourseId(course.courseId); setIsAssignModalOpen(true); }} className="w-full py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg">Gán Teacher</button>
                </div>

              </div>
            </div>
          ))}
        </div>
      )}

      {/* TABLE VIEW */}
      {!loading && viewMode === "table" && filteredCourses.length > 0 && (
        <div className="bg-white rounded-2xl shadow border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-semibold">
                <tr>
                  <th className="p-4 pl-6 whitespace-nowrap">Khóa học</th>
                  <th className="p-4 whitespace-nowrap">Slug</th>
                  <th className="p-4 whitespace-nowrap">Trạng thái</th>
                  <th className="p-4 whitespace-nowrap w-[250px]">Giảng viên</th>
                  <th className="p-4 whitespace-nowrap text-center">Hành động</th>
                </tr>
              </thead>
              <tbody className="divide-y text-sm text-gray-700">
                {filteredCourses.map((course) => (
                  <tr key={course.courseId} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 pl-6 font-bold text-gray-800 align-middle">{course.title}</td>
                    <td className="p-4 align-middle text-gray-500">{course.slug}</td>
                    <td className="p-4 align-middle">{course.published ? <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-md text-xs font-medium">Published</span> : <span className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-medium">Draft</span>}</td>

                    <td className="p-4 align-middle">
                      {course.teachers && course.teachers.length > 0 ? (
                        <div className="flex items-center justify-between gap-2 bg-gray-50 p-2 rounded-lg border border-gray-100">
                          <div className="flex flex-col overflow-hidden">
                            <span className="font-medium text-gray-800 truncate" title={course.teachers[0].fullName}>{course.teachers[0].fullName}</span>
                          </div>
                          <button onClick={() => handleRemoveTeacher(course.courseId, course.teachers[0].teacherId)} className="px-2 py-1 text-xs font-semibold text-red-600 bg-white border border-red-100 rounded shadow-sm hover:bg-red-600 hover:text-white transition whitespace-nowrap" title="Gỡ giảng viên khỏi khóa học">Xóa</button>
                        </div>
                      ) : (
                        <span className="text-gray-400 italic text-xs block p-2">- Chưa gán -</span>
                      )}
                    </td>

                    <td className="p-4 align-middle">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => handleDeleteCourse(course.courseId)} className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium">Xóa</button>
                        <button onClick={() => { setAssignCourseId(course.courseId); setIsAssignModalOpen(true); }} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium">Gán Teacher</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EMPTY */}
      {!loading && filteredCourses.length === 0 && (
        <div className="text-center py-20 bg-white rounded-2xl border">
          <Search size={40} className="mx-auto text-gray-400 mb-3" />
          <h3 className="text-lg font-bold">Không tìm thấy khóa học nào</h3>
        </div>
      )}

      {/* CREATE MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-lg p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold">Tạo khóa học mới</h2>
              <button onClick={() => setIsCreateModalOpen(false)}><X size={20} className="text-gray-500" /></button>
            </div>

            {["title", "slug", "shortDescription", "description"].map((field) => (
              <div key={field}>
                <label className="block text-xs font-bold mb-1">{field === "shortDescription" ? "Short Description" : field.charAt(0).toUpperCase() + field.slice(1)}</label>
                {field.includes("Description") ? (
                  <textarea className="w-full border p-2 rounded" rows={field === "description" ? 4 : 3} value={newCourse[field]} onChange={(e) => setNewCourse({ ...newCourse, [field]: e.target.value })} />
                ) : (
                  <input className="w-full border p-2 rounded" value={newCourse[field]} onChange={(e) => setNewCourse({ ...newCourse, [field]: e.target.value })} />
                )}
              </div>
            ))}

            <div className="text-sm text-gray-500">Khóa học sẽ được Published mặc định khi tạo. Bạn có thể chỉnh trạng thái sau khi tạo.</div>

            <div className="flex justify-end gap-3 pt-3">
              <button onClick={() => setIsCreateModalOpen(false)} className="px-4 py-2 border rounded">Hủy</button>
              <button onClick={handleCreateCourse} className="px-4 py-2 bg-[#5a4d8c] text-white rounded">Tạo khóa học</button>
            </div>
          </div>
        </div>
      )}

      {/* ASSIGN TEACHER MODAL */}
      {isAssignModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md p-6 rounded-2xl shadow-xl space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-xl font-bold">Gán giảng viên cho khóa học</h2>
              <button onClick={() => setIsAssignModalOpen(false)}><X size={20} className="text-gray-500" /></button>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Chọn giảng viên</label>
              <select className="w-full border p-2 rounded" value={selectedTeacher} onChange={(e) => setSelectedTeacher(e.target.value)}>
                <option value="">-- Chọn giảng viên --</option>
                {teachers.map((t) => (<option key={t.id} value={t.id}>{t.full_name} ({t.email})</option>))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button onClick={() => setIsAssignModalOpen(false)} className="px-4 py-2 border rounded">Hủy</button>
              <button onClick={handleAssignTeacher} className="px-4 py-2 bg-[#5a4d8c] text-white rounded">Gán</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
