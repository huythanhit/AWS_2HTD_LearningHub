import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Play } from "lucide-react";
import { getLectureDetail, updateLectureProgress } from "../../services/memberService";
import { toast } from "react-toastify";

export default function MemberLectureView() {
  const navigate = useNavigate();
  const { courseId, lectureId } = useParams();
  const [lecture, setLecture] = useState(null);
  const [videoUrl, setVideoUrl] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const progressUpdateIntervalRef = useRef(null);
  const lastProgressUpdateRef = useRef(0);

  useEffect(() => {
    if (!courseId || !lectureId) {
      setError("Không tìm thấy mã khóa học hoặc bài giảng.");
      setLoading(false);
      return;
    }

    const fetchLecture = async () => {
      setLoading(true);
      setError(null);
      try {
        // Lấy chi tiết bài giảng
        const lectureData = await getLectureDetail(courseId, lectureId);
        setLecture(lectureData);

        // Backend đã trả về URL đầy đủ từ s3Key bằng getS3Url()
        if (!lectureData?.url) {
          setError("Bài giảng không có file video");
          return;
        }

        // Sử dụng URL trực tiếp từ backend (bucket đang public)
        const finalVideoUrl = lectureData.url;
        console.log('[MemberLectureView] Video URL:', finalVideoUrl);
        
        setVideoUrl(finalVideoUrl);
      } catch (err) {
        setError(err?.message || "Không thể tải thông tin bài giảng.");
      } finally {
        setLoading(false);
      }
    };

    fetchLecture();

    // Cleanup: clear interval khi component unmount
    return () => {
      if (progressUpdateIntervalRef.current) {
        clearInterval(progressUpdateIntervalRef.current);
        progressUpdateIntervalRef.current = null;
      }
    };
  }, [courseId, lectureId]);

  const formatDuration = (seconds) => {
    if (!seconds) return "0 phút";
    const minutes = Math.floor(seconds / 60);
    return `${minutes} phút`;
  };

  // Hàm cập nhật tiến độ bài giảng
  const handleUpdateProgress = async (watchedSeconds, completed = false) => {
    if (!courseId || !lectureId || !lecture) return;

    try {
      // Chỉ cập nhật nếu thời gian đã thay đổi đáng kể (ít nhất 5 giây) để tránh spam API
      const timeDiff = Math.abs(watchedSeconds - lastProgressUpdateRef.current);
      if (timeDiff < 5 && !completed) {
        return;
      }

      await updateLectureProgress(courseId, lectureId, watchedSeconds, completed);
      lastProgressUpdateRef.current = watchedSeconds;
    } catch (err) {
      // Không hiển thị lỗi cho user vì đây là background update
      // Chỉ log trong development
      if (process.env.NODE_ENV === 'development') {
        console.error("Error updating progress:", err);
      }
    }
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center gap-4">
        <button
          onClick={() => {
            // Luôn quay về trang chi tiết khóa học thay vì dùng navigate(-1) để tránh vòng lặp
            navigate(`/member/course/${courseId}`, { replace: false });
          }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-[#5a4d8c] hover:border-[#8c78ec] transition"
        >
          <ArrowLeft size={18} />
          Quay lại
        </button>
        <h1 className="text-2xl font-bold text-[#5a4d8c]">Xem bài giảng</h1>
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

      {!loading && !error && lecture && (
        <div className="space-y-6">
          <div className="bg-white border border-gray-100 rounded-3xl shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {lecture.title || "Bài giảng"}
            </h2>
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
              <span>Thời lượng: {formatDuration(lecture.durationSeconds)}</span>
              <span>•</span>
              <span>Loại: {lecture.contentType || "video"}</span>
            </div>

            {videoUrl ? (
              <div className="w-full bg-black rounded-2xl overflow-hidden flex items-center justify-center" style={{ minHeight: '300px', maxHeight: '85vh' }}>
                <video
                  ref={videoRef}
                  controls
                  preload="metadata"
                  crossOrigin="anonymous"
                  className="w-full h-auto max-w-full max-h-[85vh]"
                  style={{ objectFit: 'contain', display: 'block' }}
                  src={videoUrl}
                  onError={(e) => {
                    const video = e.target;
                    const error = video.error;
                    
                    // Prevent infinite loop - chỉ log error một lần
                    if (video.dataset.errorLogged === 'true') {
                      return;
                    }
                    video.dataset.errorLogged = 'true';
                    
                    const currentSrc = video.currentSrc || videoUrl || '';
                    
                    console.error("Video playback error:", {
                      code: error?.code,
                      message: error?.message,
                      src: currentSrc.substring(0, 100),
                    });
                    
                    let errorMsg = "Không thể phát video. ";
                    if (error) {
                      switch (error.code) {
                        case error.MEDIA_ERR_ABORTED:
                          errorMsg += "Video bị hủy.";
                          break;
                        case error.MEDIA_ERR_NETWORK:
                          errorMsg += "Lỗi mạng. Vui lòng kiểm tra kết nối.";
                          break;
                        case error.MEDIA_ERR_DECODE:
                          errorMsg += "Lỗi giải mã video.";
                          break;
                        case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                          errorMsg += "Định dạng video không được hỗ trợ hoặc URL không hợp lệ.";
                          break;
                        default:
                          errorMsg += error.message || "Vui lòng thử lại.";
                      }
                    }
                    
                    toast.error(errorMsg);
                    setError(errorMsg);
                  }}
                  onLoadedMetadata={() => {
                    if (videoRef.current && videoRef.current.duration) {
                      console.log("Video loaded:", {
                        duration: Math.floor(videoRef.current.duration),
                        dimensions: `${videoRef.current.videoWidth}x${videoRef.current.videoHeight}`,
                      });
                    }
                  }}
                  onTimeUpdate={(e) => {
                    const video = e.target;
                    if (!video.duration || isNaN(video.duration) || !video.currentTime) return;
                    
                    const currentTime = Math.floor(video.currentTime);
                    const duration = Math.floor(video.duration);
                    
                    // Cập nhật tiến độ mỗi 10 giây hoặc khi gần hết video
                    if (currentTime % 10 === 0 || currentTime >= duration - 2) {
                      handleUpdateProgress(currentTime, false);
                    }
                  }}
                  onEnded={(e) => {
                    const video = e.target;
                    if (video.duration && !isNaN(video.duration)) {
                      const duration = Math.floor(video.duration);
                      handleUpdateProgress(duration, true);
                      toast.success("Bạn đã hoàn thành bài giảng này!");
                    }
                  }}
                  onPlay={() => {
                    // Bắt đầu cập nhật tiến độ định kỳ
                    if (progressUpdateIntervalRef.current) {
                      clearInterval(progressUpdateIntervalRef.current);
                    }
                    progressUpdateIntervalRef.current = setInterval(() => {
                      if (videoRef.current && !videoRef.current.paused && videoRef.current.currentTime) {
                        const currentTime = Math.floor(videoRef.current.currentTime);
                        handleUpdateProgress(currentTime, false);
                      }
                    }, 10000); // Cập nhật mỗi 10 giây
                  }}
                  onPause={() => {
                    // Cập nhật tiến độ khi pause
                    if (videoRef.current && videoRef.current.currentTime) {
                      const currentTime = Math.floor(videoRef.current.currentTime);
                      handleUpdateProgress(currentTime, false);
                    }
                  }}
                >
                  Trình duyệt của bạn không hỗ trợ video.
                </video>
              </div>
            ) : (
              <div className="w-full bg-gray-100 rounded-2xl flex items-center justify-center" style={{ minHeight: '300px', maxHeight: '85vh' }}>
                <div className="text-center">
                  <Play size={48} className="text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Đang tải video...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

