import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: false, // bật nếu backend yêu cầu cookie
  timeout: 20000, // Default timeout cho requests thông thường
  // Cho phép body và content lớn (cần cho file upload)
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
});

// REQUEST INTERCEPTOR
api.interceptors.request.use((config) => {
  if (!config.headers) config.headers = {};
  
  // QUAN TRỌNG: FormData handling
  // - Nếu là FormData: KHÔNG set Content-Type (browser/axios sẽ tự động set với boundary)
  // - Nếu không phải FormData: set Content-Type = application/json
  // - Việc này đảm bảo binary data không bị encode sai
  if (!(config.data instanceof FormData)) {
    config.headers["Content-Type"] = "application/json";
  }
  // Nếu là FormData, để browser tự động set Content-Type với boundary
  // KHÔNG set Content-Type cho FormData vì sẽ làm mất boundary string

  // Gắn Bearer token nếu có
  const token =
    localStorage.getItem("access_token") ||
    sessionStorage.getItem("access_token") ||
    localStorage.getItem("token") ||
    sessionStorage.getItem("token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  
  return config;
});

// RESPONSE INTERCEPTOR: chuẩn hoá lỗi
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err.response?.status;
    const data = err.response?.data;
    const message =
      (typeof data === "string" && data) ||
      (data && (data.message || data.error)) ||
      err.message ||
      "Request failed";

    // Xử lý 401 Unauthorized - token hết hạn hoặc không hợp lệ
    if (status === 401) {
      // Xóa token và redirect về login
      localStorage.removeItem("token");
      localStorage.removeItem("access_token");
      localStorage.removeItem("role");
      localStorage.removeItem("roleId");
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userName");
      localStorage.removeItem("userId");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("access_token");
      
      // Chỉ redirect nếu đang ở client-side và không phải đang ở trang login
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/auth/login')) {
        window.location.href = '/auth/login';
      }
    }

    // Create an Error but preserve the original axios response/data for callers
    const out = new Error(`[${status ?? "ERR"}] ${message}`);
    // attach axios response and parsed data so UI can inspect validation details
    out.response = err.response;
    out.data = data;
    out.originalError = err;
    return Promise.reject(out);
  }
);

export default api;
