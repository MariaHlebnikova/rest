from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Sale, Dish, Order, Booking, Table, Hall
from database import db
from datetime import datetime, timedelta
import io
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph
from reportlab.lib.styles import getSampleStyleSheet
from flask import send_file

reports_bp = Blueprint('reports', __name__)

def check_admin_access(current_user):
    """Проверка, является ли пользователь администратором"""
    return current_user.get('position') == 'Администратор'

@reports_bp.route('/sales', methods=['GET'])
@jwt_required()
def get_sales_report():
    """Отчет по продажам за период (п. 5.2.3.1 ТЗ)"""
    current_user = get_jwt_identity()
    
    if not check_admin_access(current_user):
        return jsonify({'error': 'Доступ запрещен. Требуются права администратора'}), 403
    
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')
    
    if not start_date_str or not end_date_str:
        return jsonify({'error': 'Параметры start_date и end_date обязательны'}), 400
    
    try:
        start_date = datetime.fromisoformat(start_date_str.replace('Z', '+00:00')).date()
        end_date = datetime.fromisoformat(end_date_str.replace('Z', '+00:00')).date()
    except ValueError:
        return jsonify({'error': 'Неверный формат даты'}), 400
    
    # SQL запрос для получения отчета по продажам
    query = """
    SELECT 
        d.id as dish_id,
        d.name as dish_name,
        SUM(s.quantity) as quantity_sold,
        SUM(s.quantity * d.price) as total_revenue
    FROM sale s
    JOIN dish d ON s.dish_id = d.id
    JOIN restaurant_order o ON s.order_id = o.id
    WHERE DATE(o.order_datetime) BETWEEN :start_date AND :end_date
    GROUP BY d.id, d.name
    ORDER BY total_revenue DESC
    """
    
    result = db.session.execute(query, {
        'start_date': start_date,
        'end_date': end_date
    }).fetchall()
    
    # Общая выручка за период
    total_revenue_query = """
    SELECT COALESCE(SUM(o.total_amount), 0) as total_period_revenue
    FROM restaurant_order o
    WHERE DATE(o.order_datetime) BETWEEN :start_date AND :end_date
    """
    
    total_revenue_result = db.session.execute(total_revenue_query, {
        'start_date': start_date,
        'end_date': end_date
    }).fetchone()
    
    total_period_revenue = total_revenue_result[0] if total_revenue_result else 0
    
    # Формируем отчет
    report = []
    for row in result:
        dish_id, dish_name, quantity_sold, total_revenue = row
        
        # Рассчитываем долю в общей выручке
        revenue_share = (float(total_revenue) / float(total_period_revenue) * 100) if total_period_revenue > 0 else 0
        
        report.append({
            'dish_id': dish_id,
            'dish_name': dish_name,
            'quantity_sold': int(quantity_sold),
            'total_revenue': float(total_revenue),
            'revenue_share': round(revenue_share, 2)
        })
    
    return jsonify({
        'period': {
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat()
        },
        'total_period_revenue': float(total_period_revenue),
        'report': report
    }), 200

