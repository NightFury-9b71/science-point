#!/usr/bin/env python3
import requests
import json

# Test teacher login
login_url = "http://localhost:8000/auth/login"
credentials = {
    "username": "math_teacher",
    "password": "teacher123"
}

try:
    response = requests.post(login_url, json=credentials)
    if response.status_code == 200:
        data = response.json()
        print("Login successful!")
        print("User data returned:")
        print(json.dumps(data["user"], indent=2))
        print(f"\nTeacher ID: {data['user'].get('teacher_id')}")
    else:
        print(f"Login failed with status {response.status_code}")
        print(response.text)
except requests.exceptions.ConnectionError:
    print("Cannot connect to backend server. Is it running?")
except Exception as e:
    print(f"Error: {e}")