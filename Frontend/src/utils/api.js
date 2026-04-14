import axios from 'axios';

// Base API URL must come from Vite env (no localhost fallback in production)
const API_URL = import.meta.env.VITE_API_URL;

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // safe for JWT/cookies
});

// Attach JWT token (if present)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle auth errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only logout if it's a 401 and not a login attempt
    if (error.response?.status === 401 && !error.config.url.includes('/auth/login')) {
      console.warn("Unauthorized! Logging out...");
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Use a custom event to notify AuthContext instead of window.location
      window.dispatchEvent(new Event('auth-error'));
    }
    return Promise.reject(error);
  }
);

/* ===================== AUTH APIs ===================== */
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

/* ===================== CHAT APIs ===================== */
export const chatAPI = {
  createDirectChat: (userId) => api.post('/chat/direct', { userId }),
  createGroupChat: (data) => api.post('/chat/group', data),
  getUserChats: () => api.get('/chat'),
  getChat: (chatId) => api.get(`/chat/${chatId}`),
  getChatMembers: (chatId) => api.get(`/chat/${chatId}/members`),
  updateGroup: (chatId, data) => api.put(`/chat/${chatId}`, data),
  addMember: (chatId, userId) => api.post(`/chat/${chatId}/members`, { userId }),
  removeMember: (chatId, userId) => api.delete(`/chat/${chatId}/members/${userId}`),
  leaveGroup: (chatId) => api.post(`/chat/${chatId}/leave`),
  deleteChat: (chatId) => api.delete(`/chat/${chatId}`),
  searchUsers: (query) =>
    api.get('/chat/users/search', { params: { query } }),
  getAllUsers: () => api.get('/chat/users/all'),
};

/* ===================== MESSAGE APIs ===================== */
export const messageAPI = {
  sendMessage: (data) => api.post('/message', data),
  getChatHistory: (chatId, page = 1, limit = 50) =>
    api.get(`/message/${chatId}`, { params: { page, limit } }),
  markAsRead: (chatId) => api.put(`/message/read/${chatId}`),
  deleteMessage: (messageId, type = "me") => 
    api.delete(`/message/${messageId}`, { params: { type } }),
  clearChat: (chatId) => api.delete(`/message/clear/${chatId}`),
};

/* ===================== USER APIs ===================== */
export const userAPI = {
  getAllUsers: () => api.get("/users"),
  updateProfile: (data) => api.put("/auth/profile", data),
  getPublicKey: (userId) => api.get(`/auth/publicKey/${userId}`),
};

export default api;
