from pydantic import BaseModel, ConfigDict
from typing import Optional

class Create_Account(BaseModel):
    name: str
    email: str
    password: str
    mobile_number: str
    re_enter_password: str

class Update_Account(BaseModel):
    name: str
    email: str
    mobile_number: str

class ProfileResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    profile_id: int
    name: str
    email: str
    mobile_number: str
