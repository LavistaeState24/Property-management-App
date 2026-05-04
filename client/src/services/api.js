import axios from "axios";
import { authStorage } from "../utils/storage";

const normalizeApiBaseUrl = (url) => {
  const fallbackUrl = import.meta.env.DEV ? "http://localhost:5000" : "";
  const resolvedUrl = url || fallbackUrl;

  if (!resolvedUrl) {
    throw new Error("VITE_API_URL is not configured for this environment");
  }

  const trimmed = resolvedUrl.replace(/\/+$/, "");
  return trimmed.endsWith("/api") ? trimmed : `${trimmed}/api`;
};

export const getApiOrigin = () => {
  const baseUrl = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);
  return baseUrl.replace(/\/api$/, "");
};

export const api = axios.create({
  baseURL: normalizeApiBaseUrl(import.meta.env.VITE_API_URL),
});

api.interceptors.request.use((config) => {
  const token = authStorage.getRawToken() || authStorage.getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && authStorage.getToken()) {
      authStorage.clear();

      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    }

    return Promise.reject(error);
  }
);
