from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Dish, DishCategory
from database import db

menu_bp = Blueprint('menu', __name__)

# ===================== Категории блюд =====================

@menu_bp.route('/categories', methods=['GET'])
def get_categories():
    """Получить все категории блюд"""
    categories = DishCategory.query.all()
    
    result = []
    for category in categories:
        result.append({
            'id': category.id,
            'name': category.name
        })
    
    return jsonify(result), 200

@menu_bp.route('/categories', methods=['POST'])
@jwt_required()
def create_category():
    """Создать новую категорию (только для админа)"""
    current_user = get_jwt_identity()
    if current_user.get('position') != 'Администратор':
        return jsonify({'error': 'Доступ запрещен'}), 403
    
    data = request.get_json()
    
    if not data or not data.get('name'):
        return jsonify({'error': 'Название категории обязательно'}), 400
    
    new_category = DishCategory(name=data['name'])
    
    db.session.add(new_category)
    db.session.commit()
    
    return jsonify({
        'message': 'Категория создана успешно',
        'category_id': new_category.id
    }), 201

# ===================== Блюда =====================

@menu_bp.route('/dishes', methods=['GET'])
@jwt_required(optional=True)
def get_dishes():
    """Получить все блюда (с фильтрацией по категории)"""
    category_id = request.args.get('category_id', type=int)
    
    query = Dish.query
    
    if category_id:
        query = query.filter_by(category_id=category_id)
    
    # Проверяем, авторизован ли пользователь и является ли он админом
    try:
        current_user = get_jwt_identity()
        claims = get_jwt()
        if current_user and claims.get('position') == 'Администратор':
            # Админ видит все блюда
            pass
        else:
            # Обычные пользователи видят только доступные
            query = query.filter_by(is_available=True)
    except:
        # Если не авторизован - только доступные
        query = query.filter_by(is_available=True)
    
    dishes = query.all()
    
    result = []
    for dish in dishes:
        category = DishCategory.query.get(dish.category_id)
        
        result.append({
            'id': dish.id,
            'name': dish.name,
            'category_id': dish.category_id,
            'category_name': category.name if category else None,
            'composition': dish.composition,
            'weight_grams': dish.weight_grams,
            'price': float(dish.price) if dish.price else None,
            'is_available': dish.is_available
        })
    
    return jsonify(result), 200

@menu_bp.route('/dishes/<int:dish_id>', methods=['GET'])
def get_dish(dish_id):
    """Получить информацию о конкретном блюде"""
    dish = Dish.query.get(dish_id)
    
    if not dish:
        return jsonify({'error': 'Блюдо не найдено'}), 404
    
    category = DishCategory.query.get(dish.category_id)
    
    return jsonify({
        'id': dish.id,
        'name': dish.name,
        'category_id': dish.category_id,
        'category_name': category.name if category else None,
        'composition': dish.composition,
        'weight_grams': dish.weight_grams,
        'price': float(dish.price) if dish.price else None,
        'is_available': dish.is_available
    }), 200

@menu_bp.route('/dishes', methods=['POST'])
@jwt_required()
def create_dish():
    """Создать новое блюдо (только для админа)"""
    current_user = get_jwt_identity()
    if current_user.get('position') != 'Администратор':
        return jsonify({'error': 'Доступ запрещен'}), 403
    
    data = request.get_json()
    
    # Проверка обязательных полей
    required_fields = ['name', 'category_id', 'price']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Поле {field} обязательно'}), 400
    
    # Проверка существования категории
    category = DishCategory.query.get(data['category_id'])
    if not category:
        return jsonify({'error': 'Категория не найдена'}), 404
    
    new_dish = Dish(
        name=data['name'],
        category_id=data['category_id'],
        composition=data.get('composition', ''),
        weight_grams=data.get('weight_grams'),
        price=data['price'],
        is_available=data.get('is_available', True)
    )
    
    db.session.add(new_dish)
    db.session.commit()
    
    return jsonify({
        'message': 'Блюдо создано успешно',
        'dish_id': new_dish.id
    }), 201

@menu_bp.route('/dishes/<int:dish_id>', methods=['PUT'])
@jwt_required()
def update_dish(dish_id):
    """Обновить информацию о блюде (только для админа)"""
    current_user = get_jwt_identity()
    if current_user.get('position') != 'Администратор':
        return jsonify({'error': 'Доступ запрещен'}), 403
    
    dish = Dish.query.get(dish_id)
    
    if not dish:
        return jsonify({'error': 'Блюдо не найдено'}), 404
    
    data = request.get_json()
    
    # Обновление полей
    if 'name' in data:
        dish.name = data['name']
    if 'category_id' in data:
        dish.category_id = data['category_id']
    if 'composition' in data:
        dish.composition = data['composition']
    if 'weight_grams' in data:
        dish.weight_grams = data['weight_grams']
    if 'price' in data:
        dish.price = data['price']
    if 'is_available' in data:
        dish.is_available = data['is_available']
    
    db.session.commit()
    
    return jsonify({'message': 'Блюдо обновлено успешно'}), 200

@menu_bp.route('/dishes/<int:dish_id>', methods=['DELETE'])
@jwt_required()
def delete_dish(dish_id):
    """Удалить блюдо (только для админа)"""
    current_user = get_jwt_identity()
    if current_user.get('position') != 'Администратор':
        return jsonify({'error': 'Доступ запрещен'}), 403
    
    dish = Dish.query.get(dish_id)
    
    if not dish:
        return jsonify({'error': 'Блюдо не найдено'}), 404
    
    db.session.delete(dish)
    db.session.commit()
    
    return jsonify({'message': 'Блюдо удалено успешно'}), 200

@menu_bp.route('/dishes/<int:dish_id>/toggle-availability', methods=['PUT'])
@jwt_required()
def toggle_dish_availability(dish_id):
    """Переключить доступность блюда (скрыть/показать)"""
    current_user = get_jwt_identity()
    if current_user.get('position') != 'Администратор':
        return jsonify({'error': 'Доступ запрещен'}), 403
    
    dish = Dish.query.get(dish_id)
    
    if not dish:
        return jsonify({'error': 'Блюдо не найдено'}), 404
    
    dish.is_available = not dish.is_available
    db.session.commit()
    
    status = "доступно" if dish.is_available else "скрыто"
    return jsonify({'message': f'Блюдо теперь {status}', 'is_available': dish.is_available}), 200