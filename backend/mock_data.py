from datetime import datetime, timedelta
from models import *
from passlib.context import CryptContext

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

# Mock data for seeding the database
MOCK_USERS = [
    # Admin users
    {
        "username": "admin",
        "email": "admin@coaching.com",
        "password_hash": get_password_hash("admin123"),
        "full_name": "System Administrator",
        "phone": "1234567890",
        "role": UserRole.ADMIN,
        "is_active": True
    },
    {
        "username": "principal",
        "email": "principal@coaching.com",
        "password_hash": get_password_hash("principal123"),
        "full_name": "Dr. Sarah Johnson",
        "phone": "1234567891",
        "role": UserRole.ADMIN,
        "is_active": True
    },
    
    # Teacher users
    {
        "username": "math_teacher",
        "email": "math@coaching.com",
        "password_hash": get_password_hash("teacher123"),
        "full_name": "Prof. John Smith",
        "phone": "9876543210",
        "role": UserRole.TEACHER,
        "is_active": True
    },
    {
        "username": "physics_teacher",
        "email": "physics@coaching.com",
        "password_hash": get_password_hash("teacher123"),
        "full_name": "Dr. Emily Chen",
        "phone": "9876543211",
        "role": UserRole.TEACHER,
        "is_active": True
    },
    {
        "username": "chemistry_teacher",
        "email": "chemistry@coaching.com",
        "password_hash": get_password_hash("teacher123"),
        "full_name": "Mr. Robert Davis",
        "phone": "9876543212",
        "role": UserRole.TEACHER,
        "is_active": True
    },
    {
        "username": "biology_teacher",
        "email": "biology@coaching.com",
        "password_hash": get_password_hash("teacher123"),
        "full_name": "Ms. Lisa Brown",
        "phone": "9876543213",
        "role": UserRole.TEACHER,
        "is_active": True
    },
    {
        "username": "english_teacher",
        "email": "english@coaching.com",
        "password_hash": get_password_hash("teacher123"),
        "full_name": "Mrs. Jennifer Wilson",
        "phone": "9876543214",
        "role": UserRole.TEACHER,
        "is_active": True
    },
    
    # Student users
    {
        "username": "student001",
        "email": "alice@student.com",
        "password_hash": get_password_hash("student123"),
        "full_name": "Alice Johnson",
        "phone": "5551234567",
        "role": UserRole.STUDENT,
        "is_active": True
    },
    {
        "username": "student002",
        "email": "bob@student.com",
        "password_hash": get_password_hash("student123"),
        "full_name": "Bob Smith",
        "phone": "5551234568",
        "role": UserRole.STUDENT,
        "is_active": True
    },
    {
        "username": "student003",
        "email": "charlie@student.com",
        "password_hash": get_password_hash("student123"),
        "full_name": "Charlie Brown",
        "phone": "5551234569",
        "role": UserRole.STUDENT,
        "is_active": True
    },
    {
        "username": "student004",
        "email": "diana@student.com",
        "password_hash": get_password_hash("student123"),
        "full_name": "Diana Prince",
        "phone": "5551234570",
        "role": UserRole.STUDENT,
        "is_active": True
    },
    {
        "username": "student005",
        "email": "eve@student.com",
        "password_hash": get_password_hash("student123"),
        "full_name": "Eve Martinez",
        "phone": "5551234571",
        "role": UserRole.STUDENT,
        "is_active": True
    },
    {
        "username": "student006",
        "email": "frank@student.com",
        "password_hash": get_password_hash("student123"),
        "full_name": "Frank Wilson",
        "phone": "5551234572",
        "role": UserRole.STUDENT,
        "is_active": True
    },
    {
        "username": "student007",
        "email": "grace@student.com",
        "password_hash": get_password_hash("student123"),
        "full_name": "Grace Lee",
        "phone": "5551234573",
        "role": UserRole.STUDENT,
        "is_active": True
    },
    {
        "username": "student008",
        "email": "henry@student.com",
        "password_hash": get_password_hash("student123"),
        "full_name": "Henry Davis",
        "phone": "5551234574",
        "role": UserRole.STUDENT,
        "is_active": True
    }
]

