import email
from pydantic import BaseModel



class Create_Account(BaseModel):
    name : str
    email:str
    password:str
    mobile_number:str
    re_enter_password:str



class get_profile(BaseModel):
    profile_id:int

class update_profile(BaseModel):
    profile_id:int
    name:str
    email:str
    mobile_number:str
    
class delete_profile(BaseModel):
    profile_id:int
