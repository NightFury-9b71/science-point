import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminAPI, teacherAPI, studentAPI } from './api'

// Query Keys
export const queryKeys = {
  dashboard: ['dashboard'],
  students: ['students'],
  teachers: ['teachers'],
  classes: ['classes'],
  subjects: ['subjects'],
  notices: ['notices'],
  exams: ['exams'],
  examResults: ['examResults'],
  studyMaterials: ['studyMaterials'],
  attendance: ['attendance'],
  teacherReviews: ['teacherReviews'],
  teacherClasses: ['teacherClasses'],
  classSchedules: ['classSchedules'],
  teacherSchedule: ['teacherSchedule'],
  studentSchedule: ['studentSchedule']
}

// Admin Hooks
export const useAdminDashboard = () => {
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: () => adminAPI.getDashboardStats().then(res => res.data),
  })
}

export const useStudents = () => {
  return useQuery({
    queryKey: queryKeys.students,
    queryFn: () => adminAPI.getStudents().then(res => res.data),
  })
}

export const useTeachers = () => {
  return useQuery({
    queryKey: queryKeys.teachers,
    queryFn: () => adminAPI.getTeachers().then(res => res.data),
  })
}

export const useClasses = () => {
  return useQuery({
    queryKey: queryKeys.classes,
    queryFn: () => adminAPI.getClasses().then(res => res.data),
  })
}

export const useSubjects = () => {
  return useQuery({
    queryKey: queryKeys.subjects,
    queryFn: () => adminAPI.getSubjects().then(res => res.data),
  })
}

export const useNotices = (params = {}) => {
  return useQuery({
    queryKey: [...queryKeys.notices, params],
    queryFn: () => adminAPI.getNotices(params).then(res => res.data),
  })
}

export const useAttendance = (params = {}) => {
  return useQuery({
    queryKey: [...queryKeys.attendance, params],
    queryFn: () => adminAPI.getAttendance(params).then(res => res.data),
    enabled: Object.keys(params).length > 0,
  })
}

export const useExams = () => {
  return useQuery({
    queryKey: queryKeys.exams,
    queryFn: () => adminAPI.getExams().then(res => res.data),
  })
}

export const useExamResults = (params = {}) => {
  return useQuery({
    queryKey: [...queryKeys.examResults, params],
    queryFn: async () => {
      if (Object.keys(params).length === 0) {
        return []
      }
      
      // Get results and students data to enrich the results
      const [resultsRes, studentsRes] = await Promise.all([
        adminAPI.getExamResults(params),
        adminAPI.getStudents() // Get all students to match
      ])
      
      const results = resultsRes.data
      const students = studentsRes.data
      
      // Transform and enrich results data
      return results.map(result => {
        const student = students.find(s => s.id === result.student_id) || null
        return {
          ...result,
          obtained_marks: result.marks_obtained, // Backend uses 'marks_obtained', frontend expects 'obtained_marks'
          student: student ? {
            ...student,
            name: student.user?.full_name || 'Unknown Student' // Flatten the nested name for easier access
          } : null
        }
      })
    },
    enabled: Object.keys(params).length > 0,
  })
}

export const useStudyMaterials = (subjectId) => {
  return useQuery({
    queryKey: [...queryKeys.studyMaterials, subjectId],
    queryFn: () => adminAPI.getStudyMaterials(subjectId).then(res => res.data),
  })
}

// Teacher Hooks
export const useTeacherClasses = (teacherId) => {
  return useQuery({
    queryKey: ['teacherClasses', teacherId],
    queryFn: () => teacherAPI.getMyClasses(teacherId).then(res => res.data),
    enabled: !!teacherId,  // Only run query if teacherId exists
  })
}

export const useTeacherStudents = (teacherId) => {
  return useQuery({
    queryKey: ['teacherStudents', teacherId],
    queryFn: () => teacherAPI.getMyStudents(teacherId).then(res => res.data),
    enabled: !!teacherId,  // Only run query if teacherId exists
  })
}

export const useTeacherSubjects = (teacherId) => {
  return useQuery({
    queryKey: ['teacherSubjects', teacherId],
    queryFn: () => teacherAPI.getMySubjects(teacherId).then(res => res.data),
  })
}

