from pydantic import BaseModel, EmailStr
from typing import Optional, Any, Dict

class AdminUserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class AdminUserResponse(BaseModel):
    email: EmailStr

class ApplicationCreate(BaseModel):
    fullName: str
    # Catch-all for extra fields
    # Using model_config = ConfigDict(extra='allow') in pydantic v2
    
    model_config = {
        "extra": "allow"
    }

class ApplicationUpdate(BaseModel):
    status: Optional[str] = None
    admissionId: Optional[str] = None
    branchAwarded: Optional[str] = None
    feesPaid: Optional[str] = None
    
    model_config = {
        "extra": "allow"
    }

class ApplicationResponse(BaseModel):
    id: int
    enquiryId: str
    admissionId: Optional[str]
    fullName: str
    initial: Optional[str]
    dob: Optional[str]
    gender: Optional[str]
    studentContact: Optional[str]
    community: Optional[str]
    caste: Optional[str]
    fatherName: Optional[str]
    fatherContact: Optional[str]
    district: Optional[str]
    status: str
    branchAwarded: Optional[str]
    applicationDate: Optional[str]
    date: Optional[str]
    details: Dict[str, Any]

    class Config:
        from_attributes = True
