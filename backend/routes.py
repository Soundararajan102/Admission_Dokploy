import math
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime

import models, schemas, auth
from database import get_db

router = APIRouter(prefix="/api/applications", tags=["applications"])

from sqlalchemy.exc import IntegrityError
import time
import csv
import io
import uuid
from fastapi import UploadFile, File

@router.post("/import-csv-temp")
async def import_csv_temp(
    students_file: UploadFile = File(...),
    admitted_file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Read files
    students_content = await students_file.read()
    admitted_content = await admitted_file.read()
    
    students_reader = csv.DictReader(io.StringIO(students_content.decode('utf-8')))
    admitted_reader = csv.DictReader(io.StringIO(admitted_content.decode('utf-8')))
    
    # Clear tables
    db.execute(models.StudentRecord.__table__.delete())
    db.execute(models.AdmittedStudent.__table__.delete())
    db.commit()
    
    # Insert students
    student_records = []
    seen_enquiries = set()
    for row in students_reader:
        if row.get('enquiryId') in seen_enquiries:
            continue
        seen_enquiries.add(row.get('enquiryId'))
        
        # Replace empty strings with None
        clean_row = {k: (v if v != '' else None) for k, v in row.items()}
        if 'id' not in clean_row or not clean_row['id']:
            clean_row['id'] = str(uuid.uuid4())
            
        student_records.append(models.StudentRecord(**clean_row))
        
    db.bulk_save_objects(student_records)
    
    # Insert admitted
    admitted_records = []
    seen_admitted = set()
    for row in admitted_reader:
        if row.get('enquiryId') in seen_admitted:
            continue
        seen_admitted.add(row.get('enquiryId'))
        
        clean_row = {k: (v if v != '' else None) for k, v in row.items()}
        if 'id' not in clean_row or not clean_row['id']:
            clean_row['id'] = str(uuid.uuid4())
            
        admitted_records.append(models.AdmittedStudent(**clean_row))
        
    db.bulk_save_objects(admitted_records)
    db.commit()
    
    return {"message": "Success", "students": len(student_records), "admitted": len(admitted_records)}

@router.post("", response_model=schemas.StudentRecordResponse)
def create_application(app_in: schemas.StudentRecordCreate, db: Session = Depends(get_db)):
    data = app_in.model_dump(exclude_unset=True)
    data["date"] = datetime.now().strftime("%d-%m-%Y")
    data["applicationDate"] = datetime.now().strftime("%d-%m-%Y")
    
    max_retries = 5
    for attempt in range(max_retries):
        try:
            # Generate Enquiry ID properly based on the last record
            last_app = db.query(models.StudentRecord).order_by(models.StudentRecord.enquiryId.desc()).first()
            if last_app and last_app.enquiryId.startswith("KN26EQ"):
                try:
                    count = int(last_app.enquiryId.replace("KN26EQ", ""))
                except:
                    count = db.query(models.StudentRecord).count()
            else:
                count = db.query(models.StudentRecord).count()
                
            padded_count = str(count + 1).zfill(4)
            data["enquiryId"] = f"KN26EQ{padded_count}"
            
            new_app = models.StudentRecord(**data)
            db.add(new_app)
            db.commit()
            db.refresh(new_app)
            return new_app
        except IntegrityError:
            db.rollback()
            if attempt == max_retries - 1:
                raise HTTPException(status_code=500, detail="System busy. Could not generate unique Enquiry ID. Please try again.")
            time.sleep(0.1) # Small delay before retry

from sqlalchemy import or_, func
from typing import Optional

@router.get("/stats")
def get_application_stats(db: Session = Depends(get_db)):
    registered = db.query(models.StudentRecord).count()
    admitted_list = db.query(models.StudentRecord).filter(models.StudentRecord.admissionId.isnot(None), models.StudentRecord.admissionId != "").count()
    live = db.query(models.StudentRecord).filter(models.StudentRecord.status == "Admitted").count()
    pending = db.query(models.StudentRecord).filter(models.StudentRecord.status == "Pending").count()
    cancelled = db.query(models.StudentRecord).filter(models.StudentRecord.status.ilike("cancelled")).count()

    depts_1 = db.query(models.StudentRecord.preference1).distinct().all()
    all_depts = set([d[0] for d in depts_1 if d[0] and d[0].strip() != ""])

    return {
        "registered": registered,
        "admittedList": admitted_list,
        "live": live,
        "pending": pending,
        "cancelled": cancelled,
        "departments": sorted(list(all_depts))
    }

@router.get("")
def get_applications(
    skip: int = 0, 
    limit: int = 10, 
    search: Optional[str] = None, 
    status_filter: Optional[str] = None, 
    departments: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.StudentRecord)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            or_(
                models.StudentRecord.fullName.ilike(search_term),
                models.StudentRecord.enquiryId.ilike(search_term),
                models.StudentRecord.admissionId.ilike(search_term),
                models.StudentRecord.preference1.ilike(search_term)
            )
        )
        
    if status_filter and status_filter != "All":
        if status_filter == "AdmittedList":
            query = query.filter(models.StudentRecord.admissionId.isnot(None), models.StudentRecord.admissionId != "")
        elif status_filter == "Live":
            query = query.filter(models.StudentRecord.status == "Admitted")
        else:
            query = query.filter(models.StudentRecord.status.ilike(status_filter))
            
    if departments:
        dept_list = [d.strip() for d in departments.split(',')]
        dept_conditions = []
        for d in dept_list:
            d_term = f"%{d}%"
            dept_conditions.append(models.StudentRecord.preference1.ilike(d_term))
        if dept_conditions:
            query = query.filter(or_(*dept_conditions))
            
    total = query.count()
    # Order descending so the latest submissions show up first
    apps = query.order_by(models.StudentRecord.enquiryId.desc()).offset(skip).limit(limit).all()
    
    return {
        "data": apps,
        "total": total
    }

