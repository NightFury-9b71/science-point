from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlmodel import Session, select
from sqlalchemy import func
from database import get_session, create_db_and_tables, engine
from models import *
from schemas import *
from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
import uvicorn
from typing import List, Optional

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

def authenticate_user(username: str, password: str, session: Session) -> Optional[User]:
    user = session.exec(select(User).where(User.username == username)).first()
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
def create_user(user: UserCreate, session: Session = Depends(get_session)):
    # Check if username or email already exists
    statement = select(User).where((User.username == user.username) | (User.email == user.email))
    existing_user = session.exec(statement).first()
    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Username or email already registered"
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
def get_all_users(skip: int = 0, limit: int = 100, session: Session = Depends(get_session)):
    statement = select(User).offset(skip).limit(limit)
    users = session.exec(statement).all()
    return users

@app.get("/admin/users/{user_id}", response_model=UserRead)
def get_user(user_id: int, session: Session = Depends(get_session)):
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

# Student management
@app.post("/admin/students", response_model=StudentRead)
def create_student(student: StudentCreate, session: Session = Depends(get_session)):
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
def get_all_students(skip: int = 0, limit: int = 100, session: Session = Depends(get_session)):
    statement = select(Student).offset(skip).limit(limit)
    students = session.exec(statement).all()
    
    # Load user relationships
    for student in students:
        if student.user_id:
            user = session.get(User, student.user_id)
            student.user = user
    
    return students

@app.get("/admin/students/{student_id}", response_model=StudentRead)
def get_student(student_id: int, session: Session = Depends(get_session)):
    student = session.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student

@app.put("/admin/students/{student_id}", response_model=StudentRead)
def update_student(student_id: int, student_update: StudentUpdate, session: Session = Depends(get_session)):
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
def delete_student(student_id: int, session: Session = Depends(get_session)):
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
def update_student_password(student_id: int, password_data: PasswordUpdate, session: Session = Depends(get_session)):
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
def create_teacher(teacher: TeacherCreate, session: Session = Depends(get_session)):
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
def get_all_teachers(skip: int = 0, limit: int = 100, session: Session = Depends(get_session)):
    statement = select(Teacher).offset(skip).limit(limit)
    teachers = session.exec(statement).all()
    
    # Load user relationships
    for teacher in teachers:
        if teacher.user_id:
            user = session.get(User, teacher.user_id)
            teacher.user = user
    
    return teachers

@app.put("/admin/teachers/{teacher_id}", response_model=TeacherRead)
def update_teacher(teacher_id: int, teacher_update: TeacherUpdate, session: Session = Depends(get_session)):
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
def delete_teacher(teacher_id: int, session: Session = Depends(get_session)):
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
def update_teacher_password(teacher_id: int, password_update: PasswordUpdate, session: Session = Depends(get_session)):
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
def create_class(class_data: ClassCreate, session: Session = Depends(get_session)):
    db_class = Class(**class_data.dict())
    session.add(db_class)
    session.commit()
    session.refresh(db_class)
    return db_class

@app.get("/admin/classes", response_model=List[ClassRead])
def get_all_classes(session: Session = Depends(get_session)):
    statement = select(Class)
    classes = session.exec(statement).all()
    return classes

@app.put("/admin/classes/{class_id}", response_model=ClassRead)
def update_class(class_id: int, class_data: ClassCreate, session: Session = Depends(get_session)):
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

# Subject management
@app.post("/admin/subjects", response_model=SubjectRead)
def create_subject(subject: SubjectCreate, session: Session = Depends(get_session)):
    db_subject = Subject(**subject.dict())
    session.add(db_subject)
    session.commit()
    session.refresh(db_subject)
    return db_subject

@app.get("/admin/subjects", response_model=List[SubjectRead])
def get_all_subjects(session: Session = Depends(get_session)):
    statement = select(Subject)
    subjects = session.exec(statement).all()
    return subjects

@app.put("/admin/subjects/{subject_id}", response_model=SubjectRead)
def update_subject(subject_id: int, subject_update: SubjectCreate, session: Session = Depends(get_session)):
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

# Attendance management
@app.post("/admin/attendance", response_model=AttendanceRead)
def mark_attendance(attendance: AttendanceCreate, session: Session = Depends(get_session)):
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
def update_attendance(attendance_id: int, attendance_update: AttendanceCreate, session: Session = Depends(get_session)):
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
def create_exam(exam: ExamCreate, session: Session = Depends(get_session)):
    db_exam = Exam(**exam.dict())
    session.add(db_exam)
    session.commit()
    session.refresh(db_exam)
    return db_exam

