# Coaching Center Management System

# Coaching Center Management System

A comprehensive FastAPI-based management system for coaching centers with minimal and optimal code. Built with **SQLModel** - a modern library that combines SQLAlchemy and Pydantic for type-safe database operations.

## Features

### Admin Capabilities
- **User Management**: Create and manage students, teachers, and admin users
- **Class Management**: Create and assign classes for grades 6-12
- **Subject Management**: Add subjects and assign teachers to classes
- **Attendance Tracking**: Mark and track student attendance
- **Exam Management**: Create exams and record results/marks
- **Study Materials**: Upload and manage study materials/notes
- **Notices**: Create and manage announcements for different user roles
- **Teacher Reviews**: Conduct performance reviews of teachers
- **Dashboard**: View comprehensive statistics and recent activities

### User Roles
1. **Student**: Access to their own records, study materials, notices
2. **Teacher**: Manage assigned classes, view student performance
3. **Admin**: Full access to all management features

## Installation

1. Clone or create the project directory
2. Create environment configuration:
```bash
# Copy the environment template
cp .env.example .env

# Edit the .env file with your configuration
nano .env
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Run the application:
```bash
python main.py
```

The API will be available at `http://localhost:8000`

## Environment Configuration

The application uses environment variables for configuration. Copy `.env.example` to `.env` and configure the following variables:

### Required Variables
- `SECRET_KEY`: JWT secret key for authentication (change in production)
- `DATABASE_URL`: Database connection string (SQLite by default)

### Optional Variables
- `APP_ENV`: Application environment (development/staging/production)
- `HOST`: Server host (default: 0.0.0.0)
- `PORT`: Server port (default: 8000)
- `CORS_ORIGINS`: Allowed CORS origins (comma-separated)
- `MAX_UPLOAD_SIZE`: Maximum file upload size in bytes (default: 5MB)
- `ALLOWED_IMAGE_TYPES`: Allowed image MIME types for uploads
- `LOG_LEVEL`: Logging level (DEBUG, INFO, WARNING, ERROR, CRITICAL)
- `SQL_ECHO`: Enable SQL query logging (default: False)
- `DEBUG`: Enable debug mode (default: True for development)

### Security Notes
- Never commit `.env` files to version control
- Use strong, unique secret keys in production
- Rotate keys regularly for security

## API Documentation

FastAPI automatically generates interactive API documentation:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Key Endpoints

### Admin Endpoints

#### User & Entity Management
- `POST /admin/users` - Create new user (student/teacher/admin)
- `GET /admin/users` - List all users
- `POST /admin/students` - Create student with user account
- `GET /admin/students` - List all students
- `POST /admin/teachers` - Create teacher with user account
- `GET /admin/teachers` - List all teachers
- `POST /admin/classes` - Create new class
- `POST /admin/subjects` - Create subject and assign teacher

#### Academic Management
- `POST /admin/attendance` - Mark student attendance
- `GET /admin/attendance` - View attendance records
- `POST /admin/exams` - Create exam
- `POST /admin/exam-results` - Record exam results
- `POST /admin/study-materials` - Upload study materials
- `POST /admin/notices` - Create announcements
- `POST /admin/teacher-reviews` - Review teacher performance

#### Data Management & Development
- `POST /admin/seed-data` - Populate database with comprehensive mock data
- `POST /admin/reset-data?confirm=true` - Clear all data from database
- `POST /admin/recreate-tables` - Drop and recreate all database tables
- `GET /admin/data-stats` - View current database statistics
- `GET /admin/dashboard` - View system dashboard with key metrics

### Mock Data Features

The system includes comprehensive mock data for testing and development:

- **8 Users**: 2 Admins, 5 Teachers, 8 Students
- **4 Classes**: Class 10A, 10B, 11 Science, 12 Science  
- **20 Subjects**: Math, Physics, Chemistry, Biology, English across all classes
- **600+ Attendance Records**: 30 days of attendance data for all students
- **9 Exams**: Mid-term, unit tests, and pre-board exams
- **36 Exam Results**: Realistic grade distributions for all students
- **7 Study Materials**: PDFs, presentations, and documents
- **5 Notices**: Academic announcements and important information
- **5 Teacher Reviews**: Performance evaluations with ratings and feedback

