from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Supplier, Supply, Employee
from database import db
from datetime import datetime

suppliers_bp = Blueprint('suppliers', __name__)

def check_admin_access(current_user):
    """Проверка, является ли пользователь администратором"""
    return current_user.get('position') == 'Администратор'

# ===================== Поставщики =====================

@suppliers_bp.route('/suppliers', methods=['GET'])
@jwt_required()
def get_suppliers():
    """Получить список всех поставщиков"""
    suppliers = Supplier.query.all()
    
    result = []
    for supplier in suppliers:
        result.append({
            'id': supplier.id,
            'organization_name': supplier.organization_name,
            'organization_phone': supplier.organization_phone,
            'supply_count': len(supplier.supplies)
        })
    
    return jsonify(result), 200

@suppliers_bp.route('/suppliers', methods=['POST'])
@jwt_required()
def create_supplier():
    """Создать нового поставщика (только для админа)"""
    current_user = get_jwt_identity()
    
    if not check_admin_access(current_user):
        return jsonify({'error': 'Доступ запрещен. Требуются права администратора'}), 403
    
    data = request.get_json()
    
    if not data or not data.get('organization_name'):
        return jsonify({'error': 'Название организации обязательно'}), 400
    
    new_supplier = Supplier(
        organization_name=data['organization_name'],
        organization_phone=data.get('organization_phone')
    )
    
    db.session.add(new_supplier)
    db.session.commit()
    
    return jsonify({
        'message': 'Поставщик создан успешно',
        'supplier_id': new_supplier.id
    }), 201

@suppliers_bp.route('/suppliers/<int:supplier_id>', methods=['GET'])
@jwt_required()
def get_supplier(supplier_id):
    """Получить информацию о поставщике"""
    supplier = Supplier.query.get(supplier_id)
    
    if not supplier:
        return jsonify({'error': 'Поставщик не найден'}), 404
    
    return jsonify({
        'id': supplier.id,
        'organization_name': supplier.organization_name,
        'organization_phone': supplier.organization_phone
    }), 200

@suppliers_bp.route('/suppliers/<int:supplier_id>', methods=['PUT'])
@jwt_required()
def update_supplier(supplier_id):
    """Обновить информацию о поставщике (только для админа)"""
    current_user = get_jwt_identity()
    
    if not check_admin_access(current_user):
        return jsonify({'error': 'Доступ запрещен. Требуются права администратора'}), 403
    
    supplier = Supplier.query.get(supplier_id)
    
    if not supplier:
        return jsonify({'error': 'Поставщик не найден'}), 404
    
    data = request.get_json()
    
    if 'organization_name' in data:
        supplier.organization_name = data['organization_name']
    if 'organization_phone' in data:
        supplier.organization_phone = data['organization_phone']
    
    db.session.commit()
    
    return jsonify({'message': 'Информация о поставщике обновлена успешно'}), 200

@suppliers_bp.route('/suppliers/<int:supplier_id>', methods=['DELETE'])
@jwt_required()
def delete_supplier(supplier_id):
    """Удалить поставщика (только для админа)"""
    current_user = get_jwt_identity()
    
    if not check_admin_access(current_user):
        return jsonify({'error': 'Доступ запрещен. Требуются права администратора'}), 403
    
    supplier = Supplier.query.get(supplier_id)
    
    if not supplier:
        return jsonify({'error': 'Поставщик не найден'}), 404
    
    # Проверяем, есть ли связанные поставки
    if supplier.supplies:
        return jsonify({'error': 'Нельзя удалить поставщика, у которого есть поставки'}), 400
    
    db.session.delete(supplier)
    db.session.commit()
    
    return jsonify({'message': 'Поставщик удален успешно'}), 200

# ===================== Поставки =====================

@suppliers_bp.route('/supplies', methods=['GET'])
@jwt_required()
def get_supplies():
    """Получить список всех поставок"""
    supplies = Supply.query.order_by(Supply.date.desc()).all()
    
    result = []
    for supply in supplies:
        supplier = Supplier.query.get(supply.supplier_id)
        employee = Employee.query.get(supply.employee_id)
        
        result.append({
            'id': supply.id,
            'supplier_id': supply.supplier_id,
            'supplier_name': supplier.organization_name if supplier else None,
            'employee_id': supply.employee_id,
            'employee_name': employee.full_name if employee else None,
            'date': supply.date.isoformat() if supply.date else None,
            'status': supply.status
        })
    
    return jsonify(result), 200

