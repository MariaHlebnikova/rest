import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { FaChartLine, FaUtensils, FaCalendarAlt, FaMoneyBillWave } from 'react-icons/fa';

// Функция для генерации отчета о выручке
export const generateRevenueReportPDF = (reportData, period) => {
    const doc = new jsPDF();
    
    // Настройки
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // Заголовок
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('Отчет о выручке', pageWidth / 2, 20, { align: 'center' });
    
    // Период
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Период: ${getPeriodText(period)}`, pageWidth / 2, 30, { align: 'center' });
    
    // Дата генерации
    doc.setFontSize(10);
    doc.text(`Дата генерации: ${new Date().toLocaleDateString('ru-RU')}`, pageWidth / 2, 37, { align: 'center' });
    
    // Основная информация
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text('Финансовая сводка', 20, 50);
    
    doc.setFontSize(12);
    doc.text(`Общая выручка: ${reportData.total_period_revenue.toFixed(2)} руб.`, 20, 60);
    doc.text(`Количество позиций в отчете: ${reportData.report.length}`, 20, 67);
    
    // Таблица с данными
    if (reportData.report && reportData.report.length > 0) {
        const tableData = reportData.report.map(item => [
            item.dish_name,
            item.quantity_sold.toString(),
            `${item.total_revenue.toFixed(2)} руб.`,
            `${item.revenue_share.toFixed(2)}%`
        ]);
        
        doc.autoTable({
            startY: 80,
            head: [['Блюдо', 'Кол-во продаж', 'Выручка', 'Доля в выручке']],
            body: tableData,
            theme: 'striped',
            headStyles: {
                fillColor: [41, 128, 185],
                textColor: 255,
                fontStyle: 'bold'
            },
            margin: { left: 20, right: 20 }
        });
    }
    
    // График (текстовое представление)
    const finalY = doc.lastAutoTable?.finalY || 100;
    doc.setFontSize(14);
    doc.text('Топ-5 блюд по выручке:', 20, finalY + 15);
    
    doc.setFontSize(11);
    const topDishes = reportData.report.slice(0, 5);
    topDishes.forEach((dish, index) => {
        const yPos = finalY + 25 + (index * 7);
        doc.text(`${index + 1}. ${dish.dish_name} - ${dish.total_revenue.toFixed(2)} руб. (${dish.revenue_share.toFixed(2)}%)`, 
                25, yPos);
    });
    
    // Подвал
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('© Ресторанная система управления', pageWidth / 2, pageHeight - 10, { align: 'center' });
    
    return doc;
};

// Функция для генерации отчета о популярных блюдах
export const generatePopularDishesPDF = (dishesData, period) => {
    const doc = new jsPDF();
    
    const pageWidth = doc.internal.pageSize.width;
    
    // Заголовок
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('Отчет о популярных блюдах', pageWidth / 2, 20, { align: 'center' });
    
    // Период
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Период: ${getPeriodText(period)}`, pageWidth / 2, 30, { align: 'center' });
    doc.text(`Дата генерации: ${new Date().toLocaleDateString('ru-RU')}`, pageWidth / 2, 37, { align: 'center' });
    
    // Таблица
    if (dishesData.popular_dishes && dishesData.popular_dishes.length > 0) {
        const tableData = dishesData.popular_dishes.map(item => [
            item.dish_name,
            item.category_name || '-',
            item.total_sold.toString(),
            `${item.total_revenue.toFixed(2)} руб.`,
            getPopularityStars(item.total_sold, Math.max(...dishesData.popular_dishes.map(d => d.total_sold)))
        ]);
        
        doc.autoTable({
            startY: 50,
            head: [['Блюдо', 'Категория', 'Продано', 'Выручка', 'Популярность']],
            body: tableData,
            theme: 'striped',
            headStyles: {
                fillColor: [46, 204, 113],
                textColor: 255,
                fontStyle: 'bold'
            },
            margin: { left: 20, right: 20 }
        });
    }
    
    // Анализ
    const finalY = doc.lastAutoTable?.finalY || 100;
    if (dishesData.popular_dishes && dishesData.popular_dishes.length > 0) {
        const totalSold = dishesData.popular_dishes.reduce((sum, dish) => sum + dish.total_sold, 0);
        const totalRevenue = dishesData.popular_dishes.reduce((sum, dish) => sum + dish.total_revenue, 0);
        const avgPrice = totalRevenue / totalSold;
        
        doc.setFontSize(14);
        doc.text('Ключевые показатели:', 20, finalY + 15);
        
        doc.setFontSize(11);
        doc.text(`• Всего продано блюд: ${totalSold}`, 25, finalY + 25);
        doc.text(`• Общая выручка: ${totalRevenue.toFixed(2)} руб.`, 25, finalY + 32);
        doc.text(`• Средняя цена блюда: ${avgPrice.toFixed(2)} руб.`, 25, finalY + 39);
        
        const topDish = dishesData.popular_dishes[0];
        if (topDish) {
            doc.text(`• Самое популярное блюдо: ${topDish.dish_name} (${topDish.total_sold} продаж)`, 
                    25, finalY + 46);
        }
    }
    
    // Подвал
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('© Ресторанная система управления', pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
    
    return doc;
};

