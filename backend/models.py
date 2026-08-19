from sqlalchemy import Column, Integer, String, Boolean, Float, Text, JSON
from database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class AdminUser(Base):
    __tablename__ = "admin_users"
    
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)

class StudentRecord(Base):
    __tablename__ = "student_records"
    
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    enquiryId = Column(String, unique=True, index=True)
    admissionId = Column(String, index=True, nullable=True)
    
    # Identification
    fullName = Column(String)
    initial = Column(String, nullable=True)
    dob = Column(String, nullable=True)
    gender = Column(String, nullable=True)
    studentContact = Column(String, nullable=True)
    community = Column(String, nullable=True)
    caste = Column(String, nullable=True)
    
    # Family Details
    fatherName = Column(String, nullable=True)
    fatherOccupation = Column(String, nullable=True)
    fatherContact = Column(String, nullable=True)
    motherName = Column(String, nullable=True)
    motherOccupation = Column(String, nullable=True)
    motherContact = Column(String, nullable=True)
    annualIncome = Column(String, nullable=True)
    
    # Address
    address1 = Column(String, nullable=True)
    address2 = Column(String, nullable=True)
    taluk = Column(String, nullable=True)
    district = Column(String, nullable=True)
    state = Column(String, nullable=True)
    pincode = Column(String, nullable=True)
    
    # Educational Background
    lastStudies = Column(String, nullable=True)
    sslcMarks = Column(String, nullable=True)
    schoolName = Column(String, nullable=True)
    govtSchool = Column(String, nullable=True)
    schoolType = Column(String, nullable=True)
    firstGrad = Column(String, nullable=True)
    courseType = Column(String, nullable=True)
    
    # Academic Scores
    registerNumber = Column(String, nullable=True)
    medium = Column(String, nullable=True)
    yearOfPassing = Column(String, nullable=True)
    subject1 = Column(String, nullable=True)
    subject1Marks = Column(String, nullable=True)
    subject2 = Column(String, nullable=True)
    subject2Marks = Column(String, nullable=True)
    subject3 = Column(String, nullable=True)
    subject3Marks = Column(String, nullable=True)
    subject4 = Column(String, nullable=True)
    subject4Marks = Column(String, nullable=True)
    subject5 = Column(String, nullable=True)
    subject5Marks = Column(String, nullable=True)
    subject6 = Column(String, nullable=True)
    subject6Marks = Column(String, nullable=True)
    totalMarks = Column(String, nullable=True)
    percentage = Column(String, nullable=True)
    cutoff = Column(String, nullable=True)
    eligibility = Column(String, nullable=True)
    
    # Course Preferences
    preference1 = Column(String, nullable=True)
    preference2 = Column(String, nullable=True)
    preference3 = Column(String, nullable=True)
    preference4 = Column(String, nullable=True)
    preference5 = Column(String, nullable=True)
    preference6 = Column(String, nullable=True)
    preference7 = Column(String, nullable=True)
    preference8 = Column(String, nullable=True)
    preference9 = Column(String, nullable=True)
    quota = Column(String, nullable=True)
    entry = Column(String, nullable=True)
    
    # Accommodation & Travel
    accommodation = Column(String, nullable=True)
    roomType = Column(String, nullable=True)
    travelType = Column(String, nullable=True)
    
    # Transportation Details
    busStopName = Column(String, nullable=True)
    busRoute = Column(String, nullable=True)
    busNo = Column(String, nullable=True)
    busFees = Column(String, nullable=True)
    
    # Reference & Recruitment
    consultingType = Column(String, nullable=True)
    knowAbout = Column(String, nullable=True)
    referencePrefix = Column(String, nullable=True)
    referenceName = Column(String, nullable=True)
    referenceContact = Column(String, nullable=True)
    
    # Dropout Information
    dropoutCollege = Column(String, nullable=True)
    dropoutRegisterNo = Column(String, nullable=True)
    dropoutYear = Column(String, nullable=True)
    # Admin fields
    status = Column(String, default="Registered")
    branchAwarded = Column(String, nullable=True)
    feesPaid = Column(String, nullable=True)
    
    # Metadata
    applicationDate = Column(String, nullable=True)
    date = Column(String, nullable=True)

