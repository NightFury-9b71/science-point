import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminAPI, teacherAPI, studentAPI, publicAPI } from './api'

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
  studentSchedule: ['studentSchedule'],
  admissionRequests: ['admissionRequests']
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

// usePublicClasses is defined later in the file with the public hook signature,
// so this earlier duplicate definition has been removed to avoid redeclaration.

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

export const useAdmissionRequests = () => {
  return useQuery({
    queryKey: queryKeys.admissionRequests,
    queryFn: () => adminAPI.getAdmissionRequests().then(res => res.data),
  })
}

// Public notices hook (no authentication required)
export const usePublicNotices = () => {
  return useQuery({
    queryKey: ['notices', 'public'],
    queryFn: () => publicAPI.getNotices().then(res => res.data),
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 10, // 10 minutes
  })
}

export const useAttendance = (params = {}) => {
  return useQuery({
    queryKey: [...queryKeys.attendance, params],
    queryFn: () => adminAPI.getAttendance(params).then(res => res.data),
    // Always enabled - performance components need all attendance records
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
      // Get results - allow fetching all results when no specific filters are provided
      const resultsRes = await adminAPI.getExamResults(params)
      const results = resultsRes.data
      
      // Transform results data (keep student_id for later enrichment)
      return results.map(result => ({
        ...result,
        obtained_marks: result.marks_obtained, // Backend uses 'marks_obtained', frontend expects 'obtained_marks'
        student_id: result.student_id // Keep student_id for component-level enrichment
      }))
    },
    // Always enabled - performance components need all exam results
  })
}

export const useStudyMaterials = (subjectId) => {
  return useQuery({
    queryKey: [...queryKeys.studyMaterials, subjectId],
    queryFn: () => adminAPI.getStudyMaterials(subjectId).then(res => res.data),
  })
}

// Teacher Hooks
export const useTeacherProfile = (teacherId) => {
  return useQuery({
    queryKey: ['teacherProfile', teacherId],
    queryFn: () => teacherAPI.getMyProfile(teacherId).then(res => res.data),
    enabled: !!teacherId,
  })
}

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
    enabled: !!teacherId,
  })
}

export const useTeacherMaterials = (teacherId) => {
  return useQuery({
    queryKey: ['teacherMaterials', teacherId],
    queryFn: () => teacherAPI.getMyStudyMaterials(teacherId).then(res => res.data),
    enabled: !!teacherId,
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
      const resultsRes = await studentAPI.getMyExamResults(studentId)
      const results = resultsRes.data
      
      // Transform results data (backend now returns enriched data)
      return results.map(result => ({
        ...result,
        obtained_marks: result.marks_obtained,
        exam: result.exam ? {
          ...result.exam,
          title: result.exam.name,
          total_marks: result.exam.max_marks,
          subject: result.exam.subject
        } : null
      }))
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

export const useApproveAdmissionRequest = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (requestId) => adminAPI.approveAdmissionRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admissionRequests })
      queryClient.invalidateQueries({ queryKey: queryKeys.students })
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard })
    },
  })
}

