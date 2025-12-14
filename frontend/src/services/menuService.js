import api from './api';

export const menuService = {
    // Получить все категории
    getCategories: async () => {
        try {
            const response = await api.get('/menu/categories');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Создать категорию
    createCategory: async (categoryData) => {
        try {
            const response = await api.post('/menu/categories', categoryData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Получить все блюда (с фильтрацией по категории)
    getDishes: async (categoryId = null) => {
        try {
            const url = categoryId ? `/menu/dishes?category_id=${categoryId}` : '/menu/dishes';
            const response = await api.get(url);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Получить блюдо по ID
    getDish: async (dishId) => {
        try {
            const response = await api.get(`/menu/dishes/${dishId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Создать блюдо
    createDish: async (dishData) => {
        try {
            const response = await api.post('/menu/dishes', dishData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Обновить блюдо
    updateDish: async (dishId, dishData) => {
        try {
            const response = await api.put(`/menu/dishes/${dishId}`, dishData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Удалить блюдо
    deleteDish: async (dishId) => {
        try {
            const response = await api.delete(`/menu/dishes/${dishId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Переключить доступность блюда - ИСПРАВЬТЕ URL
    toggleDishAvailability: async (dishId) => {
        try {
            const response = await api.put(`/menu/dishes/${dishId}/toggle_availability`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    }
};