@reports_bp.route('/sales/pdf', methods=['GET'])
@jwt_required()
def get_sales_report_pdf():
    """PDF отчет по продажам"""
    current_user = get_jwt_identity()
    
    if not check_admin_access(current_user):
        return jsonify({'error': 'Доступ запрещен. Требуются права администратора'}), 403
    
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')
    
    if not start_date_str or not end_date_str:
        return jsonify({'error': 'Параметры start_date и end_date обязательны'}), 400
    
    try:
        start_date = datetime.fromisoformat(start_date_str.replace('Z', '+00:00')).date()
        end_date = datetime.fromisoformat(end_date_str.replace('Z', '+00:00')).date()
    except ValueError:
        return jsonify({'error': 'Неверный формат даты'}), 400
    
    # Получаем данные для отчета
    query = """
    SELECT 
        d.name as dish_name,
        SUM(s.quantity) as quantity_sold,
        SUM(s.quantity * d.price) as total_revenue
    FROM sale s
    JOIN dish d ON s.dish_id = d.id
    JOIN restaurant_order o ON s.order_id = o.id
    WHERE DATE(o.order_datetime) BETWEEN :start_date AND :end_date
    GROUP BY d.id, d.name
    ORDER BY total_revenue DESC
    """
    
    result = db.session.execute(query, {
        'start_date': start_date,
        'end_date': end_date
    }).fetchall()
    
    # Общая выручка
    total_revenue_query = """
    SELECT COALESCE(SUM(o.total_amount), 0) as total_period_revenue
    FROM restaurant_order o
    WHERE DATE(o.order_datetime) BETWEEN :start_date AND :end_date
    """
    
    total_revenue_result = db.session.execute(total_revenue_query, {
        'start_date': start_date,
        'end_date': end_date
    }).fetchone()
    
    total_period_revenue = total_revenue_result[0] if total_revenue_result else 0
    
    # Создаем PDF
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4)
    elements = []
    styles = getSampleStyleSheet()
    
    # Заголовок
    title = Paragraph(f"Отчет по продажам за период с {start_date} по {end_date}", styles['Title'])
    elements.append(title)
    
    # Общая информация
    elements.append(Paragraph(f"Общая выручка за период: {float(total_period_revenue):.2f} руб.", styles['Normal']))
    elements.append(Paragraph(f"Количество позиций в отчете: {len(result)}", styles['Normal']))
    elements.append(Paragraph(" ", styles['Normal']))  # Пустая строка
    
    # Таблица с данными
    if result:
        table_data = [['Блюдо', 'Кол-во продаж', 'Выручка, руб.', 'Доля, %']]
        
        for row in result:
            dish_name, quantity_sold, total_revenue = row
            
            # Рассчитываем долю
            revenue_share = (float(total_revenue) / float(total_period_revenue) * 100) if total_period_revenue > 0 else 0
            
            table_data.append([
                dish_name,
                str(int(quantity_sold)),
                f"{float(total_revenue):.2f}",
                f"{revenue_share:.2f}"
            ])
        
        # Создаем таблицу
        pdf_table = Table(table_data)
        pdf_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black)
        ]))
        
        elements.append(pdf_table)
    
    # Генерация PDF
    doc.build(elements)
    
    buffer.seek(0)
    
    # Отправляем файл
    return send_file(
        buffer,
        as_attachment=True,
        download_name=f'sales_report_{start_date}_{end_date}.pdf',
        mimetype='application/pdf'
    )

@reports_bp.route('/bookings', methods=['GET'])
@jwt_required()
def get_bookings_report():
    """Отчет по бронированиям"""
    current_user = get_jwt_identity()
    
    if not check_admin_access(current_user):
        return jsonify({'error': 'Доступ запрещен. Требуются права администратора'}), 403
    
    start_date_str = request.args.get('start_date')
    end_date_str = request.args.get('end_date')
    
    if not start_date_str or not end_date_str:
        # По умолчанию - последние 30 дней
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=30)
    else:
        try:
            start_date = datetime.fromisoformat(start_date_str.replace('Z', '+00:00')).date()
            end_date = datetime.fromisoformat(end_date_str.replace('Z', '+00:00')).date()
        except ValueError:
            return jsonify({'error': 'Неверный формат даты'}), 400
    
    # Получаем бронирования за период
    bookings = Booking.query.filter(
        db.func.DATE(Booking.datetime) >= start_date,
        db.func.DATE(Booking.datetime) <= end_date
    ).all()
    
    # Статистика по статусам
    status_stats = {}
    for booking in bookings:
        status = booking.status_id
        status_stats[status] = status_stats.get(status, 0) + 1
    
    # Получаем названия статусов
    status_names = {}
    from models import BookingStatus
    all_statuses = BookingStatus.query.all()
    for status in all_statuses:
        status_names[status.id] = status.name
    
    # Формируем отчет
    report = {
        'period': {
            'start_date': start_date.isoformat(),
            'end_date': end_date.isoformat()
        },
        'total_bookings': len(bookings),
        'status_distribution': [
            {
                'status_id': status_id,
                'status_name': status_names.get(status_id, 'Неизвестно'),
                'count': count,
                'percentage': round((count / len(bookings) * 100), 2) if bookings else 0
            }
            for status_id, count in status_stats.items()
        ],
        'bookings_by_day': {}
    }
    
    # Группировка по дням
    for booking in bookings:
        day = booking.datetime.date().isoformat()
        if day not in report['bookings_by_day']:
            report['bookings_by_day'][day] = 0
        report['bookings_by_day'][day] += 1
    
    return jsonify(report), 200

