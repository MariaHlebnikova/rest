import requests
import json

BASE_URL = "http://localhost:5000"
access_token = None

def print_response(response, endpoint):
    print(f"\n{'='*50}")
    print(f"Endpoint: {endpoint}")
    print(f"Status: {response.status_code}")
    if response.status_code != 200:
        print(f"Error: {response.text}")
    else:
        try:
            data = response.json()
            print(f"Response: {json.dumps(data, indent=2, ensure_ascii=False)}")
        except:
            print(f"Response: {response.text}")

def test_authentication():
    """Тест аутентификации"""
    global access_token
    
    print("\n🔐 Тест аутентификации")
    
    # 1. Логин
    login_data = {
        "login": "admin",
        "password": "admin123"
    }
    
    response = requests.post(f"{BASE_URL}/api/auth/login", json=login_data)
    print_response(response, "POST /api/auth/login")
    
    if response.status_code == 200:
        data = response.json()
        access_token = data['access_token']
        print(f"✅ Токен получен: {access_token[:50]}...")
    
    # 2. Проверка токена
    if access_token:
        headers = {"Authorization": f"Bearer {access_token}"}
        response = requests.get(f"{BASE_URL}/api/auth/check", headers=headers)
        print_response(response, "GET /api/auth/check")

def test_with_auth(method, endpoint, data=None):
    """Выполнить запрос с аутентификацией"""
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    url = f"{BASE_URL}{endpoint}"
    
    if method == "GET":
        response = requests.get(url, headers=headers)
    elif method == "POST":
        response = requests.post(url, headers=headers, json=data)
    elif method == "PUT":
        response = requests.put(url, headers=headers, json=data)
    elif method == "DELETE":
        response = requests.delete(url, headers=headers)
    
    return response

def test_bookings():
    """Тест бронирований"""
    print("\n📅 Тест бронирований")
    
    # 1. Получить статусы
    response = test_with_auth("GET", "/api/bookings/statuses")
    print_response(response, "GET /api/bookings/statuses")
    
    # 2. Создать бронирование
    booking_data = {
        "table_id": 1,
        "guest_name": "Тестовый Клиент",
        "guest_phone": "+79161112233",
        "people_count": 2,
        "datetime": "2025-01-25T20:00:00"
    }
    
    response = test_with_auth("POST", "/api/bookings/", booking_data)
    print_response(response, "POST /api/bookings/")
    
    # 3. Получить все бронирования
    response = test_with_auth("GET", "/api/bookings/")
    print_response(response, "GET /api/bookings/")

def test_menu():
    """Тест меню"""
    print("\n🍽️ Тест меню")
    
    # 1. Получить категории
    response = test_with_auth("GET", "/api/menu/categories")
    print_response(response, "GET /api/menu/categories")
    
    # 2. Получить блюда
    response = test_with_auth("GET", "/api/menu/dishes")
    print_response(response, "GET /api/menu/dishes")

def test_orders():
    """Тест заказов"""
    print("\n🛒 Тест заказов")
    
    # 1. Создать заказ
    order_data = {
        "table_id": 1,
        "items": [
            {"dish_id": 1, "quantity": 1},
            {"dish_id": 2, "quantity": 2}
        ]
    }
    
    response = test_with_auth("POST", "/api/orders/", order_data)
    print_response(response, "POST /api/orders/")
    
    # 2. Получить активные заказы
    response = test_with_auth("GET", "/api/orders/active")
    print_response(response, "GET /api/orders/active")

def main():
    print("🚀 Начало тестирования API ресторана")
    
    # Запуск тестов
    test_authentication()
    
    if access_token:
        test_bookings()
        test_menu()
        test_orders()
        
        print("\n✅ Все тесты завершены!")
    else:
        print("\n❌ Тестирование прервано: не удалось получить токен")

if __name__ == "__main__":
    main()