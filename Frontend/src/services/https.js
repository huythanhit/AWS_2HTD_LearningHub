import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: false, // bật nếu backend yêu cầu cookie
  timeout: 20000,
});

// REQUEST INTERCEPTOR
api.interceptors.request.use((config) => {
  // Content-Type mặc định JSON
  if (!config.headers) config.headers = {};
  config.headers["Content-Type"] = "application/json";

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
