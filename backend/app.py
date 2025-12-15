from flask import Flask, jsonify
from flask_cors import CORS
from config import config
from database import init_db
from flask_jwt_extended import JWTManager

def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Включаем CORS для фронтенда
    CORS(app)
    
    # Инициализация расширений
    init_db(app)
    
    # JWT
    jwt = JWTManager(app)
    
    @app.route('/')
    def index():
        return jsonify({
            'message': 'Restaurant API',
            'status': 'running',
            'version': '1.0.0',
            'endpoints': {
                'auth': '/api/auth/*',
                'bookings': '/api/bookings/*',
                'menu': '/api/menu/*',
                'orders': '/api/orders/*',
                'employees': '/api/employees/*',
                'suppliers': '/api/suppliers/*',
                'halls': '/api/halls/*',
                'reports': '/api/reports/*'
            }
        })
    
    @app.route('/api/health')
    def health():
        return jsonify({'status': 'healthy'})
    
    # Регистрация всех маршрутов
    from routes.auth import auth_bp
    from routes.bookings import bookings_bp
    from routes.menu import menu_bp
    from routes.orders import orders_bp
    from routes.employees import employees_bp
    from routes.suppliers import suppliers_bp
    from routes.halls import halls_bp
    from routes.reports import reports_bp
    from routes.receipts import receipts_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(bookings_bp, url_prefix='/api/bookings')
    app.register_blueprint(menu_bp, url_prefix='/api/menu')
    app.register_blueprint(orders_bp, url_prefix='/api/orders')
    app.register_blueprint(employees_bp, url_prefix='/api/employees')
    app.register_blueprint(suppliers_bp, url_prefix='/api/suppliers')
    app.register_blueprint(halls_bp, url_prefix='/api/halls')
    app.register_blueprint(reports_bp, url_prefix='/api/reports')
    app.register_blueprint(receipts_bp, url_prefix='/api/receipts')
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(debug=True, host='0.0.0.0', port=5000)