export const useTeacherExams = (teacherId) => {
  return useQuery({
    queryKey: ['teacherExams', teacherId],
    queryFn: async () => {
      // Fetch all required data
      const [examsRes, classesRes, subjectsRes, studentsRes] = await Promise.all([
        teacherAPI.getMyExams(teacherId),
        teacherAPI.getMyClasses(teacherId),
        teacherAPI.getMySubjects(teacherId),
        teacherAPI.getMyStudents(teacherId)
      ])
      
      const exams = examsRes.data
      const classes = classesRes.data
      const subjects = subjectsRes.data
      const students = studentsRes.data
      
      // Transform and enrich exam data
      return exams.map(exam => {
        const examClass = classes.find(c => c.id === exam.class_id) || null
        const examSubject = subjects.find(s => s.id === exam.subject_id) || null
        const examStudents = students.filter(s => s.class_id === exam.class_id).map(student => ({
          ...student,
          name: student.user?.full_name || 'Unknown Student' // Flatten the nested name
        }))
        
        return {
          ...exam,
          title: exam.name, // Backend uses 'name', frontend expects 'title'
          total_marks: exam.max_marks, // Backend uses 'max_marks', frontend expects 'total_marks'
          subject: examSubject,
          class: examClass,
          students: examStudents
        }
      })
    },
  })
}

export const useTeacherMaterials = () => {
  return useQuery({
    queryKey: ['teacherMaterials'],
    queryFn: () => teacherAPI.getMyStudyMaterials().then(res => res.data),
  })
}

export const useTeacherNotices = () => {
  return useQuery({
    queryKey: ['teacherNotices'],
    queryFn: () => teacherAPI.getNotices().then(res => res.data),
  })
}

// Student Hooks
export const useStudentProfile = (studentId) => {
  return useQuery({
    queryKey: ['studentProfile', studentId],
    queryFn: () => studentAPI.getMyProfile(studentId).then(res => res.data),
    enabled: !!studentId,
  })
}

export const useStudentAttendance = (studentId) => {
  return useQuery({
    queryKey: ['studentAttendance', studentId],
    queryFn: () => studentAPI.getMyAttendance(studentId).then(res => res.data),
    enabled: !!studentId,
  })
}

export const useStudentExamResults = (studentId) => {
  return useQuery({
    queryKey: ['studentExamResults', studentId],
    queryFn: async () => {
      const [resultsRes, examsRes, subjectsRes] = await Promise.all([
        studentAPI.getMyExamResults(studentId),
        adminAPI.getExams(), // Get all exams to match with results
        studentAPI.getMySubjects(studentId)
      ])
      
      const results = resultsRes.data
      const exams = examsRes.data
      const subjects = subjectsRes.data
      
      // Enrich results with exam and subject information
      return results.map(result => {
        const exam = exams.find(e => e.id === result.exam_id) || null
        const subject = exam ? subjects.find(s => s.id === exam.subject_id) : null
        
        return {
          ...result,
          exam: exam ? {
            ...exam,
            title: exam.name,
            total_marks: exam.max_marks,
            subject: subject
          } : null,
          obtained_marks: result.marks_obtained
        }
      })
    },
    enabled: !!studentId,
  })
}

export const useStudentSubjects = (studentId) => {
  return useQuery({
    queryKey: ['studentSubjects', studentId],
    queryFn: () => studentAPI.getMySubjects(studentId).then(res => res.data),
    enabled: !!studentId,
  })
}

export const useStudentMaterials = (studentId) => {
  return useQuery({
    queryKey: ['studentMaterials', studentId],
    queryFn: async () => {
      const [materialsRes, subjectsRes] = await Promise.all([
        studentAPI.getStudyMaterials(studentId),
        studentAPI.getMySubjects(studentId)
      ])
      
      const materials = materialsRes.data
      const subjects = subjectsRes.data
      
      // Enrich materials with subject information
      return materials.map(material => {
        const subject = subjects.find(s => s.id === material.subject_id) || null
        return {
          ...material,
          subject: subject
        }
      })
    },
    enabled: !!studentId,
  })
}

export const useStudentNotices = (studentId) => {
  return useQuery({
    queryKey: ['studentNotices', studentId],
    queryFn: () => studentAPI.getNotices(studentId).then(res => res.data),
    enabled: !!studentId,
  })
}

// Mutation Hooks
export const useCreateStudent = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (studentData) => adminAPI.createStudent(studentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}

export const useCreateTeacher = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (teacherData) => adminAPI.createTeacher(teacherData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teachers })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}

export const useCreateClass = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (classData) => adminAPI.createClass(classData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.classes })
      queryClient.invalidateQueries({ queryKey: queryKeys.teacherClasses })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}

export const useCreateSubject = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (subjectData) => adminAPI.createSubject(subjectData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects })
      queryClient.invalidateQueries({ queryKey: queryKeys.teacherClasses })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}

export const useCreateNotice = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (noticeData) => adminAPI.createNotice(noticeData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notices })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}

export const useUpdateNotice = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, ...noticeData }) => adminAPI.updateNotice(id, noticeData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notices })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}

export const useDeleteNotice = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (noticeId) => adminAPI.deleteNotice(noticeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notices })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}