class AdmittedStudent(Base):
    __tablename__ = "admitted_students"
    
    id = Column(String, primary_key=True, index=True, default=generate_uuid)
    enquiryId = Column(String, unique=True, index=True)
    admissionId = Column(String, index=True, nullable=True)
    
    # Identification
    fullName = Column(String)
    initial = Column(String, nullable=True)
    dob = Column(String, nullable=True)
    gender = Column(String, nullable=True)
    studentContact = Column(String, nullable=True)
    community = Column(String, nullable=True)
    caste = Column(String, nullable=True)
    
    # Family Details
    fatherName = Column(String, nullable=True)
    fatherOccupation = Column(String, nullable=True)
    fatherContact = Column(String, nullable=True)
    motherName = Column(String, nullable=True)
    motherOccupation = Column(String, nullable=True)
    motherContact = Column(String, nullable=True)
    annualIncome = Column(String, nullable=True)
    
    # Address
    address1 = Column(String, nullable=True)
    address2 = Column(String, nullable=True)
    taluk = Column(String, nullable=True)
    district = Column(String, nullable=True)
    state = Column(String, nullable=True)
    pincode = Column(String, nullable=True)
    
    # Educational Background
    lastStudies = Column(String, nullable=True)
    sslcMarks = Column(String, nullable=True)
    schoolName = Column(String, nullable=True)
    govtSchool = Column(String, nullable=True)
    schoolType = Column(String, nullable=True)
    firstGrad = Column(String, nullable=True)
    courseType = Column(String, nullable=True)
    
    # Academic Scores
    registerNumber = Column(String, nullable=True)
    medium = Column(String, nullable=True)
    yearOfPassing = Column(String, nullable=True)
    subject1 = Column(String, nullable=True)
    subject1Marks = Column(String, nullable=True)
    subject2 = Column(String, nullable=True)
    subject2Marks = Column(String, nullable=True)
    subject3 = Column(String, nullable=True)
    subject3Marks = Column(String, nullable=True)
    subject4 = Column(String, nullable=True)
    subject4Marks = Column(String, nullable=True)
    subject5 = Column(String, nullable=True)
    subject5Marks = Column(String, nullable=True)
    subject6 = Column(String, nullable=True)
    subject6Marks = Column(String, nullable=True)
    totalMarks = Column(String, nullable=True)
    percentage = Column(String, nullable=True)
    cutoff = Column(String, nullable=True)
    eligibility = Column(String, nullable=True)
    
    # Course Preferences
    preference1 = Column(String, nullable=True)
    preference2 = Column(String, nullable=True)
    preference3 = Column(String, nullable=True)
    preference4 = Column(String, nullable=True)
    preference5 = Column(String, nullable=True)
    preference6 = Column(String, nullable=True)
    preference7 = Column(String, nullable=True)
    preference8 = Column(String, nullable=True)
    preference9 = Column(String, nullable=True)
    quota = Column(String, nullable=True)
    entry = Column(String, nullable=True)
    
    # Accommodation & Travel
    accommodation = Column(String, nullable=True)
    roomType = Column(String, nullable=True)
    travelType = Column(String, nullable=True)
    
    # Transportation Details
    busStopName = Column(String, nullable=True)
    busRoute = Column(String, nullable=True)
    busNo = Column(String, nullable=True)
    busFees = Column(String, nullable=True)
    
    # Reference & Recruitment
    consultingType = Column(String, nullable=True)
    knowAbout = Column(String, nullable=True)
    referencePrefix = Column(String, nullable=True)
    referenceName = Column(String, nullable=True)
    referenceContact = Column(String, nullable=True)
    
    # Dropout Information
    dropoutCollege = Column(String, nullable=True)
    dropoutRegisterNo = Column(String, nullable=True)
    dropoutYear = Column(String, nullable=True)
    # Admin fields
    status = Column(String, default="Registered")
    branchAwarded = Column(String, nullable=True)
    feesPaid = Column(String, nullable=True)
    
    # Metadata
    applicationDate = Column(String, nullable=True)
    date = Column(String, nullable=True)
