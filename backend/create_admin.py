import argparse
from database import SessionLocal
import models
import auth

def create_admin(email: str, password: str):
    db = SessionLocal()
    try:
        # Check if user already exists
        existing_admin = db.query(models.AdminUser).filter(models.AdminUser.email == email).first()
        if existing_admin:
            print(f"Error: Admin user with email '{email}' already exists.")
            return

        # Create new admin
        new_admin = models.AdminUser(
            email=email,
            hashed_password=auth.get_password_hash(password)
        )
        db.add(new_admin)
        db.commit()
        print(f"Success: Admin user '{email}' created successfully.")
    except Exception as e:
        db.rollback()
        print(f"Failed to create admin user: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Create a new admin user for the KNCET portal.")
    parser.add_argument("--email", required=True, help="Email address for the new admin")
    parser.add_argument("--password", required=True, help="Password for the new admin")
    
    args = parser.parse_args()
    create_admin(args.email, args.password)
