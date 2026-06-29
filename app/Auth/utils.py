from passlib.context import CryptContext
from sqlalchemy.orm import Session
from app.models.tables import Create_Account_Table
from app.models.schema import Create_Account

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_user(db:Session,username : str):
    return db.query(Create_Account_Table).filter(Create_Account_Table.email == username).first()

def verify_password(plain_password : str, hashed_password : str):
    return pwd_context.verify(plain_password, hashed_password)  