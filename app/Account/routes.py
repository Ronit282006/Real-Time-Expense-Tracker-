from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.models.schema import Create_Account
from app.crud.user import create_account, get_profile, update_profile, delete_profile, oauth2_scheme
from app.database.database import get_db
from app.Auth.utils import get_user, verify_password
from app.Auth.auth import create_token

router= APIRouter()

@router.post("/token")
async def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user_data = get_user(db, form_data.username)
    if not user_data or not verify_password(form_data.password, user_data.password):
        raise HTTPException(status_code=401, detail="Incorrect username or password")
    
    access_token = create_token(data={"sub": user_data.email})
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/create-account")
async def create_accounts(user:Create_Account, db: Session = Depends(get_db)):
    return create_account(db,user)


@router.get("/{profile_id}")
async def get_profiles(profile_id:int , db: Session = Depends(get_db), token:str = Depends(oauth2_scheme)):
    return get_profile(db,profile_id,token)


@router.put("/{profile_id}")
async def update_profiles(profile_id:int,user:Create_Account, db: Session = Depends(get_db), token:str = Depends(oauth2_scheme)):
    return update_profile(db, profile_id, user, token)


@router.delete("/{profile_id}")
async def delete_profiles(profile_id:int, db: Session = Depends(get_db), token:str = Depends(oauth2_scheme)):
    return delete_profile(db, profile_id, token)