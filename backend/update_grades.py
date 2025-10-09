#!/usr/bin/env python3
"""
Script to update existing exam results that don't have grades
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import get_session
from models import ExamResult, Exam
from sqlmodel import select

def update_missing_grades():
    """Update exam results that don't have grades"""
    session = next(get_session())

    try:
        # Find all exam results without grades
        results_without_grades = session.exec(
            select(ExamResult).where(ExamResult.grade.is_(None))
        ).all()

        print(f"Found {len(results_without_grades)} exam results without grades")

        updated_count = 0
        for result in results_without_grades:
            # Get the exam to calculate percentage
            exam = session.get(Exam, result.exam_id)
            if exam:
                percentage = (result.marks_obtained / exam.max_marks) * 100

                # Calculate grade
                if percentage >= 90:
                    grade = "A+"
                elif percentage >= 80:
                    grade = "A"
                elif percentage >= 70:
                    grade = "B+"
                else:
                    grade = "B"

                result.grade = grade
                session.add(result)
                updated_count += 1
                print(f"Updated result ID {result.id}: {result.marks_obtained}/{exam.max_marks} = {percentage:.1f}% -> Grade {grade}")

        session.commit()
        print(f"Successfully updated {updated_count} exam results with grades")

    except Exception as e:
        session.rollback()
        print(f"Error updating grades: {str(e)}")
    finally:
        session.close()

if __name__ == "__main__":
    update_missing_grades()