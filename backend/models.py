from datetime import datetime
from database import db

# Table: Booking Status
class BookingStatus(db.Model):
    __tablename__ = 'booking_status'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(20), nullable=False)
    
    # Relationships
    bookings = db.relationship('Booking', backref='status', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name
        }

# Table: Hall
class Hall(db.Model):
    __tablename__ = 'hall'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(15), nullable=False)
    table_count = db.Column(db.Integer, default=0)
    
    # Relationships
    tables = db.relationship('Table', backref='hall', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'table_count': self.table_count
        }

# Table: Table
class Table(db.Model):
    __tablename__ = 'restaurant_table'
    
    id = db.Column(db.Integer, primary_key=True)
    hall_id = db.Column(db.Integer, db.ForeignKey('hall.id'), nullable=False)
    capacity = db.Column(db.Integer, nullable=False)
    
    # Relationships
    bookings = db.relationship('Booking', backref='table', lazy=True)
    orders = db.relationship('Order', backref='table', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'hall_id': self.hall_id,
            'capacity': self.capacity
        }

# Table: Booking
class Booking(db.Model):
    __tablename__ = 'booking'
    
    id = db.Column(db.Integer, primary_key=True)
    table_id = db.Column(db.Integer, db.ForeignKey('restaurant_table.id'), nullable=False)
    status_id = db.Column(db.Integer, db.ForeignKey('booking_status.id'), nullable=False)
    datetime = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    guest_name = db.Column(db.String(15), nullable=False)
    guest_phone = db.Column(db.String(15), nullable=False)
    people_count = db.Column(db.Integer, nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'table_id': self.table_id,
            'status_id': self.status_id,
            'datetime': self.datetime.isoformat() if self.datetime else None,
            'guest_name': self.guest_name,
            'guest_phone': self.guest_phone,
            'people_count': self.people_count
        }

# Table: Position (Должность)
class Position(db.Model):
    __tablename__ = 'position'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(20), nullable=False)
    
    # Relationships
    employees = db.relationship('Employee', backref='position', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name
        }

