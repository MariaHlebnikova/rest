from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Employee, Position
from database import db
import hashlib

employees_bp = Blueprint('employees', __name__)

@employees_bp.route('/', methods=['GET'])
@jwt_required()
def get_employees():
    
    employees = Employee.query.all()
    
    result = []
    for employee in employees:
        position = Position.query.get(employee.position_id)
        
        result.append({
            'id': employee.id,
            'full_name': employee.full_name,
            'login': employee.login,
            'position_id': employee.position_id,
            'position_name': position.name if position else None,
            'phone': employee.phone,
            'address': employee.address,
            'passport_data': employee.passport_data,
            'salary': float(employee.salary) if employee.salary else None
        })
    
    return jsonify(result), 200

@employees_bp.route('/', methods=['POST'])
@jwt_required()
def create_employee():
    
    data = request.get_json()
    
    # Проверка обязательных полей
    required_fields = ['full_name', 'login', 'password', 'position_id']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Поле {field} обязательно'}), 400
    
    # Проверка уникальности логина
    existing_employee = Employee.query.filter_by(login=data['login']).first()
    if existing_employee:
        return jsonify({'error': 'Сотрудник с таким логином уже существует'}), 400
    
    # Проверка существования должности
    position = Position.query.get(data['position_id'])
    if not position:
        return jsonify({'error': 'Должность не найдена'}), 404
    
    # Хеширование пароля
    password_hash = hashlib.sha256(data['password'].encode()).hexdigest()
    
    # Создание сотрудника
    new_employee = Employee(
        full_name=data['full_name'],
        login=data['login'],
        password=password_hash,
        position_id=data['position_id'],
        phone=data.get('phone'),
        address=data.get('address'),
        passport_data=data.get('passport_data'),
        salary=data.get('salary')
    )
    
    db.session.add(new_employee)
    db.session.commit()
    
    return jsonify({
        'message': 'Сотрудник создан успешно',
        'employee_id': new_employee.id
    }), 201

@employees_bp.route('/<int:employee_id>', methods=['GET'])
@jwt_required()
def get_employee(employee_id):

    employee = Employee.query.get(employee_id)
    
    if not employee:
        return jsonify({'error': 'Сотрудник не найден'}), 404
    
    position = Position.query.get(employee.position_id)
    
    return jsonify({
        'id': employee.id,
        'full_name': employee.full_name,
        'login': employee.login,
        'position_id': employee.position_id,
        'position_name': position.name if position else None,
        'phone': employee.phone,
        'address': employee.address,
        'passport_data': employee.passport_data,
        'salary': float(employee.salary) if employee.salary else None
    }), 200

@employees_bp.route('/<int:employee_id>', methods=['PUT'])
@jwt_required()
def update_employee(employee_id):

    employee = Employee.query.get(employee_id)
    
    if not employee:
        return jsonify({'error': 'Сотрудник не найден'}), 404
    
    data = request.get_json()
    
    # Обновление полей
    if 'full_name' in data:
        employee.full_name = data['full_name']
    if 'phone' in data:
        employee.phone = data['phone']
    if 'address' in data:
        employee.address = data['address']
    if 'passport_data' in data:
        employee.passport_data = data['passport_data']
    if 'salary' in data:
        employee.salary = data['salary']
    if 'position_id' in data:
        # Проверка существования новой должности
        position = Position.query.get(data['position_id'])
        if not position:
            return jsonify({'error': 'Должность не найдена'}), 404
        employee.position_id = data['position_id']
    
    # Смена пароля
    if 'password' in data and data['password']:
        password_hash = hashlib.sha256(data['password'].encode()).hexdigest()
        employee.password = password_hash
    
    db.session.commit()
    
    return jsonify({'message': 'Информация о сотруднике обновлена успешно'}), 200

@employees_bp.route('/<int:employee_id>', methods=['DELETE'])
@jwt_required()
def delete_employee(employee_id):
    
    employee = Employee.query.get(employee_id)
    
    if not employee:
        return jsonify({'error': 'Сотрудник не найден'}), 404
    
    db.session.delete(employee)
    db.session.commit()
    
    return jsonify({'message': 'Сотрудник удален успешно'}), 200

@employees_bp.route('/positions', methods=['GET'])
@jwt_required()
def get_positions():
    """Получить список всех должностей"""
    positions = Position.query.all()
    
    result = []
    for position in positions:
        result.append({
            'id': position.id,
            'name': position.name
        })
    
    return jsonify(result), 200

@employees_bp.route('/positions', methods=['POST'])
@jwt_required()
def create_position():
    """Создать новую должность"""
    data = request.get_json()
    
    if not data or not data.get('name'):
        return jsonify({'error': 'Название должности обязательно'}), 400
    
    # Проверка уникальности
    existing_position = Position.query.filter_by(name=data['name']).first()
    if existing_position:
        return jsonify({'error': 'Должность с таким названием уже существует'}), 400
    
    new_position = Position(name=data['name'])
    
    db.session.add(new_position)
    db.session.commit()
    
    return jsonify({
        'message': 'Должность создана успешно',
        'position_id': new_position.id
    }), 201

@employees_bp.route('/positions/<int:position_id>', methods=['PUT'])
@jwt_required()
def update_position(position_id):
    """Обновить должность"""
    position = Position.query.get(position_id)
    
    if not position:
        return jsonify({'error': 'Должность не найдена'}), 404
    
    data = request.get_json()
    
    if not data or not data.get('name'):
        return jsonify({'error': 'Название должности обязательно'}), 400
    
    # Проверка уникальности (исключая текущую должность)
    existing_position = Position.query.filter(
        Position.name == data['name'],
        Position.id != position_id
    ).first()
    
    if existing_position:
        return jsonify({'error': 'Должность с таким названием уже существует'}), 400
    
    position.name = data['name']
    db.session.commit()
    
    return jsonify({'message': 'Должность обновлена успешно'}), 200

@employees_bp.route('/positions/<int:position_id>', methods=['DELETE'])
@jwt_required()
def delete_position(position_id):
    """Удалить должность"""
    position = Position.query.get(position_id)
    
    if not position:
        return jsonify({'error': 'Должность не найдена'}), 404
    
    # Проверка, есть ли сотрудники с этой должностью
    employees_with_position = Employee.query.filter_by(position_id=position_id).count()
    if employees_with_position > 0:
        return jsonify({
            'error': f'Невозможно удалить должность. Есть {employees_with_position} сотрудник(ов) с этой должностью'
        }), 400
    
    db.session.delete(position)
    db.session.commit()
    
    return jsonify({'message': 'Должность удалена успешно'}), 200