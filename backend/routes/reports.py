from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required
from database import db
from datetime import datetime
import io
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.fonts import addMapping
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from sqlalchemy import text
import os

reports_bp = Blueprint('reports', __name__)

# Регистрируем русские шрифты
def register_russian_fonts():
    try:
        # Попробуем найти стандартные шрифты Windows
        font_paths = [
            'C:/Windows/Fonts/arial.ttf',
            'C:/Windows/Fonts/tahoma.ttf',
        ]
        
        for font_path in font_paths:
            if os.path.exists(font_path):
                pdfmetrics.registerFont(TTFont('Arial', font_path))
                pdfmetrics.registerFont(TTFont('Arial-Bold', font_path))
                addMapping('Arial', 0, 0, 'Arial')
                addMapping('Arial', 1, 0, 'Arial-Bold')
                return True
        
        # Если не нашли, используем дефолтный
        return False
        
    except Exception as e:
        return False

# Регистрируем шрифты при импорте
register_russian_fonts()

@reports_bp.route('/sales', methods=['GET'])
@jwt_required()
def get_sales_report():
    """Отчет по продажам за период"""
    
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')
    
    if not start_date_str or not end_date_str:
        return jsonify({'error': 'Параметры start_date и end_date обязательны'}), 400
    
    try:
        # Простое преобразование дат
        start_date = datetime.strptime(start_date_str.split('T')[0], '%Y-%m-%d').date()
        end_date = datetime.strptime(end_date_str.split('T')[0], '%Y-%m-%d').date()
        
    except ValueError as e:
        return jsonify({'error': f'Неверный формат даты. Используйте YYYY-MM-DD'}), 400
    
    try:
        # Улучшенный запрос с проверкой наличия данных
        query = text("""
        SELECT 
            d.name as dish_name,
            COALESCE(SUM(s.quantity), 0) as quantity_sold,
            COALESCE(SUM(s.quantity * d.price), 0) as total_revenue
        FROM dish d
        LEFT JOIN sale s ON d.id = s.dish_id
        LEFT JOIN restaurant_order o ON s.order_id = o.id 
            AND DATE(o.order_datetime) BETWEEN :start_date AND :end_date
        WHERE EXISTS (
            SELECT 1 FROM sale s2 
            JOIN restaurant_order o2 ON s2.order_id = o2.id
            WHERE s2.dish_id = d.id 
            AND DATE(o2.order_datetime) BETWEEN :start_date AND :end_date
        )
        GROUP BY d.id, d.name
        ORDER BY total_revenue DESC
        """)
        
        result = db.session.execute(query, {
            'start_date': start_date,
            'end_date': end_date
        }).fetchall()
        
        # Общая выручка за период
        total_revenue_query = text("""
        SELECT COALESCE(SUM(total_amount), 0) as total_period_revenue
        FROM restaurant_order
        WHERE DATE(order_datetime) BETWEEN :start_date AND :end_date
        """)
        
        total_revenue_result = db.session.execute(total_revenue_query, {
            'start_date': start_date,
            'end_date': end_date
        }).fetchone()
        
        total_period_revenue = float(total_revenue_result[0]) if total_revenue_result and total_revenue_result[0] else 0.0
        
        # Формируем отчет
        report = []
        for row in result:
            dish_name, quantity_sold, total_revenue = row
            
            quantity_sold = int(quantity_sold) if quantity_sold else 0
            total_revenue = float(total_revenue) if total_revenue else 0.0
            
            revenue_share = (total_revenue / total_period_revenue * 100) if total_period_revenue > 0 else 0
            
            report.append({
                'dish_name': dish_name,
                'quantity_sold': quantity_sold,
                'total_revenue': round(total_revenue, 2),
                'revenue_share': round(revenue_share, 2)
            })
        
        return jsonify({
            'period': {
                'start_date': start_date.isoformat(),
                'end_date': end_date.isoformat()
            },
            'total_period_revenue': round(total_period_revenue, 2),
            'report': report,
            'message': 'Отчет успешно сгенерирован' if report else 'Нет данных за указанный период'
        }), 200
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Ошибка базы данных: {str(e)}'}), 500

