from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from models import Order, Sale, Dish, Table, Employee
from database import db
from datetime import datetime

orders_bp = Blueprint('orders', __name__)

@orders_bp.route('/', methods=['GET'])
@jwt_required()
def get_orders():
    """Получить все заказы"""
    current_user = get_jwt_identity()
    
    query = Order.query
    
    # Если пользователь не администратор, показываем только его заказы
    if current_user.get('position') != 'Администратор':
        query = query.filter_by(employee_id=current_user['id'])
    
    orders = query.order_by(Order.order_datetime.desc()).all()
    
    result = []
    for order in orders:
        table = Table.query.get(order.table_id)
        employee = Employee.query.get(order.employee_id)
        
        result.append({
            'id': order.id,
            'table_id': order.table_id,
            'table_number': table.id if table else None,
            'employee_id': order.employee_id,
            'employee_name': employee.full_name if employee else None,
            'order_datetime': order.order_datetime.isoformat() if order.order_datetime else None,
            'total_amount': float(order.total_amount) if order.total_amount else None,
            'item_count': sum(sale.quantity for sale in order.sales)
        })
    
    return jsonify(result), 200

@orders_bp.route('/', methods=['POST'])
@jwt_required()
def create_order():
    """Создать новый заказ"""
    data = request.get_json()
    current_user = int(get_jwt_identity())
    
    # Проверка обязательных полей
    required_fields = ['table_id', 'items']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Поле {field} обязательно'}), 400
    
    # Проверка существования стола
    table = Table.query.get(data['table_id'])
    if not table:
        return jsonify({'error': 'Стол не найден'}), 404
    
    # Проверка, что есть блюда в заказе
    if not data['items'] or len(data['items']) == 0:
        return jsonify({'error': 'Заказ должен содержать хотя бы одно блюдо'}), 400
    
    # Создание заказа
    new_order = Order(
        table_id=data['table_id'],
        employee_id=current_user
    )
    
    db.session.add(new_order)
    db.session.flush()  # Получаем ID заказа
    
    total_amount = 0
    
    # Добавляем блюда в заказ
    for item in data['items']:
        dish_id = item.get('dish_id')
        quantity = item.get('quantity', 1)
        
        if not dish_id:
            continue
        
        dish = Dish.query.get(dish_id)
        if not dish or not dish.is_available:
            continue
        
        # Создаем запись о продаже
        sale = Sale(
            order_id=new_order.id,
            dish_id=dish_id,
            quantity=quantity
        )
        
        db.session.add(sale)
        
        # Считаем общую сумму
        total_amount += float(dish.price) * quantity
    
    # Обновляем общую сумму заказа
    new_order.total_amount = total_amount
    
    db.session.commit()
    
    return jsonify({
        'message': 'Заказ создан успешно',
        'order_id': new_order.id,
        'total_amount': total_amount
    }), 201

@orders_bp.route('/<int:order_id>', methods=['GET'])
@jwt_required()
def get_order(order_id):
    """Получить детали заказа"""
    order = Order.query.get(order_id)
    
    if not order:
        return jsonify({'error': 'Заказ не найден'}), 404
    
    # Проверка прав доступа
    current_user = get_jwt_identity()
    if current_user.get('position') != 'Администратор' and order.employee_id != current_user['id']:
        return jsonify({'error': 'Доступ запрещен'}), 403
    
    table = Table.query.get(order.table_id)
    employee = Employee.query.get(order.employee_id)
    
    # Получаем блюда в заказе
    order_items = []
    for sale in order.sales:
        dish = Dish.query.get(sale.dish_id)
        if dish:
            order_items.append({
                'dish_id': dish.id,
                'dish_name': dish.name,
                'price': float(dish.price) if dish.price else None,
                'quantity': sale.quantity,
                'subtotal': float(dish.price) * sale.quantity if dish.price else None
            })
    
    return jsonify({
        'id': order.id,
        'table_id': order.table_id,
        'table_number': table.id if table else None,
        'employee_id': order.employee_id,
        'employee_name': employee.full_name if employee else None,
        'order_datetime': order.order_datetime.isoformat() if order.order_datetime else None,
        'total_amount': float(order.total_amount) if order.total_amount else None,
        'items': order_items
    }), 200

