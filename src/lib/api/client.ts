import axios from "axios";

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8350/api/v1",
  headers: { "Content-Type": "application/json" },
});

// Auto-inject token + academy_id
apiClient.interceptors.request.use((config) => {
  if (typeof window === "undefined") return config;
  const token = localStorage.getItem("token");
  const academyId = localStorage.getItem("activeAcademyId");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (academyId) config.headers["X-Academy-Id"] = academyId;
  return config;
});

// Handle 401 → redirect to login
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error.response?.status === 401 && typeof window !== "undefined") {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default apiClient;