@reports_bp.route('/sales/pdf', methods=['GET'])
@jwt_required()
def get_sales_report_pdf():
    """PDF отчет по продажам с русскими шрифтами"""
    
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')
    
    if not start_date_str or not end_date_str:
        return jsonify({'error': 'Параметры start_date и end_date обязательны'}), 400
    
    try:
        start_date = datetime.strptime(start_date_str.split('T')[0], '%Y-%m-%d').date()
        end_date = datetime.strptime(end_date_str.split('T')[0], '%Y-%m-%d').date()
        
    except ValueError as e:
        return jsonify({'error': f'Неверный формат даты: {str(e)}'}), 400
    
    try:
        # Получаем данные
        query = text("""
        SELECT 
            d.name as dish_name,
            COALESCE(SUM(s.quantity), 0) as quantity_sold,
            COALESCE(SUM(s.quantity * d.price), 0) as total_revenue
        FROM dish d
        LEFT JOIN sale s ON d.id = s.dish_id
        LEFT JOIN restaurant_order o ON s.order_id = o.id 
            AND DATE(o.order_datetime) BETWEEN :start_date AND :end_date
        WHERE EXISTS (
            SELECT 1 FROM sale s2 
            JOIN restaurant_order o2 ON s2.order_id = o2.id
            WHERE s2.dish_id = d.id 
            AND DATE(o2.order_datetime) BETWEEN :start_date AND :end_date
        )
        GROUP BY d.id, d.name
        ORDER BY total_revenue DESC
        """)
        
        result = db.session.execute(query, {
            'start_date': start_date,
            'end_date': end_date
        }).fetchall()
        
        # Общая выручка
        total_revenue_query = text("""
        SELECT COALESCE(SUM(total_amount), 0) as total_period_revenue
        FROM restaurant_order
        WHERE DATE(order_datetime) BETWEEN :start_date AND :end_date
        """)
        
        total_revenue_result = db.session.execute(total_revenue_query, {
            'start_date': start_date,
            'end_date': end_date
        }).fetchone()
        
        total_period_revenue = float(total_revenue_result[0]) if total_revenue_result and total_revenue_result[0] else 0.0
        
        # Создаем PDF с русскими шрифтами
        buffer = io.BytesIO()
        
        # Создаем пользовательские стили
        styles = getSampleStyleSheet()
        
        # Добавляем русские стили
        styles.add(ParagraphStyle(
            name='RussianTitle',
            parent=styles['Title'],
            fontName='Arial-Bold',
            fontSize=18,
            alignment=1,  # центрирование
            spaceAfter=30
        ))
        
        styles.add(ParagraphStyle(
            name='RussianHeading',
            parent=styles['Heading2'],
            fontName='Arial-Bold',
            fontSize=14,
            textColor=colors.HexColor('#2C3E50')
        ))
        
        styles.add(ParagraphStyle(
            name='RussianNormal',
            parent=styles['Normal'],
            fontName='Arial',
            fontSize=10
        ))
        
        styles.add(ParagraphStyle(
            name='RussianTableHeader',
            parent=styles['Normal'],
            fontName='Arial-Bold',
            fontSize=10,
            textColor=colors.white,
            alignment=1
        ))
        
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        elements = []
        
        # Заголовок
        title = Paragraph(f"ОТЧЕТ О ПРОДАЖАХ", styles['RussianTitle'])
        elements.append(title)
        
        # Период
        period_text = Paragraph(
            f"Период: {start_date.strftime('%d.%m.%Y')} - {end_date.strftime('%d.%m.%Y')}", 
            styles['RussianHeading']
        )
        elements.append(period_text)
        
        elements.append(Spacer(1, 12))
        
        # Информация о отчете
        info_text = Paragraph(
            f"Дата формирования: {datetime.now().strftime('%d.%m.%Y %H:%M')}<br/>"
            f"Общая выручка: {total_period_revenue:.2f} руб.<br/>"
            f"Количество позиций: {len(result)}",
            styles['RussianNormal']
        )
        elements.append(info_text)
        
        elements.append(Spacer(1, 20))
        
        # Таблица с данными
        if result and len(result) > 0:
            # Заголовки таблицы
            table_data = [
                ['№', 'Наименование блюда', 'Количество', 'Выручка, руб.', 'Доля, %']
            ]
            
            total_quantity = 0
            for i, row in enumerate(result, 1):
                dish_name, quantity_sold, total_revenue = row
                
                quantity_sold = int(quantity_sold) if quantity_sold else 0
                total_revenue = float(total_revenue) if total_revenue else 0.0
                total_quantity += quantity_sold
                
                revenue_share = (total_revenue / total_period_revenue * 100) if total_period_revenue > 0 else 0
                
                table_data.append([
                    str(i),
                    dish_name,
                    str(quantity_sold),
                    f"{total_revenue:.2f}",
                    f"{revenue_share:.2f}"
                ])
            
            # Итоговая строка
            table_data.append([
                "   ИТОГО",
                "",
                str(total_quantity),
                f"{total_period_revenue:.2f}",
                "100.00"
            ])
            
            # Создаем таблицу
            pdf_table = Table(table_data, colWidths=[30, 200, 60, 70, 50])
            pdf_table.setStyle(TableStyle([
                # Заголовок
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3498DB')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('FONTNAME', (0, 0), (-1, 0), 'Arial-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                
                # Тело таблицы
                ('FONTNAME', (0, 1), (-1, -2), 'Arial'),
                ('FONTSIZE', (0, 1), (-1, -2), 9),
                ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
                ('ALIGN', (1, 1), (1, -2), 'LEFT'),
                ('BACKGROUND', (0, 1), (-1, -2), colors.HexColor('#F8F9FA')),
                ('GRID', (0, 0), (-1, -2), 0.5, colors.HexColor('#DDDDDD')),
                
                # Итоговая строка
                ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#2C3E50')),
                ('TEXTCOLOR', (0, -1), (-1, -1), colors.white),
                ('FONTNAME', (0, -1), (-1, -1), 'Arial-Bold'),
                ('FONTSIZE', (0, -1), (-1, -1), 10),
                
                # Границы
                ('BOX', (0, 0), (-1, -1), 1, colors.black),
                ('LINEABOVE', (0, -1), (-1, -1), 1, colors.white),
            ]))
            
            elements.append(pdf_table)
        else:
            # Сообщение об отсутствии данных
            no_data = Paragraph(
                "НЕТ ДАННЫХ ДЛЯ ОТЧЕТА<br/><br/>"
                f"За период с {start_date.strftime('%d.%m.%Y')} по {end_date.strftime('%d.%m.%Y')} "
                "продажи отсутствуют.",
                ParagraphStyle(
                    name='NoData',
                    fontName='Arial',
                    fontSize=12,
                    textColor=colors.HexColor('#E74C3C'),
                    alignment=1
                )
            )
            elements.append(no_data)
        
        # Подпись
        elements.append(Spacer(1, 30))
        
        footer = Paragraph(
            "Отчет сформирован автоматически системой управления рестораном<br/>"
            f"© {datetime.now().year} Ресторан",
            ParagraphStyle(
                name='Footer',
                fontName='Arial',
                fontSize=8,
                textColor=colors.HexColor('#7F8C8D'),
                alignment=1
            )
        )
        elements.append(footer)
        
        # Генерация PDF
        doc.build(elements)
        buffer.seek(0)
        
        # Отправляем файл
        filename = f'отчет_продаж_{start_date}_{end_date}.pdf'
        return send_file(
            buffer,
            as_attachment=True,
            download_name=filename,
            mimetype='application/pdf'
        )
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Ошибка генерации PDF: {str(e)}'}), 500

