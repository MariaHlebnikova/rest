# create_all_tables.py
from app import create_app
from database import db
from models import *

app = create_app()

with app.app_context():
    print("=== Принудительное создание всех таблиц ===")
    
    # Удаляем все таблицы (если есть)
    print("Очистка базы данных...")
    db.drop_all()
    
    # Создаем все таблицы заново
    print("Создание таблиц...")
    db.create_all()
    
    print("✅ Все таблицы созданы!")
    
    # Проверим
    from sqlalchemy import inspect
    inspector = inspect(db.engine)
    tables = inspector.get_table_names()
    
    print(f"\n📋 Создано таблиц: {len(tables)}")
    for table in sorted(tables):
        print(f"  • {table}")