export const useRejectAdmissionRequest = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (requestId) => adminAPI.rejectAdmissionRequest(requestId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.admissionRequests })
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
        // Use the new bulk endpoint for efficiency
        return teacherAPI.markAttendance(attendanceDataArray)
      } else {
        // Single submission
        return teacherAPI.markAttendance(attendanceDataArray)
      }
    },
    onMutate: async (variables) => {
      // Optimistic update - immediately update cache before request completes
      if (Array.isArray(variables)) {
        const classId = variables[0]?.class_id
        const date = variables[0]?.date?.split('T')[0]
        
        if (classId && date) {
          // Cancel any outgoing refetches
          await queryClient.cancelQueries(['classAttendance', classId, date])
          
          // Snapshot the previous value
          const previousAttendance = queryClient.getQueryData(['classAttendance', classId, date])
          
          // Optimistically update to the new value
          queryClient.setQueryData(['classAttendance', classId, date], () => {
            return variables.map((record, index) => ({
              id: previousAttendance?.[index]?.id || Date.now() + index,
              student_id: record.student_id,
              class_id: record.class_id,
              date: record.date,
              status: record.status,
              remarks: record.remarks || '',
              is_present: record.status === 'present'
            }))
          })
          
          // Return a context object with the snapshotted value
          return { previousAttendance, classId, date }
        }
      }
    },
    onError: (err, variables, context) => {
      console.error('Attendance submission error:', err)
      console.error('Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        variables: variables
      })
      // If the mutation fails, use the context returned from onMutate to roll back
      if (context?.previousAttendance) {
        queryClient.setQueryData(
          ['classAttendance', context.classId, context.date], 
          context.previousAttendance
        )
      }
    },
    onSuccess: (data, variables) => {
      console.log('Attendance submission successful:', data)
      console.log('Variables:', variables)
      // Update the cache with the actual server response
      if (Array.isArray(variables)) {
        const classId = variables[0]?.class_id
        const date = variables[0]?.date?.split('T')[0]
        
        if (classId && date) {
          // For bulk response, data.data contains the array of created records
          const attendanceRecords = data?.data || data
          
          // Update with real server data
          queryClient.setQueryData(['classAttendance', classId, date], () => {
            return attendanceRecords.map((record) => ({
              id: record.id,
              student_id: record.student_id,
              class_id: record.class_id,
              date: record.date,
              status: record.status,
              remarks: record.remarks || '',
              is_present: record.status === 'present'
            }))
          })
        }
      }
      
      // Invalidate broader attendance queries for consistency
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.attendance,
        refetchType: 'none'
      })
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

export const useUpdateExam = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, ...examData }) => adminAPI.updateExam(id, examData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.exams })
      queryClient.invalidateQueries({ queryKey: ['teacherExams'] })
    },
  })
}

export const useDeleteExam = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (examId) => adminAPI.deleteExam(examId),
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
      // Invalidate all examResults queries, regardless of parameters
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.examResults,
        exact: false 
      })
      // Also invalidate student exam results since new results affect students
      queryClient.invalidateQueries({ 
        queryKey: ['studentExamResults'],
        exact: false 
      })
    },
  })
}

export const useUploadStudyMaterial = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ formData, teacherId }) => teacherAPI.uploadStudyMaterial(formData, teacherId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.studyMaterials })
      queryClient.invalidateQueries({ queryKey: ['teacherMaterials'] })
    },
  })
}

export const useUpdateStudyMaterial = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ teacherId, materialId, materialData }) => teacherAPI.updateStudyMaterial(teacherId, materialId, materialData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.studyMaterials })
      queryClient.invalidateQueries({ queryKey: ['teacherMaterials'] })
    },
  })
}

export const useDeleteStudyMaterial = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ teacherId, materialId }) => teacherAPI.deleteStudyMaterial(teacherId, materialId),
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
      // Invalidate all examResults queries, regardless of parameters
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.examResults,
        exact: false 
      })
      // Also invalidate student exam results since new results affect students
      queryClient.invalidateQueries({ 
        queryKey: ['studentExamResults'],
        exact: false 
      })
    },
  })
}

export const useUpdateResult = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ id, ...resultData }) => adminAPI.updateExamResult(id, resultData),
    onSuccess: () => {
      // Invalidate all examResults queries, regardless of parameters
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.examResults,
        exact: false 
      })
      // Also invalidate student exam results since updated results affect students
      queryClient.invalidateQueries({ 
        queryKey: ['studentExamResults'],
        exact: false 
      })
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

export const useDeleteSubject = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (subjectId) => adminAPI.deleteSubject(subjectId),
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
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    cacheTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
    refetchOnWindowFocus: false, // Don't refetch when window gains focus
    placeholderData: (previousData) => previousData, // Keep previous data while refetching
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

