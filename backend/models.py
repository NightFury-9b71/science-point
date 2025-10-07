from sqlmodel import SQLModel, Field, Relationship
from typing import Optional, List
from datetime import datetime
from enum import Enum

class UserRole(str, Enum):
    STUDENT = "student"
    TEACHER = "teacher"
    ADMIN = "admin"

class AttendanceStatus(str, Enum):
    PRESENT = "present"
    ABSENT = "absent"
    LATE = "late"

# Base models for table creation
class UserBase(SQLModel):
    username: str = Field(max_length=50, unique=True, index=True)
    email: str = Field(max_length=100, unique=True, index=True)
    full_name: str = Field(max_length=100)
    phone: Optional[str] = Field(default=None, max_length=15)
    role: UserRole
    is_active: bool = Field(default=True)

class User(UserBase, table=True):
    __tablename__ = "users"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    password_hash: str = Field(max_length=255)
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    
    # Relationships
    student: Optional["Student"] = Relationship(back_populates="user")
    teacher: Optional["Teacher"] = Relationship(back_populates="user")

# User creation/response models
class UserCreate(UserBase):
    password: str = Field(min_length=6, max_length=50)

class UserRead(UserBase):
    id: int
    created_at: datetime

class StudentBase(SQLModel):
    roll_number: str = Field(max_length=20, unique=True)
    parent_name: Optional[str] = Field(default=None, max_length=100)
    parent_phone: Optional[str] = Field(default=None, max_length=15)
    address: Optional[str] = Field(default=None)
    date_of_birth: Optional[datetime] = Field(default=None)

class Student(StudentBase, table=True):
    __tablename__ = "students"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", unique=True)
    class_id: int = Field(foreign_key="classes.id")
    admission_date: Optional[datetime] = Field(default_factory=datetime.utcnow)
    
    # Relationships
    user: Optional[User] = Relationship(back_populates="student")
    class_assigned: Optional["Class"] = Relationship(back_populates="students")
    attendances: List["Attendance"] = Relationship(back_populates="student")
    exam_results: List["ExamResult"] = Relationship(back_populates="student")

class StudentCreate(StudentBase):
    user: UserCreate
    class_id: int

class StudentRead(StudentBase):
    id: int
    user_id: int
    class_id: int
    admission_date: datetime
    user: Optional[UserRead] = None

class TeacherBase(SQLModel):
    employee_id: str = Field(max_length=20, unique=True)
    qualification: Optional[str] = Field(default=None, max_length=100)
    experience_years: Optional[int] = Field(default=0, ge=0)
    salary: Optional[float] = Field(default=None, ge=0)

class Teacher(TeacherBase, table=True):
    __tablename__ = "teachers"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: int = Field(foreign_key="users.id", unique=True)
    joining_date: Optional[datetime] = Field(default_factory=datetime.utcnow)
    
    # Relationships
    user: Optional[User] = Relationship(back_populates="teacher")
    subjects: List["Subject"] = Relationship(back_populates="teacher")
    classes: List["Class"] = Relationship(back_populates="class_teacher")
    reviews: List["TeacherReview"] = Relationship(back_populates="teacher")

class TeacherCreate(TeacherBase):
    user: UserCreate

class TeacherRead(TeacherBase):
    id: int
    user_id: int
    joining_date: datetime
    user: Optional[UserRead] = None

class ClassBase(SQLModel):
    name: str = Field(max_length=50, unique=True)
    grade: int = Field(ge=6, le=12)
    section: Optional[str] = Field(default=None, max_length=10)
    academic_year: Optional[str] = Field(default=None, max_length=10)
    capacity: int = Field(default=30, ge=1, le=100)

class Class(ClassBase, table=True):
    __tablename__ = "classes"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    class_teacher_id: Optional[int] = Field(default=None, foreign_key="teachers.id")
    
    # Relationships
    class_teacher: Optional[Teacher] = Relationship(back_populates="classes")
    students: List[Student] = Relationship(back_populates="class_assigned")
    subjects: List["Subject"] = Relationship(back_populates="class_assigned")
    attendances: List["Attendance"] = Relationship(back_populates="class_session")
    exams: List["Exam"] = Relationship(back_populates="class_assigned")

class ClassCreate(ClassBase):
    class_teacher_id: Optional[int] = None

class ClassRead(ClassBase):
    id: int
    class_teacher_id: Optional[int] = None

class SubjectBase(SQLModel):
    name: str = Field(max_length=100)
    code: str = Field(max_length=10, unique=True)
    credits: int = Field(default=1, ge=1, le=10)

class Subject(SubjectBase, table=True):
    __tablename__ = "subjects"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    class_id: int = Field(foreign_key="classes.id")
    teacher_id: int = Field(foreign_key="teachers.id")
    
    # Relationships
    class_assigned: Optional[Class] = Relationship(back_populates="subjects")
    teacher: Optional[Teacher] = Relationship(back_populates="subjects")
    study_materials: List["StudyMaterial"] = Relationship(back_populates="subject")
    exams: List["Exam"] = Relationship(back_populates="subject")

class SubjectCreate(SubjectBase):
    class_id: int
    teacher_id: int