@reports_bp.route('/check-data', methods=['GET'])
def check_data():
    """Проверка наличия данных"""
    try:
        # Проверяем наличие тестовых данных
        from datetime import date
        
        today = date.today()
        
        # Проверяем заказы за сегодня
        query = text("""
        SELECT 
            COUNT(*) as orders_count,
            COALESCE(SUM(total_amount), 0) as total_amount
        FROM restaurant_order 
        WHERE DATE(order_datetime) = :today
        """)
        
        result = db.session.execute(query, {'today': today}).fetchone()
        
        # Проверяем продажи
        sales_query = text("""
        SELECT COUNT(*) as sales_count
        FROM sale s
        JOIN restaurant_order o ON s.order_id = o.id
        WHERE DATE(o.order_datetime) = :today
        """)
        
        sales_result = db.session.execute(sales_query, {'today': today}).fetchone()
        
        # Проверяем блюда
        dishes_query = text("SELECT COUNT(*) as dishes_count FROM dish")
        dishes_result = db.session.execute(dishes_query).fetchone()
        
        return jsonify({
            'date': today.isoformat(),
            'orders': {
                'count': result[0] if result else 0,
                'total_amount': float(result[1]) if result and result[1] else 0.0
            },
            'sales': {
                'count': sales_result[0] if sales_result else 0
            },
            'dishes': {
                'count': dishes_result[0] if dishes_result else 0
            },
            'message': 'Для генерации отчета нужны заказы и продажи за выбранный период.'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500