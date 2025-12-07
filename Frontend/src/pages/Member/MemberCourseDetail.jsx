import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  DollarSign,
  Loader2,
  User,
} from "lucide-react";
import { getCourseDetail } from "../../services/memberService";

const formatDateTime = (value) => {
  if (!value) return "Chưa xác định";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa xác định";
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const renderDescription = (value) => {
  if (!value) return "Chưa có mô tả cho khóa học này.";
  return value.split(/\n+/).map((paragraph, index) => (
    <p key={index} className="text-gray-600 leading-relaxed">
      {paragraph}
    </p>
  ));
};

export default function MemberCourseDetail() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!courseId) {
      setError("Không tìm thấy mã khóa học.");
      setLoading(false);
      return;
    }

    const fetchDetail = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getCourseDetail(courseId);
        setCourse(data || null);
      } catch (err) {
        setCourse(null);
        setError(err?.message || "Không thể tải thông tin khóa học.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [courseId]);

  const teachers = useMemo(() => {
    if (!course?.teachers || !Array.isArray(course.teachers)) return [];
    return course.teachers.map((teacher) => ({
      id: teacher.teacherId || teacher.id,
      name: teacher.fullName || teacher.name || teacher.email || "Giảng viên",
      email: teacher.email || null,
    }));
  }, [course]);

  const lectures = useMemo(() => {
    if (!course?.lectures || !Array.isArray(course.lectures)) return [];
    return course.lectures;
  }, [course]);

  const priceLabel = useMemo(() => {
    if (course?.price === 0) return "Miễn phí";
    if (course?.price && course?.currency) {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: course.currency,
      }).format(course.price);
    }
    if (course?.price) return `${course.price}`;
    return "Chưa cập nhật";
  }, [course]);

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-[#5a4d8c] hover:border-[#8c78ec] transition"
        >
          <ArrowLeft size={18} />
          Quay lại
        </button>
        <h1 className="text-2xl font-bold text-[#5a4d8c]">Chi tiết khóa học</h1>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-[#8c78ec]" size={36} />
        </div>
      )}

      {!loading && error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-2xl">
          {error}
        </div>
      )}

      {!loading && !error && course && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-8 space-y-6">
            <div className="flex flex-col gap-4">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-50 text-[#5a4d8c] w-fit">
                <BookOpen size={16} />
                {course.slug || "Khóa học"}
              </span>
              <h2 className="text-3xl font-extrabold text-gray-900">
                {course.title || "Chưa có tên khóa học"}
              </h2>
              <p className="text-base text-gray-600">
                {course.shortDescription || "Khóa học chưa có mô tả ngắn."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-indigo-50/60 rounded-2xl p-4 border border-indigo-100">
                <p className="text-xs font-semibold uppercase text-[#5a4d8c] tracking-wider mb-1">
                  Thời gian xuất bản
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar size={16} className="text-[#8c78ec]" />
                  {formatDateTime(course.publishedAt || course.createdAt)}
                </div>
              </div>
              <div className="bg-emerald-50/60 rounded-2xl p-4 border border-emerald-100">
                <p className="text-xs font-semibold uppercase text-emerald-600 tracking-wider mb-1">
                  Học phí
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <DollarSign size={16} className="text-emerald-500" />
                  {priceLabel}
                </div>
              </div>
              <div className="bg-purple-50/60 rounded-2xl p-4 border border-purple-100">
                <p className="text-xs font-semibold uppercase text-purple-600 tracking-wider mb-1">
                  Trạng thái
                </p>
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-gray-700">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      course.published ? "bg-emerald-500" : "bg-gray-400"
                    }`}
                  />
                  {course.published ? "Đang mở" : "Chưa phát hành"}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-gray-800">
                Mô tả chi tiết
              </h3>
              <div className="flex flex-col gap-3 bg-gray-50 border border-gray-100 rounded-2xl p-5 text-sm">
                {renderDescription(course.description)}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 space-y-4 lg:col-span-1">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <User size={18} className="text-[#8c78ec]" />
                Giảng viên
              </h3>
              {teachers.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Chưa có giảng viên được gán cho khóa học này.
                </p>
              ) : (
                <ul className="space-y-3">
                  {teachers.map((teacher) => (
                    <li
                      key={teacher.id}
                      className="bg-gray-50 border border-gray-100 rounded-2xl p-3"
                    >
                      <p className="text-sm font-semibold text-gray-800">
                        {teacher.name}
                      </p>
                      {teacher.email && (
                        <p className="text-xs text-gray-500 mt-1">
                          {teacher.email}
                        </p>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6 space-y-4 lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                <BookOpen size={18} className="text-[#8c78ec]" />
                Danh sách bài giảng
              </h3>

              {lectures.length === 0 ? (
                <div className="border border-dashed border-gray-200 rounded-2xl p-6 text-center text-sm text-gray-500">
                  Khóa học chưa có bài giảng nào.
                </div>
              ) : (
                <ul className="space-y-3">
                  {lectures.map((lecture, index) => (
                    <li
                      key={lecture.lectureId || lecture.id || index}
                      className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3 flex flex-col gap-1"
                    >
                      <span className="text-sm font-semibold text-gray-800">
                        {lecture.title || `Bài giảng ${index + 1}`}
                      </span>
                      {lecture.durationMinutes && (
                        <span className="text-xs text-gray-500">
                          Thời lượng: {lecture.durationMinutes} phút
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
