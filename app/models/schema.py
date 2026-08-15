from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

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
    role: str
    is_active: bool
    created_at: Optional[datetime] = None


class OtpVerify(BaseModel):
    email: str
    otp: str


class OtpResend(BaseModel):
    email: str


class UpdateProfileResponse(BaseModel):
    """Returned when a profile update triggers an email-change OTP."""
    message: str
    pending_field: Optional[str] = None


class GoogleLoginRequest(BaseModel):
    credential: str
