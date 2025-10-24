from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session, select
from sqlalchemy import func, or_, and_
from sqlalchemy.orm import selectinload
from database import get_session, create_db_and_tables, engine
from models import *
from schemas import *
from schemas import PasswordChangeRequest
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
import uvicorn
from typing import List, Optional
import os
import shutil
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def parse_datetime_field(value, field_name):
    """Helper function to parse datetime fields from string to datetime object"""
    if isinstance(value, str):
        try:
            # Handle ISO format with Z suffix
            if value.endswith('Z'):
                value = value.replace('Z', '+00:00')
            # Parse ISO format date string to datetime
            return datetime.fromisoformat(value)
        except (ValueError, AttributeError) as e:
            print(f"Error parsing {field_name}: {e}")
            return None
    return value
from mock_data import *

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT settings
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# File upload settings
MAX_UPLOAD_SIZE = int(os.getenv("MAX_UPLOAD_SIZE", 500 * 1024 * 1024))  # Default 500MB

# Security
security = HTTPBearer()

# Create FastAPI app
app = FastAPI(
    title="Coaching Center Management System",
    description="A comprehensive management system for coaching centers",
    version="1.0.0"
)

# Configure for large file uploads
from fastapi.middleware.trustedhost import TrustedHostMiddleware

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables on startup
@app.on_event("startup")
def startup_event():
    create_db_and_tables()
    
    # Initialize default admin creation code if it doesn't exist
    session = Session(engine)
    try:
        existing_code = session.exec(
            select(AdminCreationCode).where(AdminCreationCode.code == "illusion")
        ).first()
        
        if not existing_code:
            default_code = AdminCreationCode(code="illusion", is_active=True)
            session.add(default_code)
            session.commit()
            print("Default admin creation code 'illusion' initialized")
    except Exception as e:
        print(f"Error initializing default admin creation code: {e}")
    finally:
        session.close()

# Utility functions
def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security), session: Session = Depends(get_session)) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = session.exec(select(User).where(User.username == username)).first()
    if user is None:
        raise credentials_exception
    return user

def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user

# Role-based authorization dependencies
def require_admin(current_user: User = Depends(get_current_active_user)) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

def require_teacher(current_user: User = Depends(get_current_active_user)) -> User:
    if current_user.role != UserRole.TEACHER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Teacher access required"
        )
    return current_user

def require_student(current_user: User = Depends(get_current_active_user)) -> User:
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student access required"
        )
    return current_user

def require_teacher_or_admin(current_user: User = Depends(get_current_active_user)) -> User:
    if current_user.role not in [UserRole.TEACHER, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Teacher or Admin access required"
        )
    return current_user

def require_student_or_teacher(current_user: User = Depends(get_current_active_user)) -> User:
    if current_user.role not in [UserRole.STUDENT, UserRole.TEACHER]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Student or Teacher access required"
        )
    return current_user

def validate_student_access(student_id: int, current_user: User, session: Session) -> User:
    """Validate that the current user can access the specified student's data"""
    if current_user.role == UserRole.ADMIN:
        return current_user  # Admins can access any student data
    elif current_user.role == UserRole.TEACHER:
        return current_user  # Teachers can access any student data (for now)
    elif current_user.role == UserRole.STUDENT:
        # Students can only access their own data
        student = session.get(Student, student_id)
        if not student or student.user_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You can only view your own data."
            )
        return current_user
    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )

def generate_roll_number_for_class(class_id: int, session: Session) -> str:
    """Generate a unique roll number for a student in a specific class"""
    # Find the next available roll number for this class
    existing_roll_numbers = session.exec(
        select(Student.roll_number).where(Student.class_id == class_id)
    ).all()
    
    # Extract numeric parts from existing roll numbers
    existing_nums = []
    for roll_num in existing_roll_numbers:
        if roll_num:
            # Extract numbers from roll number (e.g., "STU001" -> 1)
            num_part = ''.join(filter(str.isdigit, str(roll_num)))
            if num_part:
                try:
                    existing_nums.append(int(num_part))
                except ValueError:
                    pass
    
    # Generate next roll number
    next_num = max(existing_nums) + 1 if existing_nums else 1
    roll_number = f"STU{next_num:03d}"  # Format as STU001, STU002, etc.
    
    # Double-check roll number doesn't exist
    existing_student = session.exec(select(Student).where(Student.roll_number == roll_number)).first()
    while existing_student:
        next_num += 1
        roll_number = f"STU{next_num:03d}"
        existing_student = session.exec(select(Student).where(Student.roll_number == roll_number)).first()
    
    return roll_number

def generate_secure_password() -> str:
    """Generate a secure random password"""
    import random
    import string
    letters = ''.join(random.choices(string.ascii_letters, k=4))
    numbers = ''.join(random.choices(string.digits, k=4))
    return letters + numbers

# Helper function for generating student credentials
def generate_student_credentials(full_name: str, class_id: int, session: Session) -> dict:
    """Generate consistent username, password, and roll number for a student"""
    # Generate roll number for the class
    # Find the next available roll number for this class
    existing_roll_numbers = session.exec(
        select(Student.roll_number).where(Student.class_id == class_id)
    ).all()
    
    # Extract numeric parts from existing roll numbers
    existing_nums = []
    for roll_num in existing_roll_numbers:
        # Extract numbers from roll number (e.g., "STU001" -> 1)
        num_part = ''.join(filter(str.isdigit, str(roll_num)))
        if num_part:
            try:
                existing_nums.append(int(num_part))
            except ValueError:
                pass
    
    # Generate next roll number
    next_num = max(existing_nums) + 1 if existing_nums else 1
    roll_number = f"STU{next_num:03d}"  # Format as STU001, STU002, etc.
    
    # Double-check roll number doesn't exist
    existing_student = session.exec(select(Student).where(Student.roll_number == roll_number)).first()
    while existing_student:
        next_num += 1
        roll_number = f"STU{next_num:03d}"
        existing_student = session.exec(select(Student).where(Student.roll_number == roll_number)).first()
    
    # Generate username
    # Use first 3 letters of first name + first letter of last name + roll number
    name_parts = full_name.strip().split()
    if len(name_parts) >= 2:
        first_name = name_parts[0].lower()[:3]
        last_name_initial = name_parts[-1].lower()[:1]
        base_username = f"{first_name}{last_name_initial}{next_num:03d}"
    else:
        # If only one name, use first 4 letters + roll number
        first_name = name_parts[0].lower()[:4] if name_parts else "stud"
        base_username = f"{first_name}{next_num:03d}"
    
    # Ensure username is unique
    username = base_username
    counter = 1
    existing_user = session.exec(select(User).where(User.username == username)).first()
    while existing_user:
        username = f"{base_username}{counter}"
        existing_user = session.exec(select(User).where(User.username == username)).first()
        counter += 1
    
    # Generate password (8 characters: 4 letters + 4 numbers)
    import random
    import string
    letters = ''.join(random.choices(string.ascii_letters, k=4))
    numbers = ''.join(random.choices(string.digits, k=4))
    password = letters + numbers
    
    return {
        "username": username,
        "password": password,
        "roll_number": roll_number
    }

# Root endpoint
@app.get("/", tags=["System"])
def read_root():
    return {"message": "Coaching Center Management System API", "version": "1.0.0"}

# Health check
@app.get("/health", tags=["System"])
def health_check():
    return {"status": "healthy"}

# Authentication endpoints
@app.post("/auth/login", response_model=LoginResponse, tags=["Authentication"])
def login(login_data: LoginRequest, session: Session = Depends(get_session)):
    user = authenticate_user(login_data.username, login_data.password, session)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    
    # Get additional user data based on role
    user_data = {
        "id": user.id,
        "username": user.username,
        "email": user.email,
        "full_name": user.full_name,
        "phone": user.phone,
        "photo_path": user.photo_path,
        "photo_url": user.photo_url,
        "role": user.role,
        "is_active": user.is_active
    }
    
    # Add role-specific data
    if user.role == UserRole.STUDENT and user.student:
        user_data["student_id"] = user.student.id
        user_data["roll_number"] = user.student.roll_number
        user_data["class_id"] = user.student.class_id
    elif user.role == UserRole.TEACHER and user.teacher:
        user_data["teacher_id"] = user.teacher.id
        user_data["employee_id"] = user.teacher.employee_id
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user": user_data
    }

@app.get("/auth/me", response_model=UserRead, tags=["Authentication"])
def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user

