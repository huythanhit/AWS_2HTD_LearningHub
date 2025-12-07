import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Award,
  ArrowRight,
  BookOpen,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Loader2,
  Target,
  TrendingUp,
  Zap,
} from "lucide-react";
import {
  enrollCourse,
  getPublishedCourses,
} from "../../services/memberService";

const formatDateTime = (value) => {
  if (!value) return "Chưa cập nhật";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa cập nhật";
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDate = (value) => {
  if (!value) return "Chưa cập nhật";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Chưa cập nhật";
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const formatCurrency = (price, currency) => {
  if (price === null || price === undefined) {
    return "Chưa cập nhật";
  }
  const numericPrice = Number(price);
  if (!Number.isFinite(numericPrice)) return "Chưa cập nhật";
  if (numericPrice === 0) return "Miễn phí";

  if (currency) {
    try {
      return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: currency.toUpperCase(),
      }).format(numericPrice);
    } catch (err) {
      return `${numericPrice} ${currency}`;
    }
  }

  return `${numericPrice}`;
};

const mapCourse = (course) => {
  const rawPrice =
    typeof course?.price === "number"
      ? course.price
      : Number(course?.price ?? NaN);
  const price = Number.isFinite(rawPrice) ? rawPrice : null;
  const publishedAt = course?.publishedAt || course?.createdAt || null;
  const publishedMs = (() => {
    if (!publishedAt) return null;
    const date = new Date(publishedAt);
    return Number.isNaN(date.getTime()) ? null : date.getTime();
  })();

  return {
    id: course?.courseId || course?.id || "",
    slug: course?.slug || "",
    title: course?.title || "Khóa học chưa đặt tên",
    shortDescription: course?.shortDescription || "",
    price,
    currency: course?.currency || "VND",
    publishedAt,
    publishedMs,
    publishedDate: formatDate(publishedAt),
    publishedDateTime: formatDateTime(publishedAt),
    isFree: price === 0,
  };
};

