import React, { useEffect, useState, useRef } from 'react';
import { 
  Search,
  BookOpen,
  Users,
  DollarSign,
  CheckCircle,
  XCircle,
  MoreVertical,
  Edit,
  Trash2,
  AlertTriangle,
  X
} from 'lucide-react';
import { toast } from 'react-toastify';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import {
  getTeacherCourses,
  getCourseLectures,
  createCourseLecture,
  updateCourseLecture,
  deleteCourseLecture
} from '../../services/teacherService';
import { lectureValidationSchema } from '../../validation/teacherClasses';

export default function TeacherClasses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(null);

  const [lectures, setLectures] = useState([]);
  const [lecturesLoading, setLecturesLoading] = useState(false);
  const [lecturesError, setLecturesError] = useState('');

  const [isCreatingLecture, setIsCreatingLecture] = useState(false);
  const [editingLecture, setEditingLecture] = useState(null);
  const [openMenuId, setOpenMenuId] = useState(null);
  const [lectureToDelete, setLectureToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchCourses = async () => {
      try {
        const data = await getTeacherCourses();
        if (!isMounted) return;
        setCourses(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!isMounted) return;
        setError(err.message || 'Không thể tải danh sách khóa học.');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCourses();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredCourses = courses.filter((course) => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return true;
    return (
      course.title?.toLowerCase().includes(keyword) ||
      course.shortDescription?.toLowerCase().includes(keyword) ||
      course.description?.toLowerCase().includes(keyword)
    );
  });

  const renderPrice = (price, currency) => {
    if (price === 0) return 'Miễn phí';
    return `${price?.toLocaleString('vi-VN')} ${currency || ''}`.trim();
  };

  const handleSelectCourse = async (course) => {
    setSelectedCourse(course);
    setLectures([]);
    setLecturesError('');
    setIsCreatingLecture(false);
    if (!course?.courseId) return;

    setLecturesLoading(true);
    try {
      const data = await getCourseLectures(course.courseId);
      setLectures(Array.isArray(data) ? data : []);
    } catch (err) {
      setLecturesError(err.message || 'Không thể tải danh sách bài giảng.');
    } finally {
      setLecturesLoading(false);
    }
  };

  const handleBackToCourses = () => {
    setSelectedCourse(null);
    setLectures([]);
    setLecturesError('');
    setIsCreatingLecture(false);
  };

  // Đóng menu khi click bên ngoài
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Kiểm tra xem click có phải vào menu không
      const clickedMenu = event.target.closest('[data-menu-container]');
      if (!clickedMenu && openMenuId !== null) {
        setOpenMenuId(null);
      }
    };

    if (openMenuId !== null) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openMenuId]);

  const getInitialValues = (lecture = null) => ({
    title: lecture?.title || '',
    contentType: lecture?.contentType || 'video',
    s3Key: lecture?.s3Key || '',
    durationSeconds: lecture?.durationSeconds || 600,
    orderIndex: lecture?.orderIndex || (lectures?.length || 0) + 1,
    published: lecture?.published ?? true
  });

  const handleOpenCreateLecture = () => {
    setEditingLecture(null);
    setIsCreatingLecture(true);
  };

  const handleOpenEditLecture = (lecture) => {
    setEditingLecture(lecture);
    setOpenMenuId(null);
    setIsCreatingLecture(true);
  };

  const handleOpenDeleteConfirm = (lecture) => {
    setLectureToDelete(lecture);
    setOpenMenuId(null);
  };

  const handleCloseDeleteConfirm = () => {
    if (!isDeleting) {
      setLectureToDelete(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (!lectureToDelete || !selectedCourse?.courseId) {
      return;
    }

    // Lấy ID từ nhiều trường có thể có
    const lectureId = lectureToDelete.id || lectureToDelete.lectureId || lectureToDelete.lecture_id;
    
    if (!lectureId) {
      toast.error('Không tìm thấy ID bài giảng. Vui lòng thử lại.');
      setLectureToDelete(null);
      return;
    }

    setIsDeleting(true);
    try {
      await deleteCourseLecture(selectedCourse.courseId, lectureId);

      // Sau khi xóa thành công, gọi lại API để lấy danh sách lectures mới nhất
      setLecturesLoading(true);
      try {
        const data = await getCourseLectures(selectedCourse.courseId);
        setLectures(Array.isArray(data) ? data : []);
        setLecturesError('');
      } catch (fetchErr) {
        setLecturesError(fetchErr.message || 'Không thể tải danh sách bài giảng.');
      } finally {
        setLecturesLoading(false);
      }

      setLectureToDelete(null);
      toast.success('Xóa bài giảng thành công!');
    } catch (err) {
      toast.error(err.message || 'Xóa bài giảng thất bại');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSubmitLecture = async (values, { setSubmitting }) => {
    if (!selectedCourse?.courseId) {
      setSubmitting(false);
      return;
    }

    try {
      const payload = {
        title: values.title,
        contentType: values.contentType,
        s3Key: values.s3Key,
        durationSeconds: Number(values.durationSeconds) || 0,
        orderIndex: Number(values.orderIndex) || 1,
        published: !!values.published
      };

      if (editingLecture) {
        // Sửa bài giảng
        const lectureId = editingLecture.id || editingLecture.lectureId || editingLecture.lecture_id;
        
        if (!lectureId) {
          toast.error('Không tìm thấy ID bài giảng. Vui lòng thử lại.');
          setSubmitting(false);
            return;
        }
        
        await updateCourseLecture(selectedCourse.courseId, lectureId, payload);
      } else {
        // Tạo bài giảng mới
        await createCourseLecture(selectedCourse.courseId, payload);
      }

      // Sau khi tạo/sửa thành công, gọi lại API để lấy danh sách lectures mới nhất
      setLecturesLoading(true);
      try {
        const data = await getCourseLectures(selectedCourse.courseId);
        setLectures(Array.isArray(data) ? data : []);
        setLecturesError('');
      } catch (fetchErr) {
        setLecturesError(fetchErr.message || 'Không thể tải danh sách bài giảng.');
      } finally {
        setLecturesLoading(false);
      }

      setIsCreatingLecture(false);
      setEditingLecture(null);
      toast.success(editingLecture ? 'Cập nhật bài giảng thành công!' : 'Tạo bài giảng thành công!');
    } catch (err) {
      toast.error(err.message || (editingLecture ? 'Sửa bài giảng thất bại' : 'Tạo bài giảng thất bại'));
    } finally {
      setSubmitting(false);
    }
  };

    return (
    <div className="min-h-screen bg-slate-50 p-6 font-sans text-slate-800">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <BookOpen size={26} className="text-indigo-600" />
            {selectedCourse ? 'Chi tiết khóa học' : 'Khóa học của tôi'}
                            </h2>
          <p className="text-slate-500 text-sm">
            {selectedCourse
              ? selectedCourse.title
              : 'Danh sách khóa học bạn đang phụ trách trên LearningHub.'}
          </p>
                        </div>

        <div className="flex items-center gap-3">
          {!selectedCourse && (
            <div className="relative w-full md:w-72">
              <Search
                className="absolute left-3 top-2.5 text-gray-400"
                size={18}
              />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên / mô tả khóa học..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all"
              />
                            </div>
          )}

          {selectedCourse && (
            <button
              onClick={handleBackToCourses}
              className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-600 hover:bg-gray-50"
            >
              Quay lại danh sách
            </button>
          )}
                                </div>
                            </div>

      {/* DANH SÁCH KHÓA HỌC */}
      {!selectedCourse && (
        <>
          {/* STATE: LOADING */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse"
                >
                  <div className="h-4 w-24 bg-slate-100 rounded-full mb-4" />
                  <div className="h-5 w-3/4 bg-slate-100 rounded-full mb-3" />
                  <div className="h-4 w-full bg-slate-100 rounded-full mb-2" />
                  <div className="h-4 w-5/6 bg-slate-100 rounded-full mb-6" />
                  <div className="flex justify-between items-center">
                    <div className="h-4 w-20 bg-slate-100 rounded-full" />
                    <div className="h-8 w-24 bg-slate-100 rounded-full" />
                            </div>
                        </div>
              ))}
            </div>
          )}

          {/* STATE: ERROR */}
          {!loading && error && (
            <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-2xl text-sm max-w-xl">
              {error}
            </div>
          )}

          {/* STATE: EMPTY */}
          {!loading && !error && filteredCourses.length === 0 && (
            <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-10 text-center text-gray-500">
              <p className="font-medium mb-1">
                Không tìm thấy khóa học nào phù hợp.
              </p>
              <p className="text-sm">
                Hãy thử lại với từ khóa khác hoặc kiểm tra bộ lọc.
              </p>
                        </div>
          )}

          {/* GRID COURSES */}
          {!loading && !error && filteredCourses.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCourses.map((course) => (
                <button
                  key={course.courseId}
                  type="button"
                  onClick={() => handleSelectCourse(course)}
                  className="group text-left bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-lg hover:border-indigo-100 transition-all duration-300 flex flex-col h-full"
                >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-base font-semibold group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    {course.title?.charAt(0) || 'K'}
                    </div>
                  <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-2 group-hover:text-indigo-700 transition-colors">
                    {course.title}
                  </h3>
                </div>
                <span
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold border whitespace-nowrap ${
                    course.published
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                      : 'bg-amber-50 text-amber-700 border-amber-100'
                  }`}
                >
                  {course.published ? (
                    <>
                      <CheckCircle size={13} />
                      Công khai
                    </>
                  ) : (
                    <>
                      <XCircle size={13} />
                      Riêng tư
                    </>
                  )}
                </span>
              </div>

              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                {course.shortDescription}
              </p>
              <p className="text-xs text-gray-500 mb-5 line-clamp-3">
                {course.description}
              </p>

              <div className="mt-auto pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <DollarSign size={16} />
                  </div>
                            <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wide">
                      Học phí
                    </p>
                    <p className="font-semibold text-gray-900">
                      {renderPrice(course.price, course.currency)}
                    </p>
                  </div>
                </div>
                            </div>
                            </button>
              ))}
                        </div>
          )}
        </>
      )}

      {/* CHI TIẾT KHÓA HỌC & BÀI GIẢNG */}
      {selectedCourse && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
              <h3 className="font-semibold text-gray-900 text-lg mb-1">
                {selectedCourse.title}
              </h3>
              {selectedCourse.shortDescription && (
                <p className="text-sm text-gray-600">
                  {selectedCourse.shortDescription}
                </p>
              )}
                                            </div>
            <button
              onClick={handleOpenCreateLecture}
              className="self-end md:self-auto px-4 py-2.5 rounded-xl bg-indigo-600 text-white text-sm font-medium shadow-md hover:bg-indigo-700 transition-colors"
            >
              + Tạo bài giảng
                                            </button>
                                        </div>
                                        
          {/* LIST LECTURES */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 min-h-[260px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-semibold text-gray-900 text-base">
                Danh sách bài giảng
              </h4>
              <span className="text-xs text-gray-400">
                {lectures.length} bài giảng
                                            </span>
                                        </div>

            {lecturesLoading && (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                Đang tải danh sách bài giảng...
                                            </div>
            )}

            {!lecturesLoading && lecturesError && (
              <div className="flex-1 flex items-center justify-center">
                <div className="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded-xl text-sm max-w-md text-center">
                  {lecturesError}
                                            </div>
                                        </div>
            )}

            {!lecturesLoading &&
              !lecturesError &&
              lectures.length === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
                    <BookOpen size={26} />
                                    </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      Chưa có bài giảng nào cho khóa học này
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Bắt đầu bằng việc tạo bài giảng đầu tiên để học viên có
                      thể học nội dung.
                    </p>
                                            </div>
                  <button
                    onClick={handleOpenCreateLecture}
                    className="mt-1 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium shadow hover:bg-indigo-700"
                  >
                    + Tạo bài giảng
                                        </button>
                                    </div>
              )}

            {!lecturesLoading &&
              !lecturesError &&
              lectures.length > 0 && (
                <div className="space-y-3">
                  {lectures
                    .slice()
                    .sort(
                      (a, b) =>
                        (a.orderIndex || 0) - (b.orderIndex || 0)
                    )
                    .map((lecture, index) => {
                      // Dùng index làm unique key cho UI để tránh conflict
                      const uniqueKey = `lecture-${index}-${lecture.id || lecture.lectureId || lecture.lecture_id || lecture.title || 'unknown'}`;
                      const isMenuOpen = openMenuId === uniqueKey;
                      
                      return (
                        <div
                          key={uniqueKey}
                          className="p-4 rounded-xl border border-gray-100 bg-gray-50/60 hover:bg-white hover:border-indigo-100 transition-all flex items-start justify-between gap-4 relative"
                        >
                          <div className="flex items-start gap-3 flex-1">
                            <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm font-semibold">
                              {lecture.orderIndex ?? '-'}
                                </div>
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">
                                {lecture.title}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                Loại nội dung:{' '}
                                <span className="font-medium">
                                  {lecture.contentType}
                                </span>{' '}
                                • Thời lượng:{' '}
                                <span className="font-medium">
                                  {Math.round(
                                    (lecture.durationSeconds || 0) / 60
                                  ) || 0}{' '}
                                  phút
                                        </span>
                              </p>
                              {lecture.s3Key && (
                                <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                                  {lecture.s3Key}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold border ${
                                lecture.published
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                  : 'bg-amber-50 text-amber-700 border-amber-100'
                              }`}
                            >
                              {lecture.published ? 'Công khai' : 'Nháp'}
                            </span>
                            
                            <div className="relative" data-menu-container>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenMenuId(isMenuOpen ? null : uniqueKey);
                                }}
                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                              >
                                <MoreVertical size={18} />
                              </button>
                              
                              {isMenuOpen && (
                                <div 
                                  className="absolute right-0 top-9 z-10 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditLecture(lecture)}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors"
                                  >
                                    <Edit size={16} />
                                    Sửa
                                </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenDeleteConfirm(lecture)}
                                    className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                                  >
                                    <Trash2 size={16} />
                                    Xóa
                                </button>
                                </div>
                              )}
                            </div>
                            </div>
                        </div>
                      );
                    })}
                            </div>
              )}
                                </div>
                            </div>
      )}

      {/* MODAL TẠO BÀI GIẢNG */}
      {selectedCourse && isCreatingLecture && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                                <div>
                <h3 className="font-semibold text-gray-900">
                  {editingLecture ? 'Sửa bài giảng' : 'Tạo bài giảng mới'}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Khóa học: {selectedCourse.title}
                </p>
                                </div>
              <button
                type="button"
                onClick={() => {
                  setIsCreatingLecture(false);
                  setEditingLecture(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-sm"
              >
                Đóng
              </button>
                            </div>

            <Formik
              initialValues={getInitialValues(editingLecture)}
              validationSchema={lectureValidationSchema}
              onSubmit={handleSubmitLecture}
              enableReinitialize
            >
              {({ isSubmitting, values, setFieldValue }) => (
                <Form className="px-6 py-5 space-y-4">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                  Tiêu đề bài giảng <span className="text-red-500">*</span>
                </label>
                <Field
                  type="text"
                  id="title"
                  name="title"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                  placeholder="VD: Bài 1 - Chào hỏi cơ bản"
                />
                <ErrorMessage name="title" component="div" className="text-red-500 text-xs mt-1" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="contentType" className="block text-sm font-medium text-gray-700 mb-1">
                    Loại nội dung <span className="text-red-500">*</span>
                  </label>
                  <Field
                    as="select"
                    id="contentType"
                    name="contentType"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                  >
                    <option value="video">Video</option>
                  </Field>
                  <ErrorMessage name="contentType" component="div" className="text-red-500 text-xs mt-1" />
                </div>
                <div>
                  <label htmlFor="orderIndex" className="block text-sm font-medium text-gray-700 mb-1">
                    Thứ tự bài <span className="text-red-500">*</span>
                  </label>
                  <Field
                    type="number"
                    id="orderIndex"
                    name="orderIndex"
                    min={1}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                  />
                  <ErrorMessage name="orderIndex" component="div" className="text-red-500 text-xs mt-1" />
                </div>
              </div>
                            
              <div>
                <label htmlFor="s3Key" className="block text-sm font-medium text-gray-700 mb-1">
                  S3 Key / URL nội dung <span className="text-red-500">*</span>
                </label>
                <Field
                  type="text"
                  id="s3Key"
                  name="s3Key"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                  placeholder="courses/english-a2/lesson1.mp4"
                />
                <ErrorMessage name="s3Key" component="div" className="text-red-500 text-xs mt-1" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="durationSeconds" className="block text-sm font-medium text-gray-700 mb-1">
                    Thời lượng (giây) <span className="text-red-500">*</span>
                  </label>
                  <Field
                    type="number"
                    id="durationSeconds"
                    name="durationSeconds"
                    min={0}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400"
                  />
                  <ErrorMessage name="durationSeconds" component="div" className="text-red-500 text-xs mt-1" />
                </div>
                <div className="flex items-center gap-2 mt-6 md:mt-8">
                  <Field
                    id="published"
                    name="published"
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                  />
                  <label
                    htmlFor="published"
                    className="text-sm text-gray-700"
                  >
                    Công khai ngay
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-gray-100 mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingLecture(false);
                    setEditingLecture(null);
                  }}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Hủy
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium shadow hover:bg-indigo-700 disabled:opacity-70"
                >
                  {isSubmitting
                    ? 'Đang lưu...'
                    : editingLecture
                    ? 'Cập nhật bài giảng'
                    : 'Lưu bài giảng'}
                </button>
              </div>
            </Form>
              )}
            </Formik>
                        </div>
                    </div>
                )}

      {/* MODAL XÁC NHẬN XÓA BÀI GIẢNG */}
      {lectureToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 animate-slide-up">
            <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                  <AlertTriangle className="text-red-600" size={24} />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 text-lg">
                    Xác nhận xóa bài giảng
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Hành động này không thể hoàn tác
                  </p>
                </div>
              </div>
              {!isDeleting && (
                <button
                  type="button"
                  onClick={handleCloseDeleteConfirm}
                  className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition"
                >
                  <X size={20} />
                </button>
              )}
            </div>

            <div className="px-6 py-6">
              <p className="text-gray-700 mb-2">
                Bạn có chắc chắn muốn xóa bài giảng này không?
              </p>
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                <p className="font-medium text-gray-900 text-sm">
                  {lectureToDelete.title}
                </p>
                {lectureToDelete.contentType && (
                  <p className="text-xs text-gray-500 mt-1">
                    Loại nội dung: {lectureToDelete.contentType}
                  </p>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-5 border-t border-gray-100 bg-gray-50/50">
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleCloseDeleteConfirm}
                className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-white transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="px-6 py-2.5 rounded-lg bg-red-600 text-white font-medium hover:bg-red-700 shadow-lg transition disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Đang xóa...</span>
                  </>
                ) : (
                  <>
                    <Trash2 size={18} />
                    <span>Xóa bài giảng</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
        </div>
    );
}