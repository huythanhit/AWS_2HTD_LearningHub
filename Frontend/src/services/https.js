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
      (data && data.message) ||
      err.message ||
      "Request failed";
    return Promise.reject(new Error(`[${status ?? "ERR"}] ${message}`));
  }
);

export default api;
