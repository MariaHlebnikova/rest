import api from './api';

export const employeeService = {
    // Получить всех сотрудников
    getAllEmployees: async () => {
        try {
            const response = await api.get('/employees/');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Получить сотрудника по ID
    getEmployee: async (employeeId) => {
        try {
            const response = await api.get(`/employees/${employeeId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Создать сотрудника
    createEmployee: async (employeeData) => {
        try {
            const response = await api.post('/employees/', employeeData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Обновить сотрудника
    updateEmployee: async (employeeId, employeeData) => {
        try {
            const response = await api.put(`/employees/${employeeId}`, employeeData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Удалить сотрудника
    deleteEmployee: async (employeeId) => {
        try {
            const response = await api.delete(`/employees/${employeeId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Получить все должности
    getPositions: async () => {
        try {
            const response = await api.get('/employees/positions');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Создать должность
    createPosition: async (positionData) => {
        try {
            const response = await api.post('/employees/positions', positionData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    }
};