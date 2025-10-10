import axios from 'axios'
import Logger from '../utils/logger.js'
import config from '../config/index.js'
import monitoringService from '../utils/monitoringService.js'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: config.api.baseURL,
  timeout: config.api.timeout,
  headers: {
    'Content-Type': 'application/json',
  }
})

// Request interceptor
api.interceptors.request.use(
  (requestConfig) => {
    // Add auth token to all requests
    const token = localStorage.getItem(config.auth.tokenKey)
    if (token) {
      requestConfig.headers.Authorization = `Bearer ${token}`
    }

    // Add request start time for monitoring
    requestConfig.metadata = { startTime: Date.now() }
    
    return requestConfig
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Track successful API calls
    if (response.config.metadata) {
      const duration = Date.now() - response.config.metadata.startTime
      monitoringService.trackAPICall(
        response.config.method.toUpperCase(),
        response.config.url,
        duration,
        response.status
      )
    }
    return response
  },
  (error) => {
    // Track failed API calls
    if (error.config?.metadata) {
      const duration = Date.now() - error.config.metadata.startTime
      monitoringService.trackAPICall(
        error.config.method?.toUpperCase() || 'UNKNOWN',
        error.config.url || 'unknown',
        duration,
        error.response?.status || 0,
        error
      )
    }

    Logger.error('API Error:', error)
    
    // Handle authentication errors (but don't auto-redirect to avoid loops)
    if (error.response?.status === 401) {
      // Token is invalid or expired
      localStorage.removeItem(config.auth.tokenKey)
      localStorage.removeItem(config.auth.userKey)
      
      // Let the UI handle the redirect through context
      Logger.warn('Authentication failed - token removed')
    }
    
    return Promise.reject(error)
  }
)

