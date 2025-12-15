from flask import Blueprint, send_file, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from models import Order, Sale, Dish, Table as RestaurantTable, Employee
from database import db
from datetime import datetime
import io
from reportlab.pdfgen import canvas
from reportlab.lib.fonts import addMapping
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import os

receipts_bp = Blueprint('receipts', __name__)

# Регистрируем русские шрифты
def register_russian_fonts():
    try:
        font_paths = [
            'C:/Windows/Fonts/arial.ttf',
            'C:/Windows/Fonts/arialbd.ttf',
            'C:/Windows/Fonts/tahoma.ttf',
            'C:/Windows/Fonts/tahomabd.ttf', 
        ]
        
        registered = False
        for font_path in font_paths:
            if os.path.exists(font_path):
                try:
                    # Регистрируем обычный шрифт
                    pdfmetrics.registerFont(TTFont('Arial', font_path))
                    
                    # Пробуем найти bold версию
                    base_path = os.path.splitext(font_path)[0]
                    bold_path = base_path + 'bd.ttf'  # arialbd.ttf
                    if os.path.exists(bold_path):
                        pdfmetrics.registerFont(TTFont('Arial-Bold', bold_path))
                        addMapping('Arial', 0, 0, 'Arial')
                        addMapping('Arial', 1, 0, 'Arial-Bold')
                    else:
                        # Если нет отдельного bold файла, используем тот же
                        pdfmetrics.registerFont(TTFont('Arial-Bold', font_path))
                        addMapping('Arial', 0, 0, 'Arial')
                        addMapping('Arial', 1, 0, 'Arial-Bold')
                    
                    registered = True
                    break
                    
                except Exception as e:
                    continue
        return registered
        
    except Exception as e:
        return False

# Регистрируем шрифты
register_russian_fonts()

