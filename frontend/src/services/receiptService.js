import api from './api';

export const receiptService = {
    // Сгенерировать чек для заказа
    generateReceipt: async (orderId) => {
        try {
            const response = await api.get(
                `/receipts/${orderId}`,
                {
                    responseType: 'blob',
                    timeout: 30000
                }
            );
            return response.data;
        } catch (error) {
            if (error.response) {
                throw error.response.data;
            } else if (error.request) {
                throw { error: 'Нет ответа от сервера' };
            } else {
                throw { error: error.message };
            }
        }
    },

    // Закрыть заказ и получить чек
    closeOrderWithReceipt: async (orderId) => {
        try {
            // 1. Закрываем заказ
            await api.post(`/orders/${orderId}/close`);
            
            // 2. Получаем чек
            const receiptBlob = await receiptService.generateReceipt(orderId);
            
            return {
                success: true,
                receiptBlob: receiptBlob,
                orderId: orderId
            };
        } catch (error) {
            throw error;
        }
    }
};