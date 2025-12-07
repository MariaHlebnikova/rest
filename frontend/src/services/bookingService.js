import api from './api';

export const bookingService = {
    // Получить все залы с их столами
    getAllHalls: async () => {
        try {
            const response = await api.get('/halls/halls');
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
            const response = await api.post('/bookings/', bookingData);
            return response.data;
        } catch (error) {
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

    // Получить заказы стола (чтобы понять занят ли стол)
    getTableOrders: async (tableId) => {
        try {
            // Проверяем активные заказы стола
            const response = await api.get('/orders/active');
            const orders = response.data;
            return orders.filter(order => order.table_id === tableId);
        } catch (error) {
            throw error.response?.data || error;
        }
    }
};