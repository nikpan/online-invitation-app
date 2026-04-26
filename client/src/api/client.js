import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true, // Send httpOnly cookies on every request
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue = [];

function processQueue(error) {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve();
  });
  failedQueue = [];
}

// Intercept 401s and auto-refresh the access token
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    const is401 = error.response?.status === 401;
    const isTokenExpired = error.response?.data?.code === 'TOKEN_EXPIRED';
    const isAuthRoute = original.url?.startsWith('/auth/');

    if (is401 && isTokenExpired && !original._retry && !isAuthRoute) {
      original._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => apiClient(original))
          .catch((err) => Promise.reject(err));
      }

      isRefreshing = true;

      try {
        await apiClient.post('/auth/refresh');
        processQueue(null);
        return apiClient(original);
      } catch (refreshError) {
        processQueue(refreshError);
        // Redirect to login if refresh fails
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