@app.get("/admin/exams", response_model=List[ExamRead])
def get_all_exams(session: Session = Depends(get_session)):
    statement = select(Exam)
    exams = session.exec(statement).all()
    return exams

# Exam results
@app.post("/admin/exam-results", response_model=ExamResultRead)
def create_exam_result(result: ExamResultCreate, session: Session = Depends(get_session)):
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
    current_user_id: int = 1,  # Placeholder for authentication
    session: Session = Depends(get_session)
):
    db_material = StudyMaterial(
        **material.dict(),
        created_by_id=current_user_id
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
    current_user_id: int = 1,  # Placeholder for authentication
    session: Session = Depends(get_session)
):
    db_notice = Notice(
        **notice.dict(),
        created_by_id=current_user_id
    )
    session.add(db_notice)
    session.commit()
    session.refresh(db_notice)
    return db_notice

@app.get("/admin/notices", response_model=List[NoticeRead])
def get_notices(
    target_role: UserRole = None,
    active_only: bool = True,
    session: Session = Depends(get_session)
):
    statement = select(Notice)
    if target_role:
        statement = statement.where(Notice.target_role == target_role)
    if active_only:
        statement = statement.where(Notice.is_active == True)
    
    statement = statement.order_by(Notice.created_at.desc())
    notices = session.exec(statement).all()
    return notices

# Teacher reviews
@app.post("/admin/teacher-reviews", response_model=TeacherReviewRead)
def create_teacher_review(
    review: TeacherReviewCreate,
    current_user_id: int = 1,  # Placeholder for authentication
    session: Session = Depends(get_session)
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
        reviewed_by_id=current_user_id,
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
        class_teacher_assignments = [
            (0, 0),  # Class 10A -> Math teacher (Prof. John Smith)
            (1, 1),  # Class 10B -> Physics teacher (Dr. Emily Chen)  
            (2, 2),  # Class 11 Science -> Chemistry teacher (Mr. Robert Davis)
            (3, 3)   # Class 12 Science -> Biology teacher (Ms. Lisa Brown)
        ]
        
        for i, class_data in enumerate(MOCK_CLASSES):
            class_copy = class_data.copy()
            # Assign class teacher ID from the created teachers
            class_idx, teacher_idx = class_teacher_assignments[i]
            class_copy["class_teacher_id"] = teachers[teacher_idx].id
            
            class_obj = Class(**class_copy)
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
            (0, 0, 0),  # Math -> Math teacher, Class 10A
            (0, 1, 1),  # Physics -> Physics teacher, Class 10A
            (0, 2, 2),  # Chemistry -> Chemistry teacher, Class 10A
            (0, 3, 3),  # Biology -> Biology teacher, Class 10A
            (0, 4, 4),  # English -> English teacher, Class 10A
            
            # Class 10B subjects (class_id = classes[1].id)
            (1, 0, 5),  # Math -> Math teacher, Class 10B
            (1, 1, 6),  # Physics -> Physics teacher, Class 10B
            (1, 2, 7),  # Chemistry -> Chemistry teacher, Class 10B
            (1, 3, 8),  # Biology -> Biology teacher, Class 10B
            (1, 4, 9),  # English -> English teacher, Class 10B
            
            # Class 11 Science subjects (class_id = classes[2].id)
            (2, 0, 10), # Advanced Math -> Math teacher, Class 11
            (2, 1, 11), # Advanced Physics -> Physics teacher, Class 11
            (2, 2, 12), # Advanced Chemistry -> Chemistry teacher, Class 11
            (2, 3, 13), # Advanced Biology -> Biology teacher, Class 11
            (2, 4, 14), # English Literature -> English teacher, Class 11
            
            # Class 12 Science subjects (class_id = classes[3].id)
            (3, 0, 15), # Calculus -> Math teacher, Class 12
            (3, 1, 16), # Quantum Physics -> Physics teacher, Class 12
            (3, 2, 17), # Organic Chemistry -> Chemistry teacher, Class 12
            (3, 3, 18), # Molecular Biology -> Biology teacher, Class 12
            (3, 4, 19), # Advanced English -> English teacher, Class 12
        ]
        
        for assignment in subject_assignments:
            class_idx, teacher_idx, subject_idx = assignment
            subject_data = MOCK_SUBJECTS[subject_idx].copy()
            
            # Set the actual IDs from created objects
            subject_data["class_id"] = classes[class_idx].id
            subject_data["teacher_id"] = teachers[teacher_idx].id
            
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
                "teacher_reviews": len(MOCK_TEACHER_REVIEWS)
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

