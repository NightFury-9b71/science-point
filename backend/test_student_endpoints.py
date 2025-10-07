#!/usr/bin/env python3
"""
Quick test script to verify the new student endpoints work correctly
"""
import requests
import json

BASE_URL = "http://localhost:8000"

def test_student_endpoints():
    """Test all student endpoints with student ID 1"""
    student_id = 1
    
    endpoints = [
        f"/student/{student_id}/profile",
        f"/student/{student_id}/attendance", 
        f"/student/{student_id}/exam-results",
        f"/student/{student_id}/subjects",
        f"/student/{student_id}/study-materials",
        f"/student/{student_id}/notices"
    ]
    
    print("Testing Student API Endpoints...")
    print("=" * 50)
    
    for endpoint in endpoints:
        try:
            response = requests.get(BASE_URL + endpoint, timeout=5)
            print(f"\n🧪 Testing: {endpoint}")
            print(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    print(f"✅ Success: Returned {len(data)} items")
                    if data:
                        print(f"Sample item keys: {list(data[0].keys())}")
                else:
                    print(f"✅ Success: Returned object with keys: {list(data.keys())}")
            else:
                print(f"❌ Error: {response.text}")
                
        except requests.exceptions.ConnectionError:
            print(f"❌ Connection Error: Backend server not running on {BASE_URL}")
            return False
        except Exception as e:
            print(f"❌ Error: {str(e)}")
    
    return True

if __name__ == "__main__":
    # First check if backend is running
    try:
        health_response = requests.get(BASE_URL + "/health", timeout=5)
        if health_response.status_code == 200:
            print("✅ Backend server is running!")
            test_student_endpoints()
        else:
            print("❌ Backend server responded with error")
    except requests.exceptions.ConnectionError:
        print("❌ Backend server is not running. Please start it with:")
        print("   cd /home/nomanstine/backend && uvicorn main:app --reload --port 8000")
    except Exception as e:
        print(f"❌ Error checking backend: {str(e)}")