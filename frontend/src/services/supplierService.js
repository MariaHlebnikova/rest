import api from './api';

export const supplierService = {
    // Получить всех поставщиков
    getAllSuppliers: async () => {
        try {
            const response = await api.get('/suppliers/suppliers');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Создать поставщика
    createSupplier: async (supplierData) => {
        try {
            const response = await api.post('/suppliers/suppliers', supplierData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Обновить поставщика
    updateSupplier: async (supplierId, supplierData) => {
        try {
            const response = await api.put(`/suppliers/suppliers/${supplierId}`, supplierData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Удалить поставщика
    deleteSupplier: async (supplierId) => {
        try {
            const response = await api.delete(`/suppliers/suppliers/${supplierId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Получить все поставки
    getAllSupplies: async () => {
        try {
            const response = await api.get('/suppliers/supplies');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Создать поставку
    createSupply: async (supplyData) => {
        try {
            const response = await api.post('/suppliers/supplies', supplyData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Обновить поставку
    updateSupply: async (supplyId, supplyData) => {
        try {
            const response = await api.put(`/suppliers/supplies/${supplyId}`, supplyData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Удалить поставку
    deleteSupply: async (supplyId) => {
        try {
            const response = await api.delete(`/suppliers/supplies/${supplyId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Переключить статус поставки
    toggleSupplyStatus: async (supplyId) => {
        try {
            const response = await api.put(`/suppliers/supplies/${supplyId}/toggle-status`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    }
};