#!/usr/bin/env python3
"""
Standalone script to seed mock data into the database.
This script can be run independently of the FastAPI server.
"""

import os
import sys
from sqlmodel import Session, select
from database import engine, create_db_and_tables
from models import *
from mock_data import *

def seed_database():
    """Seed the database with mock data"""
    print("🌱 Starting database seeding...")

    # Create tables if they don't exist
    create_db_and_tables()

    with Session(engine) as session:
        try:
            # Check if data already exists
            existing_users = session.exec(select(User)).first()
            if existing_users:
                print("❌ Database already contains data. Please reset first.")
                return

            print("📝 Seeding users...")
            users = []
            for user_data in MOCK_USERS:
                user = User(**user_data)
                session.add(user)
                users.append(user)
            session.flush()

            print("👨‍🏫 Seeding teachers...")
            teachers = []
            for teacher_data in MOCK_TEACHERS:
                teacher = Teacher(**teacher_data)
                session.add(teacher)
                teachers.append(teacher)
            session.flush()

            print("🏫 Seeding classes...")
            classes = []
            for class_data in MOCK_CLASSES:
                class_obj = Class(**class_data)
                session.add(class_obj)
                classes.append(class_obj)
            session.flush()

            print("👨‍🎓 Seeding students...")
            students = []
            for student_data in MOCK_STUDENTS:
                student = Student(**student_data)
                session.add(student)
                students.append(student)
            session.flush()

            print("📚 Seeding subjects...")
            subjects = []
            subject_assignments = [
                (0, 0), (0, 1), (0, 2), (0, 3), (0, 4),  # Class 10A
                (1, 5), (1, 6), (1, 7), (1, 8), (1, 9),  # Class 10B
                (2, 10), (2, 11), (2, 12), (2, 13), (2, 14),  # Class 11 Science
                (3, 15), (3, 16), (3, 17), (3, 18), (3, 19)   # Class 12 Science
            ]

            for assignment in subject_assignments:
                class_idx, subject_idx = assignment
                subject_data = MOCK_SUBJECTS[subject_idx].copy()
                subject_data["class_id"] = classes[class_idx].id
                subject = Subject(**subject_data)
                session.add(subject)
                subjects.append(subject)
            session.flush()

            print("📊 Seeding attendance...")
            for attendance_data in MOCK_ATTENDANCE:
                attendance = Attendance(**attendance_data)
                session.add(attendance)

            print("📝 Seeding exams...")
            exams = []
            for exam_data in MOCK_EXAMS:
                exam = Exam(**exam_data)
                session.add(exam)
                exams.append(exam)
            session.flush()

            print("📈 Seeding exam results...")
            for result_data in MOCK_EXAM_RESULTS:
                result = ExamResult(**result_data)
                session.add(result)

            print("📁 Seeding study materials...")
            for material_data in MOCK_STUDY_MATERIALS:
                material = StudyMaterial(**material_data)
                session.add(material)

            print("📢 Seeding notices...")
            for notice_data in MOCK_NOTICES:
                notice = Notice(**notice_data)
                session.add(notice)

            print("⭐ Seeding teacher reviews...")
            for review_data in MOCK_TEACHER_REVIEWS:
                review = TeacherReview(**review_data)
                session.add(review)

            print("📅 Seeding class schedules...")
            for schedule_data in MOCK_CLASS_SCHEDULES:
                schedule = ClassSchedule(**schedule_data)
                session.add(schedule)

            print("🔑 Seeding admin creation code...")
            admin_code = AdminCreationCode(**MOCK_ADMIN_CREATION_CODE)
            session.add(admin_code)

            session.commit()

            print("✅ Database seeding completed successfully!")
            print(f"   Users: {len(MOCK_USERS)}")
            print(f"   Teachers: {len(MOCK_TEACHERS)}")
            print(f"   Students: {len(MOCK_STUDENTS)}")
            print(f"   Classes: {len(MOCK_CLASSES)}")
            print(f"   Subjects: {len(MOCK_SUBJECTS)}")
            print(f"   Attendance records: {len(MOCK_ATTENDANCE)}")
            print(f"   Exams: {len(MOCK_EXAMS)}")
            print(f"   Exam results: {len(MOCK_EXAM_RESULTS)}")
            print(f"   Study materials: {len(MOCK_STUDY_MATERIALS)}")
            print(f"   Notices: {len(MOCK_NOTICES)}")
            print(f"   Teacher reviews: {len(MOCK_TEACHER_REVIEWS)}")
            print(f"   Class schedules: {len(MOCK_CLASS_SCHEDULES)}")
            print(f"   Admin creation code: {MOCK_ADMIN_CREATION_CODE['code']}")

        except Exception as e:
            session.rollback()
            print(f"❌ Error seeding database: {e}")
            sys.exit(1)

if __name__ == "__main__":
    seed_database()