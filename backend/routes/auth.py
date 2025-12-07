from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
from models import Employee, Position
from database import db
import hashlib

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    """Авторизация пользователя"""
    data = request.get_json()
    
    # Проверка обязательных полей
    if not data or not data.get('login') or not data.get('password'):
        return jsonify({'error': 'Логин и пароль обязательны'}), 400
    
    # Поиск сотрудника
    employee = Employee.query.filter_by(login=data['login']).first()
    
    if not employee:
        return jsonify({'error': 'Пользователь не найден'}), 401
    
    # Проверка пароля (хешируем введенный пароль)
    password_hash = hashlib.sha256(data['password'].encode()).hexdigest()
    
    if employee.password != password_hash:
        return jsonify({'error': 'Неверный пароль'}), 401
    
    # Получаем информацию о должности
    position = Position.query.get(employee.position_id)
    
    # Создаем JWT токен с CORRECT identity и additional_claims
    # Identity должен быть простым значением (например, ID пользователя)
    user_identity = str(employee.id)  # ПРОСТАЯ строка как identity
    
    # Дополнительные данные храним в additional_claims
    additional_claims = {
        'login': employee.login,
        'full_name': employee.full_name,
        'position': position.name if position else 'unknown',
        'position_id': employee.position_id
    }
    
    access_token = create_access_token(
        identity=user_identity,  # ПРОСТАЯ строка
        additional_claims=additional_claims
    )
    
    return jsonify({
        'access_token': access_token,
        'user': {
            'id': employee.id,
            'login': employee.login,
            'full_name': employee.full_name,
            'position': position.name if position else 'unknown',
            'position_id': employee.position_id,
            'phone': employee.phone
        }
    }), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Получить информацию о текущем пользователе"""
    current_user_id = get_jwt_identity()  # Получаем identity (ID пользователя)
    jwt_data = get_jwt()  # Получаем весь JWT payload
    
    # Ищем пользователя в базе
    employee = Employee.query.get(int(current_user_id))
    if not employee:
        return jsonify({'error': 'Пользователь не найден'}), 404
    
    position = Position.query.get(employee.position_id)
    
    return jsonify({
        'id': employee.id,
        'login': employee.login,
        'full_name': employee.full_name,
        'position': position.name if position else 'unknown',
        'position_id': employee.position_id,
        'phone': employee.phone
    }), 200

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Выход из системы (на клиенте просто удалить токен)"""
    return jsonify({'message': 'Successfully logged out'}), 200

@auth_bp.route('/check', methods=['GET'])
@jwt_required()
def check_auth():
    """Проверка валидности токена"""
    return jsonify({'valid': True}), 200