export const useBulkUpdateAttendance = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (attendanceUpdates) => {
      console.log('Processing bulk attendance updates:', attendanceUpdates)
      
      // Use the actual bulk endpoint instead of sequential individual updates
      try {
        const result = await adminAPI.updateBulkAttendance(attendanceUpdates)
        console.log('Bulk update successful:', result.data || result)
        return result.data || result
      } catch (error) {
        console.error('Bulk update failed, falling back to individual updates:', error)
        
        // Fallback: Use individual updates sequentially if bulk fails
        const results = []
        const errors = []
        
        for (let i = 0; i < attendanceUpdates.length; i++) {
          const update = attendanceUpdates[i]
          try {
            console.log(`Processing fallback update ${i + 1}/${attendanceUpdates.length}:`, update)
            
            const result = await adminAPI.updateAttendance(update.attendanceId, {
              student_id: update.student_id,
              class_id: update.class_id,
              date: update.date,
              status: update.status,
              remarks: update.remarks || ''
            })
            
            results.push(result.data || result)
          } catch (error) {
            console.error(`Error updating attendance ${i + 1}:`, error)
            errors.push(`Student ${i + 1}: ${error.response?.data?.detail || error.message}`)
          }
        }
        
        if (errors.length > 0 && results.length === 0) {
          // All failed
          throw new Error(`All updates failed: ${errors.join('; ')}`)
        } else if (errors.length > 0) {
          // Partial success
          console.warn(`Partial success: ${results.length} succeeded, ${errors.length} failed`, errors)
        }
        
        return results
      }
    },
    onMutate: async (variables) => {
      // Optimistic update for bulk attendance updates
      if (Array.isArray(variables) && variables.length > 0) {
        const classId = variables[0]?.class_id
        const date = variables[0]?.date?.split('T')[0]
        
        if (classId && date) {
          // Cancel any outgoing refetches
          await queryClient.cancelQueries(['classAttendance', classId, date])
          
          // Snapshot the previous value
          const previousAttendance = queryClient.getQueryData(['classAttendance', classId, date])
          
          // Optimistically update to the new values
          queryClient.setQueryData(['classAttendance', classId, date], (oldData) => {
            if (!oldData) return oldData
            
            return oldData.map(record => {
              const update = variables.find(upd => 
                (upd.attendanceId === record.id || upd.id === record.id)
              )
              if (update) {
                return {
                  ...record,
                  status: update.status || record.status,
                  remarks: update.remarks || record.remarks,
                  is_present: (update.status || record.status) === 'present'
                }
              }
              return record
            })
          })
          
          return { previousAttendance, classId, date }
        }
      }
    },
    onError: (err, variables, context) => {
      console.error('Bulk attendance update error:', err)
      // Rollback optimistic update on error
      if (context?.previousAttendance) {
        queryClient.setQueryData(
          ['classAttendance', context.classId, context.date], 
          context.previousAttendance
        )
      }
    },
    onSuccess: (data, variables) => {
      console.log('Bulk attendance update successful:', data)
      
      // Update cache with server response
      if (Array.isArray(variables) && variables.length > 0) {
        const classId = variables[0]?.class_id
        const date = variables[0]?.date?.split('T')[0]
        
        if (classId && date && data) {
          queryClient.setQueryData(['classAttendance', classId, date], (oldData) => {
            if (!oldData) return oldData
            
            return oldData.map(record => {
              const updatedRecord = data.find(upd => upd.id === record.id)
              return updatedRecord ? {
                ...updatedRecord,
                is_present: updatedRecord.status === 'present'
              } : record
            })
          })
        }
      }
      
      // Invalidate broader attendance queries for consistency
      queryClient.invalidateQueries({ 
        queryKey: queryKeys.attendance,
        refetchType: 'none'
      })
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

// Public Admission Hook
export const useSubmitAdmission = () => {
  return useMutation({
    mutationFn: (admissionData) => publicAPI.submitAdmission(admissionData),
  })
}

// Public Classes Hook (no authentication required)
export const usePublicClasses = () => {
  return useQuery({
    queryKey: ['public', 'classes'],
    queryFn: () => publicAPI.getClasses().then(res => res.data),
  })
}

// Photo Upload/Delete Mutations
export const useUploadUserPhoto = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ userId, formData }) => adminAPI.uploadUserPhoto(userId, formData),
    onSuccess: () => {
      // Invalidate relevant queries that might show user photos
      queryClient.invalidateQueries({ queryKey: queryKeys.students })
      queryClient.invalidateQueries({ queryKey: queryKeys.teachers })
      queryClient.invalidateQueries({ queryKey: ['studentProfile'] })
      queryClient.invalidateQueries({ queryKey: ['teacherClasses'] })
      queryClient.invalidateQueries({ queryKey: ['teacherStudents'] })
    },
  })
}

