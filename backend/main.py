from fastapi import FastAPI, HTTPException, Depends, status, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session, select
from sqlalchemy import func, or_, and_
from sqlalchemy.orm import selectinload
from database import get_session, create_db_and_tables, engine
from models import *
from schemas import *
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
import uvicorn
from typing import List, Optional
import os
import shutil

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
SECRET_KEY = "your-secret-key-here-change-in-production"  # In production, use environment variable
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Security
security = HTTPBearer()

# Create FastAPI app
app = FastAPI(
    title="Coaching Center Management System",
    description="A comprehensive management system for coaching centers",
    version="1.0.0"
)

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

def authenticate_user(username: str, password: str, session: Session) -> Optional[User]:
    user = session.exec(
        select(User).options(
            selectinload(User.student),
            selectinload(User.teacher)
        ).where(User.username == username)
    ).first()
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user

# Root endpoint
@app.get("/")
def read_root():
    return {"message": "Coaching Center Management System API", "version": "1.0.0"}

# Health check
@app.get("/health")
def health_check():
    return {"status": "healthy"}

# Authentication endpoints
@app.post("/auth/login", response_model=LoginResponse)
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

@app.get("/auth/me", response_model=UserRead)
def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user

@app.post("/auth/logout")
def logout():
    # Since JWT tokens are stateless, logout is handled on the frontend by removing the token
    return {"message": "Successfully logged out"}

# Admin endpoints for user management
@app.post("/admin/users", response_model=UserRead)
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

