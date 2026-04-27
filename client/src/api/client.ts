import axios, {
  AxiosError,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

interface ApiErrorBody {
  code?: string;
  message?: string;
}

// Extend axios's request config so we can mark requests we've already retried.
interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const apiClient = axios.create({
  baseURL: '/api',
  withCredentials: true, // Send httpOnly cookies on every request
  headers: {
    'Content-Type': 'application/json',
  },
});

interface QueuedRequest {
  resolve: () => void;
  reject: (err: unknown) => void;
}

let isRefreshing = false;
let failedQueue: QueuedRequest[] = [];

function processQueue(error: unknown): void {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve();
  });
  failedQueue = [];
}

// Intercept 401s and auto-refresh the access token
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError<ApiErrorBody>) => {
    const original = error.config as RetryableRequestConfig | undefined;
    if (!original) return Promise.reject(error);

    const is401 = error.response?.status === 401;
    const isTokenExpired = error.response?.data?.code === 'TOKEN_EXPIRED';
    const isAuthRoute = original.url?.startsWith('/auth/');

    if (is401 && isTokenExpired && !original._retry && !isAuthRoute) {
      original._retry = true;

      if (isRefreshing) {
        return new Promise<void>((resolve, reject) => {
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
