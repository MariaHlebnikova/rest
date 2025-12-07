from app import create_app
from models import DishCategory, Dish

app = create_app()

with app.app_context():
    from database import db
    
    print("=== Создание тестовых данных ===")

    categories = DishCategory.query.all()
    
    if categories:
        test_dishes = [
            {'name': 'Цезарь с курицей', 'category_id': categories[1].id, 'price': 450, 'weight_grams': 300},
            {'name': 'Том Ям', 'category_id': categories[2].id, 'price': 380, 'weight_grams': 350},
            {'name': 'Стейк Рибай', 'category_id': categories[3].id, 'price': 1200, 'weight_grams': 400},
            {'name': 'Тирамису', 'category_id': categories[4].id, 'price': 320, 'weight_grams': 150},
            {'name': 'Апельсиновый фреш', 'category_id': categories[5].id, 'price': 250, 'weight_grams': 300}
        ]
        
        created_dishes = 0
        for dish_data in test_dishes:
            existing_dish = Dish.query.filter_by(name=dish_data['name']).first()
            if not existing_dish:
                dish = Dish(**dish_data)
                db.session.add(dish)
                created_dishes += 1
        
        if created_dishes > 0:
            db.session.commit()
            print(f"✅ Создано {created_dishes} тестовых блюд")