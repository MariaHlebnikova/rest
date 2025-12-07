from app import create_app
from models import Hall, Table

app = create_app()

with app.app_context():
    from database import db
    
    print("=== Создание тестовых данных ===")
    
    # Создаем зал
    hall = Hall.query.filter_by(name='Основной зал').first()
    if not hall:
        hall = Hall(name='Основной зал', table_count=5)
        db.session.add(hall)
        db.session.commit()
        print("✅ Зал 'Основной зал' создан")
    
    # Создаем столы
    tables_data = [
        {'capacity': 2},
        {'capacity': 4},
        {'capacity': 4},
        {'capacity': 6},
        {'capacity': 8}
    ]
    
    created_tables = 0
    for i, table_data in enumerate(tables_data, 1):
        existing_table = Table.query.filter_by(hall_id=hall.id, capacity=table_data['capacity']).first()
        if not existing_table:
            table = Table(hall_id=hall.id, capacity=table_data['capacity'])
            db.session.add(table)
            created_tables += 1
    
    if created_tables > 0:
        db.session.commit()
        hall.table_count = Table.query.filter_by(hall_id=hall.id).count()
        db.session.commit()
        print(f"✅ Создано {created_tables} столов")
    
    print("\n📊 Тестовые данные готовы!")
    print(f"Зал: {hall.name} (ID: {hall.id})")
    print(f"Столы: {hall.table_count} шт.")