@app.get("/admin/users", response_model=List[UserRead])
def get_users(
    skip: int = 0,
    limit: int = 100,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    statement = select(User).offset(skip).limit(limit)
    users = session.exec(statement).all()
    return users

@app.get("/admin/users/{user_id}", response_model=UserRead)
def get_user(
    user_id: int, 
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Student management
@app.post("/admin/students", response_model=StudentRead)
def create_student(
    student: StudentCreate, 
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    # First create the user
    user_data = student.user
    user_dict = user_data.dict(exclude={'password'})
    db_user = User(
        **user_dict,
        password_hash=get_password_hash(user_data.password)
        # role is already included in user_dict from frontend
    )
    session.add(db_user)
    session.flush()  # Flush to get the user ID
    
    # Then create the student
    student_dict = student.dict(exclude={'user'})
    db_student = Student(**student_dict, user_id=db_user.id)
    session.add(db_student)
    session.commit()
    session.refresh(db_student)
    return db_student

@app.get("/admin/students", response_model=List[StudentRead])
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

@app.get("/admin/students/{student_id}", response_model=StudentRead)
def get_student(
    student_id: int, 
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    student = session.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

@app.put("/admin/students/{student_id}", response_model=StudentRead)
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

@app.delete("/admin/students/{student_id}")
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

@app.patch("/admin/students/{student_id}/password")
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
@app.post("/admin/teachers", response_model=TeacherRead)
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

@app.get("/admin/teachers", response_model=List[TeacherRead])
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

@app.put("/admin/teachers/{teacher_id}", response_model=TeacherRead)
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

@app.delete("/admin/teachers/{teacher_id}")
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

@app.patch("/admin/teachers/{teacher_id}/password")
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
@app.post("/admin/classes", response_model=ClassRead)
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

@app.get("/admin/classes", response_model=List[ClassRead])
def get_all_classes(
    session: Session = Depends(get_session),
    current_user: User = Depends(require_teacher_or_admin)
):
    statement = select(Class)
    classes = session.exec(statement).all()
    return classes

@app.put("/admin/classes/{class_id}", response_model=ClassRead)
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

@app.delete("/admin/classes/{class_id}")
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
@app.post("/admin/subjects", response_model=SubjectRead)
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

@app.get("/admin/subjects", response_model=List[SubjectRead])
def get_all_subjects(
    session: Session = Depends(get_session),
    current_user: User = Depends(require_teacher_or_admin)
):
    statement = select(Subject)
    subjects = session.exec(statement).all()
    return subjects

@app.put("/admin/subjects/{subject_id}", response_model=SubjectRead)
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

@app.delete("/admin/subjects/{subject_id}")
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
@app.post("/admin/attendance", response_model=AttendanceRead)
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

@app.put("/admin/attendance/{attendance_id}", response_model=AttendanceRead)
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

@app.get("/admin/attendance", response_model=List[AttendanceRead])
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
@app.post("/admin/exams", response_model=ExamRead)
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

@app.get("/admin/exams", response_model=List[ExamRead])
def get_all_exams(
    session: Session = Depends(get_session),
    current_user: User = Depends(require_teacher_or_admin)
):
    statement = select(Exam)
    exams = session.exec(statement).all()
    return exams

@app.put("/admin/exams/{exam_id}", response_model=ExamRead)
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

@app.delete("/admin/exams/{exam_id}")
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
@app.post("/admin/exam-results", response_model=ExamResultRead)
def create_exam_result(result: ExamResultCreate, session: Session = Depends(get_session)):
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
    
    # Validate marks don't exceed maximum
    exam = session.get(Exam, result.exam_id)
    if not exam:
        raise HTTPException(status_code=404, detail="Exam not found")
    
    if result.marks_obtained > exam.max_marks:
        raise HTTPException(
            status_code=400,
            detail="Marks obtained cannot exceed maximum marks"
        )
    
    db_result = ExamResult(**result.dict())
    session.add(db_result)
    session.commit()
    session.refresh(db_result)
    return db_result

@app.get("/admin/exam-results", response_model=List[ExamResultRead])
def get_exam_results(
    exam_id: int = None,
    student_id: int = None,
    session: Session = Depends(get_session)
):
    statement = select(ExamResult)
    if exam_id:
        statement = statement.where(ExamResult.exam_id == exam_id)
    if student_id:
        statement = statement.where(ExamResult.student_id == student_id)
    
    results = session.exec(statement).all()
    return results

@app.put("/admin/exam-results/{result_id}", response_model=ExamResultRead)
def update_exam_result(result_id: int, result_update: ExamResultUpdate, session: Session = Depends(get_session)):
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
    
    # Update the result
    result_data = result_update.dict(exclude_unset=True)
    for field, value in result_data.items():
        setattr(db_result, field, value)
    
    session.add(db_result)
    session.commit()
    session.refresh(db_result)
    return db_result

# Study materials
@app.post("/admin/study-materials", response_model=StudyMaterialRead)
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

@app.get("/admin/study-materials", response_model=List[StudyMaterialRead])
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
@app.post("/admin/notices", response_model=NoticeRead)
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

@app.get("/admin/notices", response_model=List[NoticeRead])
def get_notices(
    target_role: UserRole = None,
    active_only: bool = True,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_teacher_or_admin)
):
    statement = select(Notice)
    
    # If user is a teacher, they can only see notices targeted at teachers or general notices
    if current_user.role == UserRole.TEACHER:
        statement = statement.where(
            (Notice.target_role == UserRole.TEACHER) | (Notice.target_role == None)
        )
    elif target_role:
        statement = statement.where(Notice.target_role == target_role)
    
    if active_only:
        statement = statement.where(Notice.is_active == True)
    
    statement = statement.order_by(Notice.created_at.desc())
    notices = session.exec(statement).all()
    return notices

# Public notices endpoint (no authentication required)
@app.get("/public/notices", response_model=List[NoticeRead])
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

# Public admission endpoint (no authentication required)
@app.post("/public/admission", response_model=StudentRead)
def submit_admission_request(
    student: StudentCreate,
    session: Session = Depends(get_session)
):
    """Allow prospective students to submit admission requests"""
    # Check if username already exists
    existing_user = session.exec(select(User).where(User.username == student.user.username)).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Username already registered"
        )
    
    # If email is provided, check if it already exists
    if student.user.email:
        email_check = session.exec(select(User).where(User.email == student.user.email)).first()
        if email_check:
            raise HTTPException(
                status_code=400,
                detail="Email already registered"
            )
    
    # Check if roll number already exists
    existing_student = session.exec(select(Student).where(Student.roll_number == student.roll_number)).first()
    if existing_student:
        raise HTTPException(
            status_code=400,
            detail="Roll number already exists"
        )
    
    # Validate class exists and has capacity
    class_obj = session.get(Class, student.class_id)
    if not class_obj:
        raise HTTPException(status_code=404, detail="Selected class not found")
    
    # Check current enrollment
    current_students = session.exec(select(Student).where(Student.class_id == student.class_id)).all()
    if len(current_students) >= class_obj.capacity:
        raise HTTPException(
            status_code=400,
            detail=f"Class {class_obj.name} is at full capacity ({class_obj.capacity} students)"
        )
    
    # Create new user
    hashed_password = get_password_hash(student.user.password)
    user_data = student.user.dict(exclude={'password'})
    db_user = User(**user_data, password_hash=hashed_password)
    session.add(db_user)
    session.flush()  # Flush to get the user ID
    
    # Create the student
    student_dict = student.dict(exclude={'user'})
    db_student = Student(**student_dict, user_id=db_user.id)
    session.add(db_student)
    session.commit()
    session.refresh(db_student)
    return db_student

@app.put("/admin/notices/{notice_id}", response_model=NoticeRead)
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

@app.delete("/admin/notices/{notice_id}")
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
@app.post("/admin/class-schedules", response_model=ClassScheduleRead)
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

@app.get("/admin/class-schedules", response_model=List[ClassScheduleRead])
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

@app.get("/teacher/{teacher_id}/schedule", response_model=List[ClassScheduleRead])
def get_teacher_schedule(
    teacher_id: int,
    day_of_week: DayOfWeek = None,
    session: Session = Depends(get_session),
    current_user: User = Depends(require_teacher_or_admin)
):
    # Validate teacher access (teachers can only see their own schedule, admins can see any)
    if current_user.role == UserRole.TEACHER:
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

@app.get("/student/{student_id}/schedule", response_model=List[ClassScheduleRead])
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

@app.delete("/admin/class-schedules/{schedule_id}")
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
@app.post("/admin/teacher-reviews", response_model=TeacherReviewRead)
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

@app.get("/admin/teacher-reviews", response_model=List[TeacherReviewRead])
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
@app.get("/admin/dashboard", response_model=DashboardStats)
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
@app.post("/admin/seed-data")
def seed_mock_data(session: Session = Depends(get_session)):
    """Seed the database with mock data for testing and development"""
    try:
        # Check if data already exists
        existing_users = session.exec(select(User)).first()
        if existing_users:
            raise HTTPException(
                status_code=400,
                detail="Database already contains data. Use /admin/reset-data first to clear existing data."
            )
        
        # Create users
        users = []
        for user_data in MOCK_USERS:
            user = User(**user_data)
            session.add(user)
            users.append(user)
        session.flush()  # Flush to get IDs
        
        # Create teachers
        teachers = []
        for teacher_data in MOCK_TEACHERS:
            teacher = Teacher(**teacher_data)
            session.add(teacher)
            teachers.append(teacher)
        session.flush()
        
        # Create classes with proper teacher assignments
        classes = []
        for class_data in MOCK_CLASSES:
            class_obj = Class(**class_data)
            session.add(class_obj)
            classes.append(class_obj)
        session.flush()
        
        # Create students
        students = []
        for student_data in MOCK_STUDENTS:
            student = Student(**student_data)
            session.add(student)
            students.append(student)
        session.flush()
        
        # Create subjects with proper teacher and class assignments
        subjects = []
        subject_assignments = [
            # Class 10A subjects (class_id = classes[0].id)
            (0, 0),  # Math, Class 10A
            (0, 1),  # Physics, Class 10A
            (0, 2),  # Chemistry, Class 10A
            (0, 3),  # Biology, Class 10A
            (0, 4),  # English, Class 10A
            
            # Class 10B subjects (class_id = classes[1].id)
            (1, 5),  # Math, Class 10B
            (1, 6),  # Physics, Class 10B
            (1, 7),  # Chemistry, Class 10B
            (1, 8),  # Biology, Class 10B
            (1, 9),  # English, Class 10B
            
            # Class 11 Science subjects (class_id = classes[2].id)
            (2, 10), # Advanced Math, Class 11
            (2, 11), # Advanced Physics, Class 11
            (2, 12), # Advanced Chemistry, Class 11
            (2, 13), # Advanced Biology, Class 11
            (2, 14), # English Literature, Class 11
            
            # Class 12 Science subjects (class_id = classes[3].id)
            (3, 15), # Calculus, Class 12
            (3, 16), # Quantum Physics, Class 12
            (3, 17), # Organic Chemistry, Class 12
            (3, 18), # Molecular Biology, Class 12
            (3, 19), # Advanced English, Class 12
        ]
        
        for assignment in subject_assignments:
            class_idx, subject_idx = assignment
            subject_data = MOCK_SUBJECTS[subject_idx].copy()
            
            # Set the actual class ID from created objects
            subject_data["class_id"] = classes[class_idx].id
            
            subject = Subject(**subject_data)
            session.add(subject)
            subjects.append(subject)
        session.flush()
        
        # Create attendance records
        for attendance_data in MOCK_ATTENDANCE:
            attendance = Attendance(**attendance_data)
            session.add(attendance)
        
        # Create exams
        exams = []
        for exam_data in MOCK_EXAMS:
            exam = Exam(**exam_data)
            session.add(exam)
            exams.append(exam)
        session.flush()
        
        # Create exam results
        for result_data in MOCK_EXAM_RESULTS:
            result = ExamResult(**result_data)
            session.add(result)
        
        # Create study materials
        for material_data in MOCK_STUDY_MATERIALS:
            material = StudyMaterial(**material_data)
            session.add(material)
        
        # Create notices
        for notice_data in MOCK_NOTICES:
            notice = Notice(**notice_data)
            session.add(notice)
        
        # Create teacher reviews
        for review_data in MOCK_TEACHER_REVIEWS:
            review = TeacherReview(**review_data)
            session.add(review)
        
        # Create class schedules
        for schedule_data in MOCK_CLASS_SCHEDULES:
            schedule = ClassSchedule(**schedule_data)
            session.add(schedule)
        
        session.commit()
        
        return {
            "message": "Mock data seeded successfully",
            "data": {
                "users": len(MOCK_USERS),
                "teachers": len(MOCK_TEACHERS),
                "students": len(MOCK_STUDENTS),
                "classes": len(MOCK_CLASSES),
                "subjects": len(MOCK_SUBJECTS),
                "attendance_records": len(MOCK_ATTENDANCE),
                "exams": len(MOCK_EXAMS),
                "exam_results": len(MOCK_EXAM_RESULTS),
                "study_materials": len(MOCK_STUDY_MATERIALS),
                "notices": len(MOCK_NOTICES),
                "teacher_reviews": len(MOCK_TEACHER_REVIEWS),
                "class_schedules": len(MOCK_CLASS_SCHEDULES)
            }
        }
        
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Error seeding data: {str(e)}")

@app.post("/admin/reset-data")
def reset_all_data(confirm: bool = False, session: Session = Depends(get_session)):
    """Reset/clear all data from the database"""
    if not confirm:
        raise HTTPException(
            status_code=400,
            detail="Please confirm data deletion by setting confirm=true query parameter"
        )
    
    try:
        # Delete all data in reverse order of dependencies
        # Get all records and delete them
        teacher_reviews = session.exec(select(TeacherReview)).all()
        for item in teacher_reviews:
            session.delete(item)
            
        notices = session.exec(select(Notice)).all()
        for item in notices:
            session.delete(item)
            
        study_materials = session.exec(select(StudyMaterial)).all()
        for item in study_materials:
            session.delete(item)
            
        exam_results = session.exec(select(ExamResult)).all()
        for item in exam_results:
            session.delete(item)
            
        exams = session.exec(select(Exam)).all()
        for item in exams:
            session.delete(item)
            
        attendances = session.exec(select(Attendance)).all()
        for item in attendances:
            session.delete(item)
            
        class_schedules = session.exec(select(ClassSchedule)).all()
        for item in class_schedules:
            session.delete(item)
            
        subjects = session.exec(select(Subject)).all()
        for item in subjects:
            session.delete(item)
            
        students = session.exec(select(Student)).all()
        for item in students:
            session.delete(item)
            
        teachers = session.exec(select(Teacher)).all()
        for item in teachers:
            session.delete(item)
            
        classes = session.exec(select(Class)).all()
        for item in classes:
            session.delete(item)
            
        users = session.exec(select(User)).all()
        for item in users:
            session.delete(item)
        
        session.commit()
        
        return {"message": "All data has been reset successfully"}
        
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Error resetting data: {str(e)}")

@app.post("/admin/cleanup-duplicate-results")
def cleanup_duplicate_exam_results(session: Session = Depends(get_session)):
    """Clean up duplicate exam results, keeping only the first one for each student-exam combination"""
    try:
        # Find duplicate results
        duplicates_query = select(
            ExamResult.exam_id,
            ExamResult.student_id,
            func.count(ExamResult.id).label('count'),
            func.min(ExamResult.id).label('keep_id')
        ).group_by(ExamResult.exam_id, ExamResult.student_id).having(func.count(ExamResult.id) > 1)
        
        duplicates = session.exec(duplicates_query).all()
        
        if not duplicates:
            return {"message": "No duplicate results found"}
        
        deleted_count = 0
        for dup in duplicates:
            # Delete all results except the one with the smallest ID (first created)
            delete_query = select(ExamResult).where(
                ExamResult.exam_id == dup.exam_id,
                ExamResult.student_id == dup.student_id,
                ExamResult.id != dup.keep_id
            )
            duplicate_results = session.exec(delete_query).all()
            
            for result in duplicate_results:
                session.delete(result)
                deleted_count += 1
        
        session.commit()
        
        return {
            "message": f"Cleaned up {deleted_count} duplicate exam results",
            "duplicates_found": len(duplicates)
        }
        
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=f"Error cleaning up duplicates: {str(e)}")

@app.get("/admin/data-stats")
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
@app.post("/admin/create-admin", response_model=UserRead)
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
    user_data['role'] = UserRole.ADMIN  # Force admin role
    
    db_user = User(**user_data, password_hash=hashed_password)
    session.add(db_user)
    session.commit()
    session.refresh(db_user)
    
    # Deactivate the code after successful use (one-time use)
    code_record.is_active = False
    session.add(code_record)
    session.commit()
    
    return db_user

@app.get("/admin/creation-codes", response_model=List[AdminCreationCodeRead])
def get_admin_creation_codes(
    session: Session = Depends(get_session),
    current_user: User = Depends(require_admin)
):
    """Get all admin creation codes (admin only)"""
    codes = session.exec(select(AdminCreationCode)).all()
    return codes

@app.post("/admin/creation-codes", response_model=AdminCreationCodeRead)
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

@app.put("/admin/creation-codes/{code_id}", response_model=AdminCreationCodeRead)
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

@app.delete("/admin/creation-codes/{code_id}")
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

# Student-specific endpoints
@app.get("/student/{student_id}/profile", response_model=StudentRead)
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
    
    return student

@app.get("/student/{student_id}/attendance", response_model=List[AttendanceRead])
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

@app.get("/student/{student_id}/exam-results", response_model=List[ExamResultRead])
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

@app.get("/student/{student_id}/subjects", response_model=List[SubjectRead])
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

@app.get("/student/{student_id}/study-materials", response_model=List[StudyMaterialRead])
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

@app.get("/student/{student_id}/notices", response_model=List[NoticeRead])
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
        (Notice.target_role == UserRole.STUDENT) | (Notice.target_role == None)
    ).order_by(Notice.created_at.desc())
    notices = session.exec(statement).all()
    return notices