MOCK_TEACHERS = [
    {
        "user_id": 3,  # math_teacher
        "employee_id": "T001",
        "qualification": "M.Sc Mathematics, B.Ed",
        "experience_years": 8,
        "salary": 45000.0
    },
    {
        "user_id": 4,  # physics_teacher
        "employee_id": "T002",
        "qualification": "Ph.D Physics",
        "experience_years": 12,
        "salary": 55000.0
    },
    {
        "user_id": 5,  # chemistry_teacher
        "employee_id": "T003",
        "qualification": "M.Sc Chemistry, B.Ed",
        "experience_years": 6,
        "salary": 42000.0
    },
    {
        "user_id": 6,  # biology_teacher
        "employee_id": "T004",
        "qualification": "M.Sc Biology, B.Ed",
        "experience_years": 5,
        "salary": 40000.0
    },
    {
        "user_id": 7,  # english_teacher
        "employee_id": "T005",
        "qualification": "M.A English Literature",
        "experience_years": 10,
        "salary": 38000.0
    }
]

MOCK_CLASSES = [
    {
        "name": "Class 10A",
        "grade": 10,
        "section": "A",
        "class_teacher_id": None,  # Will be set to actual teacher ID after creation
        "academic_year": "2024-25",
        "capacity": 30
    },
    {
        "name": "Class 10B",
        "grade": 10,
        "section": "B",
        "class_teacher_id": None,
        "academic_year": "2024-25",
        "capacity": 30
    },
    {
        "name": "Class 11 Science",
        "grade": 11,
        "section": "Science",
        "class_teacher_id": None,
        "academic_year": "2024-25",
        "capacity": 25
    },
    {
        "name": "Class 12 Science",
        "grade": 12,
        "section": "Science",
        "class_teacher_id": None,
        "academic_year": "2024-25",
        "capacity": 25
    }
]

MOCK_STUDENTS = [
    # Class 10A students
    {
        "user_id": 8,  # Alice
        "roll_number": "2024001",
        "class_id": 1,
        "parent_name": "Mr. David Johnson",
        "parent_phone": "1111111111",
        "address": "123 Main St, City",
        "date_of_birth": datetime(2009, 5, 15)
    },
    {
        "user_id": 9,  # Bob
        "roll_number": "2024002",
        "class_id": 1,
        "parent_name": "Mrs. Mary Smith",
        "parent_phone": "1111111112",
        "address": "456 Oak Ave, City",
        "date_of_birth": datetime(2009, 8, 22)
    },
    
    # Class 10B students
    {
        "user_id": 10,  # Charlie
        "roll_number": "2024003",
        "class_id": 2,
        "parent_name": "Mr. James Brown",
        "parent_phone": "1111111113",
        "address": "789 Pine St, City",
        "date_of_birth": datetime(2009, 3, 10)
    },
    {
        "user_id": 11,  # Diana
        "roll_number": "2024004",
        "class_id": 2,
        "parent_name": "Ms. Angela Prince",
        "parent_phone": "1111111114",
        "address": "321 Elm St, City",
        "date_of_birth": datetime(2009, 12, 5)
    },
    
    # Class 11 Science students
    {
        "user_id": 12,  # Eve
        "roll_number": "2024005",
        "class_id": 3,
        "parent_name": "Mr. Carlos Martinez",
        "parent_phone": "1111111115",
        "address": "654 Maple Ave, City",
        "date_of_birth": datetime(2008, 7, 18)
    },
    {
        "user_id": 13,  # Frank
        "roll_number": "2024006",
        "class_id": 3,
        "parent_name": "Mrs. Susan Wilson",
        "parent_phone": "1111111116",
        "address": "987 Cedar St, City",
        "date_of_birth": datetime(2008, 11, 30)
    },
    
    # Class 12 Science students
    {
        "user_id": 14,  # Grace
        "roll_number": "2024007",
        "class_id": 4,
        "parent_name": "Mr. Michael Lee",
        "parent_phone": "1111111117",
        "address": "147 Birch Ave, City",
        "date_of_birth": datetime(2007, 4, 25)
    },
    {
        "user_id": 15,  # Henry
        "roll_number": "2024008",
        "class_id": 4,
        "parent_name": "Mrs. Linda Davis",
        "parent_phone": "1111111118",
        "address": "258 Spruce St, City",
        "date_of_birth": datetime(2007, 9, 12)
    }
]