@orders_bp.route('/<int:order_id>/close', methods=['POST'])
@jwt_required()
def close_order(order_id):
    """Закрыть заказ (для печати чека)"""
    order = Order.query.get(order_id)
    
    if not order:
        return jsonify({'error': 'Заказ не найден'}), 404
    
    # Проверка прав доступа
    current_user = get_jwt_identity()
    if current_user.get('position') != 'Администратор' and order.employee_id != current_user['id']:
        return jsonify({'error': 'Доступ запрещен'}), 403
    
    # Здесь будет логика генерации PDF чека
    # Пока просто возвращаем успех
    
    return jsonify({
        'message': 'Заказ закрыт успешно',
        'order_id': order.id,
        'receipt_available': True,
        'receipt_url': f'/api/orders/{order_id}/receipt'  # Будущий эндпоинт для чека
    }), 200

@orders_bp.route('/<int:order_id>/add-item', methods=['POST'])
@jwt_required()
def add_item_to_order(order_id):
    """Добавить блюдо в существующий заказ"""
    data = request.get_json()
    order = Order.query.get(order_id)
    
    if not order:
        return jsonify({'error': 'Заказ не найден'}), 404
    
    # Проверка прав доступа
    current_user = get_jwt_identity()
    if current_user.get('position') != 'Администратор' and order.employee_id != current_user['id']:
        return jsonify({'error': 'Доступ запрещен'}), 403
    
    if not data or not data.get('dish_id'):
        return jsonify({'error': 'ID блюда обязательно'}), 400
    
    dish_id = data['dish_id']
    quantity = data.get('quantity', 1)
    
    dish = Dish.query.get(dish_id)
    if not dish or not dish.is_available:
        return jsonify({'error': 'Блюдо не найдено или недоступно'}), 404
    
    # Добавляем блюдо в заказ
    sale = Sale(
        order_id=order.id,
        dish_id=dish_id,
        quantity=quantity
    )
    
    db.session.add(sale)
    
    # Обновляем общую сумму
    order.total_amount = (float(order.total_amount) if order.total_amount else 0) + (float(dish.price) * quantity)
    
    db.session.commit()
    
    return jsonify({
        'message': 'Блюдо добавлено в заказ',
        'order_id': order.id,
        'dish_name': dish.name,
        'quantity': quantity,
        'added_amount': float(dish.price) * quantity
    }), 200

@orders_bp.route('/active', methods=['GET'])
@jwt_required()
def get_active_orders():
    """Получить активные (не закрытые) заказы"""
    # Получаем JWT claims
    claims = get_jwt()
    
    # Получаем ID пользователя (identity это строка)
    user_id = int(get_jwt_identity())
    user_position = claims.get('position', 'unknown')
    
    query = Order.query
    
    # Если пользователь не администратор, показываем только его заказы
    if user_position != 'Администратор':
        query = query.filter_by(employee_id=user_id)
    
    # Заказы за сегодня
    today = datetime.now().date()
    orders = query.filter(
        db.func.DATE(Order.order_datetime) == today
    ).order_by(Order.order_datetime.desc()).all()
    
    result = []
    for order in orders:
        table = Table.query.get(order.table_id)
        
        # Получаем список блюд в заказе
        dish_names = []
        for sale in order.sales[:3]:  # Первые 3 блюда
            dish = Dish.query.get(sale.dish_id)
            if dish:
                dish_names.append(dish.name)
        
        result.append({
            'id': order.id,
            'table_id': order.table_id,
            'table_number': table.id if table else None,
            'order_datetime': order.order_datetime.isoformat() if order.order_datetime else None,
            'total_amount': float(order.total_amount) if order.total_amount else None,
            'item_count': len(order.sales),
            'dishes_preview': ', '.join(dish_names) + ('...' if len(order.sales) > 3 else '')
        })
    
    return jsonify(result), 200