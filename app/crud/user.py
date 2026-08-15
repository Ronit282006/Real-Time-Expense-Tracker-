from sqlalchemy.orm import Session
from app.models.tables import Create_Account_Table
from app.models.schema import Create_Account
from app.Auth.utils import pwd_context
from fastapi.security import OAuth2PasswordBearer
from fastapi import HTTPException , Depends,HTTPException
from app.Auth.auth import create_token,verify_token
from app.Auth.utils import get_user,verify_password


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/account/token")


def validate_registration(db: Session, user: Create_Account):
    """
    Validate registration input. Raises HTTPException on failure.
    Called during Step 1 (send OTP) and Step 2 (verify OTP).
    """
    if db.query(Create_Account_Table).filter(Create_Account_Table.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already exists")
    if user.password != user.re_enter_password:
        raise HTTPException(status_code=400, detail="Password does not match")


def create_account(db:Session, user:Create_Account):
    validate_registration(db, user)
    user_data = Create_Account_Table(
        name = user.name,
        email = user.email,
        password = pwd_context.hash(user.password),
        mobile_number = user.mobile_number,
        re_enter_password = pwd_context.hash(user.re_enter_password)
    )
    db.add(user_data)
    db.commit()
    db.refresh(user_data)
    return user_data



def login(db:Session,user:Create_Account):
    user_data = get_user(db,user.email)
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    if not verify_password(user.password,user_data.password):
        raise HTTPException(status_code=401, detail="Invalid password")
    access_token = create_token(data={"username": user.email})
    return {"access_token": access_token, "token_type": "bearer"}











def _validate_active_session(token_data: dict, user_data: Create_Account_Table):
    """Ensures the account is active and the token version is current."""
    if not user_data.is_active:
        raise HTTPException(status_code=403, detail="Account is deactivated")
    try:
        token_version = int(token_data.get("tv", 0))
    except (TypeError, ValueError):
        token_version = 0
    if token_version != user_data.token_version:
        raise HTTPException(status_code=401, detail="Token has been revoked")


def get_profile(db:Session,profile_id:int , token:str):
    token_data = verify_token(token)
    if not token_data:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user_id = int(token_data.get("sub"))
    if profile_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to view this profile")
        
    user_data = db.query(Create_Account_Table).filter(Create_Account_Table.profile_id == profile_id).first()
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    _validate_active_session(token_data, user_data)
    return user_data
from app.models.schema import Update_Account

def update_profile(db:Session,profile_id:int, user:Update_Account , token:str):
    token_data = verify_token(token)
    if not token_data:
        raise HTTPException(status_code=401, detail="Invalid token")
        
    user_id = int(token_data.get("sub"))
    if profile_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to update this profile")
        
    user_data = db.query(Create_Account_Table).filter(Create_Account_Table.profile_id == profile_id).first()
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    _validate_active_session(token_data, user_data)
    user_data.name = user.name
    user_data.email = user.email
    user_data.mobile_number = user.mobile_number
    db.commit()
    db.refresh(user_data)
    return user_data

def delete_profile(db:Session,profile_id:int , token:str):
    token_data = verify_token(token)
    if not token_data:
        raise HTTPException(status_code=401, detail="Invalid token")    
        
    user_id = int(token_data.get("sub"))
    if profile_id != user_id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this profile")
        
    user_data = db.query(Create_Account_Table).filter(Create_Account_Table.profile_id == profile_id).first()
    if not user_data:
        raise HTTPException(status_code=404, detail="User not found")
    _validate_active_session(token_data, user_data)
    db.delete(user_data)
    db.commit()
    return user_data
