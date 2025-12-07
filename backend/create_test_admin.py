from app import create_app
from models import Employee, Position
import hashlib

app = create_app()

with app.app_context():
    # Проверим, есть ли должность Администратор
    admin_position = Position.query.filter_by(name='Администратор').first()
    
    if not admin_position:
        print("❌ Должность 'Администратор' не найдена!")
        print("Сначала запусти create_initial_data.py")
        exit()
    
    # Проверим, есть ли уже админ
    existing_admin = Employee.query.filter_by(login='admin').first()
    if existing_admin:
        print("✅ Администратор уже существует!")
        print(f"Логин: admin")
        print(f"Пароль: (уже установлен)")
    else:
        # Хешируем пароль
        password_hash = hashlib.sha256('admin123'.encode()).hexdigest()
        
        # Создаем администратора
        admin = Employee(
            full_name='Главный Администратор',
            login='admin',
            password=password_hash,
            position_id=admin_position.id,
            phone='+79991234567',
            salary=50000.00
        )
        
        from database import db
        db.session.add(admin)
        db.session.commit()
        
        print("✅ Администратор создан!")
        print(f"Логин: admin")
        print(f"Пароль: admin123")
        print("\n⚠️ ЗАПИШИ ЭТИ ДАННЫЕ!")