@receipts_bp.route('/<int:order_id>', methods=['GET'])
@jwt_required()
def generate_receipt(order_id):
    """Сгенерировать PDF чек для заказа"""
    try:
        # Получаем заказ
        order = Order.query.get(order_id)
        
        if not order:
            return jsonify({'error': 'Заказ не найден'}), 404
        
        # Проверка прав доступа
        current_user_id = int(get_jwt_identity())
        claims = get_jwt()
        
        # Для официантов показываем только их заказы
        if claims.get('position') != 'Администратор' and order.employee_id != current_user_id:
            return jsonify({'error': 'Доступ запрещен'}), 403
        
        # Получаем данные
        table = RestaurantTable.query.get(order.table_id)
        employee = Employee.query.get(order.employee_id)
        
        # Получаем блюда заказа
        order_items = []
        total_amount = 0
        
        for sale in order.sales:
            dish = Dish.query.get(sale.dish_id)
            if dish:
                price = float(dish.price) if dish.price else 0
                subtotal = price * sale.quantity
                total_amount += subtotal
                order_items.append({
                    'name': dish.name,
                    'quantity': sale.quantity,
                    'price': price,
                    'subtotal': subtotal
                })
        
        # Создаем PDF в памяти
        buffer = io.BytesIO()
        
        # Используем SimpleDocTemplate
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            leftMargin=40,
            rightMargin=40,
            topMargin=40,
            bottomMargin=40
        )
        
        # Создаем пользовательские стили с русскими шрифтами
        styles = getSampleStyleSheet()
        
        # Стиль для заголовка
        styles.add(ParagraphStyle(
            name='RussianTitle',
            parent=styles['Title'],
            fontName='Arial-Bold',
            fontSize=16,
            alignment=1,  # center
            spaceAfter=20
        ))
        
        # Стиль для текста
        styles.add(ParagraphStyle(
            name='RussianNormal',
            parent=styles['Normal'],
            fontName='Arial',
            fontSize=10,
            spaceAfter=5
        ))
        
        # Стиль для подвала
        styles.add(ParagraphStyle(
            name='RussianFooter',
            parent=styles['Normal'],
            fontName='Arial',
            fontSize=8,
            alignment=1,  # center
            textColor=colors.grey
        ))
        
        # Создаем элементы документа
        elements = []
        
        # Заголовок
        elements.append(Paragraph("РЕСТОРАН", styles['RussianTitle']))
        elements.append(Paragraph("КАССОВЫЙ ЧЕК", styles['RussianTitle']))
        
        elements.append(Spacer(1, 20))
        
        # Информация о заказе
        elements.append(Paragraph(f"Чек №: {order.id}", styles['RussianNormal']))
        elements.append(Paragraph(f"Стол: {table.id if table else 'N/A'}", styles['RussianNormal']))
        elements.append(Paragraph(f"Официант: {employee.full_name if employee else 'N/A'}", styles['RussianNormal']))
        elements.append(Paragraph(f"Дата: {order.order_datetime.strftime('%d.%m.%Y %H:%M')}", styles['RussianNormal']))
        
        elements.append(Spacer(1, 20))
        
        # Таблица с блюдами
        if order_items:
            table_data = [['№', 'Наименование', 'Кол-во', 'Цена', 'Сумма']]
            
            for i, item in enumerate(order_items, 1):
                table_data.append([
                    str(i),
                    item['name'],
                    str(item['quantity']),
                    f"{item['price']:.2f}",
                    f"{item['subtotal']:.2f}"
                ])
            
            # Итоговая строка
            table_data.append(['', '', '', 'ИТОГО:', f"{total_amount:.2f} руб."])
            
            # Создаем таблицу
            pdf_table = Table(table_data, colWidths=[30, 220, 50, 60, 70])
            
            # Проверяем доступные шрифты
            available_fonts = pdfmetrics.getRegisteredFontNames()
            print(f"Доступные шрифты для таблицы: {available_fonts}")
            
            # Используем 'Arial' если он зарегистрирован, иначе 'Helvetica'
            font_name = 'Arial' if 'Arial' in available_fonts else 'Helvetica'
            font_name_bold = 'Arial-Bold' if 'Arial-Bold' in available_fonts else 'Helvetica-Bold'
            
            print(f"Используем шрифты: {font_name} (обычный), {font_name_bold} (жирный)")
            
            # Стили таблицы с правильными шрифтами
            table_style = TableStyle([
                # Заголовок
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#3498DB')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), font_name_bold),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                
                # Данные
                ('ALIGN', (0, 1), (-1, -2), 'CENTER'),
                ('ALIGN', (1, 1), (1, -2), 'LEFT'),
                ('FONTNAME', (0, 1), (-1, -2), font_name),
                ('FONTSIZE', (0, 1), (-1, -2), 9),
                ('BACKGROUND', (0, 1), (-1, -2), colors.HexColor('#F8F9FA')),
                
                # Итог
                ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#2C3E50')),
                ('TEXTCOLOR', (0, -1), (-1, -1), colors.white),
                ('FONTNAME', (0, -1), (-1, -1), font_name_bold),
                ('FONTSIZE', (0, -1), (-1, -1), 11),
                
                # Границы
                ('GRID', (0, 0), (-1, -2), 0.5, colors.HexColor('#DDDDDD')),
                ('BOX', (0, 0), (-1, -1), 1, colors.black),
            ])
            
            pdf_table.setStyle(table_style)
            elements.append(pdf_table)
        else:
            # Если нет блюд в заказе
            elements.append(Paragraph("Заказ пуст", styles['RussianNormal']))
        
        elements.append(Spacer(1, 30))
        
        # Подпись
        elements.append(Paragraph("Спасибо за посещение!", styles['RussianFooter']))
        elements.append(Paragraph("Чек действителен для налоговой отчетности", styles['RussianFooter']))
        elements.append(Paragraph(f"© Ресторан {datetime.now().year}", styles['RussianFooter']))
        
        # Генерируем PDF
        doc.build(elements)
        buffer.seek(0)
        
        # Отправляем файл
        filename = f'чек_{order_id}.pdf'
        return send_file(
            buffer,
            as_attachment=True,
            download_name=filename,
            mimetype='application/pdf'
        )
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Ошибка генерации чека: {str(e)}'}), 500