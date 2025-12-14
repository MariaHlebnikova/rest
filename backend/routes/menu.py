from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import Dish, DishCategory
from database import db

menu_bp = Blueprint('menu', __name__)

# ===================== Категории =====================

@menu_bp.route('/categories', methods=['GET', 'OPTIONS'])
def get_categories():
    """Получить список всех категорий"""
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'CORS preflight'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response, 200
    
    categories = DishCategory.query.all()
    
    result = []
    for category in categories:
        result.append({
            'id': category.id,
            'name': category.name
        })
    
    return jsonify(result), 200

@menu_bp.route('/categories', methods=['POST', 'OPTIONS'])
@jwt_required()
def create_category():
    """Создать новую категорию"""
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'CORS preflight'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response, 200
    
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

@menu_bp.route('/categories/<int:category_id>', methods=['PUT', 'OPTIONS'])
@jwt_required()
def update_category(category_id):
    """Обновить категорию"""
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'CORS preflight'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response, 200
    
    category = DishCategory.query.get(category_id)
    
    if not category:
        return jsonify({'error': 'Категория не найдена'}), 404
    
    data = request.get_json()
    
    if 'name' in data:
        category.name = data['name']
    
    db.session.commit()
    
    return jsonify({'message': 'Категория обновлена успешно'}), 200

@menu_bp.route('/categories/<int:category_id>', methods=['DELETE', 'OPTIONS'])
@jwt_required()
def delete_category(category_id):
    """Удалить категорию"""
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'CORS preflight'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response, 200
    
    category = DishCategory.query.get(category_id)
    
    if not category:
        return jsonify({'error': 'Категория не найдена'}), 404
    
    # Проверяем, есть ли блюда в этой категории
    dishes = Dish.query.filter_by(category_id=category_id).all()
    if dishes:
        return jsonify({'error': 'Нельзя удалить категорию, в которой есть блюда'}), 400
    
    db.session.delete(category)
    db.session.commit()
    
    return jsonify({'message': 'Категория удалена успешно'}), 200

# ===================== Блюда =====================

@menu_bp.route('/dishes', methods=['GET', 'OPTIONS'])
def get_dishes():
    """Получить список всех блюд"""
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'CORS preflight'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response, 200
    
    category_id = request.args.get('category_id', type=int)
    
    query = Dish.query
    
    if category_id:
        query = query.filter_by(category_id=category_id)
    
    dishes = query.all()
    
    result = []
    for dish in dishes:
        category = DishCategory.query.get(dish.category_id)
        
        result.append({
            'id': dish.id,
            'name': dish.name,
            'composition': dish.composition,
            'price': float(dish.price) if dish.price else 0,
            'category_id': dish.category_id,
            'category_name': category.name if category else None,
            'weight_grams': dish.weight_grams,
            'is_available': dish.is_available
        })
    
    return jsonify(result), 200

@menu_bp.route('/dishes', methods=['POST', 'OPTIONS'])
@jwt_required()
def create_dish():
    """Создать новое блюдо"""
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'CORS preflight'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response, 200
    
    data = request.get_json()
    
    required_fields = ['name', 'price', 'category_id']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Поле {field} обязательно'}), 400
    
    # Проверка существования категории
    category = DishCategory.query.get(data['category_id'])
    if not category:
        return jsonify({'error': 'Категория не найдена'}), 404
    
    new_dish = Dish(
        name=data['name'],
        composition=data.get('composition', ''),
        price=data['price'],
        category_id=data['category_id'],
        weight_grams=data.get('weight_grams'),
        is_available=data.get('is_available', True)
    )
    
    db.session.add(new_dish)
    db.session.commit()
    
    return jsonify({
        'message': 'Блюдо создано успешно',
        'dish_id': new_dish.id
    }), 201

@menu_bp.route('/dishes/<int:dish_id>', methods=['GET', 'OPTIONS'])
def get_dish(dish_id):
    """Получить информацию о блюде"""
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'CORS preflight'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response, 200
    
    dish = Dish.query.get(dish_id)
    
    if not dish:
        return jsonify({'error': 'Блюдо не найдено'}), 404
    
    category = DishCategory.query.get(dish.category_id)
    
    return jsonify({
        'id': dish.id,
        'name': dish.name,
        'composition': dish.composition,
        'price': float(dish.price) if dish.price else 0,
        'category_id': dish.category_id,
        'category_name': category.name if category else None,
        'weight_grams': dish.weight_grams,
        'is_available': dish.is_available
    }), 200

@menu_bp.route('/dishes/<int:dish_id>', methods=['PUT', 'OPTIONS'])
@jwt_required()
def update_dish(dish_id):
    """Обновить информацию о блюде"""
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'CORS preflight'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response, 200
    
    dish = Dish.query.get(dish_id)
    
    if not dish:
        return jsonify({'error': 'Блюдо не найдено'}), 404
    
    data = request.get_json()
    
    if 'name' in data:
        dish.name = data['name']
    if 'composition' in data:
        dish.composition = data['composition']
    if 'price' in data:
        dish.price = data['price']
    if 'category_id' in data:
        # Проверка существования новой категории
        category = DishCategory.query.get(data['category_id'])
        if not category:
            return jsonify({'error': 'Категория не найдена'}), 404
        dish.category_id = data['category_id']
    if 'weight_grams' in data:
        dish.weight_grams = data['weight_grams']
    if 'is_available' in data:
        dish.is_available = data['is_available']
    
    db.session.commit()
    
    return jsonify({'message': 'Блюдо обновлено успешно'}), 200

@menu_bp.route('/dishes/<int:dish_id>', methods=['DELETE', 'OPTIONS'])
@jwt_required()
def delete_dish(dish_id):
    """Удалить блюдо"""
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'CORS preflight'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response, 200
    
    dish = Dish.query.get(dish_id)
    
    if not dish:
        return jsonify({'error': 'Блюдо не найдено'}), 404
    
    # TODO: Проверка, есть ли это блюдо в активных заказах
    
    db.session.delete(dish)
    db.session.commit()
    
    return jsonify({'message': 'Блюдо удалено успешно'}), 200

@menu_bp.route('/dishes/<int:dish_id>/toggle_availability', methods=['PUT', 'OPTIONS'])
@jwt_required()
def toggle_dish_availability(dish_id):
    """Переключить доступность блюда"""
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'CORS preflight'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response, 200
    
    dish = Dish.query.get(dish_id)
    
    if not dish:
        return jsonify({'error': 'Блюдо не найдено'}), 404
    
    dish.is_available = not dish.is_available
    db.session.commit()
    
    return jsonify({
        'message': 'Доступность блюда изменена',
        'is_available': dish.is_available
    }), 200