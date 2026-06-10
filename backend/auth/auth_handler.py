import jwt
import bcrypt
import uuid
from datetime import datetime, timedelta
from typing import Optional

SECRET_KEY = "enterprise-rag-secret-key-2024-change-in-production"
ALGORITHM = "HS256"
TOKEN_EXPIRE_HOURS = 24

# In-memory user store (replace with PostgreSQL/MongoDB in production)
USERS_DB: dict = {}

# Role hierarchy and permissions
ROLE_PERMISSIONS = {
    "employee": {
        "departments": ["general", "hr"],
        "access_levels": ["employee"],
        "can_upload": False
    },
    "manager": {
        "departments": ["general", "hr", "finance", "it"],
        "access_levels": ["employee", "manager"],
        "can_upload": False
    },
    "hr_admin": {
        "departments": ["general", "hr"],
        "access_levels": ["employee", "manager", "hr_admin"],
        "can_upload": True
    },
    "legal_admin": {
        "departments": ["general", "legal"],
        "access_levels": ["employee", "manager", "legal_admin"],
        "can_upload": True
    },
    "finance_admin": {
        "departments": ["general", "finance"],
        "access_levels": ["employee", "manager", "finance_admin"],
        "can_upload": True
    },
    "it_admin": {
        "departments": ["general", "it"],
        "access_levels": ["employee", "manager", "it_admin"],
        "can_upload": True
    },
    "admin": {
        "departments": ["general", "hr", "legal", "finance", "it"],
        "access_levels": ["employee", "manager", "hr_admin", "legal_admin", "finance_admin", "it_admin", "admin"],
        "can_upload": True
    }
}


class AuthHandler:
    def __init__(self):
        # Seed demo users
        self._seed_demo_users()

    def _seed_demo_users(self):
        demo_users = [
            {"name": "Alice (Employee)", "email": "alice@company.com", "password": "EnterprisePass!2024", "role": "employee", "department": "general"},
            {"name": "Bob (Manager)", "email": "bob@company.com", "password": "EnterprisePass!2024", "role": "manager", "department": "general"},
            {"name": "Carol (HR Admin)", "email": "carol@company.com", "password": "EnterprisePass!2024", "role": "hr_admin", "department": "hr"},
            {"name": "Dave (Legal Admin)", "email": "dave@company.com", "password": "EnterprisePass!2024", "role": "legal_admin", "department": "legal"},
            {"name": "Eve (Finance Admin)", "email": "eve@company.com", "password": "EnterprisePass!2024", "role": "finance_admin", "department": "finance"},
            {"name": "Admin", "email": "admin@company.com", "password": "AdminPass!2024", "role": "admin", "department": "general"},
        ]
        for u in demo_users:
            hashed = bcrypt.hashpw(u["password"].encode(), bcrypt.gensalt()).decode()
            uid = str(uuid.uuid4())
            USERS_DB[u["email"]] = {
                "id": uid,
                "name": u["name"],
                "email": u["email"],
                "password_hash": hashed,
                "role": u["role"],
                "department": u["department"],
                "created_at": datetime.utcnow().isoformat()
            }

    def register_user(self, user_data) -> Optional[str]:
        if user_data.email in USERS_DB:
            return None
        hashed = bcrypt.hashpw(user_data.password.encode(), bcrypt.gensalt()).decode()
        uid = str(uuid.uuid4())
        USERS_DB[user_data.email] = {
            "id": uid,
            "name": user_data.name,
            "email": user_data.email,
            "password_hash": hashed,
            "role": user_data.role,
            "department": user_data.department,
            "created_at": datetime.utcnow().isoformat()
        }
        return uid

    def authenticate_user(self, email: str, password: str) -> Optional[dict]:
        user = USERS_DB.get(email)
        if not user:
            return None
        if not bcrypt.checkpw(password.encode(), user["password_hash"].encode()):
            return None
        return user

    def create_token(self, user: dict) -> str:
        payload = {
            "sub": user["id"],
            "email": user["email"],
            "role": user["role"],
            "name": user["name"],
            "exp": datetime.utcnow() + timedelta(hours=TOKEN_EXPIRE_HOURS)
        }
        return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    def decode_token(self, token: str) -> Optional[dict]:
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            return {
                "id": payload["sub"],
                "email": payload["email"],
                "role": payload["role"],
                "name": payload["name"]
            }
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None

    def get_user_permissions(self, role: str) -> dict:
        return ROLE_PERMISSIONS.get(role, ROLE_PERMISSIONS["employee"])
