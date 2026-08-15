from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.tables import Create_Account_Table
from app.Auth.auth import verify_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/account/token")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> Create_Account_Table:
    payload = verify_token(token)
    
    user_id = payload.get("sub")
    username = payload.get("username")
    
    user = None
    if user_id is not None:
        try:
            # Try parsing as integer ID (profile_id)
            user_id_int = int(user_id)
            user = db.query(Create_Account_Table).filter(Create_Account_Table.profile_id == user_id_int).first()
        except ValueError:
            # Fallback to querying by email
            user = db.query(Create_Account_Table).filter(Create_Account_Table.email == str(user_id)).first()
            
    if not user and username:
        user = db.query(Create_Account_Table).filter(Create_Account_Table.email == username).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated",
        )

    # token_version (tv) claim must match the account's current version.
    # Incrementing token_version forces all previously issued tokens to be revoked.
    try:
        token_version = int(payload.get("tv", 0))
    except (TypeError, ValueError):
        token_version = 0
    if token_version != user.token_version:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked",
        )

    return user


def get_current_admin(
    current_user: Create_Account_Table = Depends(get_current_user),
) -> Create_Account_Table:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required",
        )
    return current_user
