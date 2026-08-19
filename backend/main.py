import os
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timedelta

import models, schemas, auth
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="KNCET Admission API")

from config import settings

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL], # Secure production origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def create_initial_admin():
    # Helper to create an initial admin if none exists (for dev purposes)
    print("Initial admin user created or already exists")
    db = next(get_db())
    admin = db.query(models.AdminUser).first()
    if not admin:
        new_admin = models.AdminUser(
            email="admin@kncet.com",
            hashed_password=auth.get_password_hash("admin")
        )
        db.add(new_admin)
        db.commit()

@app.post("/api/login")
def login(user_credentials: schemas.AdminUserLogin, db: Session = Depends(get_db)):
    user = db.query(models.AdminUser).filter(models.AdminUser.email == user_credentials.email).first()
    
    if not user or not auth.verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    
    return {"access_token": access_token, "token_type": "bearer", "user": {"email": user.email}}

@app.get("/api/me", response_model=schemas.AdminUserResponse)
def read_users_me(current_user: models.AdminUser = Depends(auth.get_current_user)):
    return current_user

# Include routes
from routes import router as applications_router
app.include_router(applications_router)
