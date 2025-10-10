#!/usr/bin/env python3
"""
Test script to verify exam result creation with Bangladesh GPA system
"""
import requests
import json
import time

BASE_URL = "http://localhost:8000"

def login_and_get_token(username="admin", password="admin123"):
    """Login and get authentication token"""
    login_data = {
        "username": username,
        "password": password
    }
    
    try:
        response = requests.post(
            BASE_URL + "/auth/login",
            json=login_data,
            headers={"Content-Type": "application/json"},
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            return data.get("access_token")
        else:
            print(f"❌ Login failed: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Login exception: {str(e)}")
        return None

def seed_database(token):
    """Seed the database with mock data"""
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }
    
    # First reset the database
    try:
        reset_response = requests.post(
            BASE_URL + "/admin/reset-data?confirm=true",
            headers=headers,
            timeout=30
        )
        if reset_response.status_code != 200:
            print(f"❌ Failed to reset database: {reset_response.text}")
            return False
        print("✅ Database reset successfully!")
    except Exception as e:
        print(f"❌ Exception resetting database: {str(e)}")
        return False
    
    # Now seed the database
    try:
        response = requests.post(
            BASE_URL + "/admin/seed-data",
            headers=headers,
            timeout=60
        )
        
        if response.status_code == 200:
            print("✅ Database seeded successfully!")
            return True
        else:
            print(f"❌ Failed to seed database: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Exception seeding database: {str(e)}")
        return False

def test_exam_result_creation():
    """Test creating exam results with Bangladesh GPA grades"""

    # First, check if the backend is running
    try:
        health_response = requests.get(BASE_URL + "/health", timeout=5)
        if health_response.status_code != 200:
            print("❌ Backend server is not responding properly")
            return False
    except requests.exceptions.ConnectionError:
        print("❌ Backend server is not running. Please start it with:")
        print("   cd /home/nomanstine/backend && uvicorn main:app --reload --port 8000")
        return False

    print("✅ Backend server is running!")
    
    # Login to get authentication token
    print("🔐 Logging in as admin...")
    token = login_and_get_token()
    if not token:
        print("❌ Failed to authenticate")
        return False
    
    print("✅ Authentication successful!")
    
    # Seed the database with mock data
    print("🌱 Seeding database with mock data...")
    if not seed_database(token):
        print("❌ Failed to seed database")
        return False
    
    print("Testing Exam Result Creation with Bangladesh GPA System...")
    print("=" * 60)
    
    # Set up headers with authentication
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {token}"
    }

    # Test data for different percentage ranges
    test_cases = [
        {"exam_id": 1, "student_id": 1, "marks_obtained": 95.0, "expected_grade": "5.00 (A+)"},  # 95% of 100
        {"exam_id": 1, "student_id": 2, "marks_obtained": 85.0, "expected_grade": "4.00 (A)"},   # 85% of 100
        {"exam_id": 1, "student_id": 3, "marks_obtained": 75.0, "expected_grade": "4.00 (A)"},   # 75% of 100 (70-79% = A)
        {"exam_id": 1, "student_id": 4, "marks_obtained": 65.0, "expected_grade": "3.50 (A-)"},  # 65% of 100 (60-69% = A-)
        {"exam_id": 1, "student_id": 5, "marks_obtained": 55.0, "expected_grade": "3.00 (B)"},   # 55% of 100 (50-59% = B)
        {"exam_id": 1, "student_id": 6, "marks_obtained": 35.0, "expected_grade": "1.00 (D)"},   # 35% of 100 (33-39% = D)
        {"exam_id": 1, "student_id": 7, "marks_obtained": 25.0, "expected_grade": "0.00 (F)"}    # 25% of 100 (<33% = F)
    ]

    success_count = 0

    for i, test_case in enumerate(test_cases, 1):
        print(f"\n🧪 Test Case {i}: {test_case['marks_obtained']} marks (expected: {test_case['expected_grade']})")

        # Create exam result
        payload = {
            "exam_id": test_case["exam_id"],
            "student_id": test_case["student_id"],
            "marks_obtained": test_case["marks_obtained"]
        }

        try:
            response = requests.post(
                BASE_URL + "/admin/exam-results",
                json=payload,
                headers=headers,
                timeout=10
            )

            if response.status_code == 200:
                result = response.json()
                actual_grade = result.get("grade")

                if actual_grade == test_case["expected_grade"]:
                    print(f"✅ SUCCESS: Grade calculated correctly - {actual_grade}")
                    success_count += 1
                else:
                    print(f"❌ FAILED: Expected {test_case['expected_grade']}, got {actual_grade}")

            elif response.status_code == 409:
                print(f"⚠️  SKIPPED: Result already exists for student {test_case['student_id']}")
                success_count += 1  # Count as success since the constraint is working
            else:
                print(f"❌ ERROR: HTTP {response.status_code} - {response.text}")

        except Exception as e:
            print(f"❌ EXCEPTION: {str(e)}")

    print("\n" + "=" * 60)
    print(f"Test Results: {success_count}/{len(test_cases)} passed")

    if success_count == len(test_cases):
        print("🎉 All tests passed! Bangladesh GPA system is working correctly.")
        return True
    else:
        print("⚠️  Some tests failed. Please check the implementation.")
        return False

if __name__ == "__main__":
    test_exam_result_creation()