#### Using Mock Data

1. **Seed Database**: `POST /admin/seed-data`
   - Populates empty database with realistic test data
   - Returns summary of created records

2. **View Statistics**: `GET /admin/data-stats`
   - Shows current record counts for all tables

3. **Reset Database**: `POST /admin/reset-data?confirm=true`
   - Clears all data (requires confirmation parameter)
   
4. **Fresh Start**: `POST /admin/recreate-tables`
   - Drops and recreates all tables (nuclear option)

## Technology Stack

- **FastAPI**: Modern, fast web framework for building APIs
- **SQLModel**: Type-safe database library combining SQLAlchemy and Pydantic
- **SQLite**: Default database (easily configurable to PostgreSQL/MySQL)
- **Pydantic**: Data validation and serialization
- **Passlib**: Password hashing and security

## Database Schema

### Core SQLModel Tables:
- **User**: Base user model with roles (student/teacher/admin)
- **Student**: Student-specific information linked to User
- **Teacher**: Teacher-specific information linked to User
- **Class**: Classes for grades 6-12 with sections
- **Subject**: Subjects taught in specific classes
- **Attendance**: Daily attendance records
- **Exam**: Exam definitions
- **ExamResult**: Individual exam results with marks
- **StudyMaterial**: Uploaded study materials/notes
- **Notice**: System announcements
- **TeacherReview**: Performance reviews for teachers

### Key Features of SQLModel Implementation:
- **Type Safety**: Full type hints and validation
- **Dual Purpose Models**: Same models work for database tables and API schemas
- **Automatic API Documentation**: FastAPI automatically generates docs from SQLModel types
- **Runtime Validation**: Pydantic validation at runtime
- **IDE Support**: Excellent autocomplete and error detection

#### Data management (deployment note)

- The HTTP endpoints to seed or reset the database (`POST /admin/seed-data` and `POST /admin/reset-data`) have been disabled in this deployment for security. Use the provided backend scripts for local development:
  - `python seed_data.py` — Seed database locally (script-based seeding)
  - `python reset_neon_db.py` — Reset a Neon/PostgreSQL database (script-based)

If you require programmatic seeding in a development environment, run the scripts directly or enable seeding behind a secure admin-only mechanism.

### Creating a Student:
```json
POST /admin/students
{
  "user": {
    "username": "john_doe",
    "email": "john@example.com",
    "password": "secure123",
    "full_name": "John Doe",
    "phone": "1234567890",
    "role": "student"
  },
  "roll_number": "2024001",
  "class_id": 1,
  "parent_name": "Mr. Doe",
  "parent_phone": "9876543210"
}
```

### Creating a Class:
```json
POST /admin/classes
{
  "name": "Class 10A",
  "grade": 10,
  "section": "A",
  "academic_year": "2024-25",
  "capacity": 30
}
```

### Marking Attendance:
```json
POST /admin/attendance
{
  "student_id": 1,
  "class_id": 1,
  "date": "2024-01-15T09:00:00",
  "status": "present",
  "remarks": "On time"
}
```

### Development Workflow:
```bash
# Reset everything and start fresh
curl -X POST "http://localhost:8000/admin/reset-data?confirm=true"

# Seed with fresh mock data
curl -X POST http://localhost:8000/admin/seed-data

# Test your changes...

# Check current state
curl http://localhost:8000/admin/data-stats
```

## Database

The system uses SQLite by default for development. For production, you can set the `DATABASE_URL` environment variable to use PostgreSQL or MySQL:

```bash
export DATABASE_URL="postgresql://username:password@localhost/coaching_db"
```

## Security Features

- Password hashing using bcrypt
- Input validation with Pydantic
- SQL injection protection via SQLAlchemy ORM
- CORS middleware for cross-origin requests

## Performance Optimizations

- Minimal code structure
- Efficient database queries with SQLAlchemy
- Lazy loading of relationships
- Pagination support for large datasets
- Proper indexing on frequently queried fields

This system provides a solid foundation for a coaching center management system that can be extended with authentication, file uploads, and additional features as needed.