class SubjectRead(SubjectBase):
    id: int
    class_id: int
    teacher_id: int

class AttendanceBase(SQLModel):
    date: datetime
    status: AttendanceStatus
    remarks: Optional[str] = Field(default=None)

class Attendance(AttendanceBase, table=True):
    __tablename__ = "attendances"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    student_id: int = Field(foreign_key="students.id")
    class_id: int = Field(foreign_key="classes.id")
    
    # Relationships
    student: Optional[Student] = Relationship(back_populates="attendances")
    class_session: Optional[Class] = Relationship(back_populates="attendances")

class AttendanceCreate(AttendanceBase):
    student_id: int
    class_id: int

class AttendanceRead(AttendanceBase):
    id: int
    student_id: int
    class_id: int

class ExamBase(SQLModel):
    name: str = Field(max_length=100)
    exam_date: datetime
    max_marks: int = Field(gt=0)
    duration_minutes: int = Field(default=120, gt=0)

class Exam(ExamBase, table=True):
    __tablename__ = "exams"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    subject_id: int = Field(foreign_key="subjects.id")
    class_id: int = Field(foreign_key="classes.id")
    
    # Relationships
    subject: Optional[Subject] = Relationship(back_populates="exams")
    class_assigned: Optional[Class] = Relationship(back_populates="exams")
    results: List["ExamResult"] = Relationship(back_populates="exam")

class ExamCreate(ExamBase):
    subject_id: int
    class_id: int

class ExamRead(ExamBase):
    id: int
    subject_id: int
    class_id: int

class ExamResultBase(SQLModel):
    marks_obtained: float = Field(ge=0)
    grade: Optional[str] = Field(default=None, max_length=5)
    remarks: Optional[str] = Field(default=None)

class ExamResult(ExamResultBase, table=True):
    __tablename__ = "exam_results"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    exam_id: int = Field(foreign_key="exams.id")
    student_id: int = Field(foreign_key="students.id")
    
    # Relationships
    exam: Optional[Exam] = Relationship(back_populates="results")
    student: Optional[Student] = Relationship(back_populates="exam_results")

class ExamResultCreate(ExamResultBase):
    exam_id: int
    student_id: int

class ExamResultRead(ExamResultBase):
    id: int
    exam_id: int
    student_id: int

class StudyMaterialBase(SQLModel):
    title: str = Field(max_length=200)
    description: Optional[str] = Field(default=None)
    file_path: Optional[str] = Field(default=None, max_length=500)
    file_type: Optional[str] = Field(default=None, max_length=50)
    is_public: bool = Field(default=True)

class StudyMaterial(StudyMaterialBase, table=True):
    __tablename__ = "study_materials"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    subject_id: int = Field(foreign_key="subjects.id")
    created_by_id: int = Field(foreign_key="users.id")
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    
    # Relationships
    subject: Optional[Subject] = Relationship(back_populates="study_materials")
    created_by: Optional[User] = Relationship()

class StudyMaterialCreate(StudyMaterialBase):
    subject_id: int

class StudyMaterialRead(StudyMaterialBase):
    id: int
    subject_id: int
    created_by_id: int
    created_at: datetime

class NoticeBase(SQLModel):
    title: str = Field(max_length=200)
    content: str = Field(min_length=10)
    target_role: Optional[UserRole] = Field(default=None)
    is_urgent: bool = Field(default=False)
    expires_at: Optional[datetime] = Field(default=None)
    is_active: bool = Field(default=True)

class Notice(NoticeBase, table=True):
    __tablename__ = "notices"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    created_by_id: int = Field(foreign_key="users.id")
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    
    # Relationships
    created_by: Optional[User] = Relationship()

class NoticeCreate(NoticeBase):
    pass

class NoticeRead(NoticeBase):
    id: int
    created_by_id: int
    created_at: datetime

class TeacherReviewBase(SQLModel):
    teaching_quality: Optional[int] = Field(default=None, ge=1, le=5)
    punctuality: Optional[int] = Field(default=None, ge=1, le=5)
    student_engagement: Optional[int] = Field(default=None, ge=1, le=5)
    comments: Optional[str] = Field(default=None)

class TeacherReview(TeacherReviewBase, table=True):
    __tablename__ = "teacher_reviews"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    teacher_id: int = Field(foreign_key="teachers.id")
    reviewed_by_id: int = Field(foreign_key="users.id")
    overall_rating: Optional[float] = Field(default=None)
    review_date: Optional[datetime] = Field(default_factory=datetime.utcnow)
    
    # Relationships
    teacher: Optional[Teacher] = Relationship(back_populates="reviews")
    reviewed_by: Optional[User] = Relationship()

class TeacherReviewCreate(TeacherReviewBase):
    teacher_id: int

class TeacherReviewRead(TeacherReviewBase):
    id: int
    teacher_id: int
    reviewed_by_id: int
    overall_rating: Optional[float] = None
    review_date: datetime

# Dashboard schemas
class DashboardStats(SQLModel):
    total_students: int
    total_teachers: int
    total_classes: int
    total_subjects: int
    recent_notices: List[NoticeRead]