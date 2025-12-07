import axios from 'axios';

// Базовый URL твоего бэкенда
const API_URL = 'http://localhost:5000/api';

// Создаем экземпляр axios
const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Интерсептор для добавления токена к запросам
api.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    error => Promise.reject(error)
);

// Интерсептор для обработки ошибок
api.interceptors.response.use(
    response => response,
    error => {
        if (error.response?.status === 401) {
            // Если токен истек, удаляем его
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;