// Admin API functions
export const adminAPI = {
  // Dashboard
  getDashboardStats: () => api.get('/admin/dashboard'),
  
  // Users
  getUsers: (skip = 0, limit = 100) => api.get(`/admin/users?skip=${skip}&limit=${limit}`),
  getUser: (userId) => api.get(`/admin/users/${userId}`),
  createUser: (userData) => api.post('/admin/users', userData),
  
  // Students
  getStudents: (skip = 0, limit = 100) => api.get(`/admin/students?skip=${skip}&limit=${limit}`),
  getStudent: (studentId) => api.get(`/admin/students/${studentId}`),
  createStudent: (studentData) => api.post('/admin/students', studentData),
  updateStudent: (studentId, studentData) => api.put(`/admin/students/${studentId}`, studentData),
  deleteStudent: (studentId) => api.delete(`/admin/students/${studentId}`),
  updateStudentPassword: (studentId, password) => api.patch(`/admin/students/${studentId}/password`, { password }),
  
  // Teachers
  getTeachers: (skip = 0, limit = 100) => api.get(`/admin/teachers?skip=${skip}&limit=${limit}`),
  createTeacher: (teacherData) => api.post('/admin/teachers', teacherData),
  updateTeacher: (teacherId, teacherData) => api.put(`/admin/teachers/${teacherId}`, teacherData),
  deleteTeacher: (teacherId) => api.delete(`/admin/teachers/${teacherId}`),
  updateTeacherPassword: (teacherId, password) => api.patch(`/admin/teachers/${teacherId}/password`, { password }),
  
  // Classes
  getClasses: () => api.get('/admin/classes'),
  createClass: (classData) => api.post('/admin/classes', classData),
  updateClass: (classId, classData) => api.put(`/admin/classes/${classId}`, classData),
  deleteClass: (classId) => api.delete(`/admin/classes/${classId}`),
  
  // Subjects
  getSubjects: () => api.get('/admin/subjects'),
  createSubject: (subjectData) => api.post('/admin/subjects', subjectData),
  updateSubject: (subjectId, subjectData) => api.put(`/admin/subjects/${subjectId}`, subjectData),
  deleteSubject: (subjectId) => api.delete(`/admin/subjects/${subjectId}`),
  
  // Attendance
  getAttendance: (params = {}) => {
    const queryParams = new URLSearchParams()
    if (params.class_id) queryParams.append('class_id', params.class_id)
    if (params.student_id) queryParams.append('student_id', params.student_id)
    if (params.date) queryParams.append('date', params.date)
    if (params.skip) queryParams.append('skip', params.skip)
    if (params.limit) queryParams.append('limit', params.limit)
    return api.get(`/admin/attendance?${queryParams}`)
  },
  markAttendance: (attendanceData) => api.post('/admin/attendance', attendanceData),
  updateAttendance: (attendanceId, attendanceData) => api.put(`/admin/attendance/${attendanceId}`, attendanceData),
  
  // Exams
  getExams: () => api.get('/admin/exams'),
  createExam: (examData) => api.post('/admin/exams', examData),
  updateExam: (examId, examData) => api.put(`/admin/exams/${examId}`, examData),
  deleteExam: (examId) => api.delete(`/admin/exams/${examId}`),
  
  // Exam Results
  getExamResults: (params = {}) => {
    const queryParams = new URLSearchParams()
    if (params.exam_id) queryParams.append('exam_id', params.exam_id)
    if (params.student_id) queryParams.append('student_id', params.student_id)
    return api.get(`/admin/exam-results?${queryParams}`)
  },
  createExamResult: (resultData) => api.post('/admin/exam-results', resultData),
  updateExamResult: (resultId, resultData) => api.put(`/admin/exam-results/${resultId}`, resultData),
  
  // Study Materials
  getStudyMaterials: (subjectId) => {
    const url = subjectId ? `/admin/study-materials?subject_id=${subjectId}` : '/admin/study-materials'
    return api.get(url)
  },
  createStudyMaterial: (materialData) => api.post('/admin/study-materials', materialData),
  
  // Notices
  getNotices: (params = {}) => {
    const queryParams = new URLSearchParams()
    if (params.target_role) queryParams.append('target_role', params.target_role)
    if (params.active_only !== undefined) queryParams.append('active_only', params.active_only)
    return api.get(`/admin/notices?${queryParams}`)
  },
  createNotice: (noticeData) => api.post('/admin/notices', noticeData),
  updateNotice: (noticeId, noticeData) => api.put(`/admin/notices/${noticeId}`, noticeData),
  deleteNotice: (noticeId) => api.delete(`/admin/notices/${noticeId}`),
  
  // Teacher Reviews
  getTeacherReviews: (teacherId) => {
    const url = teacherId ? `/admin/teacher-reviews?teacher_id=${teacherId}` : '/admin/teacher-reviews'
    return api.get(url)
  },
  createTeacherReview: (reviewData) => api.post('/admin/teacher-reviews', reviewData),
  
  // Class Schedules
  getClassSchedules: (params = {}) => {
    const queryParams = new URLSearchParams()
    if (params.day_of_week) queryParams.append('day_of_week', params.day_of_week)
    if (params.class_id) queryParams.append('class_id', params.class_id)
    if (params.teacher_id) queryParams.append('teacher_id', params.teacher_id)
    return api.get(`/admin/class-schedules?${queryParams}`)
  },
  createClassSchedule: (scheduleData) => api.post('/admin/class-schedules', scheduleData),
  deleteClassSchedule: (scheduleId) => api.delete(`/admin/class-schedules/${scheduleId}`),

  // Data Management
  seedData: () => api.post('/admin/seed-data'),
  resetData: (confirm = false) => api.post(`/admin/reset-data?confirm=${confirm}`),
  recreateTables: () => api.post('/admin/recreate-tables'),
  getDataStats: () => api.get('/admin/data-stats'),

  // Admission Requests
  getAdmissionRequests: () => api.get('/admin/admission-requests?status=pending'),
  approveAdmissionRequest: (requestId) => api.post(`/admin/admission-requests/${requestId}/approve`).then(res => res.data),
  rejectAdmissionRequest: (requestId) => api.post(`/admin/admission-requests/${requestId}/reject`).then(res => res.data),

  // User Photos
  uploadUserPhoto: (userId, photoData) => {
    return api.post(`/users/${userId}/photo`, photoData, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  },
  deleteUserPhoto: (userId) => api.delete(`/users/${userId}/photo`),

  // Admin Profile
  getMyProfile: (adminId) => api.get(`/admin/${adminId}/profile`)
}

// Public API functions (no authentication required)
export const publicAPI = {
  submitAdmission: (admissionData) => api.post('/public/admission', admissionData),
  getNotices: () => api.get('/public/notices'),
  getClasses: () => api.get('/public/classes')
}

// Teacher-specific API functions
export const teacherAPI = {
  getMyProfile: (teacherId) => api.get(`/teacher/${teacherId}/profile`),
  getMyClasses: (teacherId) => api.get(`/teacher/${teacherId}/classes`),
  getMyStudents: (teacherId) => api.get(`/teacher/${teacherId}/students`),
  getMySubjects: (teacherId) => api.get(`/teacher/${teacherId}/subjects`),
  markAttendance: (attendanceData) => adminAPI.markAttendance(attendanceData),
  getClassAttendance: (classId) => adminAPI.getAttendance({ class_id: classId }),
  createExam: (examData) => adminAPI.createExam(examData),
  getMyExams: (teacherId) => api.get(`/teacher/${teacherId}/exams`),
  recordExamResult: (resultData) => adminAPI.createExamResult(resultData),
  uploadStudyMaterial: (materialData, teacherId) => {
    return api.post(`/teacher/${teacherId}/study-materials`, materialData)
  },
  getMyStudyMaterials: (teacherId) => api.get(`/teacher/${teacherId}/study-materials`),
  updateStudyMaterial: (teacherId, materialId, materialData) => {
    return api.put(`/teacher/${teacherId}/study-materials/${materialId}`, materialData)
  },
  deleteStudyMaterial: (teacherId, materialId) => api.delete(`/teacher/${teacherId}/study-materials/${materialId}`),
  getNotices: () => adminAPI.getNotices({ target_role: 'teacher' }),
  getMySchedule: (teacherId, dayOfWeek) => {
    const params = dayOfWeek ? `?day_of_week=${dayOfWeek}` : ''
    return api.get(`/teacher/${teacherId}/schedule${params}`)
  },

  // User Photos
  uploadUserPhoto: (userId, photoData) => {
    return api.post(`/users/${userId}/photo`, photoData, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  },
  deleteUserPhoto: (userId) => api.delete(`/users/${userId}/photo`)
}

// Student-specific API functions
export const studentAPI = {
  getMyProfile: (studentId) => api.get(`/student/${studentId}/profile`),
  getMyAttendance: (studentId) => api.get(`/student/${studentId}/attendance`),
  getMyExamResults: (studentId) => api.get(`/student/${studentId}/exam-results`),
  getMySubjects: (studentId) => api.get(`/student/${studentId}/subjects`),
  getStudyMaterials: (studentId) => api.get(`/student/${studentId}/study-materials`),
  getNotices: (studentId) => api.get(`/student/${studentId}/notices`),
  getMySchedule: (studentId, dayOfWeek) => {
    const params = dayOfWeek ? `?day_of_week=${dayOfWeek}` : ''
    return api.get(`/student/${studentId}/schedule${params}`)
  },

  // User Photos
  uploadUserPhoto: (userId, photoData) => {
    return api.post(`/users/${userId}/photo`, photoData, {
      headers: {
        'Content-Type': 'application/json',
      },
    })
  },
  deleteUserPhoto: (userId) => api.delete(`/users/${userId}/photo`)
}

export default api