# Teacher-specific endpoints
@app.get("/teacher/{teacher_id}/exams", response_model=List[ExamRead])
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

@app.get("/teacher/{teacher_id}/subjects", response_model=List[SubjectRead])
def get_teacher_subjects(teacher_id: int, session: Session = Depends(get_session)):
    """Get all subjects taught by a specific teacher"""
    # Get distinct subjects from class schedules where teacher is assigned
    subject_ids = session.exec(
        select(ClassSchedule.subject_id).distinct().where(ClassSchedule.teacher_id == teacher_id)
    ).all()
    
    if not subject_ids:
        return []
    
    # Get the actual subject objects
    subjects = session.exec(
        select(Subject).where(Subject.id.in_(subject_ids))
    ).all()
    
    return subjects

@app.get("/teacher/{teacher_id}/classes", response_model=List[ClassRead])
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

@app.get("/teacher/{teacher_id}/students", response_model=List[StudentRead])
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

@app.get("/teacher/{teacher_id}/study-materials", response_model=List[StudyMaterialRead])
def get_teacher_study_materials(teacher_id: int, session: Session = Depends(get_session)):
    """Get all study materials for subjects taught by a specific teacher"""
    # Get all subjects taught by this teacher
    teacher_subjects = get_teacher_subjects(teacher_id, session)
    
    if not teacher_subjects:
        return []
    
    subject_ids = [subject.id for subject in teacher_subjects]
    
    # Get study materials for those subjects
    statement = select(StudyMaterial).where(
        StudyMaterial.subject_id.in_(subject_ids)
    ).order_by(StudyMaterial.created_at.desc())
    materials = session.exec(statement).all()
    
    return materials

