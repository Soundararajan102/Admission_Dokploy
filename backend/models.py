from sqlalchemy import Column, Integer, String, Boolean, Float, Text, JSON
from .database import Base

class AdminUser(Base):
    __tablename__ = "admin_users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)

class Application(Base):
    __tablename__ = "applications"
    
    id = Column(Integer, primary_key=True, index=True)
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
    
    # We will store the rest of the dynamic fields in a JSON column to simplify schema evolution
    # as there are 68 columns in the original Google Sheet.
    # This includes academic scores, preferences, transportation, etc.
    details = Column(JSON, default={})
    
    # Admin fields
    status = Column(String, default="Registered")
    branchAwarded = Column(String, nullable=True)
    feesPaid = Column(String, nullable=True)
    
    # Metadata
    applicationDate = Column(String, nullable=True)
    date = Column(String, nullable=True)
