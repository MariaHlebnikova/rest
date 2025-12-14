from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from models import Hall, Table, Booking
from database import db
from datetime import datetime

halls_bp = Blueprint('halls', __name__)

# ===================== Залы =====================

@halls_bp.route('/', methods=['GET'])
def get_halls():
    """Получить список всех залов"""
    halls = Hall.query.all()
    
    result = []
    for hall in halls:
        tables = Table.query.filter_by(hall_id=hall.id).all()
        
        result.append({
            'id': hall.id,
            'name': hall.name,
            'table_count': hall.table_count,
            'tables': [{
                'id': table.id,
                'capacity': table.capacity
            } for table in tables]
        })
    
    return jsonify(result), 200

@halls_bp.route('/', methods=['POST', 'OPTIONS'])
@jwt_required()
def create_hall():
    """Создать новый зал"""
    # Обработка CORS preflight запроса
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'CORS preflight'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response, 200
    
    data = request.get_json()
    
    if not data or not data.get('name'):
        return jsonify({'error': 'Название зала обязательно'}), 400
    
    new_hall = Hall(
        name=data['name'],
        table_count=data.get('table_count', 0)
    )
    
    db.session.add(new_hall)
    db.session.commit()
    
    return jsonify({
        'message': 'Зал создан успешно',
        'hall_id': new_hall.id
    }), 201

@halls_bp.route('/<int:hall_id>', methods=['GET'])
def get_hall(hall_id):
    """Получить информацию о зале"""
    hall = Hall.query.get(hall_id)
    
    if not hall:
        return jsonify({'error': 'Зал не найден'}), 404
    
    tables = Table.query.filter_by(hall_id=hall.id).all()
    
    return jsonify({
        'id': hall.id,
        'name': hall.name,
        'table_count': hall.table_count,
        'tables': [{
            'id': table.id,
            'capacity': table.capacity
        } for table in tables]
    }), 200

@halls_bp.route('/<int:hall_id>', methods=['PUT', 'OPTIONS'])
@jwt_required()
def update_hall(hall_id):
    """Обновить информацию о зале"""
    # Обработка CORS preflight запроса
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'CORS preflight'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response, 200
    
    hall = Hall.query.get(hall_id)
    
    if not hall:
        return jsonify({'error': 'Зал не найден'}), 404
    
    data = request.get_json()
    
    if 'name' in data:
        hall.name = data['name']
    if 'table_count' in data:
        hall.table_count = data['table_count']
    
    db.session.commit()
    
    return jsonify({'message': 'Информация о зале обновлена успешно'}), 200

@halls_bp.route('/<int:hall_id>', methods=['DELETE', 'OPTIONS'])
@jwt_required()
def delete_hall(hall_id):
    """Удалить зал"""
    # Обработка CORS preflight запроса
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'CORS preflight'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response, 200
    
    hall = Hall.query.get(hall_id)
    
    if not hall:
        return jsonify({'error': 'Зал не найден'}), 404
    
    tables = Table.query.filter_by(hall_id=hall.id).all()
    if tables:
        return jsonify({'error': 'Нельзя удалить зал, в котором есть столы'}), 400
    
    db.session.delete(hall)
    db.session.commit()
    
    return jsonify({'message': 'Зал удален успешно'}), 200

# ===================== Столы =====================

@halls_bp.route('/tables', methods=['GET'])
def get_tables():
    """Получить список всех столов"""
    hall_id = request.args.get('hall_id', type=int)
    
    query = Table.query
    
    if hall_id:
        query = query.filter_by(hall_id=hall_id)
    
    tables = query.all()
    
    result = []
    for table in tables:
        hall = Hall.query.get(table.hall_id)
        
        result.append({
            'id': table.id,
            'hall_id': table.hall_id,
            'hall_name': hall.name if hall else None,
            'capacity': table.capacity
        })
    
    return jsonify(result), 200

@halls_bp.route('/tables', methods=['POST', 'OPTIONS'])
@jwt_required()
def create_table():
    """Создать новый стол"""
    # Обработка CORS preflight запроса
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'CORS preflight'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response, 200
    
    data = request.get_json()
    
    required_fields = ['hall_id', 'capacity']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Поле {field} обязательно'}), 400
    
    hall = Hall.query.get(data['hall_id'])
    if not hall:
        return jsonify({'error': 'Зал не найден'}), 404
    
    new_table = Table(
        hall_id=data['hall_id'],
        capacity=data['capacity']
    )
    
    db.session.add(new_table)
    
    hall.table_count = Table.query.filter_by(hall_id=hall.id).count()
    
    db.session.commit()
    
    return jsonify({
        'message': 'Стол создан успешно',
        'table_id': new_table.id
    }), 201