export const useMarkAttendance = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (attendanceDataArray) => {
      // Handle both single attendance record and bulk records
      if (Array.isArray(attendanceDataArray)) {
        // Bulk submission - send multiple requests
        const promises = attendanceDataArray.map(data => 
          adminAPI.markAttendance(data)
        )
        return Promise.all(promises)
      } else {
        // Single submission
        return teacherAPI.markAttendance(attendanceDataArray)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance })
    },
  })
}

export const useCreateExam = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (examData) => teacherAPI.createExam(examData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exams })
      queryClient.invalidateQueries({ queryKey: ['teacherExams'] })
    },
  })
}

export const useRecordExamResult = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (resultData) => teacherAPI.recordExamResult(resultData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.examResults })
    },
  })
}

export const useUploadStudyMaterial = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (materialData) => teacherAPI.uploadStudyMaterial(materialData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.studyMaterials })
      queryClient.invalidateQueries({ queryKey: ['teacherMaterials'] })
    },
  })
}

export const useUpdateStudent = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, ...studentData }) => adminAPI.updateStudent(id, studentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}

export const useDeleteStudent = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (studentId) => adminAPI.deleteStudent(studentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}

export const useUpdateStudentPassword = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ studentId, password }) => adminAPI.updateStudentPassword(studentId, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.students })
    },
  })
}

export const useUpdateTeacher = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, ...teacherData }) => adminAPI.updateTeacher(id, teacherData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teachers })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}

export const useDeleteTeacher = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (teacherId) => adminAPI.deleteTeacher(teacherId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teachers })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}

export const useUpdateTeacherPassword = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ teacherId, password }) => adminAPI.updateTeacherPassword(teacherId, password),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teachers })
    },
  })
}

export const useUpdateClass = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, ...classData }) => adminAPI.updateClass(id, classData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.classes })
      queryClient.invalidateQueries({ queryKey: queryKeys.teacherClasses })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}

export const useDeleteClass = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (classId) => adminAPI.deleteClass(classId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.classes })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}

export const useSeedDatabase = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: () => adminAPI.seedData(),
    onSuccess: () => {
      // Invalidate all queries to refresh data
      queryClient.invalidateQueries()
    },
  })
}

export const useCreateResult = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (resultData) => adminAPI.createExamResult(resultData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.examResults })
    },
  })
}

export const useUpdateResult = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, ...resultData }) => adminAPI.updateExamResult(id, resultData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.examResults })
    },
  })
}

export const useUpdateSubject = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, ...subjectData }) => adminAPI.updateSubject(id, subjectData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.subjects })
      queryClient.invalidateQueries({ queryKey: queryKeys.teacherClasses })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}

export const useClassAttendance = (classId, date) => {
  return useQuery({
    queryKey: ['classAttendance', classId, date],
    queryFn: () => adminAPI.getAttendance({ class_id: classId, date }).then(res => res.data),
    enabled: !!classId && !!date,
  })
}

export const useUpdateAttendance = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ attendanceId, ...attendanceData }) => adminAPI.updateAttendance(attendanceId, attendanceData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.attendance })
      queryClient.invalidateQueries({ queryKey: ['classAttendance'] })
    },
  })
}

// Class Schedule Hooks
export const useClassSchedules = (params = {}) => {
  return useQuery({
    queryKey: [...queryKeys.classSchedules, params],
    queryFn: () => adminAPI.getClassSchedules(params).then(res => res.data),
  })
}

export const useCreateClassSchedule = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (scheduleData) => adminAPI.createClassSchedule(scheduleData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.classSchedules })
      queryClient.invalidateQueries({ queryKey: queryKeys.teacherSchedule })
      queryClient.invalidateQueries({ queryKey: queryKeys.studentSchedule })
    },
  })
}

export const useDeleteClassSchedule = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (scheduleId) => adminAPI.deleteClassSchedule(scheduleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.classSchedules })
      queryClient.invalidateQueries({ queryKey: queryKeys.teacherSchedule })
      queryClient.invalidateQueries({ queryKey: queryKeys.studentSchedule })
    },
  })
}

export const useTeacherSchedule = (teacherId, dayOfWeek) => {
  return useQuery({
    queryKey: [...queryKeys.teacherSchedule, teacherId, dayOfWeek],
    queryFn: () => teacherAPI.getMySchedule(teacherId, dayOfWeek).then(res => res.data),
    enabled: !!teacherId,
  })
}

export const useStudentSchedule = (studentId, dayOfWeek) => {
  return useQuery({
    queryKey: [...queryKeys.studentSchedule, studentId, dayOfWeek],
    queryFn: () => studentAPI.getMySchedule(studentId, dayOfWeek).then(res => res.data),
    enabled: !!studentId,
  })
}