MOCK_SUBJECTS = [
    # Class 10A subjects - will be updated with actual IDs during seeding
    {"name": "Mathematics", "code": None, "class_id": None, "credits": 4},
    {"name": "Physics", "code": None, "class_id": None, "credits": 3},
    {"name": "Chemistry", "code": None, "class_id": None, "credits": 3},
    {"name": "Biology", "code": None, "class_id": None, "credits": 3},
    {"name": "English", "code": None, "class_id": None, "credits": 2},
    
    # Class 10B subjects
    {"name": "Mathematics", "code": None, "class_id": None, "credits": 4},
    {"name": "Physics", "code": None, "class_id": None, "credits": 3},
    {"name": "Chemistry", "code": None, "class_id": None, "credits": 3},
    {"name": "Biology", "code": None, "class_id": None, "credits": 3},
    {"name": "English", "code": None, "class_id": None, "credits": 2},
    
    # Class 11 Science subjects
    {"name": "Advanced Mathematics", "code": None, "class_id": None, "credits": 5},
    {"name": "Advanced Physics", "code": None, "class_id": None, "credits": 4},
    {"name": "Advanced Chemistry", "code": None, "class_id": None, "credits": 4},
    {"name": "Advanced Biology", "code": None, "class_id": None, "credits": 4},
    {"name": "English Literature", "code": None, "class_id": None, "credits": 2},
    
    # Class 12 Science subjects
    {"name": "Calculus", "code": None, "class_id": None, "credits": 5},
    {"name": "Quantum Physics", "code": None, "class_id": None, "credits": 4},
    {"name": "Organic Chemistry", "code": None, "class_id": None, "credits": 4},
    {"name": "Molecular Biology", "code": None, "class_id": None, "credits": 4},
    {"name": "Advanced English", "code": None, "class_id": None, "credits": 2}
]

# Generate attendance data for the last 30 days
def generate_attendance_data():
    attendance_data = []
    base_date = datetime.now() - timedelta(days=30)
    
    # For each student
    for student_id in range(1, 9):  # 8 students
        for day in range(30):
            current_date = base_date + timedelta(days=day)
            # Skip weekends
            if current_date.weekday() < 5:  # Monday = 0, Friday = 4
                # 85% chance of being present
                import random
                status = AttendanceStatus.PRESENT if random.random() < 0.85 else AttendanceStatus.ABSENT
                
                attendance_data.append({
                    "student_id": student_id,
                    "class_id": (student_id - 1) // 2 + 1,  # Distribute students across classes
                    "date": current_date,
                    "status": status,
                    "remarks": "Regular attendance" if status == AttendanceStatus.PRESENT else "Absent"
                })
    
    return attendance_data

MOCK_ATTENDANCE = generate_attendance_data()

MOCK_EXAMS = [
    # Class 10A exams
    {"name": "Mid Term Math", "subject_id": 1, "class_id": 1, "exam_date": datetime(2024, 10, 15), "max_marks": 100, "duration_minutes": 120},
    {"name": "Mid Term Physics", "subject_id": 2, "class_id": 1, "exam_date": datetime(2024, 10, 17), "max_marks": 80, "duration_minutes": 90},
    {"name": "Mid Term Chemistry", "subject_id": 3, "class_id": 1, "exam_date": datetime(2024, 10, 19), "max_marks": 80, "duration_minutes": 90},
    
    # Class 10B exams
    {"name": "Mid Term Math", "subject_id": 6, "class_id": 2, "exam_date": datetime(2024, 10, 16), "max_marks": 100, "duration_minutes": 120},
    {"name": "Mid Term Physics", "subject_id": 7, "class_id": 2, "exam_date": datetime(2024, 10, 18), "max_marks": 80, "duration_minutes": 90},
    
    # Class 11 Science exams
    {"name": "Unit Test Math", "subject_id": 11, "class_id": 3, "exam_date": datetime(2024, 10, 20), "max_marks": 50, "duration_minutes": 60},
    {"name": "Unit Test Physics", "subject_id": 12, "class_id": 3, "exam_date": datetime(2024, 10, 22), "max_marks": 50, "duration_minutes": 60},
    
    # Class 12 Science exams
    {"name": "Pre-Board Math", "subject_id": 16, "class_id": 4, "exam_date": datetime(2024, 10, 25), "max_marks": 100, "duration_minutes": 180},
    {"name": "Pre-Board Physics", "subject_id": 17, "class_id": 4, "exam_date": datetime(2024, 10, 27), "max_marks": 100, "duration_minutes": 180}
]

