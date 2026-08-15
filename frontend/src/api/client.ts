import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({ baseURL: BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;

/* ─── Auth ─── */
export const loginApi = (username: string, password: string) =>
  api.post('/account/token', new URLSearchParams({ username, password }), {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

export const registerApi = (data: Record<string, string>) =>
  api.post('/account/create-account', data);

export const verifyRegistrationOtpApi = (email: string, otp: string) =>
  api.post('/account/verify-registration-otp', { email, otp });

export const resendRegistrationOtpApi = (email: string) =>
  api.post('/account/resend-otp', { email });

export const verifyEmailChangeOtpApi = (email: string, otp: string) =>
  api.post('/account/verify-email-change-otp', { email, otp });

export const googleLoginApi = (credential: string) =>
  api.post('/account/google-login', { credential });

export const getMeApi = () => api.get('/account/me');

/* ─── Profile ─── */
export const getProfileApi = (id: number) => api.get(`/account/${id}`);
export const updateProfileApi = (id: number, data: Record<string, string>) =>
  api.put(`/account/${id}`, data);
export const deleteProfileApi = (id: number) => api.delete(`/account/${id}`);

/* ─── Transactions (v2) ─── */
export const createTransactionApi = (data: Record<string, unknown>) =>
  api.post('/transactions/', data);

export const listTransactionsApi = (skip = 0, limit = 100) =>
  api.get(`/transactions/?skip=${skip}&limit=${limit}`);

export const getTransactionApi = (id: number) =>
  api.get(`/transactions/${id}`);

export const updateTransactionApi = (id: number, data: Record<string, unknown>) =>
  api.put(`/transactions/${id}`, data);

export const deleteTransactionApi = (id: number) =>
  api.delete(`/transactions/${id}`);

/* ─── Transactions (v1 – extended filter) ─── */
export const listTransactionsV1Api = (params: Record<string, string | number>) =>
  api.get('/get-transaction', { params });

/* ─── Dashboard ─── */
export const getDashboardApi = () => api.get('/dashboard');

/* ─── Import ─── */
export const uploadFileApi = (file: File) => {
  const fd = new FormData();
  fd.append('file', file);
  return api.post('/import/upload', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

/* ─── Admin Panel ─── */
export const adminStatsApi = () => api.get('/admin/stats');

export const adminUsersApi = (params?: Record<string, string | number | boolean>) =>
  api.get('/admin/users', { params });

export const adminSetUserStatusApi = (id: number, isActive: boolean) =>
  api.patch(`/admin/users/${id}/status`, { is_active: isActive });

export const adminSetUserRoleApi = (id: number, role: 'user' | 'admin') =>
  api.patch(`/admin/users/${id}/role`, { role });

export const adminResetPasswordApi = (id: number, newPassword: string) =>
  api.post(`/admin/users/${id}/reset-password`, { new_password: newPassword });

export const adminForceLogoutApi = (id: number) =>
  api.post(`/admin/users/${id}/force-logout`);

export const adminDeleteUserApi = (id: number) =>
  api.delete(`/admin/users/${id}`);

export const adminTransactionsApi = (params?: Record<string, string | number>) =>
  api.get('/admin/transactions', { params });

export const adminSuspiciousApi = (params?: Record<string, string | number>) =>
  api.get('/admin/transactions/suspicious', { params });

export const adminUpdateTransactionApi = (id: number, data: Record<string, unknown>) =>
  api.patch(`/admin/transactions/${id}`, data);

export const adminDeleteTransactionApi = (id: number) =>
  api.delete(`/admin/transactions/${id}`);

export const adminCategoryAnalyticsApi = () => api.get('/admin/category-analytics');

export const adminCategoriesApi = () => api.get('/admin/categories');

export const adminCreateCategoryApi = (name: string) =>
  api.post('/admin/categories', { name });

export const adminUpdateCategoryApi = (id: number, data: Record<string, unknown>) =>
  api.patch(`/admin/categories/${id}`, data);

export const adminDeleteCategoryApi = (id: number) =>
  api.delete(`/admin/categories/${id}`);

export const adminExportApi = (kind: 'users' | 'transactions', format: 'csv' | 'xlsx') =>
  api.get(`/admin/export/${kind}.${format}`, { responseType: 'blob' });
