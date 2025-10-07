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

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the development server:**
   ```bash
   npm run dev
   ```

3. **Build for production:**
   ```bash
   npm run build
   ```

The application will be available at `http://localhost:5173`

## Usage

### Role Switching
Use the navigation buttons in the header to switch between different user roles:
- **Admin**: Complete system management
- **Teacher**: Class and student management  
- **Student**: Personal dashboard and resources

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
