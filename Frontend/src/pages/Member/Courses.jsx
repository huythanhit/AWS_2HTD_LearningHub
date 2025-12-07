import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
  } from "react";
  import { useNavigate } from "react-router-dom";
  import { CheckCircle, Clock, PlayCircle, Search, Trophy } from "lucide-react";
  import { getMyCourses } from "../../services/memberService";
  
  const PLACEHOLDER_IMAGES = [
    "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1000&auto=format&fit=crop",
    "https://images.unsplash.com/photo-1472289065668-ce650ac443d2?q=80&w=1000&auto=format&fit=crop",
  ];
  
  const STATUS_LABEL = {
    "in-progress": "Đang học",
    completed: "Đã hoàn thành",
  };
  
  const normalizeStatus = (value) => {
    if (!value) return "in-progress";
    const key = value.toString().toLowerCase();
    if (["completed", "complete", "done", "finished"].includes(key)) {
      return "completed";
    }
    if (
      ["active", "in-progress", "progress", "ongoing", "started"].includes(key)
    ) {
      return "in-progress";
    }
    return "in-progress";
  };
  
  const clampPercent = (value) => {
    const number = Number(value);
    if (!Number.isFinite(number)) return 0;
    return Math.min(100, Math.max(0, Math.round(number)));
  };
  
  const formatDate = (value) => {
    if (!value) return "Chưa có dữ liệu";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "Chưa có dữ liệu";
    return date.toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };
  
  const hashToIndex = (key) => {
    if (!key) return 0;
    let hash = 0;
    for (let i = 0; i < key.length; i += 1) {
      hash = (hash << 5) - hash + key.charCodeAt(i);
      hash |= 0;
    }
    const length = PLACEHOLDER_IMAGES.length || 1;
    return Math.abs(hash) % length;
  };
  
  const mapCourse = (course) => {
    const id = course?.courseId || course?.id || "";
    const status = normalizeStatus(course?.status);
    return {
      id,
      title: course?.title || "Khóa học chưa đặt tên",
      shortDescription: course?.shortDescription || "",
      progress: clampPercent(course?.progressPercent),
      status,
      statusLabel:
        STATUS_LABEL[status] || course?.status || "Trạng thái chưa xác định",
      originalStatus: course?.status ?? null,
      enrolledAt: course?.enrolledAt ?? null,
      enrolledDate: formatDate(course?.enrolledAt),
      image: PLACEHOLDER_IMAGES[hashToIndex(id)],
      hasRoute: Boolean(id),
    };
  };
  
  export default function Courses() {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [filterStatus, setFilterStatus] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
  
    const isMountedRef = useRef(true);
  
    useEffect(() => {
      isMountedRef.current = true;
      return () => {
        isMountedRef.current = false;
      };
    }, []);
  
    const fetchCourses = useCallback(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getMyCourses();
        if (!isMountedRef.current) return;
        const mapped = (Array.isArray(data) ? data : []).map(mapCourse);
        setCourses(mapped);
      } catch (err) {
        if (!isMountedRef.current) return;
        setCourses([]);
        setError(err?.message || "Không thể tải dữ liệu khóa học.");
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
        }
      }
    }, []);
  
    useEffect(() => {
      fetchCourses();
    }, [fetchCourses]);
  
    const totalCourses = courses.length;
    const completedCount = useMemo(
      () => courses.filter((course) => course.status === "completed").length,
      [courses]
    );
    const inProgressCount = useMemo(
      () => courses.filter((course) => course.status === "in-progress").length,
      [courses]
    );
  
    const filteredCourses = useMemo(() => {
      const normalizedSearch = searchTerm.trim().toLowerCase();
      return courses.filter((course) => {
        const matchesStatus =
          filterStatus === "all" || course.status === filterStatus;
        if (!matchesStatus) return false;
  
        if (!normalizedSearch) return true;
        const title = course.title?.toLowerCase() || "";
        const description = course.shortDescription?.toLowerCase() || "";
        return (
          title.includes(normalizedSearch) ||
          description.includes(normalizedSearch)
        );
      });
    }, [courses, filterStatus, searchTerm]);
  
    return (
      <div className="w-full space-y-8 pb-10">
        <div className="relative overflow-hidden bg-gradient-to-r from-purple-50/100 to-indigo-50/100 backdrop-blur-xl p-8 rounded-3xl border border-white/60 shadow-sm">
          <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-purple-200/40 rounded-full blur-[80px]"></div>
          <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-60 h-60 bg-indigo-200/40 rounded-full blur-[60px]"></div>
  
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <h1 className="text-3xl font-extrabold text-[#5a4d8c] mb-2">
                Khóa học của tôi
              </h1>
              <p className="text-gray-600 max-w-lg">
                Tiếp tục hành trình chinh phục tri thức. Hãy hoàn thành các bài
                học còn dang dở.
              </p>
            </div>
  
            <div className="flex gap-3 bg-white/60 backdrop-blur-md p-2 rounded-2xl border border-white/50 shadow-sm">
              <div className="px-4 py-2 text-center border-r border-gray-200">
                <div className="text-[#5a4d8c] font-bold text-xl">
                  {totalCourses}
                </div>
                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                  Tổng
                </div>
              </div>
              <div className="px-4 py-2 text-center border-r border-gray-200">
                <div className="text-emerald-600 font-bold text-xl">
                  {completedCount}
                </div>
                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                  Xong
                </div>
              </div>
              <div className="px-4 py-2 text-center">
                <div className="text-indigo-600 font-bold text-xl">
                  {inProgressCount}
                </div>
                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">
                  Đang học
                </div>
              </div>
            </div>
          </div>
        </div>
  
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100 flex gap-1">
            {[
              { key: "all", label: "Tất cả" },
              { key: "in-progress", label: "Đang học" },
              { key: "completed", label: "Đã hoàn thành" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilterStatus(tab.key)}
                className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  filterStatus === tab.key
                    ? "bg-[#8c78ec] text-white shadow-md shadow-purple-200"
                    : "text-gray-500 hover:bg-gray-50 hover:text-[#5a4d8c]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
  
          <div className="relative group w-full md:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 group-hover:text-[#8c78ec] transition-colors" />
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Tìm tên hoặc mô tả khóa học..."
              className="w-full md:w-64 pl-10 pr-4 py-3 bg-white border border-gray-100 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#8c78ec]/20 focus:border-[#8c78ec] transition-all shadow-sm"
            />
          </div>
        </div>
  
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-2xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <span>{error}</span>
            <button
              onClick={fetchCourses}
              className="px-4 py-2 bg-white text-red-600 rounded-xl font-semibold border border-red-200 hover:bg-red-100 transition"
            >
              Thử lại
            </button>
          </div>
        )}
  
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm h-[360px] flex flex-col animate-pulse"
              >
                <div className="h-48 rounded-2xl mb-5 bg-gray-200" />
                <div className="h-4 bg-gray-200 rounded mb-3 w-3/4" />
                <div className="h-3 bg-gray-200 rounded mb-2 w-full" />
                <div className="h-3 bg-gray-200 rounded mb-6 w-5/6" />
                <div className="h-10 bg-gray-200 rounded-xl mt-auto" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {filteredCourses.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredCourses.map((course) => {
                  const cardKey = course.id || course.title;
                  const isCompleted = course.status === "completed";
                  const buttonBaseClass = isCompleted
                    ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100"
                    : "bg-[#8c78ec] text-white hover:bg-[#7a66d3] shadow-lg shadow-indigo-200 hover:shadow-indigo-300 hover:-translate-y-1";
  
                  return (
                    <div
                      key={cardKey}
                      className="group bg-white rounded-3xl p-5 border border-gray-100 shadow-sm hover:shadow-xl hover:shadow-indigo-100/50 transition-all duration-300 flex flex-col h-full relative"
                    >
                      <div className="absolute top-8 right-8 z-20">
                        <span
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold border backdrop-blur-md shadow-sm ${
                            isCompleted
                              ? "bg-white/90 text-green-600 border-green-100"
                              : "bg-white/90 text-indigo-600 border-indigo-100"
                          }`}
                        >
                          {course.statusLabel}
                        </span>
                      </div>
  
                      <div className="h-48 rounded-2xl mb-5 relative overflow-hidden shadow-inner group-hover:shadow-md transition-all">
                        <img
                          src={course.image}
                          alt={course.title}
                          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
  
                      <div className="flex-1 flex flex-col">
                        <h3
                          className="text-lg font-bold text-gray-800 mb-2 group-hover:text-[#8c78ec] transition-colors line-clamp-2"
                          title={course.title}
                        >
                          {course.title}
                        </h3>
                        <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                          {course.shortDescription ||
                            "Chưa có mô tả cho khóa học này."}
                        </p>
  
                        <div className="mb-5 bg-gray-50 p-3 rounded-xl border border-gray-100">
                          <div className="flex justify-between items-end mb-2">
                            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                              Tiến độ
                            </span>
                            <span className="text-sm font-bold text-[#5a4d8c]">
                              {course.progress}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                                isCompleted
                                  ? "bg-gradient-to-r from-emerald-400 to-green-500"
                                  : "bg-gradient-to-r from-[#8c78ec] to-[#5a4d8c]"
                              }`}
                              style={{ width: `${course.progress}%` }}
                            ></div>
                          </div>
                        </div>
  
                        <div className="flex flex-wrap items-center gap-4 mb-5 text-sm text-gray-500 border-t border-gray-100 pt-4">
                          <div className="flex items-center gap-1.5">
                            <CheckCircle
                              size={16}
                              className={
                                isCompleted
                                  ? "text-emerald-500"
                                  : "text-[#8c78ec]"
                              }
                            />
                            <span>{course.statusLabel}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Clock size={16} className="text-[#8c78ec]" />
                            <span>Đăng ký: {course.enrolledDate}</span>
                          </div>
                        </div>
  
                        <button
                          onClick={() =>
                            course.hasRoute &&
                            navigate(`/member/course/${course.id}`)
                          }
                          disabled={!course.hasRoute}
                          className={`mt-auto w-full py-3.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all duration-300 ${buttonBaseClass} disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none`}
                        >
                          {isCompleted ? (
                            <>
                              <Trophy size={18} /> Xem chứng chỉ
                            </>
                          ) : (
                            <>
                              <PlayCircle size={18} /> Vào học ngay
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
  
            {!error && filteredCourses.length === 0 && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                  <Search size={40} className="text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">
                  Không tìm thấy kết quả
                </h3>
                <p className="text-gray-500 mb-6">
                  Thử thay đổi bộ lọc hoặc tìm kiếm từ khóa khác.
                </p>
                <button
                  onClick={() => {
                    setFilterStatus("all");
                    setSearchTerm("");
                  }}
                  className="px-8 py-3 bg-[#8c78ec] text-white rounded-xl font-bold hover:bg-[#7a66d3] transition shadow-lg"
                >
                  Xem tất cả khóa học
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  }
  