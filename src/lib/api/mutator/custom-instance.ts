import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from "axios";
import config from "@/config";
import { useAuthStore } from "@/lib/stores/auth-store";

// API client (axios instance)
const apiClient = axios.create({
  baseURL: config.apiEndpoint,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// CSRF token management
let csrfToken: string | null = null;
let refreshPromise: Promise<void> | null = null;

const getCookie = (name: string): string | null => {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
};

apiClient.interceptors.request.use((request) => {
  const token = csrfToken || getCookie("csrf-token");
  if (token) request.headers.set("x-csrf-token", token);
  request.headers.set("x-tenant-code", process.env.NEXT_PUBLIC_TENANT_CODE ?? "DEMO");

  if (typeof window !== "undefined") {
    const authStore = useAuthStore.getState();
    if (authStore.accessToken) {
      request.headers.set("Authorization", `Bearer ${authStore.accessToken}`);
    }
  }

  return request;
});

apiClient.interceptors.response.use(
  (response) => {
    const token = response.headers?.["x-csrf-token"];
    if (token) {
      csrfToken = token;
    }
    return response;
  },
  async (error: AxiosError) => {
    const statusCode = error.response?.status;
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (typeof window !== "undefined") {
      if (statusCode === 401 && originalRequest && !originalRequest._retry) {
        const isRefreshRequest = originalRequest.url?.includes("/api/auth/refresh");

        if (!isRefreshRequest) {
          originalRequest._retry = true;

          try {
            if (!refreshPromise) {
              const { refreshToken } = useAuthStore.getState();
              refreshPromise = apiClient
                .post("/api/auth/refresh", refreshToken ? { refreshToken } : undefined)
                .then((res) => {
                  const payload = res.data?.data ?? res.data;
                  if (payload?.accessToken) {
                    useAuthStore.getState().setAuth({
                      activeTenantId: payload.activeTenantId,
                      expiresIn: payload.expiresIn,
                      roleInTenant: payload.roleInTenant,
                      sessionId: payload.sessionId,
                      accessToken: payload.accessToken,
                      refreshToken: payload.refreshToken,
                    });
                  }
                  const newCsrf = getCookie("csrf-token");
                  if (newCsrf) csrfToken = newCsrf;
                })
                .finally(() => {
                  refreshPromise = null;
                });
            }
            await refreshPromise;

            return apiClient(originalRequest);
          } catch (e) {
            console.error("Failed to refresh token", e);
            localStorage.removeItem("realhub-auth");
            localStorage.removeItem("realhub-user");
            window.location.href = `/vi/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
            return Promise.reject(error);
          }
        }

        localStorage.removeItem("realhub-auth");
        localStorage.removeItem("realhub-user");
        window.location.href = `/vi/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`;
      }

      if (statusCode === 403) {
        localStorage.removeItem("realhub-auth");
        localStorage.removeItem("realhub-user");
      }
    }

    return Promise.reject(error);
  },
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function customInstance<T = any>(config: AxiosRequestConfig): Promise<T> {
  const response = await apiClient(config);
  return response.data;
}