export default function MemberDashboard() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [joinStatus, setJoinStatus] = useState({});

  useEffect(() => {
    let active = true;

    const fetchCourses = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getPublishedCourses();
        if (!active) return;

        const mapped = (Array.isArray(response) ? response : []).map(mapCourse);
        setCourses(mapped);
      } catch (err) {
        if (!active) return;
        setCourses([]);
        setError(err?.message || "Không thể tải danh sách khóa học.");
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    fetchCourses();

    return () => {
      active = false;
    };
  }, []);

  const metrics = useMemo(() => {
    if (courses.length === 0) {
      return {
        total: 0,
        freeCount: 0,
        paidCount: 0,
        freePercent: 0,
        latestPublishedLabel: "Chưa có dữ liệu",
        latestCourseTitle: "Chưa có dữ liệu",
        cheapestPaidLabel: "Chưa cập nhật",
      };
    }

    const total = courses.length;
    const freeCount = courses.filter((item) => item.isFree).length;
    const paidCount = total - freeCount;
    const freePercent = total > 0 ? Math.round((freeCount / total) * 100) : 0;

    let latestCourse = null;
    let latestTime = null;
    courses.forEach((item) => {
      const time = item.publishedMs;
      if (time === null) return;
      if (latestTime === null || time > latestTime) {
        latestTime = time;
        latestCourse = item;
      }
    });

    const paidCourses = courses.filter(
      (item) => !item.isFree && item.price !== null
    );
    const cheapestPaid = paidCourses.reduce((min, item) => {
      if (!min) return item;
      if (item.price !== null && item.price < min.price) return item;
      return min;
    }, null);

    return {
      total,
      freeCount,
      paidCount,
      freePercent,
      latestPublishedLabel:
        latestCourse?.publishedDateTime ?? "Chưa có dữ liệu",
      latestCourseTitle: latestCourse?.title ?? "Chưa có dữ liệu",
      cheapestPaidLabel: cheapestPaid
        ? formatCurrency(cheapestPaid.price, cheapestPaid.currency)
        : "Chưa cập nhật",
    };
  }, [courses]);

  const latestCourses = useMemo(() => {
    if (courses.length === 0) return [];
    return [...courses]
      .sort((a, b) => (b.publishedMs ?? 0) - (a.publishedMs ?? 0))
      .slice(0, 6);
  }, [courses]);

  const highlightCourse = latestCourses.length > 0 ? latestCourses[0] : null;
  const highlightJoinState = highlightCourse
    ? joinStatus[highlightCourse.id] || {}
    : {};

  const statusIndicatorClass = loading
    ? "bg-amber-400"
    : error
    ? "bg-red-400"
    : "bg-emerald-400";

  const statusLabel = loading
    ? "Đang tải dữ liệu khóa học"
    : error
    ? "Không thể đồng bộ"
    : "Đã đồng bộ khóa học";

  const handleOpenCourse = useCallback(
    (courseId) => {
      if (!courseId) return;
      navigate(`/member/course/${courseId}`);
    },
    [navigate]
  );

  const handleJoinCourse = useCallback(async (courseId) => {
    if (!courseId) return;

    setJoinStatus((prev) => ({
      ...prev,
      [courseId]: {
        loading: true,
        success: prev[courseId]?.success ?? false,
        error: null,
      },
    }));

    try {
      await enrollCourse(courseId);
      setJoinStatus((prev) => ({
        ...prev,
        [courseId]: {
          loading: false,
          success: true,
          error: null,
        },
      }));
    } catch (err) {
      setJoinStatus((prev) => ({
        ...prev,
        [courseId]: {
          loading: false,
          success: false,
          error: err?.message || "Đăng ký khóa học thất bại. Vui lòng thử lại.",
        },
      }));
    }
  }, []);

  return (
    <div className="w-full">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="relative overflow-hidden bg-gradient-to-r from-purple-50/100 to-indigo-50/100 backdrop-blur-xl p-8 md:p-10 rounded-3xl border border-white/60 shadow-sm">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-purple-200/40 rounded-full blur-[80px]"></div>
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-60 h-60 bg-indigo-200/40 rounded-full blur-[60px]"></div>

          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <div className="flex items-center gap-2 mb-3 bg-white/80 w-fit px-3 py-1 rounded-full border border-purple-100 shadow-sm backdrop-blur-sm">
                <span
                  className={`w-2 h-2 rounded-full ${statusIndicatorClass}`}
                ></span>
                <span className="text-xs font-semibold tracking-wide uppercase text-gray-500">
                  {statusLabel}
                </span>
              </div>

              <h1 className="text-3xl md:text-4xl font-extrabold mb-2 text-gray-800">
                Xin chào,{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                  học viên!
                </span>{" "}
                🚀
              </h1>
              <p className="text-gray-500 text-lg max-w-xl font-medium">
                Bạn đang có{" "}
                <span className="font-semibold text-[#5a4d8c]">
                  {metrics.total}
                </span>{" "}
                khóa học đang mở đăng ký. Khám phá và chọn hành trình phù hợp
                nhất với bạn.
              </p>
            </div>

            <div className="flex items-center gap-3 bg-white/60 backdrop-blur-md text-gray-800 px-5 py-3 rounded-2xl shadow-sm border border-white/50 font-bold">
              <div className="p-2 bg-yellow-100 text-yellow-600 rounded-full">
                <Award size={24} />
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase font-normal">
                  Khóa học mới nhất
                </p>
                <p className="text-indigo-900">{metrics.latestCourseTitle}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-center justify-center relative overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-b from-indigo-50/60 to-transparent opacity-60"></div>

            <div className="relative z-10 w-full">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Target className="text-[#8c78ec]" size={20} />
                  Tỷ lệ khóa học miễn phí
                </h2>
                <span className="bg-[#8c78ec]/10 text-[#8c78ec] text-xs font-bold px-2 py-1 rounded-lg">
                  Hệ thống
                </span>
              </div>

              <div className="flex justify-center items-center py-2">
                <CircularProgress percentage={metrics.freePercent} />
              </div>

              <div className="text-center mt-6">
                <p className="text-gray-500 text-sm mb-1">Khoá học miễn phí</p>
                <div className="text-2xl font-bold text-gray-800">
                  {metrics.freeCount}{" "}
                  <span className="text-gray-400 text-lg font-normal">
                    / {metrics.total} khóa học
                  </span>
                </div>

                <button
                  onClick={() => navigate("/member/courses")}
                  className="mt-6 w-full py-3 rounded-xl bg-[#8c78ec] text-white font-semibold hover:bg-[#7a66d3] transition-colors shadow-lg shadow-indigo-200 hover:shadow-indigo-300 flex items-center justify-center gap-2"
                >
                  Khám phá khóa học
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-8 flex flex-col gap-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <StatCard
                icon={BookOpen}
                label="Tổng khóa học"
                value={metrics.total}
                subValue={`Cập nhật: ${metrics.latestPublishedLabel}`}
                theme="blue"
              />
              <StatCard
                icon={CheckCircle}
                label="Miễn phí"
                value={metrics.freeCount}
                subValue={`${metrics.freePercent}% tổng số`}
                theme="green"
              />
              <StatCard
                icon={DollarSign}
                label="Có phí"
                value={metrics.paidCount}
                subValue={`Giá thấp nhất: ${metrics.cheapestPaidLabel}`}
                theme="orange"
              />
            </div>

            <div className="flex-1 bg-gradient-to-r from-[#2c2c54] to-[#474787] rounded-3xl p-8 relative overflow-hidden flex flex-col md:flex-row items-center justify-between text-white shadow-xl shadow-indigo-200">
              <div className="absolute right-0 top-0 h-full w-1/2 bg-white/5 skew-x-12 transform origin-bottom-right"></div>

              <div className="relative z-10 max-w-md">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-2 bg-pink-500 rounded-lg shadow-lg shadow-pink-500/40">
                    <Zap size={24} className="text-white" />
                  </div>
                  <h3 className="text-2xl font-bold">
                    {highlightCourse ? "Khóa học nổi bật" : "Đang cập nhật"}
                  </h3>
                </div>

                {highlightCourse ? (
                  <>
                    <h4 className="text-3xl font-extrabold mb-3">
                      {highlightCourse.title}
                    </h4>
                    <p className="text-indigo-200 mb-6 leading-relaxed">
                      {highlightCourse.shortDescription ||
                        "Khóa học đang cập nhật mô tả chi tiết."}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-indigo-200 mb-6">
                      <span className="inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
                        <Calendar size={16} className="text-white" />
                        {highlightCourse.publishedDateTime}
                      </span>
                      <span className="inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
                        <DollarSign size={16} className="text-white" />
                        {highlightCourse.isFree
                          ? "Miễn phí"
                          : formatCurrency(
                              highlightCourse.price,
                              highlightCourse.currency
                            )}
                      </span>
                    </div>
                    <div className="flex gap-3 flex-wrap">
                      <button
                        onClick={() => handleJoinCourse(highlightCourse.id)}
                        disabled={
                          highlightJoinState.loading ||
                          highlightJoinState.success
                        }
                        className="px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition shadow-lg bg-emerald-500 hover:bg-emerald-400 text-white disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-emerald-500"
                      >
                        {highlightJoinState.loading ? (
                          <>
                            <Loader2 size={18} className="animate-spin" />
                            Đang tham gia...
                          </>
                        ) : highlightJoinState.success ? (
                          "Đã tham gia"
                        ) : (
                          "Tham gia khóa học"
                        )}
                      </button>
                      <button
                        onClick={() => handleOpenCourse(highlightCourse.id)}
                        className="px-6 py-3 bg-white text-indigo-900 rounded-xl font-bold hover:bg-gray-50 transition shadow-lg active:scale-95"
                        disabled={highlightJoinState.loading}
                      >
                        Xem chi tiết
                      </button>
                      <button
                        onClick={() => navigate("/member/courses")}
                        className="px-6 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 transition backdrop-blur-sm"
                      >
                        Xem tất cả khóa học
                      </button>
                    </div>
                    {highlightJoinState.error && (
                      <p className="text-sm text-red-200 mt-3">
                        {highlightJoinState.error}
                      </p>
                    )}
                    {highlightJoinState.success && (
                      <p className="text-sm text-emerald-200 mt-3">
                        Bạn đã tham gia khóa học này.
                      </p>
                    )}
                  </>
                ) : (
                  <div className="text-indigo-200 space-y-4">
                    <p>
                      Chúng tôi đang cập nhật các khóa học mới nhất. Vui lòng
                      kiểm tra lại sau ít phút.
                    </p>
                    {loading && (
                      <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-full">
                        <Loader2 className="animate-spin" size={18} />
                        Đang tải dữ liệu...
                      </div>
                    )}
                    {error && <p className="text-red-200">{error}</p>}
                  </div>
                )}
              </div>

              <div className="hidden md:flex relative z-10 bg-white/10 p-6 rounded-2xl backdrop-blur-sm border border-white/10 flex-col items-center">
                <span className="text-4xl font-bold mb-1">{metrics.total}</span>
                <span className="text-xs uppercase tracking-wider opacity-70">
                  Tổng số khóa học
                </span>
              </div>
            </div>
          </div>
        </div>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Khóa học mới nhất
              </h2>
              <p className="text-sm text-gray-500">
                Danh sách được cập nhật theo thời gian phát hành mới nhất.
              </p>
            </div>
            <button
              onClick={() => navigate("/member/courses")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-[#5a4d8c] hover:border-[#8c78ec] transition"
            >
              Xem tất cả
              <ArrowRight size={16} />
            </button>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 animate-pulse space-y-4"
                >
                  <div className="flex justify-between">
                    <div className="h-6 bg-gray-200 rounded-full w-24" />
                    <div className="h-6 bg-gray-200 rounded-full w-20" />
                  </div>
                  <div className="h-6 bg-gray-200 rounded w-3/4" />
                  <div className="h-6 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded w-full" />
                  <div className="h-4 bg-gray-200 rounded w-5/6" />
                  <div className="h-10 bg-gray-200 rounded-xl mt-6" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-2xl">
              {error}
            </div>
          ) : latestCourses.length === 0 ? (
            <div className="border border-dashed border-gray-200 rounded-3xl p-10 text-center text-gray-500">
              Hiện chưa có khóa học nào được xuất bản.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {latestCourses.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onOpen={handleOpenCourse}
                  onJoin={handleJoinCourse}
                  joinState={joinStatus[course.id] || {}}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

const StatCard = ({ icon: Icon, label, value, subValue, theme }) => {
  const themes = {
    blue: {
      bg: "bg-blue-50",
      text: "text-blue-900",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      border: "border-blue-100",
    },
    green: {
      bg: "bg-emerald-50",
      text: "text-emerald-900",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      border: "border-emerald-100",
    },
    orange: {
      bg: "bg-orange-50",
      text: "text-orange-900",
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
      border: "border-orange-100",
    },
  };

  const palette = themes[theme] || themes.blue;

  return (
    <div
      className={`p-5 rounded-3xl border ${palette.border} ${palette.bg} transition-all hover:shadow-md hover:-translate-y-1 duration-300`}
    >
      <div className="flex justify-between items-start mb-4">
        <div
          className={`p-3 rounded-2xl ${palette.iconBg} ${palette.iconColor}`}
        >
          <Icon size={24} />
        </div>
        {theme === "green" && (
          <TrendingUp size={20} className="text-emerald-500" />
        )}
      </div>
      <div>
        <p className={`text-sm font-semibold opacity-70 ${palette.text}`}>
          {label}
        </p>
        <h4 className={`text-3xl font-extrabold ${palette.text} mt-1 mb-1`}>
          {value}
        </h4>
        <span
          className={`text-xs font-medium px-2 py-1 rounded-md bg-white/60 ${palette.text}`}
        >
          {subValue}
        </span>
      </div>
    </div>
  );
};

const CircularProgress = ({ percentage, size = 200, strokeWidth = 18 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const dash = circumference - (percentage / 100) * circumference;

  return (
    <div
      className="relative flex items-center justify-center drop-shadow-xl"
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#dashboardGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={dash}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient
            id="dashboardGradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="0%"
          >
            <stop offset="0%" stopColor="#8c78ec" />
            <stop offset="100%" stopColor="#7a66d3" />
          </linearGradient>
        </defs>
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-5xl font-extrabold text-gray-800">
          {Math.round(percentage)}%
        </span>
        <span className="text-xs text-[#8c78ec] font-bold uppercase tracking-wider mt-2 bg-white px-2 py-1 rounded-md">
          Miễn phí
        </span>
      </div>
    </div>
  );
};

const CourseCard = ({ course, onOpen, onJoin, joinState = {} }) => {
  const isJoining = Boolean(joinState.loading);
  const isJoined = Boolean(joinState.success);
  const joinError = joinState.error;

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 flex flex-col gap-4 hover:shadow-lg hover:shadow-indigo-100/60 transition-all duration-300">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-[#8c78ec] bg-indigo-50 px-3 py-1 rounded-full">
          {course.slug || "Khóa học"}
        </span>
        <span
          className={`text-xs font-semibold px-3 py-1 rounded-full ${
            course.isFree
              ? "bg-emerald-50 text-emerald-600 border border-emerald-100"
              : "bg-purple-50 text-purple-600 border border-purple-100"
          }`}
        >
          {course.isFree
            ? "Miễn phí"
            : formatCurrency(course.price, course.currency)}
        </span>
      </div>

      <div>
        <h4 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
          {course.title}
        </h4>
        <p className="text-sm text-gray-500 line-clamp-3">
          {course.shortDescription || "Khoá học đang cập nhật mô tả."}
        </p>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-1">
          <Calendar size={14} className="text-[#8c78ec]" />
          {course.publishedDate}
        </div>
        <div className="flex items-center gap-1">
          <Clock size={14} className="text-[#8c78ec]" />
          Phát hành
        </div>
      </div>

      <div className="mt-auto space-y-2">
        <button
          onClick={() => onJoin(course.id)}
          disabled={isJoining || isJoined}
          className="w-full py-3 rounded-xl bg-emerald-500 text-white font-semibold flex items-center justify-center gap-2 transition-all duration-300 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-emerald-500"
        >
          {isJoining ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Đang tham gia...
            </>
          ) : isJoined ? (
            "Đã tham gia"
          ) : (
            "Tham gia khóa học"
          )}
        </button>
        <button
          onClick={() => onOpen(course.id)}
          disabled={isJoining}
          className="w-full py-3 rounded-xl bg-[#8c78ec] text-white font-semibold hover:bg-[#7a66d3] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          Xem chi tiết
          <ArrowRight size={16} />
        </button>
        {joinError && (
          <p className="text-xs text-red-500 text-center">{joinError}</p>
        )}
        {isJoined && !joinError && (
          <p className="text-xs text-emerald-600 text-center">
            Bạn đã đăng ký khóa học này.
          </p>
        )}
      </div>
    </div>
  );
};
