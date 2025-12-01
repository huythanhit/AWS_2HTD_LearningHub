// src/services/axios.js
import axios, { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: false,
  headers: { "Content-Type": "application/json" },
  timeout: 20000,
});

// REQUEST INTERCEPTOR
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (!config.headers) {
    config.headers = new AxiosHeaders();
  } else if (!(config.headers instanceof AxiosHeaders)) {
    config.headers = new AxiosHeaders(config.headers as any);
  }

  const token = localStorage.getItem("access_token") || sessionStorage.getItem("access_token");
  if (token) {
    (config.headers as AxiosHeaders).set("Authorization", `Bearer ${token}`);
  }

  return config;
});

// RESPONSE INTERCEPTOR
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status ?? 'ERR';
    const message = error.response?.data?.message || error.message || "Request failed";

    // You can log the error here if needed

    return Promise.reject(new Error(`[${status}] ${message}`));
  }
);

export default apiClient;
export const api = apiClient;