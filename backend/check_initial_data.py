# check_initial_data.py
from app import create_app
from models import BookingStatus, Position, DishCategory

app = create_app()

with app.app_context():
    print("=== Проверка начальных данных ===")
    
    # Статусы бронирования
    statuses = BookingStatus.query.all()
    print(f"✅ Статусы бронирования ({len(statuses)}):")
    for status in statuses:
        print(f"  • {status.id}: {status.name}")
    
    # Должности
    positions = Position.query.all()
    print(f"\n✅ Должности ({len(positions)}):")
    for pos in positions:
        print(f"  • {pos.id}: {pos.name}")
    
    # Категории блюд
    categories = DishCategory.query.all()
    print(f"\n✅ Категории блюд ({len(categories)}):")
    for cat in categories:
        print(f"  • {cat.id}: {cat.name}")