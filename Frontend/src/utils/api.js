import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

// Chat APIs
export const chatAPI = {
  createDirectChat: (userId) => api.post('/chat/direct', { userId }),
  createGroupChat: (data) => api.post('/chat/group', data),
  getUserChats: () => api.get('/chat'),
  getChat: (chatId) => api.get(`/chat/${chatId}`),
  searchUsers: (query) => api.get('/chat/users/search', { params: { query } }),
  getAllUsers: () => api.get('/chat/users/all'),
};

// Message APIs
export const messageAPI = {
  sendMessage: (data) => api.post('/message', data),
  getChatHistory: (chatId, page = 1, limit = 50) =>
    api.get(`/message/${chatId}`, { params: { page, limit } }),
  markAsRead: (chatId) => api.put(`/message/read/${chatId}`),
};

// User APIs
export const userAPI = {
  getAllUsers: () => api.get('/users'),
};

export default api;