@halls_bp.route('/tables/<int:table_id>', methods=['GET'])
def get_table(table_id):
    """Получить информацию о столе"""
    table = Table.query.get(table_id)
    
    if not table:
        return jsonify({'error': 'Стол не найден'}), 404
    
    hall = Hall.query.get(table.hall_id)
    
    return jsonify({
        'id': table.id,
        'hall_id': table.hall_id,
        'hall_name': hall.name if hall else None,
        'capacity': table.capacity
    }), 200

@halls_bp.route('/tables/<int:table_id>', methods=['PUT', 'OPTIONS'])
@jwt_required()
def update_table(table_id):
    """Обновить информацию о столе"""
    # Обработка CORS preflight запроса
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'CORS preflight'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response, 200
    
    table = Table.query.get(table_id)
    
    if not table:
        return jsonify({'error': 'Стол не найден'}), 404
    
    data = request.get_json()
    
    old_hall_id = table.hall_id
    
    if 'hall_id' in data:
        hall = Hall.query.get(data['hall_id'])
        if not hall:
            return jsonify({'error': 'Зал не найден'}), 404
        table.hall_id = data['hall_id']
    
    if 'capacity' in data:
        table.capacity = data['capacity']
    
    db.session.commit()
    
    if 'hall_id' in data and old_hall_id != data['hall_id']:
        old_hall = Hall.query.get(old_hall_id)
        if old_hall:
            old_hall.table_count = Table.query.filter_by(hall_id=old_hall_id).count()
        
        new_hall = Hall.query.get(data['hall_id'])
        if new_hall:
            new_hall.table_count = Table.query.filter_by(hall_id=data['hall_id']).count()
    
    elif 'hall_id' not in data:
        hall = Hall.query.get(table.hall_id)
        if hall:
            hall.table_count = Table.query.filter_by(hall_id=table.hall_id).count()
    
    db.session.commit()
    
    return jsonify({'message': 'Информация о столе обновлена успешно'}), 200

@halls_bp.route('/tables/<int:table_id>', methods=['DELETE', 'OPTIONS'])
@jwt_required()
def delete_table(table_id):
    """Удалить стол"""
    # Обработка CORS preflight запроса
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'CORS preflight'})
        response.headers.add('Access-Control-Allow-Origin', '*')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
        response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
        return response, 200
    
    table = Table.query.get(table_id)
    
    if not table:
        return jsonify({'error': 'Стол не найден'}), 404
    
    bookings = Booking.query.filter_by(table_id=table_id).all()
    if bookings:
        return jsonify({'error': 'Нельзя удалить стол, на который есть бронирования'}), 400
    
    hall_id = table.hall_id
    
    db.session.delete(table)
    db.session.commit()
    
    hall = Hall.query.get(hall_id)
    if hall:
        hall.table_count = Table.query.filter_by(hall_id=hall_id).count()
        db.session.commit()
    
    return jsonify({'message': 'Стол удален успешно'}), 200

@halls_bp.route('/tables/available', methods=['GET'])
def get_available_tables():
    """Получить доступные столы на определенную дату"""
    date_str = request.args.get('date')
    people_count = request.args.get('people_count', type=int)
    hall_id = request.args.get('hall_id', type=int)
    
    if not date_str:
        return jsonify({'error': 'Параметр date обязателен'}), 400
    
    try:
        target_date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
    except ValueError:
        return jsonify({'error': 'Неверный формат даты'}), 400
    
    query = Table.query
    
    if hall_id:
        query = query.filter_by(hall_id=hall_id)
    
    if people_count:
        query = query.filter(Table.capacity >= people_count)
    
    all_tables = query.all()
    
    booked_tables = Booking.query.filter(
        db.func.DATE(Booking.datetime) == target_date.date()
    ).all()
    
    booked_table_ids = [bt.table_id for bt in booked_tables]
    
    available_tables = []
    for table in all_tables:
        if table.id not in booked_table_ids:
            hall = Hall.query.get(table.hall_id)
            available_tables.append({
                'id': table.id,
                'hall_id': table.hall_id,
                'hall_name': hall.name if hall else None,
                'capacity': table.capacity
            })
    
    return jsonify(available_tables), 200