# Generate exam results
def generate_exam_results():
    results = []
    import random
    
    # Map students to their exams based on class
    student_class_map = {
        1: 1, 2: 1,  # Class 10A
        3: 2, 4: 2,  # Class 10B
        5: 3, 6: 3,  # Class 11 Science
        7: 4, 8: 4   # Class 12 Science
    }
    
    exam_class_map = {
        1: 1, 2: 1, 3: 1,  # Class 10A exams
        4: 2, 5: 2,        # Class 10B exams
        6: 3, 7: 3,        # Class 11 Science exams
        8: 4, 9: 4         # Class 12 Science exams
    }
    
    for exam_id, class_id in exam_class_map.items():
        # Find students in this class
        students_in_class = [student_id for student_id, student_class in student_class_map.items() if student_class == class_id]
        
        # Get max marks for this exam
        exam_max_marks = MOCK_EXAMS[exam_id - 1]["max_marks"]
        
        for student_id in students_in_class:
            # Generate random marks (70-95% of max marks)
            percentage = random.uniform(0.70, 0.95)
            marks = round(exam_max_marks * percentage, 1)
            
            # Assign grade based on percentage
            if percentage >= 0.90:
                grade = "A+"
            elif percentage >= 0.80:
                grade = "A"
            elif percentage >= 0.70:
                grade = "B+"
            else:
                grade = "B"
            
            results.append({
                "exam_id": exam_id,
                "student_id": student_id,
                "marks_obtained": marks,
                "grade": grade,
                "remarks": "Good performance" if percentage >= 0.80 else "Needs improvement"
            })
    
    return results

MOCK_EXAM_RESULTS = generate_exam_results()

MOCK_STUDY_MATERIALS = [
    {"title": "Sample Image", "description": "A sample uploaded image", "subject_id": 1, "created_by_id": 1, "file_path": "study_materials/20251008_052514_1_1.jpg", "file_type": "image/jpeg", "file_size": 53754, "is_public": True}
]

MOCK_NOTICES = [
    {
        "title": "নতুন শিক্ষাবর্ষে স্বাগতম",
        "content": "🎉 নতুন ব্যাচ শুরু হবে ১৫ অক্টোবর থেকে - সীমিত আসন! এখনই ভর্তি হন এবং বিশেষ ছাড় পান।",
        "created_by_id": 1,
        "target_role": None,  # For all users
        "is_urgent": False,
        "show_on_landing": True,
        "expires_at": datetime(2025, 12, 31),
        "is_active": True
    },
    {
        "title": "HSC ২০২৬ ব্যাচের ভর্তি",
        "content": "📚 HSC ২০২৬ ব্যাচের ভর্তি চলছে - বিশেষ ছাড়ে! গণিত, পদার্থ, রসায়ন ও জীববিজ্ঞানে বিশেষজ্ঞ শিক্ষকমণ্ডলী।",
        "created_by_id": 1,
        "target_role": UserRole.STUDENT,
        "is_urgent": True,
        "show_on_landing": True,
        "expires_at": datetime(2025, 11, 30),
        "is_active": True
    },
    {
        "title": "পরীক্ষার ফলাফল ঘোষণা",
        "content": "🏆 আমাদের ৫০+ শিক্ষার্থী এবছর A+ পেয়েছে! সায়েন্স পয়েন্টের সফলতার গল্প অব্যাহত।",
        "created_by_id": 1,
        "target_role": None,
        "is_urgent": False,
        "show_on_landing": True,
        "expires_at": datetime(2025, 10, 31),
        "is_active": True
    },
    {
        "title": "বিনামূল্যে মডেল টেস্ট",
        "content": "📝 বিনামূল্যে মডেল টেস্ট প্রতি শনিবার। SSC ও HSC পরীক্ষার্থীদের জন্য বিশেষ প্রস্তুতি।",
        "created_by_id": 2,
        "target_role": UserRole.STUDENT,
        "is_urgent": False,
        "show_on_landing": True,
        "expires_at": datetime(2025, 12, 31),
        "is_active": True
    },
    {
        "title": "বিশেষ ক্লাস শুরু",
        "content": "🎯 গণিত ও পদার্থবিজ্ঞানে বিশেষ ক্লাস শুরু। দুর্বল শিক্ষার্থীদের জন্য অতিরিক্ত যত্ন ও মনোযোগ।",
        "created_by_id": 1,
        "target_role": None,
        "is_urgent": False,
        "show_on_landing": True,
        "expires_at": datetime(2025, 11, 15),
        "is_active": True
    },
    {
        "title": "অভিভাবক সভা",
        "content": "শিক্ষক-অভিভাবক সভা অনুষ্ঠিত হবে নভেম্বর ৫-৬, ২০২৪ তারিখে। দয়া করে নিজ নিজ ক্লাস শিক্ষকের সাথে সময় নির্ধারণ করুন।",
        "created_by_id": 2,
        "target_role": None,
        "is_urgent": False,
        "show_on_landing": False,
        "expires_at": datetime(2024, 11, 7),
        "is_active": True
    },
    {
        "title": "ছুটির নোটিশ",
        "content": "দীপাবলি উৎসব উপলক্ষে নভেম্বর ১৫, ২০২৪ তারিখে কোচিং সেন্টার বন্ধ থাকবে। নিয়মিত ক্লাস ১৬ নভেম্বর থেকে শুরু হবে।",
        "created_by_id": 1,
        "target_role": None,
        "is_urgent": False,
        "show_on_landing": False,
        "expires_at": datetime(2024, 11, 16),
        "is_active": True
    },
    {
        "title": "নতুন শিক্ষক নিয়োগ",
        "content": "🎓 আমাদের টিমে যুক্ত হয়েছেন নতুন অভিজ্ঞ শিক্ষকমণ্ডলী। গণিত ও বিজ্ঞানে আরও উন্নত শিক্ষার ব্যবস্থা।",
        "created_by_id": 2,
        "target_role": None,
        "is_urgent": False,
        "show_on_landing": False,
        "expires_at": datetime(2025, 12, 31),
        "is_active": True
    },
    {
        "title": "অনলাইন ক্লাস সুবিধা",
        "content": "💻 এখন অনলাইন ক্লাসের সুবিধা! যেকোনো জরুরি অবস্থায় বাড়িতে বসেই ক্লাস করার সুযোগ।",
        "created_by_id": 1,
        "target_role": UserRole.STUDENT,
        "is_urgent": False,
        "show_on_landing": False,
        "expires_at": datetime(2025, 12, 31),
        "is_active": True
    }
]

