# Coaching Center Management Frontend

A comprehensive React-based frontend application for managing coaching centers, built with modern web technologies.

## Features

### Admin Dashboard
- **Dashboard Overview**: Real-time statistics for students, teachers, classes, and subjects
- **User Management**: Create and manage students and teachers
- **Class Management**: Create and organize classes with capacity management
- **Attendance Overview**: Monitor attendance across all classes
- **Notices Management**: Create and broadcast notices to specific user roles
- **Database Management**: Seed database with mock data for testing

### Teacher Dashboard
- **Class Overview**: View assigned classes and student counts
- **Attendance Management**: Mark daily attendance for students
- **Exam Management**: Create exams and record results
- **Grade Management**: Input and manage student grades
- **Study Materials**: Upload and organize learning materials
- **Notices**: View teacher-specific announcements

### Student Dashboard
- **Personal Profile**: View and manage personal information
- **Attendance Tracking**: Monitor attendance history and statistics
- **Exam Results**: View grades and performance analytics
- **Study Materials**: Access and download learning resources
- **Notices**: Receive important announcements and updates

## Technology Stack

- **React 19** - Frontend framework
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Beautiful, customizable SVG icons
- **Axios** - HTTP client for API communication
- **Vite** - Fast build tool and development server

## Getting Started

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn package manager

### Installation

1. **Configure environment variables:**
   ```bash
   # Copy the environment template
   cp .env.example .env
   
   # Edit the .env file with your configuration
   nano .env
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Build for production:**
   ```bash
   npm run build
   ```

The application will be available at `http://localhost:5173`

## Environment Configuration

The application uses environment variables for configuration. Copy `.env.example` to `.env` and configure the following variables:

### Required Variables
- `VITE_API_BASE_URL`: Backend API base URL (default: http://localhost:8000)

### Optional Variables
- `VITE_APP_NAME`: Application name (default: "Science Point")
- `VITE_APP_VERSION`: Application version
- `VITE_FRONTEND_BASE_URL`: Frontend base URL for redirects
- `VITE_API_TIMEOUT`: API request timeout in milliseconds (default: 10000)
- `VITE_AUTH_TOKEN_EXPIRY`: Token expiry time in seconds (default: 86400)
- `VITE_PAGINATION_LIMIT`: Default pagination limit (default: 25)
- `VITE_FILE_UPLOAD_MAX_SIZE`: Maximum file upload size in bytes (default: 5MB)
- `VITE_CACHE_TTL`: Cache timeout in seconds (default: 300)

### Feature Flags
- `VITE_ENABLE_DEBUG`: Enable debug mode (default: false)
- `VITE_ENABLE_MOCK_DATA`: Enable mock data for development (default: false)
- `VITE_ENABLE_DEV_TOOLS`: Enable developer tools (default: true)
- `VITE_ENABLE_CONSOLE_LOGS`: Enable console logging (default: true)
- `VITE_ERROR_REPORTING_ENABLED`: Enable error reporting (default: false)

### Security & External Services
- `VITE_ENABLE_HTTPS_ONLY`: Force HTTPS only (default: false)
- `VITE_ENABLE_CSP`: Enable Content Security Policy (default: false)
- `VITE_SENTRY_DSN`: Sentry DSN for error reporting
- `VITE_ANALYTICS_ID`: Analytics service ID (Google Analytics, etc.)
- `VITE_CDN_BASE_URL`: CDN base URL for static assets

### Development Notes
- Environment variables must be prefixed with `VITE_` to be accessible in the frontend
- Changes to `.env` require a development server restart
- Never commit `.env` files to version control

## Demo Credentials

The application includes seeded demo data for testing. Use these credentials to explore different user roles:

### Admin Users
- **Username**: `admin` / **Password**: `admin123`
- **Username**: `principal` / **Password**: `principal123`

### Teacher Users
- **Username**: `math_teacher` / **Password**: `teacher123`
- **Username**: `physics_teacher` / **Password**: `teacher123`
- **Username**: `chemistry_teacher` / **Password**: `teacher123`
- **Username**: `biology_teacher` / **Password**: `teacher123`
- **Username**: `english_teacher` / **Password**: `teacher123`

### Student Users
- **Username**: `student001` / **Password**: `student123`
- **Username**: `student002` / **Password**: `student123`
- **Username**: `student003` / **Password**: `student123`
- **Username**: `student004` / **Password**: `student123`
- **Username**: `student005` / **Password**: `student123`
- **Username**: `student006` / **Password**: `student123`
- **Username**: `student007` / **Password**: `student123`
- **Username**: `student008` / **Password**: `student123`

### Admin Features
- View dashboard statistics
- Create and manage students/teachers
- Organize classes and subjects
- Monitor attendance across all classes
- Create system-wide notices
- Seed database with sample data

### Teacher Features
- View assigned classes and students
- Mark daily attendance
- Create and schedule exams
- Record exam results and grades
- Upload study materials
- View teacher-specific notices

### Student Features
- View personal profile and information
- Check attendance history and statistics
- View exam results and grades
- Download study materials
- Read important notices

## API Integration

The frontend connects to a FastAPI backend at `http://localhost:8000`. Make sure the backend server is running before using the application.

## Project Structure

```
frontend/
├── src/
│   ├── components/          # Reusable UI components
│   ├── pages/               # Main dashboard pages  
│   ├── services/            # API service layer
│   └── utils/               # Utility functions
├── public/                  # Static assets
└── package.json             # Dependencies and scripts
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
