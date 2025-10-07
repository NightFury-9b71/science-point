# Since we're using SQLModel, most schemas are now in models.py
# This file contains only additional utility schemas that don't correspond to database tables

from pydantic import BaseModel
from typing import List, Optional

# Login schema
class LoginRequest(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict  # Will contain user info with role-specific data

# Performance/Analytics schemas
class StudentPerformance(BaseModel):
    student_id: int
    student_name: str
    roll_number: str
    class_name: str
    attendance_percentage: float
    average_marks: float
    total_exams: int

class TeacherPerformance(BaseModel):
    teacher_id: int
    teacher_name: str
    employee_id: str
    subjects_taught: int
    classes_assigned: int
    average_rating: Optional[float] = None
    total_reviews: int

# Update schemas for partial updates
class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    full_name: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None

class StudentUpdate(BaseModel):
    user: Optional[UserUpdate] = None
    roll_number: Optional[str] = None
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    address: Optional[str] = None
    class_id: Optional[int] = None
    date_of_birth: Optional[str] = None

class PasswordUpdate(BaseModel):
    password: str

class TeacherUpdate(BaseModel):
    user: Optional[UserUpdate] = None
    qualification: Optional[str] = None
    experience_years: Optional[int] = None
    salary: Optional[float] = None

class ClassUpdate(BaseModel):
    name: Optional[str] = None
    section: Optional[str] = None
    class_teacher_id: Optional[int] = None
    capacity: Optional[int] = None

class SubjectUpdate(BaseModel):
    name: Optional[str] = None
    teacher_id: Optional[int] = None
    credits: Optional[int] = None

class AttendanceUpdate(BaseModel):
    status: Optional[str] = None
    remarks: Optional[str] = None

class ExamUpdate(BaseModel):
    name: Optional[str] = None
    exam_date: Optional[str] = None
    max_marks: Optional[int] = None
    duration_minutes: Optional[int] = None

class ExamResultUpdate(BaseModel):
    marks_obtained: Optional[float] = None
    grade: Optional[str] = None
    remarks: Optional[str] = None

class StudyMaterialUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    is_public: Optional[bool] = None

class NoticeUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    is_urgent: Optional[bool] = None
    is_active: Optional[bool] = None

class TeacherReviewUpdate(BaseModel):
    teaching_quality: Optional[int] = None
    punctuality: Optional[int] = None
    student_engagement: Optional[int] = None
    comments: Optional[str] = None