MOCK_TEACHER_REVIEWS = [
    {
        "teacher_id": 1,  # Math teacher
        "reviewed_by_id": 1,  # Admin
        "teaching_quality": 4,
        "punctuality": 5,
        "student_engagement": 4,
        "overall_rating": 4.3,
        "comments": "Excellent mathematical knowledge and good teaching methodology. Students respond well to the teaching style.",
        "review_date": datetime(2024, 9, 15)
    },
    {
        "teacher_id": 2,  # Physics teacher
        "reviewed_by_id": 2,  # Principal
        "teaching_quality": 5,
        "punctuality": 5,
        "student_engagement": 5,
        "overall_rating": 5.0,
        "comments": "Outstanding performance in all areas. Highly recommended teacher with excellent student feedback.",
        "review_date": datetime(2024, 9, 20)
    },
    {
        "teacher_id": 3,  # Chemistry teacher
        "reviewed_by_id": 1,  # Admin
        "teaching_quality": 4,
        "punctuality": 4,
        "student_engagement": 3,
        "overall_rating": 3.7,
        "comments": "Good subject knowledge. Could improve on student engagement and interactive teaching methods.",
        "review_date": datetime(2024, 9, 25)
    },
    {
        "teacher_id": 4,  # Biology teacher
        "reviewed_by_id": 2,  # Principal
        "teaching_quality": 4,
        "punctuality": 5,
        "student_engagement": 4,
        "overall_rating": 4.3,
        "comments": "Very punctual and reliable. Good teaching skills with practical approach to biology concepts.",
        "review_date": datetime(2024, 10, 1)
    },
    {
        "teacher_id": 5,  # English teacher
        "reviewed_by_id": 1,  # Admin
        "teaching_quality": 5,
        "punctuality": 4,
        "student_engagement": 5,
        "overall_rating": 4.7,
        "comments": "Excellent communication skills and creative teaching methods. Students show great improvement in language skills.",
        "review_date": datetime(2024, 10, 5)
    }
]

