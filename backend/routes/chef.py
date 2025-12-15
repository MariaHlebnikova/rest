from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from models import Sale, Dish, Order, Table
from database import db

chef_bp = Blueprint('chef', __name__)

@chef_bp.route('/orders', methods=['GET'])
@jwt_required()
def get_chef_orders():
    """Получить заказы для повара (только не готовые блюда)"""
    try:
        # Проверяем, что пользователь - повар
        claims = get_jwt()
        user_position = claims.get('position', 'unknown')
        
        if user_position not in ['Повар', 'Администратор']:
            return jsonify({'error': 'Доступ запрещен. Только для поваров и администраторов.'}), 403
        
        # Получаем все неготовые блюда из активных заказов
        sales = Sale.query\
            .join(Dish, Sale.dish_id == Dish.id)\
            .join(Order, Sale.order_id == Order.id)\
            .join(Table, Order.table_id == Table.id)\
            .filter(
                Sale.is_ready == False,
                Order.is_active == True
            )\
            .add_columns(
                Sale.id,
                Sale.order_id,
                Sale.dish_id,
                Sale.quantity,
                Sale.is_ready,
                Dish.name.label('dish_name'),
                Dish.composition,
                Dish.weight_grams,
                Table.id.label('table_number')
            )\
            .order_by(Sale.order_id)\
            .all()
        
        result = []
        for sale in sales:
            result.append({
                'id': sale.id,
                'order_id': sale.order_id,
                'dish_id': sale.dish_id,
                'dish_name': sale.dish_name,
                'composition': sale.composition,
                'weight_grams': sale.weight_grams,
                'quantity': sale.quantity,
                'is_ready': sale.is_ready,
                'table_number': sale.table_number
            })
        
        return jsonify(result), 200
        
    except Exception as e:
        print(f"Ошибка при получении заказов для повара: {e}")
        return jsonify({'error': str(e)}), 500

@chef_bp.route('/orders/<int:sale_id>/ready', methods=['POST'])
@jwt_required()
def mark_dish_as_ready(sale_id):
    """Отметить блюдо как готовое"""
    try:
        # Проверяем, что пользователь - повар
        claims = get_jwt()
        user_position = claims.get('position', 'unknown')
        
        if user_position not in ['Повар', 'Администратор']:
            return jsonify({'error': 'Доступ запрещен. Только для поваров и администраторов.'}), 403
        
        sale = Sale.query.get(sale_id)
        if not sale:
            return jsonify({'error': 'Блюдо не найдено'}), 404
        
        # Проверяем, что заказ еще активен
        order = Order.query.get(sale.order_id)
        if not order or not order.is_active:
            return jsonify({'error': 'Заказ уже закрыт или не найден'}), 400
        
        # Отмечаем блюдо как готовое
        sale.is_ready = True
        db.session.commit()
        
        # Получаем информацию о блюде для ответа
        dish = Dish.query.get(sale.dish_id)
        
        return jsonify({
            'success': True,
            'message': f'Блюдо "{dish.name}" отмечено как готовое',
            'sale_id': sale.id,
            'order_id': sale.order_id,
            'dish_name': dish.name
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Ошибка при обновлении статуса блюда: {e}")
        return jsonify({'error': str(e)}), 500

@chef_bp.route('/orders/<int:order_id>/all-ready', methods=['POST'])
@jwt_required()
def mark_all_dishes_ready(order_id):
    """Отметить все блюда в заказе как готовые"""
    try:
        # Проверяем, что пользователь - повар
        claims = get_jwt()
        user_position = claims.get('position', 'unknown')
        
        if user_position not in ['Повар', 'Администратор']:
            return jsonify({'error': 'Доступ запрещен. Только для поваров и администраторов.'}), 403
        
        order = Order.query.get(order_id)
        if not order or not order.is_active:
            return jsonify({'error': 'Заказ не найден или уже закрыт'}), 404
        
        # Находим все неготовые блюда в заказе
        pending_sales = Sale.query.filter_by(
            order_id=order_id,
            is_ready=False
        ).all()
        
        if not pending_sales:
            return jsonify({'error': 'Нет неготовых блюд в заказе'}), 400
        
        # Отмечаем все как готовые
        for sale in pending_sales:
            sale.is_ready = True
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'Все блюда в заказе #{order_id} отмечены как готовые',
            'order_id': order_id,
            'marked_count': len(pending_sales)
        }), 200
        
    except Exception as e:
        db.session.rollback()
        print(f"Ошибка при массовом обновлении статуса блюд: {e}")
        return jsonify({'error': str(e)}), 500