@app.post("/admin/recreate-tables")
def recreate_database_tables():
    """Recreate all database tables (drops and creates fresh tables)"""
    try:
        # Drop all tables
        SQLModel.metadata.drop_all(engine)
        # Create all tables
        SQLModel.metadata.create_all(engine)
        
        return {"message": "Database tables recreated successfully"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error recreating tables: {str(e)}")

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

# Student-specific endpoints
@app.get("/student/{student_id}/profile", response_model=StudentRead)
def get_student_profile(student_id: int, session: Session = Depends(get_session)):
    """Get student profile with user information"""
    student = session.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Load user relationship
    if student.user_id:
        user = session.get(User, student.user_id)
        student.user = user
    
    return student

@app.get("/student/{student_id}/attendance", response_model=List[AttendanceRead])
def get_student_attendance(student_id: int, session: Session = Depends(get_session)):
    """Get all attendance records for a specific student"""
    statement = select(Attendance).where(Attendance.student_id == student_id).order_by(Attendance.date.desc())
    attendance = session.exec(statement).all()
    return attendance

@app.get("/student/{student_id}/exam-results", response_model=List[ExamResultRead])
def get_student_exam_results(student_id: int, session: Session = Depends(get_session)):
    """Get all exam results for a specific student"""
    statement = select(ExamResult).where(ExamResult.student_id == student_id)
    results = session.exec(statement).all()
    return results

@app.get("/student/{student_id}/subjects", response_model=List[SubjectRead])
def get_student_subjects(student_id: int, session: Session = Depends(get_session)):
    """Get all subjects for a student's class"""
    # First get the student to find their class
    student = session.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Get subjects for the student's class
    statement = select(Subject).where(Subject.class_id == student.class_id)
    subjects = session.exec(statement).all()
    return subjects

@app.get("/student/{student_id}/study-materials", response_model=List[StudyMaterialRead])
def get_student_study_materials(student_id: int, session: Session = Depends(get_session)):
    """Get all study materials for a student's subjects"""
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
def get_student_notices(student_id: int, session: Session = Depends(get_session)):
    """Get notices relevant to students"""
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
    # First get all subjects taught by this teacher
    teacher_subjects = session.exec(
        select(Subject).where(Subject.teacher_id == teacher_id)
    ).all()
    
    if not teacher_subjects:
        return []
    
    # Get subject IDs
    subject_ids = [subject.id for subject in teacher_subjects]
    
    # Get exams for those subjects
    statement = select(Exam).where(Exam.subject_id.in_(subject_ids))
    exams = session.exec(statement).all()
    
    return exams

@app.get("/teacher/{teacher_id}/subjects", response_model=List[SubjectRead])
def get_teacher_subjects(teacher_id: int, session: Session = Depends(get_session)):
    """Get all subjects taught by a specific teacher"""
    statement = select(Subject).where(Subject.teacher_id == teacher_id)
    subjects = session.exec(statement).all()
    return subjects

@app.get("/teacher/{teacher_id}/classes", response_model=List[ClassRead])
def get_teacher_classes(teacher_id: int, session: Session = Depends(get_session)):
    """Get all classes where the teacher is class teacher or teaches subjects"""
    # Get classes where teacher is class teacher
    class_teacher_classes = session.exec(
        select(Class).where(Class.class_teacher_id == teacher_id)
    ).all()
    
    # Get classes where teacher teaches subjects
    teacher_subjects = session.exec(
        select(Subject).where(Subject.teacher_id == teacher_id)
    ).all()
    
    subject_class_ids = [subject.class_id for subject in teacher_subjects]
    subject_classes = session.exec(
        select(Class).where(Class.id.in_(subject_class_ids))
    ).all() if subject_class_ids else []
    
    # Combine and remove duplicates
    all_classes = class_teacher_classes + subject_classes
    unique_classes = {cls.id: cls for cls in all_classes}.values()
    
    return list(unique_classes)

@app.get("/teacher/{teacher_id}/students", response_model=List[StudentRead])
def get_teacher_students(teacher_id: int, session: Session = Depends(get_session)):
    """Get all students in classes taught by a specific teacher"""
    # Get all classes taught by this teacher
    teacher_classes = get_teacher_classes(teacher_id, session)
    
    if not teacher_classes:
        return []
    
    class_ids = [cls.id for cls in teacher_classes]
    
    # Get all students in those classes
    statement = select(Student).where(Student.class_id.in_(class_ids))
    students = session.exec(statement).all()
    
    return students

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)