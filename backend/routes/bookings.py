from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Booking, Table, BookingStatus, Hall
from database import db
from datetime import datetime

bookings_bp = Blueprint('bookings', __name__)

@bookings_bp.route('/', methods=['GET'])
@jwt_required()
def get_bookings():
    """Получить список всех бронирований"""
    bookings = Booking.query.all()
    
    result = []
    for booking in bookings:
        table = Table.query.get(booking.table_id)
        hall = Hall.query.get(table.hall_id) if table else None
        status = BookingStatus.query.get(booking.status_id)
        
        result.append({
            'id': booking.id,
            'table_id': booking.table_id,
            'table_number': table.id if table else None,
            'hall_id': table.hall_id if table else None,
            'hall_name': hall.name if hall else None,
            'status_id': booking.status_id,
            'status_name': status.name if status else None,
            'datetime': booking.datetime.isoformat() if booking.datetime else None,
            'guest_name': booking.guest_name,
            'guest_phone': booking.guest_phone,
            'people_count': booking.people_count
        })
    
    return jsonify(result), 200

@bookings_bp.route('/', methods=['POST'])
@jwt_required()
def create_booking():
    """Создать новое бронирование"""
    data = request.get_json()
    
    # Проверка обязательных полей
    required_fields = ['table_id', 'guest_name', 'guest_phone', 'people_count', 'datetime']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Поле {field} обязательно'}), 400
    
    # Проверка существования стола
    table = Table.query.get(data['table_id'])
    if not table:
        return jsonify({'error': 'Стол не найден'}), 404
    
    # Проверка вместимости
    if int(data['people_count']) > table.capacity:
        return jsonify({'error': f'Вместимость стола: {table.capacity} человек'}), 400
    
    try:
        # Парсим дату
        booking_datetime = datetime.fromisoformat(data['datetime'].replace('Z', '+00:00'))
    except ValueError:
        return jsonify({'error': 'Неверный формат даты. Используйте ISO формат'}), 400
    
    # Создание брони
    new_booking = Booking(
        table_id=data['table_id'],
        status_id=data.get('status_id', 1),
        datetime=booking_datetime,
        guest_name=data['guest_name'],
        guest_phone=data['guest_phone'],
        people_count=data['people_count']
    )
    
    db.session.add(new_booking)
    db.session.commit()
    
    return jsonify({
        'message': 'Бронь создана успешно',
        'booking_id': new_booking.id
    }), 201

@bookings_bp.route('/<int:booking_id>', methods=['GET'])
@jwt_required()
def get_booking(booking_id):
    """Получить информацию о конкретном бронировании"""
    booking = Booking.query.get(booking_id)
    
    if not booking:
        return jsonify({'error': 'Бронь не найдена'}), 404
    
    table = Table.query.get(booking.table_id)
    hall = Hall.query.get(table.hall_id) if table else None
    status = BookingStatus.query.get(booking.status_id)
    
    return jsonify({
        'id': booking.id,
        'table_id': booking.table_id,
        'table_number': table.id if table else None,
        'hall_id': table.hall_id if table else None,
        'hall_name': hall.name if hall else None,
        'status_id': booking.status_id,
        'status_name': status.name if status else None,
        'datetime': booking.datetime.isoformat() if booking.datetime else None,
        'guest_name': booking.guest_name,
        'guest_phone': booking.guest_phone,
        'people_count': booking.people_count
    }), 200

@bookings_bp.route('/<int:booking_id>', methods=['PUT'])
@jwt_required()
def update_booking(booking_id):
    """Обновить бронирование"""
    data = request.get_json()
    booking = Booking.query.get(booking_id)
    
    if not booking:
        return jsonify({'error': 'Бронь не найдена'}), 404
    
    # Обновление полей
    if 'table_id' in data:
        booking.table_id = data['table_id']
    if 'status_id' in data:
        booking.status_id = data['status_id']
    if 'guest_name' in data:
        booking.guest_name = data['guest_name']
    if 'guest_phone' in data:
        booking.guest_phone = data['guest_phone']
    if 'people_count' in data:
        booking.people_count = data['people_count']
    if 'datetime' in data:
        try:
            booking.datetime = datetime.fromisoformat(data['datetime'].replace('Z', '+00:00'))
        except ValueError:
            return jsonify({'error': 'Неверный формат даты'}), 400
    
    db.session.commit()
    
    return jsonify({'message': 'Бронь обновлена успешно'}), 200

@bookings_bp.route('/<int:booking_id>', methods=['DELETE'])
@jwt_required()
def delete_booking(booking_id):
    """Удалить бронирование"""
    booking = Booking.query.get(booking_id)
    
    if not booking:
        return jsonify({'error': 'Бронь не найдена'}), 404
    
    db.session.delete(booking)
    db.session.commit()
    
    return jsonify({'message': 'Бронь удалена успешно'}), 200

@bookings_bp.route('/statuses', methods=['GET'])
@jwt_required()
def get_booking_statuses():
    """Получить список статусов бронирования"""
    statuses = BookingStatus.query.all()
    
    result = []
    for status in statuses:
        result.append({
            'id': status.id,
            'name': status.name
        })
    
    return jsonify(result), 200

@bookings_bp.route('/available-tables', methods=['GET'])
@jwt_required()
def get_available_tables():
    """Получить свободные столы на определенную дату"""
    date_str = request.args.get('date')
    people_count = request.args.get('people_count', type=int)
    
    if not date_str:
        return jsonify({'error': 'Параметр date обязателен'}), 400
    
    try:
        target_date = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
    except ValueError:
        return jsonify({'error': 'Неверный формат даты'}), 400
    
    # Находим все столы
    all_tables = Table.query.all()
    
    # Находим забронированные столы на эту дату
    booked_tables = Booking.query.filter(
        db.func.DATE(Booking.datetime) == target_date.date()
    ).all()
    
    booked_table_ids = [bt.table_id for bt in booked_tables]
    
    # Фильтруем столы
    available_tables = []
    for table in all_tables:
        if table.id not in booked_table_ids:
            # Фильтр по вместимости, если указан
            if people_count and table.capacity < people_count:
                continue
                
            hall = Hall.query.get(table.hall_id)
            available_tables.append({
                'id': table.id,
                'hall_id': table.hall_id,
                'hall_name': hall.name if hall else None,
                'capacity': table.capacity
            })
    
    return jsonify(available_tables), 200