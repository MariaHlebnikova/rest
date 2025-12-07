import api from './api';

export const reportService = {
    // Получить отчет по продажам за период
    getSalesReport: async (startDate, endDate) => {
        try {
            const response = await api.get(`/reports/sales?start_date=${startDate}&end_date=${endDate}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Получить PDF отчет по продажам
    getSalesReportPDF: async (startDate, endDate) => {
        try {
            const response = await api.get(
                `/reports/sales/pdf?start_date=${startDate}&end_date=${endDate}`,
                { responseType: 'blob' }
            );
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Получить отчет по бронированиям
    getBookingsReport: async (startDate, endDate) => {
        try {
            const response = await api.get(`/reports/bookings?start_date=${startDate}&end_date=${endDate}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Получить популярные блюда
    getPopularDishes: async (limit = 10) => {
        try {
            const response = await api.get(`/reports/popular-dishes?limit=${limit}`);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Получить ежедневную сводку
    getDailySummary: async (date = null) => {
        try {
            const url = date ? `/reports/daily-summary?date=${date}` : '/reports/daily-summary';
            const response = await api.get(url);
            return response.data;
        } catch (error) {
            throw error.response?.data || error;
        }
    },

    // Получить финансовую сводку
    getFinancialSummary: async (period) => {
        try {
            // Здесь будет логика для разных периодов
            const today = new Date();
            let startDate, endDate;

            switch (period) {
                case 'day':
                    startDate = today.toISOString().split('T')[0];
                    endDate = startDate;
                    break;
                case 'week':
                    const weekStart = new Date(today);
                    weekStart.setDate(today.getDate() - today.getDay());
                    startDate = weekStart.toISOString().split('T')[0];
                    endDate = today.toISOString().split('T')[0];
                    break;
                case 'month':
                    startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
                    endDate = today.toISOString().split('T')[0];
                    break;
                case 'year':
                    startDate = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
                    endDate = today.toISOString().split('T')[0];
                    break;
                default:
                    startDate = today.toISOString().split('T')[0];
                    endDate = startDate;
            }

            return await this.getSalesReport(startDate, endDate);
        } catch (error) {
            throw error;
        }
    }
};