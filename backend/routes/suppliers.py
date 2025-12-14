from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import Supplier, Supply, Employee
from database import db
from datetime import datetime

suppliers_bp = Blueprint('suppliers', __name__)

def add_cors_headers(response):
    """Добавить CORS заголовки к ответу"""
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response

# ===================== Поставщики =====================

@suppliers_bp.route('/suppliers', methods=['GET', 'OPTIONS'])
@jwt_required(optional=True)  # Изменили на optional для OPTIONS запросов
def get_suppliers():
    """Получить список всех поставщиков"""
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'CORS preflight'})
        return add_cors_headers(response)
    
    suppliers = Supplier.query.all()
    
    result = []
    for supplier in suppliers:
        result.append({
            'id': supplier.id,
            'organization_name': supplier.organization_name,
            'organization_phone': supplier.organization_phone,
            'supply_count': len(supplier.supplies)
        })
    
    response = jsonify(result)
    return add_cors_headers(response)

@suppliers_bp.route('/suppliers', methods=['POST', 'OPTIONS'])
@jwt_required()
def create_supplier():
    """Создать нового поставщика"""
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'CORS preflight'})
        return add_cors_headers(response)
    
    data = request.get_json()
    
    if not data or not data.get('organization_name'):
        response = jsonify({'error': 'Название организации обязательно'})
        return add_cors_headers(response), 400
    
    new_supplier = Supplier(
        organization_name=data['organization_name'],
        organization_phone=data.get('organization_phone')
    )
    
    db.session.add(new_supplier)
    db.session.commit()
    
    response = jsonify({
        'message': 'Поставщик создан успешно',
        'supplier_id': new_supplier.id
    })
    return add_cors_headers(response), 201

@suppliers_bp.route('/suppliers/<int:supplier_id>', methods=['GET', 'OPTIONS'])
@jwt_required()
def get_supplier(supplier_id):
    """Получить информацию о поставщике"""
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'CORS preflight'})
        return add_cors_headers(response)
    
    supplier = Supplier.query.get(supplier_id)
    
    if not supplier:
        response = jsonify({'error': 'Поставщик не найден'})
        return add_cors_headers(response), 404
    
    response = jsonify({
        'id': supplier.id,
        'organization_name': supplier.organization_name,
        'organization_phone': supplier.organization_phone
    })
    return add_cors_headers(response)

@suppliers_bp.route('/suppliers/<int:supplier_id>', methods=['PUT', 'OPTIONS'])
@jwt_required()
def update_supplier(supplier_id):
    """Обновить информацию о поставщике"""
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'CORS preflight'})
        return add_cors_headers(response)
    
    supplier = Supplier.query.get(supplier_id)
    
    if not supplier:
        response = jsonify({'error': 'Поставщик не найден'})
        return add_cors_headers(response), 404
    
    data = request.get_json()
    
    if 'organization_name' in data:
        supplier.organization_name = data['organization_name']
    if 'organization_phone' in data:
        supplier.organization_phone = data['organization_phone']
    
    db.session.commit()
    
    response = jsonify({'message': 'Информация о поставщике обновлена успешно'})
    return add_cors_headers(response)

@suppliers_bp.route('/suppliers/<int:supplier_id>', methods=['DELETE', 'OPTIONS'])
@jwt_required()
def delete_supplier(supplier_id):
    """Удалить поставщика"""
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'CORS preflight'})
        return add_cors_headers(response)
    
    supplier = Supplier.query.get(supplier_id)
    
    if not supplier:
        response = jsonify({'error': 'Поставщик не найден'})
        return add_cors_headers(response), 404
    
    if supplier.supplies:
        response = jsonify({'error': 'Нельзя удалить поставщика, у которого есть поставки'})
        return add_cors_headers(response), 400
    
    db.session.delete(supplier)
    db.session.commit()
    
    response = jsonify({'message': 'Поставщик удален успешно'})
    return add_cors_headers(response)

# ===================== Поставки =====================

@suppliers_bp.route('/supplies', methods=['GET', 'OPTIONS'])
@jwt_required()
def get_supplies():
    """Получить список всех поставок"""
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'CORS preflight'})
        return add_cors_headers(response)
    
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
    
    response = jsonify(result)
    return add_cors_headers(response)