@suppliers_bp.route('/supplies', methods=['POST'])
@jwt_required()
def create_supply():
    """Создать новую поставку"""
    current_user = get_jwt_identity()
    data = request.get_json()
    
    # Проверка обязательных полей
    required_fields = ['supplier_id', 'date']
    for field in required_fields:
        if field not in data:
            return jsonify({'error': f'Поле {field} обязательно'}), 400
    
    # Проверка существования поставщика
    supplier = Supplier.query.get(data['supplier_id'])
    if not supplier:
        return jsonify({'error': 'Поставщик не найден'}), 404
    
    # Парсинг даты
    try:
        supply_date = datetime.fromisoformat(data['date'].replace('Z', '+00:00')).date()
    except ValueError:
        return jsonify({'error': 'Неверный формат даты'}), 400
    
    # Создание поставки
    new_supply = Supply(
        supplier_id=data['supplier_id'],
        employee_id=current_user['id'],
        date=supply_date,
        status=data.get('status', False)
    )
    
    db.session.add(new_supply)
    db.session.commit()
    
    return jsonify({
        'message': 'Поставка создана успешно',
        'supply_id': new_supply.id
    }), 201

@suppliers_bp.route('/supplies/<int:supply_id>', methods=['GET'])
@jwt_required()
def get_supply(supply_id):
    """Получить информацию о поставке"""
    supply = Supply.query.get(supply_id)
    
    if not supply:
        return jsonify({'error': 'Поставка не найдена'}), 404
    
    supplier = Supplier.query.get(supply.supplier_id)
    employee = Employee.query.get(supply.employee_id)
    
    return jsonify({
        'id': supply.id,
        'supplier_id': supply.supplier_id,
        'supplier_name': supplier.organization_name if supplier else None,
        'employee_id': supply.employee_id,
        'employee_name': employee.full_name if employee else None,
        'date': supply.date.isoformat() if supply.date else None,
        'status': supply.status
    }), 200

@suppliers_bp.route('/supplies/<int:supply_id>', methods=['PUT'])
@jwt_required()
def update_supply(supply_id):
    """Обновить информацию о поставке"""
    current_user = get_jwt_identity()
    supply = Supply.query.get(supply_id)
    
    if not supply:
        return jsonify({'error': 'Поставка не найдена'}), 404
    
    # Только админ или создатель поставки может её изменять
    if not check_admin_access(current_user) and supply.employee_id != current_user['id']:
        return jsonify({'error': 'Доступ запрещен'}), 403
    
    data = request.get_json()
    
    if 'supplier_id' in data:
        # Проверка существования нового поставщика
        supplier = Supplier.query.get(data['supplier_id'])
        if not supplier:
            return jsonify({'error': 'Поставщик не найден'}), 404
        supply.supplier_id = data['supplier_id']
    
    if 'date' in data:
        try:
            supply.date = datetime.fromisoformat(data['date'].replace('Z', '+00:00')).date()
        except ValueError:
            return jsonify({'error': 'Неверный формат даты'}), 400
    
    if 'status' in data:
        supply.status = data['status']
    
    db.session.commit()
    
    return jsonify({'message': 'Информация о поставке обновлена успешно'}), 200

@suppliers_bp.route('/supplies/<int:supply_id>/toggle-status', methods=['PUT'])
@jwt_required()
def toggle_supply_status(supply_id):
    """Переключить статус поставки (выполнена/не выполнена)"""
    current_user = get_jwt_identity()
    supply = Supply.query.get(supply_id)
    
    if not supply:
        return jsonify({'error': 'Поставка не найдена'}), 404
    
    # Только админ может менять статус
    if not check_admin_access(current_user):
        return jsonify({'error': 'Доступ запрещен. Требуются права администратора'}), 403
    
    supply.status = not supply.status
    db.session.commit()
    
    status_text = "выполнена" if supply.status else "не выполнена"
    return jsonify({'message': f'Поставка теперь {status_text}', 'status': supply.status}), 200

@suppliers_bp.route('/supplies/<int:supply_id>', methods=['DELETE'])
@jwt_required()
def delete_supply(supply_id):
    """Удалить поставку (только для админа)"""
    current_user = get_jwt_identity()
    
    if not check_admin_access(current_user):
        return jsonify({'error': 'Доступ запрещен. Требуются права администратора'}), 403
    
    supply = Supply.query.get(supply_id)
    
    if not supply:
        return jsonify({'error': 'Поставка не найдена'}), 404
    
    db.session.delete(supply)
    db.session.commit()
    
    return jsonify({'message': 'Поставка удалена успешно'}), 200