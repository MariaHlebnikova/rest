from app import create_app
from models import create_initial_data

app = create_app()
with app.app_context():
    create_initial_data()