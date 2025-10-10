#!/usr/bin/env python3
"""
Test script to verify study material upload functionality
"""
import requests
import json
import os

BASE_URL = "http://localhost:8000"

def login_and_get_token(username="math_teacher", password="teacher123"):
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

def test_study_material_upload():
    """Test uploading a study material"""

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

    # Login as teacher
    print("🔐 Logging in as math_teacher...")
    token = login_and_get_token()
    if not token:
        print("❌ Failed to authenticate")
        return False

    print("✅ Authentication successful!")

    # Get teacher ID from token or profile
    headers = {
        "Authorization": f"Bearer {token}"
    }

    test_file_path = "/tmp/test_upload.txt"

    try:
        # Get teacher profile to find teacher ID
        profile_response = requests.get(BASE_URL + "/auth/me", headers=headers, timeout=10)
        if profile_response.status_code != 200:
            print(f"❌ Failed to get profile: {profile_response.text}")
            return False

        user_data = profile_response.json()
        user_id = user_data.get("id")
        print(f"✅ User ID: {user_id}")

        # Get teacher profile directly (assuming teacher ID is 1 for math_teacher)
        # Let's try different teacher IDs
        for teacher_id in [1, 2, 3, 4, 5]:
            try:
                teacher_response = requests.get(BASE_URL + f"/teacher/{teacher_id}/profile", headers=headers, timeout=10)
                if teacher_response.status_code == 200:
                    teacher_data = teacher_response.json()
                    if teacher_data.get("user_id") == user_id:
                        print(f"✅ Found teacher ID: {teacher_id}")
                        break
            except:
                continue
        else:
            print("❌ Could not find teacher profile")
            return False

        # Get teacher's subjects
        subjects_response = requests.get(BASE_URL + f"/teacher/{teacher_id}/subjects", headers=headers, timeout=10)
        if subjects_response.status_code != 200:
            print(f"❌ Failed to get subjects: {subjects_response.text}")
            return False

        subjects = subjects_response.json()
        if not subjects:
            print("❌ No subjects found for teacher")
            return False

        subject_id = subjects[0]["id"]
        print(f"✅ Using subject ID: {subject_id}")

        # Create a test file
        with open(test_file_path, "w") as f:
            f.write("This is a test file for upload functionality.")

        # Prepare form data
        with open(test_file_path, "rb") as f:
            files = {"file": ("test_upload.txt", f, "text/plain")}
            data = {
                "title": "Test Upload Material",
                "description": "This is a test upload to verify functionality",
                "subject_id": str(subject_id),
                "is_public": "true"
            }

            print("📤 Uploading study material...")
            upload_response = requests.post(
                BASE_URL + f"/teacher/{teacher_id}/study-materials",
                files=files,
                data=data,
                headers={"Authorization": f"Bearer {token}"},
                timeout=30
            )

            if upload_response.status_code == 200:
                result = upload_response.json()
                print("✅ Upload successful!")
                print(f"Material ID: {result.get('id')}")
                print(f"Title: {result.get('title')}")
                print(f"File path: {result.get('file_path')}")
                return True
            else:
                print(f"❌ Upload failed with status {upload_response.status_code}")
                print(f"Response: {upload_response.text}")
                return False

    except Exception as e:
        print(f"❌ Exception during upload test: {str(e)}")
        return False
    finally:
        # Clean up test file
        if os.path.exists(test_file_path):
            os.remove(test_file_path)

if __name__ == "__main__":
    test_study_material_upload()