@reports_bp.route('/popular-dishes', methods=['GET'])
@jwt_required()
def get_popular_dishes():
    """Отчет по популярным блюдам"""
    current_user = get_jwt_identity()
    
    if not check_admin_access(current_user):
        return jsonify({'error': 'Доступ запрещен. Требуются права администратора'}), 403
    
    limit = request.args.get('limit', 10, type=int)
    
    # SQL запрос для популярных блюд
    query = """
    SELECT 
        d.id,
        d.name,
        d.category_id,
        dc.name as category_name,
        SUM(s.quantity) as total_sold,
        SUM(s.quantity * d.price) as total_revenue
    FROM dish d
    LEFT JOIN sale s ON d.id = s.dish_id
    LEFT JOIN dish_category dc ON d.category_id = dc.id
    GROUP BY d.id, d.name, d.category_id, dc.name
    ORDER BY total_sold DESC
    LIMIT :limit
    """
    
    result = db.session.execute(query, {'limit': limit}).fetchall()
    
    popular_dishes = []
    for row in result:
        dish_id, dish_name, category_id, category_name, total_sold, total_revenue = row
        
        popular_dishes.append({
            'dish_id': dish_id,
            'dish_name': dish_name,
            'category_id': category_id,
            'category_name': category_name,
            'total_sold': int(total_sold) if total_sold else 0,
            'total_revenue': float(total_revenue) if total_revenue else 0
        })
    
    return jsonify({
        'limit': limit,
        'popular_dishes': popular_dishes
    }), 200

@reports_bp.route('/daily-summary', methods=['GET'])
@jwt_required()
def get_daily_summary():
    """Ежедневная сводка"""
    current_user = get_jwt_identity()
    
    if not check_admin_access(current_user):
        return jsonify({'error': 'Доступ запрещен. Требуются права администратора'}), 403
    
    date_str = request.args.get('date')
    
    if date_str:
        try:
            target_date = datetime.fromisoformat(date_str.replace('Z', '+00:00')).date()
        except ValueError:
            return jsonify({'error': 'Неверный формат даты'}), 400
    else:
        target_date = datetime.now().date()
    
    # Заказы за день
    orders_today = Order.query.filter(
        db.func.DATE(Order.order_datetime) == target_date
    ).all()
    
    total_orders = len(orders_today)
    total_revenue = sum(float(order.total_amount) for order in orders_today if order.total_amount)
    avg_order_value = total_revenue / total_orders if total_orders > 0 else 0
    
    # Бронирования на сегодня
    bookings_today = Booking.query.filter(
        db.func.DATE(Booking.datetime) == target_date
    ).all()
    
    # Самые популярные блюда сегодня
    popular_query = """
    SELECT 
        d.name,
        SUM(s.quantity) as quantity
    FROM sale s
    JOIN dish d ON s.dish_id = d.id
    JOIN restaurant_order o ON s.order_id = o.id
    WHERE DATE(o.order_datetime) = :target_date
    GROUP BY d.id, d.name
    ORDER BY quantity DESC
    LIMIT 5
    """
    
    popular_result = db.session.execute(popular_query, {'target_date': target_date}).fetchall()
    
    popular_dishes = []
    for row in popular_result:
        dish_name, quantity = row
        popular_dishes.append({
            'dish_name': dish_name,
            'quantity': int(quantity)
        })
    
    return jsonify({
        'date': target_date.isoformat(),
        'orders': {
            'total': total_orders,
            'revenue': round(total_revenue, 2),
            'average_order_value': round(avg_order_value, 2)
        },
        'bookings': {
            'total': len(bookings_today),
            'confirmed': len([b for b in bookings_today if b.status_id == 2]),  # Подтвержденные
            'new': len([b for b in bookings_today if b.status_id == 1])  # Новые
        },
        'popular_dishes_today': popular_dishes
    }), 200