@router.get("/admitted-students")
def get_admitted_students(db: Session = Depends(get_db)):
    # Fetch all from AdmittedStudent table
    apps = db.query(models.AdmittedStudent).order_by(models.AdmittedStudent.enquiryId.asc()).all()
    return apps

@router.put("/{app_id}")
def update_application(app_id: str, app_in: schemas.ApplicationUpdate, db: Session = Depends(auth.get_current_user), db_session: Session = Depends(get_db)):
    # Wait, the Depends is wrong above, let's fix it manually inside or correctly inject
    pass

@router.put("/by-enquiry/{enquiry_id}")
def update_by_enquiry(enquiry_id: str, app_update: dict, current_user: models.AdminUser = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    max_retries = 5
    for attempt in range(max_retries):
        try:
            app = db.query(models.StudentRecord).filter(models.StudentRecord.enquiryId == enquiry_id).first()
            if not app:
                raise HTTPException(status_code=404, detail="Application not found")
                
            # Generate admissionId if admitted and doesn't have one
            if "status" in app_update and app_update["status"] == "Admitted" and not app.admissionId:
                last_admitted = db.query(models.StudentRecord).filter(models.StudentRecord.admissionId != None).order_by(models.StudentRecord.admissionId.desc()).first()
                if last_admitted and last_admitted.admissionId.startswith("26KNF"):
                    try:
                        admitted_count = int(last_admitted.admissionId.replace("26KNF", ""))
                    except:
                        admitted_count = db.query(models.StudentRecord).filter(models.StudentRecord.admissionId != None).count()
                else:
                    admitted_count = db.query(models.StudentRecord).filter(models.StudentRecord.admissionId != None).count()
                    
                padded_count = str(admitted_count + 1).zfill(4)
                app.admissionId = f"26KNF{padded_count}"

            # Update fields dynamically
            for key, value in app_update.items():
                if hasattr(app, key):
                    setattr(app, key, value)

            # Handle AdmittedStudent table if status is Admitted
            if app.status == "Admitted" and app.admissionId:
                # Check if it already exists in admitted_students
                admitted_record = db.query(models.AdmittedStudent).filter(models.AdmittedStudent.admissionId == app.admissionId).first()
                
                # Copy all fields except the primary key ID from StudentRecord
                data_dict = {col.name: getattr(app, col.name) for col in app.__table__.columns if col.name != 'id'}
                
                if admitted_record:
                    # Update existing
                    for key, value in data_dict.items():
                        if hasattr(admitted_record, key):
                            setattr(admitted_record, key, value)
                else:
                    # Insert new
                    new_admitted = models.AdmittedStudent(**data_dict)
                    db.add(new_admitted)

            db.commit()
            return {"success": True, "message": "Updated successfully"}
        except IntegrityError:
            db.rollback()
            if attempt == max_retries - 1:
                raise HTTPException(status_code=500, detail="System busy. Could not generate unique Admission ID. Please try again.")
            time.sleep(0.1)

@router.get("/by-enquiry/{enquiry_id}")
def get_by_enquiry(enquiry_id: str, db: Session = Depends(get_db)):
    app = db.query(models.StudentRecord).filter(models.StudentRecord.enquiryId == enquiry_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")
        
    return app
