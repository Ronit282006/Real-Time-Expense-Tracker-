from sqlalchemy import Column,Integer,String,Date,DateTime,Text
from app.database.database import base

class Create_Account_Table(base):
    __tablename__ = "Account"
    
    profile_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(20), nullable=False)
    email = Column(String(20), nullable=False)
    password = Column(String(20), nullable=False)
    mobile_number = Column(String(20), nullable=False)
    re_enter_password = Column(String(20), nullable=False)

    
    