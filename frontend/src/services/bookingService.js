import api from './api';

export const bookingService = {
    // Получить все залы с их столами
    getAllHalls: async () => {
        try {
            const response = await api.get('/halls/');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Получить все столы
    getAllTables: async (hallId = null) => {
        try {
            const url = hallId ? `/halls/tables?hall_id=${hallId}` : '/halls/tables';
            const response = await api.get(url);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Получить все бронирования
    getAllBookings: async () => {
        try {
            const response = await api.get('/bookings/');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Создать новое бронирование
    createBooking: async (bookingData) => {
        try {
            console.log('Отправка запроса на бронирование:', bookingData);
            const response = await api.post('/bookings/', bookingData);
            console.log('Ответ от сервера:', response.data);
            return response.data;
        } catch (error) {
            console.error('Ошибка при создании бронирования:', error);
            console.error('Детали ошибки:', error.response?.data);
            throw error.response?.data || error;
        }
    },

    // Обновить бронирование
    updateBooking: async (bookingId, bookingData) => {
        try {
            const response = await api.put(`/bookings/${bookingId}`, bookingData);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Удалить бронирование
    deleteBooking: async (bookingId) => {
        try {
            const response = await api.delete(`/bookings/${bookingId}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Получить статусы бронирования
    getBookingStatuses: async () => {
        try {
            const response = await api.get('/bookings/statuses');
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Получить доступные столы на дату
    getAvailableTables: async (date, peopleCount = null, hallId = null) => {
        try {
            let url = `/halls/tables/available?date=${date}`;
            if (peopleCount) url += `&people_count=${peopleCount}`;
            if (hallId) url += `&hall_id=${hallId}`;
            
            const response = await api.get(url);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Управление залами
    createHall: async (hallData) => {
        try {
            const response = await api.post('/halls/', hallData);
            return response.data;
        } catch (error) {
            console.error('Ошибка при создании зала:', error);
            throw error.response?.data || error;
        }
    },

    updateHall: async (hallId, hallData) => {
        try {
            const response = await api.put(`/halls/${hallId}`, hallData);
            return response.data;
        } catch (error) {
            console.error('Ошибка при обновлении зала:', error);
            throw error.response?.data || error;
        }
    },

    deleteHall: async (hallId) => {
        try {
            const response = await api.delete(`/halls/${hallId}`);
            return response.data;
        } catch (error) {
            console.error('Ошибка при удалении зала:', error);
            throw error.response?.data || error;
        }
    },

    // Управление столами
    createTable: async (tableData) => {
        try {
            const response = await api.post('/halls/tables', tableData);
            return response.data;
        } catch (error) {
            console.error('Ошибка при создании стола:', error);
            throw error.response?.data || error;
        }
    },

    updateTable: async (tableId, tableData) => {
        try {
            const response = await api.put(`/halls/tables/${tableId}`, tableData);
            return response.data;
        } catch (error) {
            console.error('Ошибка при обновлении стола:', error);
            throw error.response?.data || error;
        }
    },

    deleteTable: async (tableId) => {
        try {
            const response = await api.delete(`/halls/tables/${tableId}`);
            return response.data;
        } catch (error) {
            console.error('Ошибка при удалении стола:', error);
            throw error.response?.data || error;
        }
    }
};