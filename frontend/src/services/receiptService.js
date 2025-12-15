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
                throw new Error(error.response.data?.error || 'Ошибка сервера');
            } else if (error.request) {
                throw new Error('Нет ответа от сервера');
            } else {
                throw new Error(error.message || 'Неизвестная ошибка');
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