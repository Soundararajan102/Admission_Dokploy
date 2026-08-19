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

frontend_url = settings.FRONTEND_URL.rstrip('/')
if frontend_url == "*":
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[frontend_url, f"{frontend_url}/"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

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

from sqlalchemy import text

from fastapi import FastAPI, Depends, HTTPException, status, Response

@app.get("/health", tags=["system"])
def health_check(response: Response, db: Session = Depends(get_db)):
    try:
        # Perform a simple query to check database connectivity
        db.execute(text("SELECT 1"))
        db_status = "healthy"
    except Exception as e:
        db_status = "unhealthy"
        
    if db_status != "healthy":
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
    
    return {
        "status": "healthy" if db_status == "healthy" else "unhealthy",
        "database": db_status,
        "message": "Backend is running flawlessly" if db_status == "healthy" else "Database connection failed"
    }
