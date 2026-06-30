from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from auth.auth_handler import AuthHandler

security = HTTPBearer()
auth_handler = AuthHandler()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    user = auth_handler.decode_token(token)
    if not user:
        print(f"Token decoding failed or returned None for token: {token}")
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return user
