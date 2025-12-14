import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Функция для генерации отчета о выручке
export const generateRevenueReportPDF = (reportData, period, dateFilter = null) => {
    const doc = new jsPDF();
    
    // Настройки
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 20;
    
    // Логотип или заголовок
    doc.setFontSize(24);
    doc.setTextColor(0, 102, 204);
    doc.text('РЕСТОРАН "DELICIA"', pageWidth / 2, 15, { align: 'center' });
    
    // Заголовок отчета
    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text('ОТЧЕТ О ПРОДАЖАХ', pageWidth / 2, 25, { align: 'center' });
    
    // Период отчета
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    
    let periodText = getPeriodText(period);
    if (period === 'custom' && dateFilter) {
        periodText = `с ${formatDate(dateFilter.startDate)} по ${formatDate(dateFilter.endDate)}`;
    }
    
    doc.text(`Период: ${periodText}`, pageWidth / 2, 35, { align: 'center' });
    
    // Дата и время генерации
    doc.setFontSize(10);
    const now = new Date();
    doc.text(`Отчет сгенерирован: ${formatDateTime(now)}`, pageWidth / 2, 42, { align: 'center' });
    
    // Финансовая сводка
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('ФИНАНСОВАЯ СВОДКА', margin, 55);
    
    // Линия под заголовком
    doc.setDrawColor(0, 102, 204);
    doc.setLineWidth(0.5);
    doc.line(margin, 57, pageWidth - margin, 57);
    
    doc.setFontSize(11);
    doc.setTextColor(60, 60, 60);
    
    // Общая информация
    doc.text(`Общая выручка: ${formatCurrency(reportData.total_period_revenue)}`, margin, 65);
    doc.text(`Количество блюд в отчете: ${reportData.report.length}`, margin, 72);
    
    // Период отчета
    if (reportData.period) {
        doc.text(
            `Период отчета: ${formatDate(reportData.period.start_date)} - ${formatDate(reportData.period.end_date)}`,
            margin, 79
        );
    }
    
    // Таблица с данными продаж
    if (reportData.report && reportData.report.length > 0) {
        const tableData = reportData.report.map((item, index) => [
            (index + 1).toString(),
            item.dish_name || 'Не указано',
            item.quantity_sold?.toString() || '0',
            formatCurrency(item.total_revenue || 0),
            `${(item.revenue_share || 0).toFixed(2)}%`
        ]);
        
        doc.autoTable({
            startY: 90,
            head: [['№', 'Наименование блюда', 'Кол-во', 'Выручка', 'Доля, %']],
            body: tableData,
            theme: 'grid',
            headStyles: {
                fillColor: [41, 128, 185],
                textColor: 255,
                fontStyle: 'bold',
                fontSize: 10
            },
            bodyStyles: {
                fontSize: 9
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245]
            },
            margin: { left: margin, right: margin },
            styles: {
                overflow: 'linebreak',
                cellWidth: 'auto'
            },
            columnStyles: {
                0: { cellWidth: 15 }, // №
                1: { cellWidth: 70 }, // Наименование
                2: { cellWidth: 25 }, // Кол-во
                3: { cellWidth: 35 }, // Выручка
                4: { cellWidth: 25 }  // Доля
            },
            didDrawPage: function(data) {
                // Номер страницы
                doc.setFontSize(8);
                doc.setTextColor(150, 150, 150);
                doc.text(
                    `Страница ${data.pageNumber}`,
                    data.settings.margin.left,
                    doc.internal.pageSize.height - 10
                );
            }
        });
    }
    
    // Итоговая строка
    const finalY = doc.lastAutoTable?.finalY || 100;
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('ИТОГО:', pageWidth - margin - 80, finalY + 10);
    
    doc.setFontSize(14);
    doc.setTextColor(0, 128, 0);
    doc.text(
        formatCurrency(reportData.total_period_revenue), 
        pageWidth - margin - 10, 
        finalY + 10,
        { align: 'right' }
    );
    
    // Топ блюд
    const topStartY = finalY + 25;
    if (reportData.report.length > 0) {
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('ТОП-5 БЛЮД ПО ВЫРУЧКЕ:', margin, topStartY);
        
        doc.setFontSize(10);
        doc.setTextColor(60, 60, 60);
        
        const topDishes = reportData.report.slice(0, 5);
        topDishes.forEach((dish, index) => {
            const yPos = topStartY + 10 + (index * 6);
            doc.text(
                `${index + 1}. ${dish.dish_name} - ${formatCurrency(dish.total_revenue)} (${(dish.revenue_share || 0).toFixed(2)}%)`,
                margin + 5,
                yPos
            );
        });
    }
    
    // Подпись
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text(
        'Отчет сгенерирован автоматически системой управления рестораном',
        pageWidth / 2,
        pageHeight - 15,
        { align: 'center' }
    );
    
    // Контактная информация
    doc.setFontSize(8);
    doc.text('© 2024 Ресторан "Delicia". Все права защищены.', pageWidth / 2, pageHeight - 5, { align: 'center' });
    
    return doc;
};

// Вспомогательные функции
const getPeriodText = (period) => {
    const periods = {
        'day': 'За день',
        'week': 'За неделю',
        'month': 'За месяц',
        'year': 'За год',
        'custom': 'Произвольный период'
    };
    return periods[period] || period;
};

const formatCurrency = (amount) => {
    return `${Number(amount || 0).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} руб.`;
};

const formatDate = (dateStr) => {
    if (!dateStr) return 'н/д';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

const formatDateTime = (date) => {
    return date.toLocaleString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

// Функция для скачивания PDF
export const downloadPDF = (pdfDoc, filename) => {
    pdfDoc.save(filename);
};

// Дополнительные функции для разных типов отчетов
export const generateBookingReportPDF = (bookingData) => {
    const doc = new jsPDF();
    
    // ... (код для отчета по бронированиям)
    
    return doc;
};

export const generateDailySummaryPDF = (summaryData) => {
    const doc = new jsPDF();
    
    // ... (код для ежедневной сводки)
    
    return doc;
};