// Функция для генерации комплексного отчета
export const generateComprehensiveReportPDF = (salesData, dishesData, period) => {
    const doc = new jsPDF();
    
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // Титульная страница
    doc.setFontSize(24);
    doc.setTextColor(52, 152, 219);
    doc.text('Комплексный отчет ресторана', pageWidth / 2, 40, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setTextColor(100, 100, 100);
    doc.text('Финансовый анализ и популярность блюд', pageWidth / 2, 55, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text(`Период: ${getPeriodText(period)}`, pageWidth / 2, 70, { align: 'center' });
    doc.text(`Дата составления: ${new Date().toLocaleDateString('ru-RU')}`, pageWidth / 2, 80, { align: 'center' });
    
    // Добавляем новую страницу для финансового отчета
    doc.addPage();
    
    // Финансовый отчет
    doc.setFontSize(18);
    doc.setTextColor(41, 128, 185);
    doc.text('Финансовый отчет', 20, 20);
    
    doc.setFontSize(12);
    doc.text(`Общая выручка за период: ${salesData.total_period_revenue.toFixed(2)} руб.`, 20, 35);
    doc.text(`Количество проданных позиций: ${salesData.report.reduce((sum, item) => sum + item.quantity_sold, 0)}`, 20, 42);
    
    // Таблица финансов
    const financeTableData = salesData.report.slice(0, 15).map(item => [
        item.dish_name,
        item.quantity_sold.toString(),
        `${item.total_revenue.toFixed(2)} руб.`,
        `${item.revenue_share.toFixed(2)}%`
    ]);
    
    doc.autoTable({
        startY: 55,
        head: [['Блюдо', 'Кол-во', 'Выручка', 'Доля %']],
        body: financeTableData,
        theme: 'striped',
        headStyles: {
            fillColor: [41, 128, 185],
            textColor: 255,
            fontStyle: 'bold'
        },
        margin: { left: 20, right: 20 }
    });
    
    // Добавляем страницу для популярных блюд
    doc.addPage();
    
    // Популярные блюда
    doc.setFontSize(18);
    doc.setTextColor(46, 204, 113);
    doc.text('Анализ популярности блюд', 20, 20);
    
    // Таблица популярности
    const popularityTableData = dishesData.popular_dishes.slice(0, 15).map(item => [
        item.dish_name,
        item.category_name || '-',
        item.total_sold.toString(),
        `${item.total_revenue.toFixed(2)} руб.`
    ]);
    
    doc.autoTable({
        startY: 35,
        head: [['Блюдо', 'Категория', 'Продано', 'Выручка']],
        body: popularityTableData,
        theme: 'striped',
        headStyles: {
            fillColor: [46, 204, 113],
            textColor: 255,
            fontStyle: 'bold'
        },
        margin: { left: 20, right: 20 }
    });
    
    // Заключение на последней странице
    doc.addPage();
    doc.setFontSize(16);
    doc.setTextColor(52, 73, 94);
    doc.text('Заключение и рекомендации', pageWidth / 2, 30, { align: 'center' });
    
    doc.setFontSize(12);
    const conclusionY = 50;
    doc.text('На основе анализа данных можно сделать следующие выводы:', 20, conclusionY);
    
    const topDish = dishesData.popular_dishes[0];
    const topRevenue = salesData.report[0];
    
    if (topDish && topRevenue) {
        doc.text(`1. Самое популярное блюдо: "${topDish.dish_name}"`, 25, conclusionY + 10);
        doc.text(`   - Продано: ${topDish.total_sold} раз`, 30, conclusionY + 17);
        doc.text(`   - Принесло: ${topDish.total_revenue.toFixed(2)} руб.`, 30, conclusionY + 24);
        
        doc.text(`2. Блюдо с максимальной выручкой: "${topRevenue.dish_name}"`, 25, conclusionY + 35);
        doc.text(`   - Выручка: ${topRevenue.total_revenue.toFixed(2)} руб.`, 30, conclusionY + 42);
        doc.text(`   - Доля в общей выручке: ${topRevenue.revenue_share.toFixed(2)}%`, 30, conclusionY + 49);
        
        doc.text('3. Рекомендации:', 25, conclusionY + 60);
        doc.text('   - Увеличить запас ингредиентов для популярных блюд', 30, conclusionY + 67);
        doc.text('   - Рассмотреть возможность увеличения цен на блюда с высокой долей выручки', 30, conclusionY + 74);
        doc.text('   - Разработать акции для менее популярных блюд', 30, conclusionY + 81);
    }
    
    // Подвал
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('© Ресторанная система управления. Отчет сгенерирован автоматически.', 
            pageWidth / 2, pageHeight - 10, { align: 'center' });
    
    return doc;
};

// Вспомогательные функции
const getPeriodText = (period) => {
    const periods = {
        'day': 'За день',
        'week': 'За неделю',
        'month': 'За месяц',
        'year': 'За год',
        'custom': 'Выбранный период'
    };
    return periods[period] || period;
};

const getPopularityStars = (count, maxCount) => {
    const percentage = (count / maxCount) * 100;
    if (percentage >= 80) return '★★★★★';
    if (percentage >= 60) return '★★★★☆';
    if (percentage >= 40) return '★★★☆☆';
    if (percentage >= 20) return '★★☆☆☆';
    return '★☆☆☆☆';
};

// Функция для скачивания PDF
export const downloadPDF = (pdfDoc, filename) => {
    pdfDoc.save(filename);
};