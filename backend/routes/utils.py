from flask_jwt_extended import get_jwt_identity, get_jwt

def get_current_user():
    try:
        user_id = get_jwt_identity()
        jwt_data = get_jwt()
        
        if not user_id:
            return None
        
        return {
            'id': int(user_id),
            'login': jwt_data.get('login', ''),
            'full_name': jwt_data.get('full_name', ''),
            'position': jwt_data.get('position', ''),
            'position_id': jwt_data.get('position_id', 0)
        }
    except Exception as e:
        print(f"Error getting current user: {e}")
        return None


def check_admin_access(user_data):
    if not user_data:
        return False
    
    return user_data.get('position') == 'Администратор'