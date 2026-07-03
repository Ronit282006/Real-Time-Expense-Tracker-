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
    return user