export const useDeleteUserPhoto = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (userId) => adminAPI.deleteUserPhoto(userId),
    onSuccess: () => {
      // Invalidate relevant queries that might show user photos
      queryClient.invalidateQueries({ queryKey: queryKeys.students })
      queryClient.invalidateQueries({ queryKey: queryKeys.teachers })
      queryClient.invalidateQueries({ queryKey: ['studentProfile'] })
      queryClient.invalidateQueries({ queryKey: ['teacherClasses'] })
      queryClient.invalidateQueries({ queryKey: ['teacherStudents'] })
    },
  })
}

// Student-specific Photo Upload/Delete Mutations
export const useStudentUploadPhoto = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ userId, photoData }) => studentAPI.uploadUserPhoto(userId, photoData),
    onSuccess: () => {
      // Invalidate student profile to refresh photo
      queryClient.invalidateQueries({ queryKey: ['studentProfile'] })
    },
  })
}

export const useStudentDeletePhoto = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (userId) => studentAPI.deleteUserPhoto(userId),
    onSuccess: () => {
      // Invalidate student profile to refresh photo
      queryClient.invalidateQueries({ queryKey: ['studentProfile'] })
    },
  })
}

// Teacher-specific Photo Upload/Delete Mutations
export const useTeacherUploadPhoto = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ userId, photoData }) => teacherAPI.uploadUserPhoto(userId, photoData),
    onSuccess: () => {
      // Invalidate teacher profile to refresh photo
      queryClient.invalidateQueries({ queryKey: ['teacherProfile'] })
    },
  })
}

export const useTeacherDeletePhoto = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (userId) => teacherAPI.deleteUserPhoto(userId),
    onSuccess: () => {
      // Invalidate teacher profile to refresh photo
      queryClient.invalidateQueries({ queryKey: ['teacherProfile'] })
    },
  })
}

// Admin-specific Photo Upload/Delete Mutations
export const useAdminUploadPhoto = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ userId, photoData }) => adminAPI.uploadUserPhoto(userId, photoData),
    onSuccess: (data, variables) => {
      // Invalidate admin profile to refresh photo
      queryClient.invalidateQueries({ queryKey: ['adminProfile', variables.userId] })
    },
  })
}

export const useAdminDeletePhoto = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (userId) => adminAPI.deleteUserPhoto(userId),
    onSuccess: (data, userId) => {
      // Invalidate admin profile to refresh photo
      queryClient.invalidateQueries({ queryKey: ['adminProfile', userId] })
    },
  })
}

// Admin Profile Hook
export const useAdminProfile = (adminId) => {
  return useQuery({
    queryKey: ['adminProfile', adminId],
    queryFn: () => adminAPI.getMyProfile(adminId).then(res => res.data),
    enabled: !!adminId,
  })
}

// Profile Update Hooks for Students and Teachers to Edit Their Own Profiles
export const useUpdateStudentProfile = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ studentId, ...profileData }) => studentAPI.updateMyProfile(studentId, profileData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['studentProfile', variables.studentId] })
    },
  })
}

export const useUpdateTeacherProfile = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ teacherId, ...profileData }) => teacherAPI.updateMyProfile(teacherId, profileData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['teacherProfile', variables.teacherId] })
    },
  })
}

export const useUpdateAdminProfile = () => {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ adminId, ...profileData }) => adminAPI.updateMyProfile(adminId, profileData),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['adminProfile', variables.adminId] })
    },
  })
}

// Password Change Hooks for Self-Service Password Updates
export const useChangeStudentPassword = () => {
  return useMutation({
    mutationFn: ({ studentId, ...passwordData }) => studentAPI.changeMyPassword(studentId, passwordData),
  })
}

export const useChangeTeacherPassword = () => {
  return useMutation({
    mutationFn: ({ teacherId, ...passwordData }) => teacherAPI.changeMyPassword(teacherId, passwordData),
  })
}

export const useChangeAdminPassword = () => {
  return useMutation({
    mutationFn: ({ adminId, ...passwordData }) => adminAPI.changeMyPassword(adminId, passwordData),
  })
}