@suppliers_bp.route('/supplies', methods=['POST', 'OPTIONS'])
@jwt_required()
def create_supply():
    """Создать новую поставку"""
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'CORS preflight'})
        return add_cors_headers(response)
        
    data = request.get_json()
    
    # Проверка обязательных полей
    required_fields = ['supplier_id', 'date']
    for field in required_fields:
        if field not in data:
            response = jsonify({'error': f'Поле {field} обязательно'})
            return add_cors_headers(response), 400
    
    # Проверка существования поставщика
    supplier = Supplier.query.get(data['supplier_id'])
    if not supplier:
        response = jsonify({'error': 'Поставщик не найден'})
        return add_cors_headers(response), 404
    
    # Парсинг даты
    try:
        supply_date = datetime.fromisoformat(data['date'].replace('Z', '+00:00')).date()
    except ValueError:
        # Попробуем другой формат даты
        try:
            supply_date = datetime.strptime(data['date'], '%Y-%m-%d').date()
        except ValueError:
            response = jsonify({'error': 'Неверный формат даты. Используйте YYYY-MM-DD'})
            return add_cors_headers(response), 400
    
    # Создание поставки
    new_supply = Supply(
        supplier_id=data['supplier_id'],
        employee_id=1,
        date=supply_date,
        status=data.get('status', False)
    )
    
    db.session.add(new_supply)
    db.session.commit()
    
    response = jsonify({
        'message': 'Поставка создана успешно',
        'supply_id': new_supply.id
    })
    return add_cors_headers(response), 201

@suppliers_bp.route('/supplies/<int:supply_id>', methods=['GET', 'OPTIONS'])
@jwt_required()
def get_supply(supply_id):
    """Получить информацию о поставке"""
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'CORS preflight'})
        return add_cors_headers(response)
    
    supply = Supply.query.get(supply_id)
    
    if not supply:
        response = jsonify({'error': 'Поставка не найдена'})
        return add_cors_headers(response), 404
    
    supplier = Supplier.query.get(supply.supplier_id)
    employee = Employee.query.get(supply.employee_id)
    
    response = jsonify({
        'id': supply.id,
        'supplier_id': supply.supplier_id,
        'supplier_name': supplier.organization_name if supplier else None,
        'employee_id': supply.employee_id,
        'employee_name': employee.full_name if employee else None,
        'date': supply.date.isoformat() if supply.date else None,
        'status': supply.status
    })
    return add_cors_headers(response)

@suppliers_bp.route('/supplies/<int:supply_id>', methods=['PUT', 'OPTIONS'])
@jwt_required()
def update_supply(supply_id):
    """Обновить информацию о поставке"""
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'CORS preflight'})
        return add_cors_headers(response)
    
    supply = Supply.query.get(supply_id)
    
    if not supply:
        response = jsonify({'error': 'Поставка не найдена'})
        return add_cors_headers(response), 404
    
    data = request.get_json()
    
    if 'supplier_id' in data:
        # Проверка существования нового поставщика
        supplier = Supplier.query.get(data['supplier_id'])
        if not supplier:
            response = jsonify({'error': 'Поставщик не найден'})
            return add_cors_headers(response), 404
        supply.supplier_id = data['supplier_id']
    
    if 'date' in data:
        try:
            supply.date = datetime.fromisoformat(data['date'].replace('Z', '+00:00')).date()
        except ValueError:
            try:
                supply.date = datetime.strptime(data['date'], '%Y-%m-%d').date()
            except ValueError:
                response = jsonify({'error': 'Неверный формат даты. Используйте YYYY-MM-DD'})
                return add_cors_headers(response), 400
    
    if 'status' in data:
        supply.status = data['status']
    
    db.session.commit()
    
    response = jsonify({'message': 'Информация о поставке обновлена успешно'})
    return add_cors_headers(response)

@suppliers_bp.route('/supplies/<int:supply_id>/toggle-status', methods=['PUT', 'OPTIONS'])
@jwt_required()
def toggle_supply_status(supply_id):
    """Переключить статус поставки (выполнена/не выполнена)"""
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'CORS preflight'})
        return add_cors_headers(response)
    
    supply = Supply.query.get(supply_id)
    
    if not supply:
        response = jsonify({'error': 'Поставка не найдена'})
        return add_cors_headers(response), 404
    
    supply.status = not supply.status
    db.session.commit()
    
    status_text = "выполнена" if supply.status else "не выполнена"
    response = jsonify({'message': f'Поставка теперь {status_text}', 'status': supply.status})
    return add_cors_headers(response)

@suppliers_bp.route('/supplies/<int:supply_id>', methods=['DELETE', 'OPTIONS'])
@jwt_required()
def delete_supply(supply_id):
    """Удалить поставку"""
    if request.method == 'OPTIONS':
        response = jsonify({'message': 'CORS preflight'})
        return add_cors_headers(response)
    
    supply = Supply.query.get(supply_id)
    
    if not supply:
        response = jsonify({'error': 'Поставка не найдена'})
        return add_cors_headers(response), 404
    
    db.session.delete(supply)
    db.session.commit()
    
    response = jsonify({'message': 'Поставка удалена успешно'})
    return add_cors_headers(response)