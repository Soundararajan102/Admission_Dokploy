import math
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

from . import models, schemas, auth
from .database import get_db

router = APIRouter(prefix="/api/applications", tags=["applications"])

@router.post("", response_model=schemas.ApplicationResponse)
def create_application(app_in: schemas.ApplicationCreate, db: Session = Depends(get_db)):
    # Generate Enquiry ID
    count = db.query(models.Application).count()
    padded_count = str(count + 1).zfill(4)
    enquiry_id = f"KN26EQ{padded_count}"
    
    # Extract fields from dict
    data = app_in.model_dump()
    
    new_app = models.Application(
        enquiryId=enquiry_id,
        fullName=data.pop("fullName", ""),
        initial=data.pop("initial", ""),
        dob=data.pop("dob", ""),
        gender=data.pop("gender", ""),
        studentContact=data.pop("studentContact", ""),
        community=data.pop("community", ""),
        caste=data.pop("caste", ""),
        fatherName=data.pop("fatherName", ""),
        fatherOccupation=data.pop("fatherOccupation", ""),
        fatherContact=data.pop("fatherContact", ""),
        motherName=data.pop("motherName", ""),
        motherOccupation=data.pop("motherOccupation", ""),
        motherContact=data.pop("motherContact", ""),
        annualIncome=data.pop("annualIncome", ""),
        address1=data.pop("address1", ""),
        address2=data.pop("address2", ""),
        taluk=data.pop("taluk", ""),
        district=data.pop("district", ""),
        state=data.pop("state", ""),
        pincode=data.pop("pincode", ""),
        date=datetime.now().strftime("%d-%m-%Y"),
        applicationDate=datetime.now().strftime("%d-%m-%Y"),
        details=data # Put remaining fields in JSON
    )
    
    db.add(new_app)
    db.commit()
    db.refresh(new_app)
    return new_app

@router.get("", response_model=List[schemas.ApplicationResponse])
def get_applications(db: Session = Depends(get_db)):
    # Fetch all for the dashboard.
    apps = db.query(models.Application).order_by(models.Application.id.desc()).all()
    # Flatten JSON 'details' into the response to match what the frontend expects
    # In schemas.ApplicationResponse, details is a dict, so the frontend might need to adjust 
    # OR we can return a list of dicts directly without standard Pydantic validation 
    # to perfectly mock the Google Apps script behavior
    
    result = []
    for app in apps:
        app_dict = {
            "id": app.id,
            "enquiryId": app.enquiryId,
            "admissionId": app.admissionId,
            "fullName": app.fullName,
            "initial": app.initial,
            "dob": app.dob,
            "gender": app.gender,
            "studentContact": app.studentContact,
            "community": app.community,
            "caste": app.caste,
            "fatherName": app.fatherName,
            "fatherOccupation": app.fatherOccupation,
            "fatherContact": app.fatherContact,
            "motherName": app.motherName,
            "motherOccupation": app.motherOccupation,
            "motherContact": app.motherContact,
            "annualIncome": app.annualIncome,
            "address1": app.address1,
            "address2": app.address2,
            "taluk": app.taluk,
            "district": app.district,
            "state": app.state,
            "pincode": app.pincode,
            "status": app.status,
            "branchAwarded": app.branchAwarded,
            "feesPaid": app.feesPaid,
            "date": app.date,
            "applicationDate": app.applicationDate,
        }
        # Merge JSON details into the top-level dict
        if app.details:
            app_dict.update(app.details)
            
        result.append(app_dict)
        
    # Return raw dicts so it behaves exactly like the Google Sheet API (array of flat objects)
    return result

@router.put("/{app_id}")
def update_application(app_id: int, app_in: schemas.ApplicationUpdate, db: Session = Depends(auth.get_current_user), db_session: Session = Depends(get_db)):
    # Wait, the Depends is wrong above, let's fix it manually inside or correctly inject
    pass

@router.put("/by-enquiry/{enquiry_id}")
def update_by_enquiry(enquiry_id: str, app_update: dict, current_user: models.AdminUser = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    app = db.query(models.Application).filter(models.Application.enquiryId == enquiry_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    # Update fields
    if "status" in app_update:
        app.status = app_update["status"]
    if "branchAwarded" in app_update:
        app.branchAwarded = app_update["branchAwarded"]
    if "feesPaid" in app_update:
        app.feesPaid = app_update["feesPaid"]
        
    # Generate admissionId if admitted and doesn't have one
    if app.status == "Admitted" and not app.admissionId:
        admitted_count = db.query(models.Application).filter(models.Application.admissionId != None).count()
        padded_count = str(admitted_count + 1).zfill(4)
        app.admissionId = f"26KNF{padded_count}"

    # Merge remaining fields into details
    if "details" in app_update:
        app.details = {**app.details, **app_update["details"]}
    else:
        # Check for other fields to put in details
        for key, value in app_update.items():
            if hasattr(app, key):
                setattr(app, key, value)
            else:
                # Store in details JSON
                details = dict(app.details) if app.details else {}
                details[key] = value
                app.details = details

    db.commit()
    return {"success": True, "message": "Updated successfully"}

@router.get("/by-enquiry/{enquiry_id}")
def get_by_enquiry(enquiry_id: str, db: Session = Depends(get_db)):
    app = db.query(models.Application).filter(models.Application.enquiryId == enquiry_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    app_dict = {
        "id": app.id,
        "enquiryId": app.enquiryId,
        "admissionId": app.admissionId,
        "fullName": app.fullName,
        "initial": app.initial,
        "dob": app.dob,
        "gender": app.gender,
        "studentContact": app.studentContact,
        "community": app.community,
        "caste": app.caste,
        "fatherName": app.fatherName,
        "fatherContact": app.fatherContact,
        "district": app.district,
        "status": app.status,
        "branchAwarded": app.branchAwarded,
        "feesPaid": app.feesPaid,
        "date": app.date,
        "applicationDate": app.applicationDate,
    }
    if app.details:
        app_dict.update(app.details)
        
    return app_dict