MOCK_CLASS_SCHEDULES = [
    # Monday schedules
    {
        "day_of_week": DayOfWeek.MONDAY,
        "start_time": "08:00",
        "end_time": "09:30",
        "subject_id": 1,  # Mathematics for Grade 10A
        "class_id": 1,
        "teacher_id": 1,
        "room_number": "Room 101"
    },
    {
        "day_of_week": DayOfWeek.MONDAY,
        "start_time": "09:45",
        "end_time": "11:15",
        "subject_id": 2,  # Physics for Grade 10A
        "class_id": 1,
        "teacher_id": 2,
        "room_number": "Room 102"
    },
    {
        "day_of_week": DayOfWeek.MONDAY,
        "start_time": "11:30",
        "end_time": "13:00",
        "subject_id": 3,  # Chemistry for Grade 10A
        "class_id": 1,
        "teacher_id": 3,
        "room_number": "Lab 1"
    },
    
    # Tuesday schedules
    {
        "day_of_week": DayOfWeek.TUESDAY,
        "start_time": "08:00",
        "end_time": "09:30",
        "subject_id": 4,  # Biology for Grade 10A
        "class_id": 1,
        "teacher_id": 4,
        "room_number": "Lab 2"
    },
    {
        "day_of_week": DayOfWeek.TUESDAY,
        "start_time": "09:45",
        "end_time": "11:15",
        "subject_id": 5,  # English for Grade 10A
        "class_id": 1,
        "teacher_id": 5,
        "room_number": "Room 103"
    },
    {
        "day_of_week": DayOfWeek.TUESDAY,
        "start_time": "11:30",
        "end_time": "13:00",
        "subject_id": 1,  # Mathematics for Grade 10A
        "class_id": 1,
        "teacher_id": 1,
        "room_number": "Room 101"
    },
    
    # Wednesday schedules
    {
        "day_of_week": DayOfWeek.WEDNESDAY,
        "start_time": "08:00",
        "end_time": "09:30",
        "subject_id": 2,  # Physics for Grade 10A
        "class_id": 1,
        "teacher_id": 2,
        "room_number": "Room 102"
    },
    {
        "day_of_week": DayOfWeek.WEDNESDAY,
        "start_time": "09:45",
        "end_time": "11:15",
        "subject_id": 3,  # Chemistry for Grade 10A
        "class_id": 1,
        "teacher_id": 3,
        "room_number": "Lab 1"
    },
    
    # Thursday schedules
    {
        "day_of_week": DayOfWeek.THURSDAY,
        "start_time": "08:00",
        "end_time": "09:30",
        "subject_id": 5,  # English for Grade 10A
        "class_id": 1,
        "teacher_id": 5,
        "room_number": "Room 103"
    },
    {
        "day_of_week": DayOfWeek.THURSDAY,
        "start_time": "09:45",
        "end_time": "11:15",
        "subject_id": 4,  # Biology for Grade 10A
        "class_id": 1,
        "teacher_id": 4,
        "room_number": "Lab 2"
    },
    {
        "day_of_week": DayOfWeek.THURSDAY,
        "start_time": "11:30",
        "end_time": "13:00",
        "subject_id": 1,  # Mathematics for Grade 10A
        "class_id": 1,
        "teacher_id": 1,
        "room_number": "Room 101"
    },
    
    # Friday schedules
    {
        "day_of_week": DayOfWeek.FRIDAY,
        "start_time": "08:00",
        "end_time": "09:30",
        "subject_id": 2,  # Physics for Grade 10A
        "class_id": 1,
        "teacher_id": 2,
        "room_number": "Room 102"
    },
    {
        "day_of_week": DayOfWeek.FRIDAY,
        "start_time": "09:45",
        "end_time": "11:15",
        "subject_id": 3,  # Chemistry for Grade 10A
        "class_id": 1,
        "teacher_id": 3,
        "room_number": "Lab 1"
    },
    
    # Saturday schedules (lighter day)
    {
        "day_of_week": DayOfWeek.SATURDAY,
        "start_time": "09:00",
        "end_time": "10:30",
        "subject_id": 5,  # English for Grade 10A
        "class_id": 1,
        "teacher_id": 5,
        "room_number": "Room 103"
    },
    {
        "day_of_week": DayOfWeek.SATURDAY,
        "start_time": "10:45",
        "end_time": "12:15",
        "subject_id": 1,  # Mathematics for Grade 10A
        "class_id": 1,
        "teacher_id": 1,
        "room_number": "Room 101"
    }
]