# Table: Employee (Сотрудник)
class Employee(db.Model):
    __tablename__ = 'employee'
    
    id = db.Column(db.Integer, primary_key=True)
    full_name = db.Column(db.String(100), nullable=False)
    login = db.Column(db.String(50), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    position_id = db.Column(db.Integer, db.ForeignKey('position.id'), nullable=False)
    phone = db.Column(db.String(15))
    address = db.Column(db.String(200))
    passport_data = db.Column(db.String(100))
    salary = db.Column(db.Numeric(10, 2))
    
    # Relationships
    supplies = db.relationship('Supply', backref='employee', lazy=True)
    orders = db.relationship('Order', backref='employee', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'full_name': self.full_name,
            'login': self.login,
            'position_id': self.position_id,
            'phone': self.phone,
            'address': self.address,
            'passport_data': self.passport_data,
            'salary': float(self.salary) if self.salary else None
        }

# Table: Supplier (Поставщик)
class Supplier(db.Model):
    __tablename__ = 'supplier'
    
    id = db.Column(db.Integer, primary_key=True)
    organization_name = db.Column(db.String(50), nullable=False)
    organization_phone = db.Column(db.String(15))
    
    # Relationships
    supplies = db.relationship('Supply', backref='supplier', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'organization_name': self.organization_name,
            'organization_phone': self.organization_phone
        }

# Table: Supply (Поставка)
class Supply(db.Model):
    __tablename__ = 'supply'
    
    id = db.Column(db.Integer, primary_key=True)
    supplier_id = db.Column(db.Integer, db.ForeignKey('supplier.id'), nullable=False)
    employee_id = db.Column(db.Integer, db.ForeignKey('employee.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    status = db.Column(db.Boolean, default=False)  # YESNO = Boolean
    
    def to_dict(self):
        return {
            'id': self.id,
            'supplier_id': self.supplier_id,
            'employee_id': self.employee_id,
            'date': self.date.isoformat() if self.date else None,
            'status': self.status
        }

# Table: Dish Category
class DishCategory(db.Model):
    __tablename__ = 'dish_category'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(20), nullable=False)
    
    # Relationships
    dishes = db.relationship('Dish', backref='category', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name
        }

# Table: Dish (Блюдо)
class Dish(db.Model):
    __tablename__ = 'dish'
    
    id = db.Column(db.Integer, primary_key=True)
    category_id = db.Column(db.Integer, db.ForeignKey('dish_category.id'), nullable=False)
    name = db.Column(db.String(50), nullable=False)
    composition = db.Column(db.String(255))
    weight_grams = db.Column(db.Integer)
    price = db.Column(db.Numeric(10, 2), nullable=False)
    is_available = db.Column(db.Boolean, default=True)  # YESNO = Boolean
    
    # Relationships
    sales = db.relationship('Sale', backref='dish', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'category_id': self.category_id,
            'name': self.name,
            'composition': self.composition,
            'weight_grams': self.weight_grams,
            'price': float(self.price) if self.price else None,
            'is_available': self.is_available
        }

# Table: Order (Заказ)
class Order(db.Model):
    __tablename__ = 'restaurant_order'
    
    id = db.Column(db.Integer, primary_key=True)
    table_id = db.Column(db.Integer, db.ForeignKey('restaurant_table.id'), nullable=False)
    employee_id = db.Column(db.Integer, db.ForeignKey('employee.id'), nullable=False)
    order_datetime = db.Column(db.DateTime, nullable=False, default=datetime.utcnow)
    total_amount = db.Column(db.Numeric(10, 2), default=0)
    
    # Relationships
    sales = db.relationship('Sale', backref='order', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'table_id': self.table_id,
            'employee_id': self.employee_id,
            'order_datetime': self.order_datetime.isoformat() if self.order_datetime else None,
            'total_amount': float(self.total_amount) if self.total_amount else None
        }

# Table: Sale (Продажа)
class Sale(db.Model):
    __tablename__ = 'sale'
    
    id = db.Column(db.Integer, primary_key=True)
    order_id = db.Column(db.Integer, db.ForeignKey('restaurant_order.id'), nullable=False)
    dish_id = db.Column(db.Integer, db.ForeignKey('dish.id'), nullable=False)
    quantity = db.Column(db.Integer, nullable=False, default=1)
    
    def to_dict(self):
        return {
            'id': self.id,
            'order_id': self.order_id,
            'dish_id': self.dish_id,
            'quantity': self.quantity
        }

# Initial Data Functions
def create_initial_data():
    """Создание начальных данных для базы данных"""
    
    # Статусы бронирования
    booking_statuses = [
        {'name': 'Новый'},
        {'name': 'Подтвержден'},
        {'name': 'Отменен'},
        {'name': 'Завершен'}
    ]
    
    for status_data in booking_statuses:
        if not BookingStatus.query.filter_by(name=status_data['name']).first():
            status = BookingStatus(**status_data)
            db.session.add(status)
    
    # Должности
    positions = [
        {'name': 'Администратор'},
        {'name': 'Официант'},
        {'name': 'Повар'},
        {'name': 'Бармен'},
        {'name': 'Уборщик'}
    ]
    
    for position_data in positions:
        if not Position.query.filter_by(name=position_data['name']).first():
            position = Position(**position_data)
            db.session.add(position)
    
    # Категории блюд
    categories = [
        {'name': 'Закуски'},
        {'name': 'Салаты'},
        {'name': 'Супы'},
        {'name': 'Основные блюда'},
        {'name': 'Десерты'},
        {'name': 'Напитки'}
    ]
    
    for category_data in categories:
        if not DishCategory.query.filter_by(name=category_data['name']).first():
            category = DishCategory(**category_data)
            db.session.add(category)
    
    db.session.commit()
    print("✅ Initial data created successfully!")