@app.post("/auth/logout", tags=["Authentication"])
def logout():
    # Since JWT tokens are stateless, logout is handled on the frontend by removing the token
    return {"message": "Successfully logged out"}

# Admin endpoints for user management
@app.post("/admin/users", response_model=UserRead, tags=["Admin - Users"])
def create_user(
    user: UserCreate, 
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    # Check if username already exists
    statement = select(User).where(User.username == user.username)
    existing_user = session.exec(statement).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Username already registered"
        )
    
    # If email is provided, check if it already exists
    if user.email:
        email_check = session.exec(select(User).where(User.email == user.email)).first()
        if email_check:
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    user_data = user.dict(exclude={'password'})
    db_user = User(**user_data, password_hash=hashed_password)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    return db_user

@app.get("/admin/users", response_model=List[UserRead], tags=["Admin - Users"])
def get_users(
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    statement = select(User).offset(skip).limit(limit)
    users = session.exec(statement).all()
    return users

@app.get("/admin/users/{user_id}", response_model=UserRead, tags=["Admin - Users"])
def get_user(
    user_id: int, 
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.post("/users/{user_id}/photo", response_model=UserRead, tags=["Users - Photos"])
def upload_user_photo(
    user_id: int,
    photo_data: dict,  # Changed from file upload to Cloudinary data
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """Upload a photo for a user. Users can upload their own photo, admins can upload for anyone."""
    # Check permissions
    if current_user.role != UserRole.ADMIN and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Access denied. You can only upload your own photo.")

    # Get the user
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Validate Cloudinary data
    if not photo_data.get('file_url') or not photo_data.get('file_path'):
        raise HTTPException(status_code=400, detail="Invalid photo data. file_url and file_path are required.")

    # Delete old photo if exists (from Cloudinary)
    if user.photo_path and user.photo_path.startswith('science-point/'):
        try:
            # Note: We can't actually delete from Cloudinary here since we don't have the API key
            # The frontend should handle Cloudinary deletion
            print(f"Old photo should be deleted from Cloudinary: {user.photo_path}")
        except Exception as e:
            print(f"Warning: Failed to delete old photo from Cloudinary: {e}")

    # Update user with new photo data - store Cloudinary public ID and URL
    user.photo_path = photo_data['file_path']  # Cloudinary public ID
    user.photo_url = photo_data['file_url']    # Cloudinary URL

    session.add(user)
    session.commit()
    session.refresh(user)

    return user

@app.delete("/users/{user_id}/photo", tags=["Users - Photos"])
def delete_user_photo(
    user_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a user's photo. Users can delete their own photo, admins can delete anyone's."""
    # Check permissions
    if current_user.role != UserRole.ADMIN and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Access denied. You can only delete your own photo.")

    # Get the user
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not user.photo_path:
        raise HTTPException(status_code=404, detail="User has no photo to delete")

    # Note: Cloudinary deletion should be handled by the frontend
    # since we don't have Cloudinary API key in backend

    # Remove photo data from user
    user.photo_path = None
    user.photo_url = None
    session.add(user)
    session.commit()

    return {"message": "Photo deleted successfully"}

# Student management
@app.post("/admin/students", response_model=StudentRead, tags=["Admin - Students"])
def create_student(
    student: StudentCreate, 
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    # Auto-generate roll number if not provided
    roll_number = student.roll_number
    if not roll_number:
        # Generate roll number based on class
        roll_number = generate_roll_number_for_class(student.class_id, session)
    
    # Use roll number as username
    username = roll_number
    
    # Check if username already exists
    existing_user = session.exec(select(User).where(User.username == username)).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail=f"Username '{username}' already exists. Roll number must be unique."
        )
    
    # Check if email is provided and already exists
    if student.user.email:
        email_check = session.exec(select(User).where(User.email == student.user.email)).first()
        if email_check:
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )
    
    # Auto-generate password if not provided
    password = student.user.password or generate_secure_password()
    
    # Create user account
    hashed_password = get_password_hash(password)
    db_user = User(
        username=username,
        email=student.user.email,
        full_name=student.user.full_name,
        phone=student.user.phone,
        role=UserRole.STUDENT,
        password_hash=hashed_password
    )
    session.add(db_user)
    session.flush()  # Flush to get the user ID
    
    # Create student record
    student_dict = student.dict(exclude={'user', 'roll_number'})
    db_student = Student(**student_dict, user_id=db_user.id, roll_number=roll_number)
    session.add(db_student)
    session.commit()
    session.refresh(db_student)
    
    # Return student with generated credentials
    # Note: In a real implementation, you'd want to return the plain password only once for security
    return db_student

@app.get("/admin/students", response_model=List[StudentRead], tags=["Admin - Students"])
def get_all_students(
    skip: int = 0, 
    limit: int = 100, 
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    statement = select(Student).offset(skip).limit(limit)
    students = session.exec(statement).all()
    
    # Load user relationships
    for student in students:
        if student.user_id:
            user = session.get(User, student.user_id)
            student.user = user
    
    return students

@app.get("/admin/students/{student_id}", response_model=StudentRead, tags=["Admin - Students"])
def get_student(
    student_id: int, 
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    student = session.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

@app.put("/admin/students/{student_id}", response_model=StudentRead, tags=["Admin - Students"])
def update_student(
    student_id: int, 
    student_update: StudentUpdate, 
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    # Get existing student
    db_student = session.get(Student, student_id)
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Update user information if provided
    if student_update.user:
        db_user = session.get(User, db_student.user_id)
        if db_user:
            user_data = student_update.user.dict(exclude_unset=True)
            for field, value in user_data.items():
                setattr(db_user, field, value)
    
    # Update student information
    student_data = student_update.dict(exclude={'user'}, exclude_unset=True)
    datetime_fields = ['date_of_birth', 'admission_date']
    
    for field, value in student_data.items():
        # Handle datetime field conversion from string to datetime
        if field in datetime_fields:
            value = parse_datetime_field(value, field)
            if value is None:
                continue  # Skip field if parsing failed
        setattr(db_student, field, value)
    
    session.add(db_student)
    session.commit()
    session.refresh(db_student)
    return db_student

@app.delete("/admin/students/{student_id}", tags=["Admin - Students"])
def delete_student(
    student_id: int, 
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    # Get existing student
    db_student = session.get(Student, student_id)
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Delete related user as well
    db_user = session.get(User, db_student.user_id)
    
    # Delete student first (due to foreign key constraints)
    session.delete(db_student)
    
    # Then delete user if it exists
    if db_user:
        session.delete(db_user)
    
    session.commit()
    return {"message": "Student deleted successfully"}

@app.patch("/admin/students/{student_id}/password", tags=["Admin - Students"])
def update_student_password(
    student_id: int, 
    password_data: PasswordUpdate, 
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    # Get existing student
    db_student = session.get(Student, student_id)
    if not db_student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Update user password
    db_user = session.get(User, db_student.user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Hash new password and update
    db_user.password_hash = get_password_hash(password_data.password)
    session.add(db_user)
    session.commit()
    
    return {"message": "Password updated successfully"}

# Teacher management
@app.post("/admin/teachers", response_model=TeacherRead, tags=["Admin - Teachers"])
def create_teacher(
    teacher: TeacherCreate, 
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    # First create the user
    user_data = teacher.user
    user_dict = user_data.dict(exclude={'password'})
    db_user = User(
        **user_dict,
        password_hash=get_password_hash(user_data.password)
        # role is already included in user_dict from frontend
    )
    session.add(db_user)
    session.flush()
    
    # Then create the teacher
    teacher_dict = teacher.dict(exclude={'user'})
    db_teacher = Teacher(**teacher_dict, user_id=db_user.id)
    session.add(db_teacher)
    session.commit()
    session.refresh(db_teacher)
    return db_teacher

@app.get("/admin/teachers", response_model=List[TeacherRead], tags=["Admin - Teachers"])
def get_all_teachers(
    skip: int = 0, 
    limit: int = 100, 
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    statement = select(Teacher).offset(skip).limit(limit)
    teachers = session.exec(statement).all()
    
    # Load user relationships
    for teacher in teachers:
        if teacher.user_id:
            user = session.get(User, teacher.user_id)
            teacher.user = user
    
    return teachers

@app.put("/admin/teachers/{teacher_id}", response_model=TeacherRead, tags=["Admin - Teachers"])
def update_teacher(
    teacher_id: int, 
    teacher_update: TeacherUpdate, 
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    # Get existing teacher
    db_teacher = session.get(Teacher, teacher_id)
    if not db_teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    # Update user information if provided
    if teacher_update.user:
        db_user = session.get(User, db_teacher.user_id)
        if db_user:
            user_data = teacher_update.user.dict(exclude_unset=True)
            for field, value in user_data.items():
                setattr(db_user, field, value)
    
    # Update teacher information
    teacher_data = teacher_update.dict(exclude={'user'}, exclude_unset=True)
    datetime_fields = ['joining_date']
    
    for field, value in teacher_data.items():
        # Handle datetime field conversion from string to datetime
        if field in datetime_fields:
            value = parse_datetime_field(value, field)
            if value is None:
                continue  # Skip field if parsing failed
        setattr(db_teacher, field, value)
    
    session.add(db_teacher)
    session.commit()
    session.refresh(db_teacher)
    return db_teacher

@app.delete("/admin/teachers/{teacher_id}", tags=["Admin - Teachers"])
def delete_teacher(
    teacher_id: int, 
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    # Get existing teacher
    db_teacher = session.get(Teacher, teacher_id)
    if not db_teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    # Get associated user
    db_user = session.get(User, db_teacher.user_id)
    
    # Delete teacher first (due to foreign key constraint)
    session.delete(db_teacher)
    
    # Then delete user if exists
    if db_user:
        session.delete(db_user)
    
    session.commit()
    return {"message": "Teacher deleted successfully"}

@app.patch("/admin/teachers/{teacher_id}/password", tags=["Admin - Teachers"])
def update_teacher_password(
    teacher_id: int, 
    password_update: PasswordUpdate, 
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    # Get existing teacher
    db_teacher = session.get(Teacher, teacher_id)
    if not db_teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    # Get associated user
    db_user = session.get(User, db_teacher.user_id)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update password
    db_user.password_hash = get_password_hash(password_update.password)
    session.add(db_user)
    session.commit()
    
    return {"message": "Password updated successfully"}

# Class management
@app.post("/admin/classes", response_model=ClassRead, tags=["Admin - Classes"])
def create_class(
    class_data: ClassCreate, 
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    db_class = Class(**class_data.dict())
    session.add(db_class)
    session.commit()
    session.refresh(db_class)
    return db_class

@app.get("/admin/classes", response_model=List[ClassRead], tags=["Admin - Classes"])
def get_all_classes(
    session: Session = Depends(get_session),
    current_user: User = Depends(require_teacher_or_admin)
):
    statement = select(Class)
    classes = session.exec(statement).all()
    return classes

@app.put("/admin/classes/{class_id}", response_model=ClassRead, tags=["Admin - Classes"])
def update_class(
    class_id: int, 
    class_data: ClassCreate, 
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    # Get the existing class
    statement = select(Class).where(Class.id == class_id)
    db_class = session.exec(statement).first()
    
    if not db_class:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Update class fields
    update_data = class_data.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_class, key, value)
    
    session.add(db_class)
    session.commit()
    session.refresh(db_class)
    return db_class

@app.delete("/admin/classes/{class_id}", tags=["Admin - Classes"])
def delete_class(
    class_id: int, 
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    # Get the existing class
    statement = select(Class).where(Class.id == class_id)
    db_class = session.exec(statement).first()
    
    if not db_class:
        raise HTTPException(status_code=404, detail="Class not found")
    
    # Check if class has students assigned
    students_count = session.exec(
        select(func.count(Student.id)).where(Student.class_id == class_id)
    ).first()
    
    if students_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete class. {students_count} student(s) are currently assigned to this class."
        )
    
    # Check if class has subjects assigned
    subjects_count = session.exec(
        select(func.count(Subject.id)).where(Subject.class_id == class_id)
    ).first()
    
    if subjects_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete class. {subjects_count} subject(s) are currently assigned to this class."
        )
    
    # Delete the class
    session.delete(db_class)
    session.commit()
    return {"message": "Class deleted successfully"}

# Subject management
@app.post("/admin/subjects", tags=["Admin - Subjects"], response_model=SubjectRead)
def create_subject(
    subject: SubjectCreate, 
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    # Auto-generate subject code if not provided
    subject_data = subject.dict()
    if not subject_data.get('code'):
        # Generate code based on subject name (first 3 letters + random number)
        name_part = subject.name[:3].upper().replace(' ', '')
        # Get the next available number for this code pattern
        existing_codes = session.exec(
            select(Subject.code).where(Subject.code.like(f"{name_part}%"))
        ).all()
        existing_codes = [code for code in existing_codes if code]
        
        # Extract numbers from existing codes
        numbers = []
        for code in existing_codes:
            try:
                num_part = code[len(name_part):]
                if num_part.isdigit():
                    numbers.append(int(num_part))
            except:
                pass
        
        next_num = max(numbers) + 1 if numbers else 1
        subject_data['code'] = f"{name_part}{next_num:02d}"
    
    db_subject = Subject(**subject_data)
    session.add(db_subject)
    session.commit()
    session.refresh(db_subject)
    return db_subject

@app.get("/admin/subjects", tags=["Admin - Subjects"], response_model=List[SubjectRead])
def get_all_subjects(
    session: Session = Depends(get_session),
    current_user: User = Depends(require_teacher_or_admin)
):
    statement = select(Subject)
    subjects = session.exec(statement).all()
    return subjects

@app.put("/admin/subjects/{subject_id}", tags=["Admin - Subjects"], response_model=SubjectRead)
def update_subject(
    subject_id: int, 
    subject_update: SubjectCreate, 
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    # Get existing subject
    db_subject = session.get(Subject, subject_id)
    if not db_subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    # Update the subject
    subject_data = subject_update.dict(exclude_unset=True)
    for field, value in subject_data.items():
        setattr(db_subject, field, value)
    
    session.add(db_subject)
    session.commit()
    session.refresh(db_subject)
    return db_subject

@app.delete("/admin/subjects/{subject_id}", tags=["Admin - Subjects"], response_model=dict)
def delete_subject(
    subject_id: int, 
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    # Get existing subject
    db_subject = session.get(Subject, subject_id)
    if not db_subject:
        raise HTTPException(status_code=404, detail="Subject not found")
    
    # Check if subject has exams assigned
    exams_count = session.exec(
        select(func.count(Exam.id)).where(Exam.subject_id == subject_id)
    ).first()
    
    if exams_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete subject. {exams_count} exam(s) are currently assigned to this subject."
        )
    
    # Check if subject has study materials assigned
    materials_count = session.exec(
        select(func.count(StudyMaterial.id)).where(StudyMaterial.subject_id == subject_id)
    ).first()
    
    if materials_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete subject. {materials_count} study material(s) are currently assigned to this subject."
        )
    
    # Check if subject has class schedules assigned
    schedules_count = session.exec(
        select(func.count(ClassSchedule.id)).where(ClassSchedule.subject_id == subject_id)
    ).first()
    
    if schedules_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete subject. {schedules_count} class schedule(s) are currently assigned to this subject."
        )
    
    # Delete the subject
    session.delete(db_subject)
    session.commit()
    return {"message": "Subject deleted successfully"}

# Attendance management
@app.post("/admin/attendance", tags=["Admin - Attendance"], response_model=AttendanceRead)
def mark_attendance(
    attendance: AttendanceCreate, 
    session: Session = Depends(get_session),
    current_user: User = Depends(require_teacher_or_admin)
):
    # Check if attendance already exists for this student on this date
    statement = select(Attendance).where(
        Attendance.student_id == attendance.student_id,
        func.date(Attendance.date) == attendance.date.date()
    )
    existing = session.exec(statement).first()
    
    if existing:
        raise HTTPException(
            status_code=400,
            detail="Attendance already marked for this student today"
        )
    
    db_attendance = Attendance(**attendance.dict())
    session.add(db_attendance)
    session.commit()
    session.refresh(db_attendance)
    return db_attendance

@app.put("/admin/attendance/{attendance_id}", tags=["Admin - Attendance"], response_model=AttendanceRead)
def update_attendance(
    attendance_id: int, 
    attendance_update: AttendanceCreate, 
    session: Session = Depends(get_session),
    current_user: User = Depends(require_teacher_or_admin)
):
    # Get existing attendance record
    db_attendance = session.get(Attendance, attendance_id)
    if not db_attendance:
        raise HTTPException(status_code=404, detail="Attendance record not found")
    
    # Update the attendance record
    attendance_data = attendance_update.dict(exclude_unset=True)
    for field, value in attendance_data.items():
        setattr(db_attendance, field, value)
    
    session.add(db_attendance)
    session.commit()
    session.refresh(db_attendance)
    return db_attendance

@app.get("/admin/attendance", tags=["Admin - Attendance"], response_model=List[AttendanceRead])
def get_attendance(
    class_id: int = None,
    student_id: int = None,
    date: str = None,
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session)
):
    statement = select(Attendance)
    if class_id:
        statement = statement.where(Attendance.class_id == class_id)
    if student_id:
        statement = statement.where(Attendance.student_id == student_id)
    if date:
        from datetime import datetime
        parsed_date = datetime.fromisoformat(date.replace('Z', '+00:00'))
        statement = statement.where(func.date(Attendance.date) == parsed_date.date())
    
    statement = statement.offset(skip).limit(limit)
    attendance = session.exec(statement).all()
    return attendance

# Exam management
@app.post("/admin/exams", tags=["Admin - Exams"], response_model=ExamRead)
def create_exam(
    exam: ExamCreate, 
    session: Session = Depends(get_session),
    current_user: User = Depends(require_teacher_or_admin)
):
    db_exam = Exam(**exam.dict())
    session.add(db_exam)
    session.commit()
    session.refresh(db_exam)
    return db_exam

@app.get("/admin/exams", tags=["Admin - Exams"], response_model=List[ExamRead])
def get_all_exams(
    session: Session = Depends(get_session),
    current_user: User = Depends(require_teacher_or_admin)
):
    statement = select(Exam)
    exams = session.exec(statement).all()
    return exams

@app.put("/admin/exams/{exam_id}", tags=["Admin - Exams"], response_model=ExamRead)
def update_exam(
    exam_id: int,
    exam_update: ExamUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_teacher_or_admin)
):
    # Get existing exam
    db_exam = session.get(Exam, exam_id)
    if not db_exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Update exam fields
    update_data = exam_update.dict(exclude_unset=True)
    datetime_fields = ['exam_date']
    
    for field, value in update_data.items():
        # Handle datetime field conversion from string to datetime
        if field in datetime_fields:
            value = parse_datetime_field(value, field)
            if value is None:
                continue  # Skip field if parsing failed
        setattr(db_exam, field, value)
    
    session.add(db_exam)
    session.commit()
    session.refresh(db_exam)
    return db_exam

@app.delete("/admin/exams/{exam_id}", tags=["Admin - Exams"])
def delete_exam(
    exam_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_teacher_or_admin)
):
    # Get existing exam
    db_exam = session.get(Exam, exam_id)
    if not db_exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Check if exam has results
    results_count = session.exec(
        select(func.count(ExamResult.id)).where(ExamResult.exam_id == exam_id)
    ).first()
    
    if results_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete exam. {results_count} result(s) are already recorded for this exam."
        )
    
    # Delete the exam
    session.delete(db_exam)
    session.commit()
    return {"message": "Exam deleted successfully"}

# Exam results
@app.post("/admin/exam-results", tags=["Admin - Exam Results"], response_model=ExamResultRead)
def create_exam_result(result: ExamResultCreate, session: Session = Depends(get_session), current_user: User = Depends(require_teacher_or_admin)):
    # Check if result already exists for this student-exam combination
    existing_result = session.exec(
        select(ExamResult).where(
            ExamResult.exam_id == result.exam_id,
            ExamResult.student_id == result.student_id
        )
    ).first()
    
    if existing_result:
        raise HTTPException(
            status_code=400,
            detail="Exam result already exists for this student. Use update instead."
        )
    
    # Validate exam exists
    exam = session.get(Exam, result.exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    # Validate student exists
    student = session.get(Student, result.student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Validate marks don't exceed maximum
    if result.marks_obtained > exam.max_marks:
        raise HTTPException(
            status_code=400,
            detail=f"Marks obtained ({result.marks_obtained}) cannot exceed maximum marks ({exam.max_marks})"
        )
    
    # Auto-calculate grade based on percentage if not provided
    grade = getattr(result, 'grade', None)
    if grade is None:
        percentage = (result.marks_obtained / exam.max_marks) * 100
        if percentage >= 80:
            grade = "5.00 (A+)"
        elif percentage >= 70:
            grade = "4.00 (A)"
        elif percentage >= 60:
            grade = "3.50 (A-)"
        elif percentage >= 50:
            grade = "3.00 (B)"
        elif percentage >= 40:
            grade = "2.00 (C)"
        elif percentage >= 33:
            grade = "1.00 (D)"
        else:
            grade = "0.00 (F)"
    
    try:
        db_result = ExamResult(
            exam_id=result.exam_id,
            student_id=result.student_id,
            marks_obtained=result.marks_obtained,
            remarks=result.remarks,
            grade=grade
        )
        session.add(db_result)
        session.commit()
        session.refresh(db_result)
        return db_result
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Failed to create exam result: {str(e)}"
        )

@app.get("/admin/exam-results", tags=["Admin - Exam Results"], response_model=List[ExamResultRead])
def get_exam_results(
    exam_id: int = None,
    student_id: int = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_teacher_or_admin)
):
    statement = select(ExamResult)
    if exam_id:
        statement = statement.where(ExamResult.exam_id == exam_id)
    if student_id:
        statement = statement.where(ExamResult.student_id == student_id)
    
    results = session.exec(statement).all()
    return results

@app.put("/admin/exam-results/{result_id}", tags=["Admin - Exam Results"], response_model=ExamResultRead)
def update_exam_result(result_id: int, result_update: ExamResultUpdate, session: Session = Depends(get_session), current_user: User = Depends(require_teacher_or_admin)):
    # Get existing result
    db_result = session.get(ExamResult, result_id)
    if not db_result:
        raise HTTPException(status_code=404, detail="Exam result not found")
    
    # Validate marks don't exceed maximum if marks are being updated
    if result_update.marks_obtained is not None:
        exam = session.get(Exam, db_result.exam_id)
        if exam and result_update.marks_obtained > exam.max_marks:
            raise HTTPException(
                status_code=400,
                detail="Marks obtained cannot exceed maximum marks"
            )
        
        # Auto-calculate grade based on new marks if grade not explicitly provided
        if result_update.grade is None:
            percentage = (result_update.marks_obtained / exam.max_marks) * 100
            if percentage >= 80:
                result_update.grade = "5.00 (A+)"
            elif percentage >= 70:
                result_update.grade = "4.00 (A)"
            elif percentage >= 60:
                result_update.grade = "3.50 (A-)"
            elif percentage >= 50:
                result_update.grade = "3.00 (B)"
            elif percentage >= 40:
                result_update.grade = "2.00 (C)"
            elif percentage >= 33:
                result_update.grade = "1.00 (D)"
            else:
                result_update.grade = "0.00 (F)"
    
    # Update the result
    result_data = result_update.dict(exclude_unset=True)
    for field, value in result_data.items():
        setattr(db_result, field, value)
    
    session.add(db_result)
    session.commit()
    session.refresh(db_result)
    return db_result

# Study materials
@app.post("/admin/study-materials", tags=["Admin - Study Materials"], response_model=StudyMaterialRead)
def create_study_material(
    material: StudyMaterialCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_teacher_or_admin)
):
    db_material = StudyMaterial(
        **material.dict(),
        created_by_id=current_user.id
    )
    session.add(db_material)
    session.commit()
    session.refresh(db_material)
    return db_material

@app.get("/admin/study-materials", tags=["Admin - Study Materials"], response_model=List[StudyMaterialRead])
def get_study_materials(
    subject_id: int = None,
    session: Session = Depends(get_session)
):
    statement = select(StudyMaterial)
    if subject_id:
        statement = statement.where(StudyMaterial.subject_id == subject_id)
    
    materials = session.exec(statement).all()
    return materials

# Notices
@app.post("/admin/notices", tags=["Admin - Notices"], response_model=NoticeRead)
def create_notice(
    notice: NoticeCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    db_notice = Notice(
        **notice.dict(),
        created_by_id=current_user.id
    )
    session.add(db_notice)
    session.commit()
    session.refresh(db_notice)
    return db_notice

@app.get("/admin/notices", tags=["Admin - Notices"], response_model=List[NoticeRead])
def get_notices(
    target_role: UserRole = None,
    active_only: bool = True,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_teacher_or_admin)
):
    statement = select(Notice)
    
    # If user is a teacher, they can only see notices targeted at teachers or general notices
    if current_user.role == "teacher":
        statement = statement.where(
            (Notice.target_role == "teacher") | (Notice.target_role == None)
        )
    elif target_role:
        statement = statement.where(Notice.target_role == target_role)
    
    if active_only:
        statement = statement.where(Notice.is_active == True)
    
    statement = statement.order_by(Notice.created_at.desc())
    notices = session.exec(statement).all()
    return notices

# Public notices endpoint (no authentication required)
@app.get("/public/notices", tags=["Public"], response_model=List[NoticeRead])
def get_public_notices(
    session: Session = Depends(get_session)
):
    """Get public notices for display on landing page and public areas"""
    statement = select(Notice).where(
        Notice.is_active == True,
        Notice.show_on_landing == True,
        # Check if notice hasn't expired
        or_(
            Notice.expires_at.is_(None),
            Notice.expires_at > datetime.utcnow()
        )
    ).order_by(Notice.created_at.desc())
    notices = session.exec(statement).all()
    return notices

# Public classes endpoint (no authentication required)
@app.get("/public/classes", tags=["Public"], response_model=List[ClassRead])
def get_public_classes(
    session: Session = Depends(get_session)
):
    """Get all available classes for public admission forms"""
    statement = select(Class)
    classes = session.exec(statement).all()
    return classes

# Public admission endpoint (no authentication required)
@app.post("/public/admission", tags=["Public"], response_model=AdmissionRequestRead)
def submit_admission_request(
    admission: AdmissionRequestCreate,
    session: Session = Depends(get_session)
):
    """Allow prospective students to submit admission requests"""
    # Validate class exists and has capacity
    class_obj = session.get(Class, admission.class_id)
    if not class_obj:
        raise HTTPException(status_code=404, detail="Selected class not found")
    
    # Check current enrollment
    current_students = session.exec(select(Student).where(Student.class_id == admission.class_id)).all()
    if len(current_students) >= class_obj.capacity:
        raise HTTPException(
            status_code=400,
            detail=f"Class {class_obj.name} is at full capacity ({class_obj.capacity} students)"
        )
    
    # If email is provided, check if it already exists
    if admission.email:
        email_check = session.exec(select(User).where(User.email == admission.email)).first()
        if email_check:
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )
    
    # Create the admission request
    db_admission = AdmissionRequest(**admission.dict())
    session.add(db_admission)
    session.commit()
    session.refresh(db_admission)
    return db_admission

@app.put("/admin/notices/{notice_id}", response_model=NoticeRead, tags=["Admin - Notices"])
def update_notice(
    notice_id: int,
    notice_update: NoticeUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    notice = session.get(Notice, notice_id)
    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found")
    
    notice_data = notice_update.model_dump(exclude_unset=True)
    for field, value in notice_data.items():
        setattr(notice, field, value)
    
    session.add(notice)
    session.commit()
    session.refresh(notice)
    return notice

@app.delete("/admin/notices/{notice_id}", tags=["Admin - Notices"])
def delete_notice(
    notice_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    notice = session.get(Notice, notice_id)
    if not notice:
        raise HTTPException(status_code=404, detail="Notice not found")
    
    session.delete(notice)
    session.commit()
    return {"message": "Notice deleted successfully"}

# Class Schedules
@app.post("/admin/class-schedules", tags=["Admin - Schedules"], response_model=ClassScheduleRead)
def create_class_schedule(
    schedule: ClassScheduleCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    # Check for time conflicts
    statement = select(ClassSchedule).where(
        ClassSchedule.day_of_week == schedule.day_of_week,
        ClassSchedule.teacher_id == schedule.teacher_id,
        # Simple time overlap check
        or_(
            and_(
                ClassSchedule.start_time <= schedule.start_time,
                ClassSchedule.end_time > schedule.start_time
            ),
            and_(
                ClassSchedule.start_time < schedule.end_time,
                ClassSchedule.end_time >= schedule.end_time
            )
        )
    )
    existing_schedule = session.exec(statement).first()
    
    if existing_schedule:
        raise HTTPException(
            status_code=400, 
            detail="Teacher already has a class scheduled at this time"
        )
    
    db_schedule = ClassSchedule(**schedule.dict())
    session.add(db_schedule)
    session.commit()
    session.refresh(db_schedule)
    return db_schedule

@app.get("/admin/class-schedules", tags=["Admin - Schedules"], response_model=List[ClassScheduleRead])
def get_class_schedules(
    day_of_week: DayOfWeek = None,
    class_id: int = None,
    teacher_id: int = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    statement = select(ClassSchedule).options(
        selectinload(ClassSchedule.subject),
        selectinload(ClassSchedule.class_assigned),
        selectinload(ClassSchedule.teacher)
    )
    
    if day_of_week:
        statement = statement.where(ClassSchedule.day_of_week == day_of_week)
    if class_id:
        statement = statement.where(ClassSchedule.class_id == class_id)
    if teacher_id:
        statement = statement.where(ClassSchedule.teacher_id == teacher_id)
    
    statement = statement.order_by(ClassSchedule.day_of_week, ClassSchedule.start_time)
    schedules = session.exec(statement).all()
    return schedules

@app.get("/teacher/{teacher_id}/schedule", tags=["Teachers"], response_model=List[ClassScheduleRead])
def get_teacher_schedule(
    teacher_id: int,
    day_of_week: DayOfWeek = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_teacher_or_admin)
):
    # Validate teacher access (teachers can only see their own schedule, admins can see any)
    if current_user.role == "teacher":
        teacher_statement = select(Teacher).where(Teacher.user_id == current_user.id)
        teacher = session.exec(teacher_statement).first()
        if not teacher or teacher.id != teacher_id:
            raise HTTPException(status_code=403, detail="Access denied. You can only view your own schedule.")
    
    statement = select(ClassSchedule).options(
        selectinload(ClassSchedule.subject),
        selectinload(ClassSchedule.class_assigned)
    ).where(ClassSchedule.teacher_id == teacher_id)
    
    if day_of_week:
        statement = statement.where(ClassSchedule.day_of_week == day_of_week)
    
    statement = statement.order_by(ClassSchedule.start_time)
    schedules = session.exec(statement).all()
    return schedules

@app.get("/student/{student_id}/schedule", tags=["Students"], response_model=List[ClassScheduleRead])
def get_student_schedule(
    student_id: int,
    day_of_week: DayOfWeek = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    # Validate access
    validate_student_access(student_id, current_user, session)
    
    # First get the student's class
    student_statement = select(Student).where(Student.id == student_id)
    student = session.exec(student_statement).first()
    
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get schedules for the student's class
    statement = select(ClassSchedule).options(
        selectinload(ClassSchedule.subject),
        selectinload(ClassSchedule.teacher)
    ).where(ClassSchedule.class_id == student.class_id)
    
    if day_of_week:
        statement = statement.where(ClassSchedule.day_of_week == day_of_week)
    
    statement = statement.order_by(ClassSchedule.start_time)
    schedules = session.exec(statement).all()
    return schedules

@app.delete("/admin/class-schedules/{schedule_id}", tags=["Admin - Schedules"])
def delete_class_schedule(
    schedule_id: int,
    session: Session = Depends(get_session)
):
    statement = select(ClassSchedule).where(ClassSchedule.id == schedule_id)
    schedule = session.exec(statement).first()
    
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    
    session.delete(schedule)
    session.commit()
    return {"message": "Schedule deleted successfully"}

# Teacher reviews
@app.post("/admin/teacher-reviews", tags=["Admin - Reviews"], response_model=TeacherReviewRead)
def create_teacher_review(
    review: TeacherReviewCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    # Calculate overall rating
    ratings = [
        review.teaching_quality,
        review.punctuality,
        review.student_engagement
    ]
    valid_ratings = [r for r in ratings if r is not None]
    overall_rating = round(sum(valid_ratings) / len(valid_ratings), 2) if valid_ratings else None
    
    db_review = TeacherReview(
        **review.dict(),
        reviewed_by_id=current_user.id,
        overall_rating=overall_rating
    )
    session.add(db_review)
    session.commit()
    session.refresh(db_review)
    return db_review

@app.get("/admin/teacher-reviews", tags=["Admin - Reviews"], response_model=List[TeacherReviewRead])
def get_teacher_reviews(
    teacher_id: int = None,
    session: Session = Depends(get_session)
):
    statement = select(TeacherReview)
    if teacher_id:
        statement = statement.where(TeacherReview.teacher_id == teacher_id)
    
    statement = statement.order_by(TeacherReview.review_date.desc())
    reviews = session.exec(statement).all()
    return reviews

# Dashboard/Statistics
@app.get("/admin/dashboard", tags=["Admin - Dashboard"], response_model=DashboardStats)
def get_dashboard_stats(session: Session = Depends(get_session)):
    # Count totals using SQLModel
    total_students = len(session.exec(select(Student)).all())
    total_teachers = len(session.exec(select(Teacher)).all())
    total_classes = len(session.exec(select(Class)).all())
    total_subjects = len(session.exec(select(Subject)).all())
    
    # Get recent notices
    statement = select(Notice).where(Notice.is_active == True).order_by(Notice.created_at.desc()).limit(5)
    recent_notices = session.exec(statement).all()
    
    return DashboardStats(
        total_students=total_students,
        total_teachers=total_teachers,
        total_classes=total_classes,
        total_subjects=total_subjects,
        recent_notices=recent_notices
    )

# Data management endpoints

@app.get("/admin/data-stats", tags=["Admin - Data Management"])
def get_data_statistics(session: Session = Depends(get_session)):
    """Get current database statistics"""
    try:
        stats = {
            "users": len(session.exec(select(User)).all()),
            "teachers": len(session.exec(select(Teacher)).all()),
            "students": len(session.exec(select(Student)).all()),
            "classes": len(session.exec(select(Class)).all()),
            "subjects": len(session.exec(select(Subject)).all()),
            "attendance_records": len(session.exec(select(Attendance)).all()),
            "exams": len(session.exec(select(Exam)).all()),
            "exam_results": len(session.exec(select(ExamResult)).all()),
            "study_materials": len(session.exec(select(StudyMaterial)).all()),
            "notices": len(session.exec(select(Notice)).all()),
            "teacher_reviews": len(session.exec(select(TeacherReview)).all())
        }
        
        return {"database_statistics": stats}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error getting statistics: {str(e)}")

# Admin creation code management
@app.post("/admin/create-admin", response_model=UserRead, tags=["Admin - Account Management"])
def create_admin_with_code(
    admin_request: AdminCreationRequest,
    session: Session = Depends(get_session)
):
    """Create an admin user using a valid creation code"""
    # Check if the code exists and is active
    code_record = session.exec(
        select(AdminCreationCode).where(
            AdminCreationCode.code == admin_request.code,
            AdminCreationCode.is_active == True
        )
    ).first()
    
    if not code_record:
        raise HTTPException(
            status_code=400,
            detail="Invalid or inactive admin creation code"
        )
    
    # Check if username or email already exists
    existing_user = session.exec(select(User).where(
        (User.username == admin_request.user.username) | 
        (User.email == admin_request.user.email)
    )).first()
    
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Username or email already registered"
        )
    
    # Create the admin user
    hashed_password = get_password_hash(admin_request.user.password)
    user_data = admin_request.user.dict(exclude={'password'})
    user_data['role'] = "admin"  # Force admin role
    
    db_user = User(**user_data, password_hash=hashed_password)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    
    # Deactivate the code after successful use (one-time use)
    code_record.is_active = False
    session.add(code_record)
    session.commit()
    
    return db_user

@app.get("/admin/creation-codes", response_model=List[AdminCreationCodeRead], tags=["Admin - Account Management"])
def get_admin_creation_codes(
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    """Get all admin creation codes (admin only)"""
    codes = session.exec(select(AdminCreationCode)).all()
    return codes

@app.post("/admin/creation-codes", response_model=AdminCreationCodeRead, tags=["Admin - Account Management"])
def create_admin_creation_code(
    code_data: AdminCreationCodeCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    """Create a new admin creation code (admin only)"""
    # Check if code already exists
    existing_code = session.exec(
        select(AdminCreationCode).where(AdminCreationCode.code == code_data.code)
    ).first()
    
    if existing_code:
        raise HTTPException(
            status_code=400,
            detail="Admin creation code already exists"
        )
    
    db_code = AdminCreationCode(**code_data.dict())
    session.add(db_code)
    session.commit()
    session.refresh(db_code)
    return db_code

@app.put("/admin/creation-codes/{code_id}", response_model=AdminCreationCodeRead, tags=["Admin - Account Management"])
def update_admin_creation_code(
    code_id: int,
    code_update: AdminCreationCodeUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    """Update an admin creation code (admin only)"""
    code_record = session.get(AdminCreationCode, code_id)
    if not code_record:
        raise HTTPException(status_code=404, detail="Admin creation code not found")
    
    # Check if the new code already exists (if different)
    if code_update.code != code_record.code:
        existing_code = session.exec(
            select(AdminCreationCode).where(AdminCreationCode.code == code_update.code)
        ).first()
        if existing_code:
            raise HTTPException(
                status_code=400,
                detail="Admin creation code already exists"
            )
    
    code_record.code = code_update.code
    code_record.updated_at = datetime.utcnow()
    session.add(code_record)
    session.commit()
    session.refresh(code_record)
    return code_record

@app.delete("/admin/creation-codes/{code_id}", tags=["Admin - Account Management"])
def delete_admin_creation_code(
    code_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    """Delete an admin creation code (admin only)"""
    code_record = session.get(AdminCreationCode, code_id)
    if not code_record:
        raise HTTPException(status_code=404, detail="Admin creation code not found")
    
    session.delete(code_record)
    session.commit()
    return {"message": "Admin creation code deleted successfully"}

# Admin admission request management
@app.get("/admin/admission-requests", tags=["Admin - Admissions"], response_model=List[AdmissionRequestRead])
def get_admission_requests(
    status: str = None,
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    """Get all admission requests (admin only)"""
    statement = select(AdmissionRequest).options(
        selectinload(AdmissionRequest.class_assigned),
        selectinload(AdmissionRequest.reviewed_by)
    )
    
    if status:
        statement = statement.where(AdmissionRequest.status == status)
    
    statement = statement.order_by(AdmissionRequest.created_at.desc())
    requests = session.exec(statement.offset(skip).limit(limit)).all()
    return requests

@app.get("/admin/admission-requests/{request_id}", tags=["Admin - Admissions"], response_model=AdmissionRequestRead)
def get_admission_request(
    request_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    """Get a specific admission request (admin only)"""
    request = session.get(AdmissionRequest, request_id)
    if not request:
        raise HTTPException(status_code=404, detail="Admission request not found")
    
    # Load relationships
    if request.class_id:
        request.class_assigned = session.get(Class, request.class_id)
    if request.reviewed_by_id:
        request.reviewed_by = session.get(User, request.reviewed_by_id)
    
    return request

@app.post("/admin/admission-requests/{request_id}/approve", tags=["Admin - Admissions"])
def approve_admission_request(
    request_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    """Approve an admission request and create student account (admin only)"""
    # Get the admission request
    admission_request = session.get(AdmissionRequest, request_id)
    if not admission_request:
        raise HTTPException(status_code=404, detail="Admission request not found")
    
    if admission_request.status != "pending":
        raise HTTPException(status_code=400, detail="Admission request has already been processed")
    
    # Generate student credentials using the helper function
    credentials = generate_student_credentials(admission_request.full_name, admission_request.class_id, session)
    username = credentials["username"]
    default_password = credentials["password"]
    roll_number = credentials["roll_number"]
    
    # Create user account
    hashed_password = get_password_hash(default_password)
    db_user = User(
        username=username,
        email=admission_request.email,
        full_name=admission_request.full_name,
        phone=admission_request.phone,
        role="student",
        password_hash=hashed_password
    )
    session.add(db_user)
    session.flush()
    
    # Create student record
    db_student = Student(
        user_id=db_user.id,
        roll_number=roll_number,
        parent_name=admission_request.parent_name,
        parent_phone=admission_request.parent_phone,
        address=admission_request.address,
        date_of_birth=admission_request.date_of_birth,
        class_id=admission_request.class_id
    )
    session.add(db_student)
    
    # Update admission request status
    admission_request.status = "approved"
    admission_request.reviewed_by_id = current_user.id
    admission_request.reviewed_at = datetime.utcnow()
    admission_request.review_notes = f"Auto-approved with roll number: {roll_number}, username: {username}"
    
    session.commit()
    
    return {
        "message": "Admission request approved successfully",
        "student_id": db_student.id,
        "username": username,
        "roll_number": roll_number,
        "password": default_password  # Return the generated password so admin can share it
    }

@app.post("/admin/admission-requests/{request_id}/reject", tags=["Admin - Admissions"])
def reject_admission_request(
    request_id: int,
    review_notes: str = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    """Reject an admission request (admin only)"""
    # Get the admission request
    admission_request = session.get(AdmissionRequest, request_id)
    if not admission_request:
        raise HTTPException(status_code=404, detail="Admission request not found")
    
    if admission_request.status != "pending":
        raise HTTPException(status_code=400, detail="Admission request has already been processed")
    
    # Update admission request status
    admission_request.status = "rejected"
    admission_request.reviewed_by_id = current_user.id
    admission_request.reviewed_at = datetime.utcnow()
    admission_request.review_notes = review_notes or "Admission request rejected"
    
    session.commit()
    
    return {"message": "Admission request rejected successfully"}

@app.delete("/admin/admission-requests/{request_id}", tags=["Admin - Admissions"])
def delete_admission_request(
    request_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    """Delete an admission request (admin only)"""
    admission_request = session.get(AdmissionRequest, request_id)
    if not admission_request:
        raise HTTPException(status_code=404, detail="Admission request not found")
    
    session.delete(admission_request)
    session.commit()
    
    return {"message": "Admission request deleted successfully"}

# Student-specific endpoints
@app.get("/student/{student_id}/profile", tags=["Students"], response_model=StudentRead)
def get_student_profile(
    student_id: int, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """Get student profile with user information"""
    # Validate access
    validate_student_access(student_id, current_user, session)
    student = session.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Load user relationship
    if student.user_id:
        user = session.get(User, student.user_id)
        student.user = user
    
    # Load class relationship
    if student.class_id:
        class_assigned = session.get(Class, student.class_id)
        student.class_assigned = class_assigned
    
    return student

@app.get("/student/{student_id}/attendance", tags=["Students"], response_model=List[AttendanceRead])
def get_student_attendance(
    student_id: int, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """Get all attendance records for a specific student"""
    # Validate access
    validate_student_access(student_id, current_user, session)
    
    statement = select(Attendance).where(Attendance.student_id == student_id).order_by(Attendance.date.desc())
    attendance = session.exec(statement).all()
    return attendance

@app.get("/student/{student_id}/exam-results", tags=["Students"], response_model=List[ExamResultRead])
def get_student_exam_results(
    student_id: int, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """Get all exam results for a specific student"""
    # Validate access
    validate_student_access(student_id, current_user, session)
    
    # Get exam results with exam and subject information
    statement = select(ExamResult).options(
        selectinload(ExamResult.exam).selectinload(Exam.subject)
    ).where(ExamResult.student_id == student_id)
    
    results = session.exec(statement).all()
    return results

@app.get("/student/{student_id}/subjects", tags=["Students"], response_model=List[SubjectRead])
def get_student_subjects(
    student_id: int, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """Get all subjects for a student's class"""
    # Validate access
    validate_student_access(student_id, current_user, session)
    
    # First get the student to find their class
    student = session.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get subjects for the student's class
    statement = select(Subject).where(Subject.class_id == student.class_id)
    subjects = session.exec(statement).all()
    return subjects

@app.get("/student/{student_id}/study-materials", tags=["Students"], response_model=List[StudyMaterialRead])
def get_student_study_materials(
    student_id: int, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """Get all study materials for a student's subjects"""
    # Validate access
    validate_student_access(student_id, current_user, session)
    
    # First get the student to find their class
    student = session.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get subjects for the student's class
    subjects = session.exec(select(Subject).where(Subject.class_id == student.class_id)).all()
    
    if not subjects:
        return []
    
    # Get subject IDs
    subject_ids = [subject.id for subject in subjects]
    
    # Get study materials for those subjects (only public ones)
    statement = select(StudyMaterial).where(
        StudyMaterial.subject_id.in_(subject_ids),
        StudyMaterial.is_public == True
    ).order_by(StudyMaterial.created_at.desc())
    materials = session.exec(statement).all()
    return materials

@app.get("/student/{student_id}/notices", tags=["Students"], response_model=List[NoticeRead])
def get_student_notices(
    student_id: int, 
    session: Session = Depends(get_session),
    current_user: User = Depends(get_current_active_user)
):
    """Get notices relevant to students"""
    # Validate access
    validate_student_access(student_id, current_user, session)
    
    # Get active notices for students or general notices
    statement = select(Notice).where(
        Notice.is_active == True,
        (Notice.target_role == "student") | (Notice.target_role == None)
    ).order_by(Notice.created_at.desc())
    notices = session.exec(statement).all()
    return notices

# Teacher-specific endpoints
@app.get("/teacher/{teacher_id}/profile", tags=["Teachers"], response_model=TeacherRead)
def get_teacher_profile(
    teacher_id: int, 
    session: Session = Depends(get_session),
    current_user: User = Depends(require_teacher_or_admin)
):
    """Get teacher profile with user information"""
    # Validate access - teachers can only see their own profile, admins can see any
    if current_user.role == "teacher":
        teacher = session.get(Teacher, teacher_id)
        if not teacher or teacher.user_id != current_user.id:
            raise HTTPException(status_code=403, detail="Access denied. You can only view your own profile.")
    
    teacher = session.get(Teacher, teacher_id)
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    # Load user relationship
    if teacher.user_id:
        user = session.get(User, teacher.user_id)
        teacher.user = user
    
    return teacher

@app.get("/teacher/{teacher_id}/exams", tags=["Teachers"], response_model=List[ExamRead])
def get_teacher_exams(teacher_id: int, session: Session = Depends(get_session)):
    """Get all exams for subjects taught by a specific teacher"""
    # First get all subjects taught by this teacher from class schedules
    teacher_subject_ids = session.exec(
        select(ClassSchedule.subject_id).distinct().where(ClassSchedule.teacher_id == teacher_id)
    ).all()
    
    if not teacher_subject_ids:
        return []
    
    # subject_ids is already a list of integers
    subject_ids = teacher_subject_ids
    
    # Get exams for those subjects
    statement = select(Exam).where(Exam.subject_id.in_(subject_ids))
    exams = session.exec(statement).all()
    
    return exams

@app.get("/teacher/{teacher_id}/subjects", tags=["Teachers"], response_model=List[SubjectRead])
def get_teacher_subjects(teacher_id: int, session: Session = Depends(get_session)):
    """Get all subjects taught by a specific teacher"""
    # Get distinct subjects from class schedules where teacher is assigned
    subject_ids = session.exec(
        select(ClassSchedule.subject_id).distinct().where(ClassSchedule.teacher_id == teacher_id)
    ).all()
    
    if not subject_ids:
        return []
    
    # Get the actual subject objects with class information
    subjects = session.exec(
        select(Subject).options(selectinload(Subject.class_assigned)).where(Subject.id.in_(subject_ids))
    ).all()
    
    return subjects

@app.get("/teacher/{teacher_id}/classes", tags=["Teachers"], response_model=List[ClassRead])
def get_teacher_classes(teacher_id: int, session: Session = Depends(get_session)):
    """Get all classes where the teacher is scheduled to teach"""
    # Get distinct classes where teacher has class schedules
    class_ids = session.exec(
        select(ClassSchedule.class_id).distinct().where(ClassSchedule.teacher_id == teacher_id)
    ).all()
    
    if not class_ids:
        return []
    
    # Get the actual class objects
    classes = session.exec(
        select(Class).where(Class.id.in_(class_ids))
    ).all()
    
    return classes

@app.get("/teacher/{teacher_id}/students", tags=["Teachers"], response_model=List[StudentRead])
def get_teacher_students(teacher_id: int, session: Session = Depends(get_session)):
    """Get all students in classes where the teacher is scheduled to teach"""
    # Get all classes where the teacher is scheduled
    teacher_classes = get_teacher_classes(teacher_id, session)
    
    if not teacher_classes:
        return []
    
    class_ids = [cls.id for cls in teacher_classes]
    
    # Get all students in those classes
    statement = select(Student).where(Student.class_id.in_(class_ids))
    students = session.exec(statement).all()
    
    return students

@app.get("/teacher/{teacher_id}/study-materials", tags=["Teachers"], response_model=List[StudyMaterialRead])
def get_teacher_study_materials(teacher_id: int, session: Session = Depends(get_session)):
    """Get all study materials uploaded by a specific teacher"""
    # Verify the teacher exists
    teacher = session.get(Teacher, teacher_id)
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    
    # Get study materials created by this teacher with subject and class information
    statement = select(StudyMaterial).options(
        selectinload(StudyMaterial.subject).selectinload(Subject.class_assigned)
    ).where(
        StudyMaterial.created_by_id == teacher.user_id
    ).order_by(StudyMaterial.created_at.desc())
    materials = session.exec(statement).all()
    
    return materials

@app.post("/teacher/{teacher_id}/study-materials", tags=["Teachers"], response_model=StudyMaterialRead)
def upload_teacher_study_material(
    teacher_id: int,
    material_data: StudyMaterialCreate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_teacher)
):
    """Upload a study material for a subject taught by the teacher"""
    # Verify the teacher is authenticated and matches the teacher_id
    teacher = session.get(Teacher, teacher_id)
    if not teacher or teacher.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied. You can only upload materials for your subjects.")
    
    # Verify the subject is taught by this teacher
    teacher_subjects = get_teacher_subjects(teacher_id, session)
    subject_ids = [subject.id for subject in teacher_subjects]
    
    if material_data.subject_id not in subject_ids:
        raise HTTPException(status_code=403, detail="Access denied. You can only upload materials for subjects you teach.")
    
    # Create database record with Cloudinary data
    db_material = StudyMaterial(
        title=material_data.title,
        description=material_data.description,
        file_path=material_data.file_path,  # Store Cloudinary public ID
        file_type=material_data.file_type,
        file_size=material_data.file_size,
        subject_id=material_data.subject_id,
        created_by_id=current_user.id,
        is_public=material_data.is_public,
        file_url=material_data.file_url  # Store Cloudinary URL
    )
    
    session.add(db_material)
    session.commit()
    session.refresh(db_material)
    
    return db_material

@app.put("/teacher/{teacher_id}/study-materials/{material_id}", tags=["Teachers"], response_model=StudyMaterialRead)
def update_teacher_study_material(
    teacher_id: int,
    material_id: int,
    material_data: StudyMaterialUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_teacher)
):
    """Update a study material uploaded by the teacher"""
    # Verify the teacher is authenticated and matches the teacher_id
    teacher = session.get(Teacher, teacher_id)
    if not teacher or teacher.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied.")
    
    # Get the material
    material = session.get(StudyMaterial, material_id)
    if not material:
        raise HTTPException(status_code=404, detail="Study material not found")
    
    # Verify the material was created by this teacher
    if material.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied. You can only update your own materials.")
    
    # Update metadata fields if provided
    if material_data.title is not None:
        material.title = material_data.title
    if material_data.description is not None:
        material.description = material_data.description
    if material_data.is_public is not None:
        material.is_public = material_data.is_public
    
    # Handle file replacement if new file data is provided
    if material_data.file_url and material_data.file_path and material_data.file_type and material_data.file_size is not None:
        material.file_url = material_data.file_url
        material.file_path = material_data.file_path
        material.file_type = material_data.file_type
        material.file_size = material_data.file_size
    
    session.add(material)
    session.commit()
    session.refresh(material)
    
    return material

@app.delete("/teacher/{teacher_id}/study-materials/{material_id}", tags=["Teachers"])
def delete_teacher_study_material(
    teacher_id: int,
    material_id: int,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_teacher)
):
    """Delete a study material uploaded by the teacher"""
    # Verify the teacher is authenticated and matches the teacher_id
    teacher = session.get(Teacher, teacher_id)
    if not teacher or teacher.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied.")
    
    # Get the material
    material = session.get(StudyMaterial, material_id)
    if not material:
        raise HTTPException(status_code=404, detail="Study material not found")
    
    # Verify the material was created by this teacher
    if material.created_by_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied. You can only delete your own materials.")
    
    # Delete the database record (Cloudinary files are deleted by frontend)
    session.delete(material)
    session.commit()
    
    return {"message": "Study material deleted successfully"}

# Self-service password change endpoints
@app.patch("/admin/{admin_id}/password", tags=["Admin - Profile"])
def change_admin_password(
    admin_id: int,
    password_data: PasswordChangeRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    """Change admin's own password"""
    if current_user.id != admin_id:
        raise HTTPException(status_code=403, detail="Access denied. You can only change your own password.")
    
    # Verify current password
    if not verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Update password
    current_user.password_hash = get_password_hash(password_data.new_password)
    session.add(current_user)
    session.commit()
    
    return {"message": "Password changed successfully"}

@app.patch("/teacher/{teacher_id}/password", tags=["Teachers"])
def change_teacher_password(
    teacher_id: int,
    password_data: PasswordChangeRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_teacher)
):
    """Change teacher's own password"""
    # Get teacher record to validate access
    teacher = session.get(Teacher, teacher_id)
    if not teacher or teacher.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied. You can only change your own password.")
    
    # Verify current password
    if not verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Update password
    current_user.password_hash = get_password_hash(password_data.new_password)
    session.add(current_user)
    session.commit()
    
    return {"message": "Password changed successfully"}

@app.patch("/student/{student_id}/password", tags=["Students"])
def change_student_password(
    student_id: int,
    password_data: PasswordChangeRequest,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_student)
):
    """Change student's own password"""
    # Get student record to validate access
    student = session.get(Student, student_id)
    if not student or student.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied. You can only change your own password.")
    
    # Verify current password
    if not verify_password(password_data.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    # Update password
    current_user.password_hash = get_password_hash(password_data.new_password)
    session.add(current_user)
    session.commit()
    
    return {"message": "Password changed successfully"}

# Profile update endpoints
@app.put("/admin/{admin_id}/profile", tags=["Admin - Profile"])
def update_admin_profile(
    admin_id: int,
    profile_data: UserUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    """Update admin's own profile"""
    if current_user.id != admin_id:
        raise HTTPException(status_code=403, detail="Access denied. You can only update your own profile.")
    
    # Update user fields
    update_data = profile_data.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(current_user, field, value)
    
    session.add(current_user)
    session.commit()
    session.refresh(current_user)
    
    return current_user

@app.put("/teacher/{teacher_id}/profile", tags=["Teachers"])
def update_teacher_profile(
    teacher_id: int,
    profile_data: TeacherUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_teacher)
):
    """Update teacher's own profile"""
    # Get teacher record
    teacher = session.get(Teacher, teacher_id)
    if not teacher or teacher.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied. You can only update your own profile.")
    
    # Update user fields if provided
    if profile_data.user:
        user_data = profile_data.user.dict(exclude_unset=True)
        for field, value in user_data.items():
            setattr(current_user, field, value)
    
    # Update teacher fields
    teacher_data = profile_data.dict(exclude={'user'}, exclude_unset=True)
    for field, value in teacher_data.items():
        setattr(teacher, field, value)
    
    session.add(current_user)
    session.add(teacher)
    session.commit()
    session.refresh(teacher)
    
    return teacher

@app.put("/student/{student_id}/profile", tags=["Students"])
def update_student_profile(
    student_id: int,
    profile_data: StudentUpdate,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_student)
):
    """Update student's own profile"""
    # Get student record
    student = session.get(Student, student_id)
    if not student or student.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied. You can only update your own profile.")
    
    # Update user fields if provided
    if profile_data.user:
        user_data = profile_data.user.dict(exclude_unset=True)
        for field, value in user_data.items():
            setattr(current_user, field, value)
    
    # Update student fields
    student_data = profile_data.dict(exclude={'user'}, exclude_unset=True)
    datetime_fields = ['date_of_birth', 'admission_date']
    
    for field, value in student_data.items():
        # Handle datetime field conversion from string to datetime
        if field in datetime_fields:
            value = parse_datetime_field(value, field)
            if value is None:
                continue  # Skip field if parsing failed
        setattr(student, field, value)
    
    session.add(current_user)
    session.add(student)
    session.commit()
    session.refresh(student)
    
    return student

# Admin-specific endpoints
@app.get("/admin/{admin_id}/profile", response_model=UserRead, tags=["Admin - Profile"])
def get_admin_profile(
    admin_id: int, 
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    """Get admin profile information"""
    # Validate access - admins can only see their own profile
    if current_user.id != admin_id:
        raise HTTPException(status_code=403, detail="Access denied. You can only view your own profile.")
    
    # Get the admin user
    admin = session.get(User, admin_id)
    if not admin or admin.role != "admin":
        raise HTTPException(status_code=404, detail="Admin not found")
    
    return admin

def authenticate_user(username: str, password: str, session: Session) -> User:
    """Authenticate a user by username/email and password"""
    # Try to find user by username first
    user = session.exec(select(User).where(User.username == username)).first()
    
    # If not found by username, try by email
    if not user:
        user = session.exec(select(User).where(User.email == username)).first()
    
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app", 
        host="0.0.0.0", 
        port=8000, 
        reload=True,
        # Configure for large file uploads
        limit_concurrency=10,
        limit_max_requests=100,
        # File upload limits
        http={
            'max_request_size': MAX_UPLOAD_SIZE,
        }
    )