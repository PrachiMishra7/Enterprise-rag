from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import bcrypt

from database import get_db
from api.dependencies import get_current_user
from models.database import User
from models.schemas import UserCreate, UserUpdateRole, UserResponse

router = APIRouter()

def require_admin(current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Superadmin privileges required to manage enterprise users"
        )
    return current_user

@router.get("", response_model=List[UserResponse])
async def list_users(
    admin: dict = Depends(require_admin),
    db: Session = Depends(get_db)
):
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [
        UserResponse(
            id=u.id,
            name=u.name,
            email=u.email,
            role=u.role,
            department=u.department,
            created_at=u.created_at.strftime("%b %d, %Y") if u.created_at else None
        )
        for u in users
    ]

@router.get("/export")
async def export_users(
    format: str = "csv",
    admin: dict = Depends(require_admin),
    db: Session = Depends(get_db)
):
    import io, csv
    from datetime import datetime
    from fastapi.responses import Response

    users = db.query(User).order_by(User.created_at.desc()).all()
    if format == "csv":
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["User ID", "Full Name", "Email Address", "Role", "Department", "Created At"])
        for u in users:
            writer.writerow([
                u.id,
                u.name,
                u.email,
                u.role,
                u.department,
                u.created_at.isoformat() if u.created_at else ""
            ])
        csv_content = output.getvalue()
        filename = f"VeriRAG_User_Directory_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"
        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    return {"users": [{"id": u.id, "name": u.name, "email": u.email, "role": u.role, "department": u.department} for u in users]}

@router.post("", response_model=UserResponse)
async def create_user(
    user_in: UserCreate,
    admin: dict = Depends(require_admin),
    db: Session = Depends(get_db)
):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="A user with this email already exists")

    salt = bcrypt.gensalt()
    pwd_hash = bcrypt.hashpw(user_in.password.encode('utf-8'), salt).decode('utf-8')

    new_user = User(
        name=user_in.name,
        email=user_in.email,
        password_hash=pwd_hash,
        role=user_in.role,
        department=user_in.department
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return UserResponse(
        id=new_user.id,
        name=new_user.name,
        email=new_user.email,
        role=new_user.role,
        department=new_user.department,
        created_at=new_user.created_at.strftime("%b %d, %Y") if new_user.created_at else None
    )

@router.patch("/{user_id}", response_model=UserResponse)
async def update_user_role(
    user_id: str,
    update_data: UserUpdateRole,
    admin: dict = Depends(require_admin),
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = update_data.role
    if update_data.department:
        user.department = update_data.department

    db.commit()
    db.refresh(user)

    return UserResponse(
        id=user.id,
        name=user.name,
        email=user.email,
        role=user.role,
        department=user.department,
        created_at=user.created_at.strftime("%b %d, %Y") if user.created_at else None
    )

@router.delete("/{user_id}")
async def delete_user(
    user_id: str,
    admin: dict = Depends(require_admin),
    db: Session = Depends(get_db)
):
    if user_id == admin.get("id"):
        raise HTTPException(status_code=400, detail="Superadmin cannot delete their own active account")

    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    db.delete(user)
    db.commit()
    return {"message": "User access revoked successfully", "user_id": user_id}