@app.post("/teacher/{teacher_id}/study-materials", response_model=StudyMaterialRead)
def upload_teacher_study_material(
    teacher_id: int,
    title: str = Form(...),
    description: str = Form(""),
    subject_id: int = Form(...),
    file: UploadFile = File(...),
    is_public: bool = Form(True),
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
    
    if subject_id not in subject_ids:
        raise HTTPException(status_code=403, detail="Access denied. You can only upload materials for subjects you teach.")
    
    # Create uploads directory if it doesn't exist
    upload_dir = "uploads/study_materials"
    os.makedirs(upload_dir, exist_ok=True)
    
    # Generate unique filename
    file_extension = os.path.splitext(file.filename)[1]
    unique_filename = f"{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{teacher_id}_{subject_id}{file_extension}"
    file_path = os.path.join(upload_dir, unique_filename)
    
    # Save the file
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Get file size
        file_size = os.path.getsize(file_path)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")
    
    # Create database record
    db_material = StudyMaterial(
        title=title,
        description=description,
        file_path=file_path,
        file_type=file.content_type,
        file_size=file_size,
        subject_id=subject_id,
        created_by_id=current_user.id,
        is_public=is_public
    )
    
    session.add(db_material)
    session.commit()
    session.refresh(db_material)
    
    return db_material

@app.put("/teacher/{teacher_id}/study-materials/{material_id}", response_model=StudyMaterialRead)
def update_teacher_study_material(
    teacher_id: int,
    material_id: int,
    material_update: StudyMaterialUpdate,
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
    
    # Update the material
    update_data = material_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(material, field, value)
    
    session.add(material)
    session.commit()
    session.refresh(material)
    
    return material

@app.delete("/teacher/{teacher_id}/study-materials/{material_id}")
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
    
    # Delete the file if it exists
    if material.file_path and os.path.exists(material.file_path):
        try:
            os.remove(material.file_path)
        except Exception as e:
            print(f"Warning: Failed to delete file {material.file_path}: {e}")
    
    # Delete the database record
    session.delete(material)
    session.commit()
    
    return {"message": "Study material deleted successfully"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)