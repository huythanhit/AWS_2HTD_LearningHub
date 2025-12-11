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
        console.log("Lecture data:", lectureData);
        setLecture(lectureData);

        // Lấy URL cho video - Backend đã trả về URL đầy đủ (giống avatar)
        let finalVideoUrl = null;
        
        if (lectureData?.url) {
          // Backend đã tạo URL đầy đủ từ s3Key bằng getS3Url()
          finalVideoUrl = lectureData.url;
          console.log("Using video URL from backend:", finalVideoUrl);
        } else if (lectureData?.s3Key) {
          // Fallback: Nếu backend chưa có URL (tương thích ngược)
          const s3Key = lectureData.s3Key;
          
          if (s3Key.startsWith('http://') || s3Key.startsWith('https://')) {
            // Đã là URL đầy đủ - clean nếu có presigned query string
            try {
              const url = new URL(s3Key);
              if (url.search && url.search.includes('X-Amz-')) {
                // Remove presigned query string, chỉ dùng public URL
                finalVideoUrl = `${url.protocol}//${url.host}${url.pathname}`;
                console.log("Cleaned presigned URL to public URL:", finalVideoUrl);
              } else {
                finalVideoUrl = s3Key;
              }
            } catch (err) {
              finalVideoUrl = s3Key;
            }
          } else {
            // Tạo public URL từ s3Key (giống getS3Url trong backend)
            const cleanKey = s3Key.startsWith('/') ? s3Key.substring(1) : s3Key;
            finalVideoUrl = `https://learninghub-app-bucket.s3.ap-southeast-1.amazonaws.com/${cleanKey}`;
            console.log("Fallback: Generated video URL from s3Key:", finalVideoUrl);
          }
        } else {
          console.error("No URL or s3Key in lecture data:", lectureData);
          setError("Bài giảng không có file video");
          return;
        }
        
        // Đảm bảo URL không có presigned query string (bucket đang public)
        if (finalVideoUrl && finalVideoUrl.includes('X-Amz-')) {
          try {
            const url = new URL(finalVideoUrl);
            finalVideoUrl = `${url.protocol}//${url.host}${url.pathname}`;
            console.log("Removed presigned query string, using public URL:", finalVideoUrl);
          } catch (err) {
            console.error("Error cleaning URL:", err);
          }
        }
        
        // Đảm bảo URL được format đúng cho video streaming
        if (finalVideoUrl) {
          try {
            const url = new URL(finalVideoUrl);
            // Pathname đã được encode tự động bởi URL constructor
            // Chỉ cần đảm bảo không có query string
            finalVideoUrl = `${url.protocol}//${url.host}${url.pathname}`;
            console.log("Final video URL:", finalVideoUrl);
            console.log("Video URL details:", {
              protocol: url.protocol,
              host: url.host,
              pathname: url.pathname,
              fullUrl: finalVideoUrl,
            });
          } catch (err) {
            console.error("Error parsing final URL:", err);
            console.log("Using original URL:", finalVideoUrl);
          }
        }
        
        setVideoUrl(finalVideoUrl);
      } catch (err) {
        console.error("Error fetching lecture:", err);
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
      
      if (completed) {
        console.log("Lecture completed, progress updated");
      }
    } catch (err) {
      console.error("Error updating progress:", err);
      // Không hiển thị lỗi cho user vì đây là background update
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
              <div className="w-full bg-black rounded-2xl overflow-hidden" style={{ minHeight: '400px', maxHeight: '80vh' }}>
                <video
                  ref={videoRef}
                  controls
                  preload="metadata"
                  crossOrigin="anonymous"
                  className="w-full h-auto max-h-[80vh]"
                  style={{ objectFit: 'contain' }}
                  src={videoUrl}
                  onError={(e) => {
                    const video = e.target;
                    const error = video.error;
                    
                    // Prevent infinite loop - chỉ log error một lần
                    if (video.dataset.errorLogged === 'true') {
                      return;
                    }
                    video.dataset.errorLogged = 'true';
                    
                    console.error("Video error:", {
                      code: error?.code,
                      message: error?.message,
                      networkState: video.networkState,
                      readyState: video.readyState,
                      src: videoUrl?.substring(0, 100) + "...",
                      currentSrc: video.currentSrc?.substring(0, 100) + "...",
                      videoWidth: video.videoWidth,
                      videoHeight: video.videoHeight,
                    });
                    
                    // Kiểm tra nếu URL có presigned query string (không nên có khi bucket public)
                    const currentSrc = video.currentSrc || videoUrl;
                    if (currentSrc && currentSrc.includes('X-Amz-')) {
                      console.warn("Video URL contains presigned query string, cleaning it...");
                      // Thử clean URL (remove query string) để dùng public URL
                      try {
                        const url = new URL(currentSrc);
                        const cleanUrl = `${url.protocol}//${url.host}${url.pathname}`;
                        console.log("Trying clean public URL:", cleanUrl);
                        video.src = cleanUrl;
                        video.dataset.errorLogged = 'false'; // Reset để log lại nếu vẫn lỗi
                        return;
                      } catch (urlErr) {
                        console.error("Error cleaning URL:", urlErr);
                      }
                    }
                    
                    let errorMsg = "Không thể phát video. ";
                    if (error) {
                      switch (error.code) {
                        case error.MEDIA_ERR_ABORTED:
                          errorMsg += "Video bị hủy.";
                          break;
                        case error.MEDIA_ERR_NETWORK:
                          errorMsg += "Lỗi mạng. Vui lòng kiểm tra kết nối.";
                          // Có thể là CORS issue
                          console.warn("Network error - có thể do CORS. Kiểm tra S3 CORS configuration.");
                          break;
                        case error.MEDIA_ERR_DECODE:
                          errorMsg += "Lỗi giải mã video.";
                          break;
                        case error.MEDIA_ERR_SRC_NOT_SUPPORTED:
                          errorMsg += "Định dạng video không được hỗ trợ hoặc URL không hợp lệ.";
                          console.error("Video URL (first 200 chars):", currentSrc?.substring(0, 200));
                          console.error("Full video URL:", currentSrc);
                          // Test URL accessibility
                          fetch(currentSrc, { method: 'HEAD', mode: 'no-cors' })
                            .then(() => console.log("URL is accessible (no-cors)"))
                            .catch(err => console.error("URL test failed:", err));
                          break;
                        default:
                          errorMsg += error.message || "Vui lòng thử lại.";
                      }
                    }
                    
                    // Thêm thông tin debug
                    console.error("Video error details:", {
                      errorCode: error?.code,
                      errorMessage: error?.message,
                      networkState: video.networkState,
                      readyState: video.readyState,
                      src: currentSrc,
                      videoElement: {
                        videoWidth: video.videoWidth,
                        videoHeight: video.videoHeight,
                        duration: video.duration,
                        paused: video.paused,
                      }
                    });
                    
                    toast.error(errorMsg);
                    setError(errorMsg);
                  }}
                  onLoadStart={() => {
                    console.log("Video load started, URL:", videoUrl.substring(0, 100));
                  }}
                  onCanPlay={() => {
                    console.log("Video can play");
                    if (videoRef.current) {
                      console.log("Video dimensions:", {
                        width: videoRef.current.videoWidth,
                        height: videoRef.current.videoHeight,
                        aspectRatio: videoRef.current.videoWidth / videoRef.current.videoHeight,
                      });
                    }
                  }}
                  onLoadedData={() => {
                    console.log("Video data loaded");
                  }}
                  onLoadedMetadata={() => {
                    console.log("Video metadata loaded");
                    if (videoRef.current) {
                      console.log("Video metadata:", {
                        duration: videoRef.current.duration,
                        videoWidth: videoRef.current.videoWidth,
                        videoHeight: videoRef.current.videoHeight,
                        aspectRatio: videoRef.current.videoWidth / videoRef.current.videoHeight,
                      });
                    }
                  }}
                  onTimeUpdate={(e) => {
                    const video = e.target;
                    const currentTime = Math.floor(video.currentTime);
                    const duration = video.duration;
                    
                    // Cập nhật tiến độ mỗi 10 giây hoặc khi gần hết video
                    if (duration && (currentTime % 10 === 0 || currentTime >= duration - 2)) {
                      handleUpdateProgress(currentTime, false);
                    }
                  }}
                  onEnded={(e) => {
                    const video = e.target;
                    const duration = Math.floor(video.duration || 0);
                    console.log("Video ended, marking as completed");
                    // Đánh dấu bài giảng đã hoàn thành
                    handleUpdateProgress(duration, true);
                    toast.success("Bạn đã hoàn thành bài giảng này!");
                  }}
                  onPlay={() => {
                    console.log("Video started playing");
                    // Bắt đầu cập nhật tiến độ định kỳ
                    if (progressUpdateIntervalRef.current) {
                      clearInterval(progressUpdateIntervalRef.current);
                    }
                    progressUpdateIntervalRef.current = setInterval(() => {
                      if (videoRef.current && !videoRef.current.paused) {
                        const currentTime = Math.floor(videoRef.current.currentTime);
                        handleUpdateProgress(currentTime, false);
                      }
                    }, 10000); // Cập nhật mỗi 10 giây
                  }}
                  onPause={() => {
                    console.log("Video paused");
                    // Cập nhật tiến độ khi pause
                    if (videoRef.current) {
                      const currentTime = Math.floor(videoRef.current.currentTime);
                      handleUpdateProgress(currentTime, false);
                    }
                  }}
                >
                  Trình duyệt của bạn không hỗ trợ video.
                </video>
              </div>
            ) : (
              <div className="w-full aspect-video bg-gray-100 rounded-2xl flex items-center justify-center">
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

