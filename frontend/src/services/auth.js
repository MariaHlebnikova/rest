import api from './api';

export const authService = {
    // Вход в систему
    login: async (login, password) => {
        try {
            const response = await api.post('/auth/login', { login, password });
            if (response.data.access_token) {
                localStorage.setItem('token', response.data.access_token);
                localStorage.setItem('user', JSON.stringify(response.data.user));
            }
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Выход из системы
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    },

    // Получить текущего пользователя
    getCurrentUser: () => {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    },

    // Проверить авторизацию
    isAuthenticated: () => {
        return localStorage.getItem('token') !== null;
    },

    // Проверить роль
    hasRole: (role) => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        return user.position === role;
    }
};