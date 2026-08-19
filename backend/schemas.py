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

class StudentRecordCreate(BaseModel):
    fullName: Optional[str] = None
    initial: Optional[str] = None
    dob: Optional[str] = None
    gender: Optional[str] = None
    studentContact: Optional[str] = None
    community: Optional[str] = None
    caste: Optional[str] = None
    fatherName: Optional[str] = None
    fatherOccupation: Optional[str] = None
    fatherContact: Optional[str] = None
    motherName: Optional[str] = None
    motherOccupation: Optional[str] = None
    motherContact: Optional[str] = None
    annualIncome: Optional[str] = None
    address1: Optional[str] = None
    address2: Optional[str] = None
    taluk: Optional[str] = None
    district: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    lastStudies: Optional[str] = None
    sslcMarks: Optional[str] = None
    schoolName: Optional[str] = None
    govtSchool: Optional[str] = None
    schoolType: Optional[str] = None
    firstGrad: Optional[str] = None
    courseType: Optional[str] = None
    registerNumber: Optional[str] = None
    medium: Optional[str] = None
    yearOfPassing: Optional[str] = None
    subject1: Optional[str] = None
    subject1Marks: Optional[str] = None
    subject2: Optional[str] = None
    subject2Marks: Optional[str] = None
    subject3: Optional[str] = None
    subject3Marks: Optional[str] = None
    subject4: Optional[str] = None
    subject4Marks: Optional[str] = None
    subject5: Optional[str] = None
    subject5Marks: Optional[str] = None
    subject6: Optional[str] = None
    subject6Marks: Optional[str] = None
    totalMarks: Optional[str] = None
    percentage: Optional[str] = None
    cutoff: Optional[str] = None
    eligibility: Optional[str] = None
    preference1: Optional[str] = None
    preference2: Optional[str] = None
    preference3: Optional[str] = None
    preference4: Optional[str] = None
    preference5: Optional[str] = None
    preference6: Optional[str] = None
    preference7: Optional[str] = None
    preference8: Optional[str] = None
    preference9: Optional[str] = None
    quota: Optional[str] = None
    entry: Optional[str] = None
    accommodation: Optional[str] = None
    roomType: Optional[str] = None
    travelType: Optional[str] = None
    busStopName: Optional[str] = None
    busRoute: Optional[str] = None
    busNo: Optional[str] = None
    busFees: Optional[str] = None
    consultingType: Optional[str] = None
    knowAbout: Optional[str] = None
    referencePrefix: Optional[str] = None
    referenceName: Optional[str] = None
    referenceContact: Optional[str] = None
    dropoutCollege: Optional[str] = None
    dropoutRegisterNo: Optional[str] = None
    dropoutYear: Optional[str] = None
    status: Optional[str] = "Registered"
    branchAwarded: Optional[str] = None
    feesPaid: Optional[str] = None
    applicationDate: Optional[str] = None
    date: Optional[str] = None

class ApplicationUpdate(BaseModel):
    status: Optional[str] = None
    admissionId: Optional[str] = None
    branchAwarded: Optional[str] = None
    feesPaid: Optional[str] = None
    
    model_config = {
        "extra": "allow"
    }

class StudentRecordResponse(StudentRecordCreate):
    id: str
    enquiryId: str
    admissionId: Optional[str] = None


    class Config:
        from_attributes = True
