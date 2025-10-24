import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, XCircle, X } from 'lucide-react'
import { toast } from 'sonner'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import { Input, Select } from '../../components/Form'
import { useAuth } from '../../contexts/AuthContext'
import { useTeacherClasses, useTeacherStudents, useMarkAttendance, useClassAttendance, useUpdateAttendance, useBulkUpdateAttendance } from '../../services/queries'

const TeacherAttendance = () => {
  const navigate = useNavigate()
  const { user, isLoading: authLoading } = useAuth()
  const teacherId = user?.teacher_id || user?.teacherId
  
  // Always call hooks first - before any conditional returns
  const { data: myClasses = [], isLoading: classesLoading, error: classesError } = useTeacherClasses(teacherId)
  const { data: myStudents = [], isLoading: studentsLoading, error: studentsError } = useTeacherStudents(teacherId)
  const markAttendance = useMarkAttendance()
  const updateAttendance = useUpdateAttendance()
  const bulkUpdateAttendance = useBulkUpdateAttendance()
  
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [attendance, setAttendance] = useState({})
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)

  // Get existing attendance for selected class and date
  const { data: existingAttendance = [], isLoading: attendanceLoading, isFetching } = useClassAttendance(
    selectedClass, 
    selectedDate ? `${selectedDate}T00:00:00` : null
  )

  const classStudents = myStudents.filter(student => 
    selectedClass ? student.class_id === parseInt(selectedClass) : false
  )

  // Load existing attendance when class/date changes
  useEffect(() => {
    if (selectedClass && classStudents.length > 0) {
      const attendanceMap = {}
      
      // First, set up all students with default data
      classStudents.forEach(student => {
        attendanceMap[student.id] = {
          status: 'absent', // Default to absent
          student_id: student.id,
          class_id: parseInt(selectedClass),
          date: `${selectedDate}T00:00:00`,
          remarks: null,
          id: null // No ID for new records initially
        }
      })
      
      // Then, overlay existing attendance data if available
      if (existingAttendance.length > 0) {
        existingAttendance.forEach(record => {
          // Update the student's record with existing data
          attendanceMap[record.student_id] = {
            status: record.status,
            id: record.id, // Keep the existing ID for updates
            student_id: record.student_id,
            class_id: record.class_id,
            date: record.date,
            remarks: record.remarks
          }
        })
        setIsEditMode(true)
        console.log(`Loaded existing attendance for ${existingAttendance.length} students, total ${Object.keys(attendanceMap).length} students in class`)
        console.log('Attendance map with IDs:', Object.fromEntries(
          Object.entries(attendanceMap).map(([studentId, data]) => [studentId, { hasId: !!data.id, status: data.status }])
        ))
      } else {
        setIsEditMode(false)
        console.log(`Set default absent status for all ${Object.keys(attendanceMap).length} students`)
      }
      
      setAttendance(attendanceMap)
    }
  }, [existingAttendance, selectedClass, selectedDate, classStudents.length])

  // Remove the duplicate effect since it's now handled above

  // Debug logging
  console.log('TeacherAttendance Debug:', {
    user,
    teacherId,
    myClasses: myClasses.length,
    myClassesData: myClasses,
    classesLoading,
    classesError,
    myStudents: myStudents.length,
    studentsLoading,
    studentsError,
    selectedClass,
    selectedDate,
    classStudents: classStudents.length,
    attendance: Object.keys(attendance).length,
    attendanceData: attendance,
    existingAttendance: existingAttendance.length,
    isEditMode,
    defaultAbsentSet: selectedClass && !existingAttendance.length && classStudents.length > 0
  })

  // CONDITIONAL RENDERING AFTER ALL HOOKS - This is critical for React hooks rules
  // Show loading while auth is being checked
  if (authLoading || classesLoading || studentsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  // Show error if teacher ID is not available
  if (!teacherId) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center p-6 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-600 mb-2">
            <XCircle className="h-8 w-8 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-red-900 mb-2">Teacher Profile Not Found</h3>
          <p className="text-red-700">
            Your teacher profile is not properly set up. Please contact the administrator.
          </p>
        </div>
      </div>
    )
  }

  // Show error if classes failed to load
  if (classesError) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center p-6 bg-red-50 border border-red-200 rounded-lg">
          <div className="text-red-600 mb-2">
            <XCircle className="h-8 w-8 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-red-900 mb-2">Failed to Load Classes</h3>
          <p className="text-red-700">
            {classesError.message || 'Unable to fetch your assigned classes. Please try refreshing the page.'}
          </p>
        </div>
      </div>
    )
  }

  // Show message if no classes are assigned
  if (myClasses.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-yellow-600 mb-2">
            <XCircle className="h-8 w-8 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-yellow-900 mb-2">No Classes Assigned</h3>
          <p className="text-yellow-700">
            You are not assigned to any classes yet. Please contact the administrator to assign classes to your account.
          </p>
        </div>
      </div>
    )
  }

  const handleAttendanceChange = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status: status
      }
    }))
  }

  const handleSubmitAttendance = async () => {
    if (!selectedClass || !selectedDate || Object.keys(attendance).length === 0) {
      toast.error('Please select class, date and mark attendance')
      return
    }

    try {
      if (isEditMode) {
        // Update existing attendance records using bulk update
        console.log('Updating attendance records:', attendance)
        console.log('Existing attendance count:', existingAttendance.length)
        console.log('Current attendance state count:', Object.keys(attendance).length)
        console.log('Class students count:', classStudents.length)
        
        // Separate updates for existing records and new records
        const updates = []
        const newRecords = []
        
        Object.entries(attendance).forEach(([studentId, data]) => {
          if (data && data.status) {
            if (data.id) {
              // Existing record - update it
              updates.push({
                attendanceId: data.id,
                id: data.id,
                student_id: data.student_id,
                class_id: data.class_id,
                date: data.date,
                status: data.status,
                remarks: data.remarks || ''
              })
            } else {
              // New record - create it only if there's no existing record for this student/date
              const existingRecord = existingAttendance.find(
                record => record.student_id === data.student_id
              )
              
              if (!existingRecord) {
                newRecords.push({
                  student_id: data.student_id,
                  class_id: data.class_id,
                  date: data.date,
                  status: data.status,
                  remarks: data.remarks
                })
              } else {
                console.warn(`Student ${data.student_id} has existing record but no ID in state - skipping to avoid duplicate`)
              }
            }
          }
        })
        
        console.log('Updates for existing records:', updates.length, updates)
        console.log('New records to create:', newRecords.length, newRecords)
        
        let totalProcessed = 0
        
        // Process updates if any
        if (updates.length > 0) {
          console.log('Sending bulk update with data:', updates)
          await bulkUpdateAttendance.mutateAsync(updates)
          totalProcessed += updates.length
        }
        
        // Process new records if any
        if (newRecords.length > 0) {
          console.log('Creating new attendance records:', newRecords)
          await markAttendance.mutateAsync(newRecords)
          totalProcessed += newRecords.length
        }
        
        if (totalProcessed > 0) {
          toast.success(`Attendance updated successfully for ${totalProcessed} students! (${updates.length} updated, ${newRecords.length} created)`)
        } else {
          toast.warning('No changes were made to attendance records')
        }
        
      } else {
        // Create new attendance records
        const attendanceRecords = Object.entries(attendance).map(([studentId, data]) => ({
          student_id: data.student_id,
          class_id: data.class_id,
          date: data.date,
          status: data.status,
          remarks: data.remarks
        }))
        
        console.log('Creating new attendance records:', attendanceRecords)
        
        await markAttendance.mutateAsync(attendanceRecords)
        toast.success(`Attendance marked successfully for ${attendanceRecords.length} students!`)
      }
      
      setShowSubmitModal(false)
      if (!isEditMode) {
        setIsEditMode(true)
        toast.success('Attendance submitted successfully! You can now edit it if needed.')
      }
    } catch (error) {
      console.error('Attendance submission error:', error)
      console.error('Error details:', error.response?.data || error.message)
      
      // Handle different error formats
      let errorMessage = 'Unknown error occurred'
      
      if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      } else {
        // Try to extract meaningful info from error object
        errorMessage = `Error: ${JSON.stringify(error.response?.data || error, null, 2)}`
      }
      
      toast.error(`Failed to ${isEditMode ? 'update' : 'mark'} attendance: ${errorMessage}`)
    }
  }

  const handleMarkAllPresent = () => {
    const newAttendance = {}
    classStudents.forEach(student => {
      newAttendance[student.id] = {
        ...(attendance[student.id] || {}),
        status: 'present'
      }
    })
    setAttendance(newAttendance)
    toast.success(`Marked all ${classStudents.length} students as present`)
  }

  const handleMarkAllAbsent = () => {
    const newAttendance = {}
    classStudents.forEach(student => {
      newAttendance[student.id] = {
        ...(attendance[student.id] || {}),
        status: 'absent'
      }
    })
    setAttendance(newAttendance)
    toast.success(`Marked all ${classStudents.length} students as absent`)
  }

  const handleClearAttendance = () => {
    setAttendance({})
    toast.success('Cleared all attendance marks')
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/teacher')}
            className="lg:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Mark Attendance</h2>
            <p className="text-sm text-gray-600 mt-1">Track student attendance for your classes</p>
          </div>
        </div>
        {selectedClass && (
          <div className="bg-blue-50 px-4 py-2 rounded-lg">
            <p className="text-sm font-medium text-blue-900">
              {myClasses.find(cls => cls.id === parseInt(selectedClass))?.name}
            </p>
            <p className="text-xs text-blue-600">{selectedDate}</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <Card className="p-6 shadow-lg border-0 bg-gradient-to-r from-white to-gray-50">
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Select
              label="Select Class"
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value)
                // Don't reset attendance immediately - let the effect handle it
              }}
              options={[
                { value: '', label: 'Choose a class' },
                ...myClasses.map(cls => ({ 
                  value: cls.id, 
                  label: cls.name 
                }))
              ]}
              className="text-base"
            />
            <Input
              label="Date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-base"
            />
          </div>
          
          {selectedClass && Object.keys(attendance).length === 0 && !attendanceLoading && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <XCircle className="h-5 w-5 text-blue-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-800">
                    Loading attendance for selected class...
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    Please wait while we check for existing attendance records
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {selectedClass && Object.keys(attendance).length > 0 && !isEditMode && (
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <XCircle className="h-5 w-5 text-orange-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-orange-800">
                    All students marked as ABSENT by default
                  </p>
                  <p className="text-xs text-orange-700 mt-1">
                    Click 'Present' for students who are attending, then submit
                  </p>
                </div>
              </div>
            </div>
          )}
          
          {selectedClass && Object.keys(attendance).length > 0 && isEditMode && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">
                    Editing existing attendance
                  </p>
                  <p className="text-xs text-green-700 mt-1">
                    Modify attendance status and click update when done
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-center">
            <Button
              onClick={() => setShowSubmitModal(true)}
              disabled={!selectedClass || Object.keys(attendance).length === 0}
              className="px-8 py-3 text-base font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300"
            >
              {isEditMode ? 'Update Attendance' : 'Submit Attendance'} ({Object.keys(attendance).length} marked)
            </Button>
          </div>
        </div>
      </Card>

      {/* Attendance List */}
      {selectedClass && (
        <Card className="shadow-lg border-0">
          <Card.Header className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
            <div className="flex flex-col space-y-4">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start space-y-3 sm:space-y-0">
                <div>
                  <Card.Title className="text-lg font-bold text-gray-900">
                    Students in {myClasses.find(cls => cls.id === parseInt(selectedClass))?.name}
                  </Card.Title>
                  {(() => {
                    const presentCount = Object.values(attendance).filter(data => 
                      data?.status === 'present'
                    ).length
                    const absentCount = Object.values(attendance).filter(data => 
                      data?.status === 'absent'
                    ).length
                    const totalStudents = classStudents.length
                    
                    return (
                      <div className="flex items-center space-x-4 text-sm mt-2">
                        <span className="text-gray-600">
                          Total: <span className="font-medium">{totalStudents}</span>
                        </span>
                        <span className="text-green-600">
                          Present: <span className="font-medium">{presentCount}</span>
                        </span>
                        <span className="text-red-600">
                          Absent: <span className="font-medium">{absentCount}</span>
                        </span>
                        {absentCount === totalStudents && totalStudents > 0 && (
                          <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                            All marked absent by default
                          </span>
                        )}
                      </div>
                    )
                  })()}
                </div>
                
                {/* Progress Bar */}
                <div className="w-full sm:w-48">
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>Progress</span>
                    <span>{Math.round((Object.keys(attendance).length / Math.max(classStudents.length, 1)) * 100)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(Object.keys(attendance).length / Math.max(classStudents.length, 1)) * 100}%` }}
                    ></div>
                  </div>
                </div>
              </div>
              
              {/* Quick Action Buttons */}
              <div className="flex flex-wrap gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleMarkAllPresent}
                  disabled={classStudents.length === 0}
                  className="text-green-600 border-green-300 hover:bg-green-50 disabled:text-gray-400 disabled:border-gray-200 font-medium"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark All Present
                </Button>
                {(() => {
                  const allAbsent = Object.values(attendance).every(data => 
                    data?.status === 'absent'
                  )
                  return (
                    <Button
                      size="sm"
                      variant={allAbsent ? "default" : "outline"}
                      onClick={handleMarkAllAbsent}
                      disabled={classStudents.length === 0 || allAbsent}
                      className={allAbsent 
                        ? "bg-red-600 text-white border-red-600 cursor-default" 
                        : "text-red-600 border-red-300 hover:bg-red-50 disabled:text-gray-400 disabled:border-gray-200"
                      }
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      {allAbsent ? "All Absent (Default)" : "Mark All Absent"}
                    </Button>
                  )
                })()}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleClearAttendance}
                  disabled={Object.keys(attendance).length === 0}
                  className="text-gray-600 border-gray-300 hover:bg-gray-50 disabled:text-gray-400 disabled:border-gray-200 font-medium"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear All
                </Button>
              </div>
            </div>
          </Card.Header>
          <Card.Content className="p-0">
            {classStudents.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {classStudents.map((student, index) => (
                  <div key={student.id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                      {/* Student Info */}
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">{index + 1}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 text-base">
                            {student.user?.full_name || 'N/A'}
                          </p>
                          <p className="text-sm text-gray-500">
                            Roll No: <span className="font-medium">{student.roll_number}</span>
                          </p>
                        </div>
                      </div>
                      
                      {/* Attendance Buttons */}
                      <div className="flex gap-3 w-full sm:w-auto">
                        <Button
                          size="sm"
                          variant={attendance[student.id]?.status === 'present' ? 'default' : 'outline'}
                          onClick={() => handleAttendanceChange(student.id, 'present')}
                          className={`flex-1 sm:flex-none py-2 px-4 font-medium transition-all duration-200 ${
                            attendance[student.id]?.status === 'present' 
                              ? 'bg-green-600 hover:bg-green-700 text-white border-green-600 shadow-md' 
                              : 'text-green-600 border-green-300 hover:bg-green-50 hover:border-green-400'
                          }`}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Present
                        </Button>
                        <Button
                          size="sm"
                          variant={attendance[student.id]?.status === 'absent' ? 'default' : 'outline'}
                          onClick={() => handleAttendanceChange(student.id, 'absent')}
                          className={`flex-1 sm:flex-none py-2 px-4 font-medium transition-all duration-200 ${
                            attendance[student.id]?.status === 'absent' 
                              ? 'bg-red-600 hover:bg-red-700 text-white border-red-600 shadow-md' 
                              : 'text-red-600 border-red-300 hover:bg-red-50 hover:border-red-400'
                          }`}
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Absent
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle className="h-8 w-8 text-gray-400" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Students Found</h3>
                <p className="text-gray-500">There are no students in the selected class.</p>
              </div>
            )}
          </Card.Content>
        </Card>
      )}

      {!selectedClass && (
        <Card className="p-12 text-center">
          <div className="w-20 h-20 mx-auto bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <CheckCircle className="h-10 w-10 text-blue-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-3">Select a Class</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            Choose a class from the dropdown above to start marking attendance for your students.
          </p>
        </Card>
      )}

      {/* Submit Confirmation Modal */}
      <Modal 
        isOpen={showSubmitModal} 
        onClose={() => setShowSubmitModal(false)}
        title={isEditMode ? "Confirm Attendance Update" : "Confirm Attendance Submission"}
        className="sm:max-w-lg"
      >
        <div className="space-y-6">
          {/* Summary Header */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <CheckCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-900">Attendance Summary</h3>
                <p className="text-sm text-blue-700">
                  {myClasses.find(cls => cls.id === parseInt(selectedClass))?.name} • {selectedDate}
                </p>
              </div>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 p-4 rounded-lg text-center border border-green-200">
              <div className="text-2xl font-bold text-green-600">
                {Object.values(attendance).filter(data => 
                  data?.status === 'present'
                ).length}
              </div>
              <div className="text-sm font-medium text-green-700">Present</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center border border-red-200">
              <div className="text-2xl font-bold text-red-600">
                {Object.values(attendance).filter(data => 
                  data?.status === 'absent'
                ).length}
              </div>
              <div className="text-sm font-medium text-red-700">Absent</div>
            </div>
          </div>

          {/* Confirmation Message */}
          <div className="text-center">
            <p className="text-gray-700 text-base">
              {isEditMode 
                ? 'Are you ready to update this attendance record?' 
                : 'Are you ready to submit this attendance record?'
              }
            </p>
            <p className="text-sm text-gray-500 mt-2">
              {isEditMode 
                ? 'This will update the existing attendance data.' 
                : 'This action cannot be undone.'
              }
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col-reverse sm:flex-row justify-end space-y-3 space-y-reverse sm:space-y-0 sm:space-x-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setShowSubmitModal(false)}
              className="px-6 py-2"
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSubmitAttendance} 
              loading={isEditMode ? (updateAttendance.isPending || bulkUpdateAttendance.isPending) : markAttendance.isPending}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700"
            >
              {(isEditMode ? (updateAttendance.isPending || bulkUpdateAttendance.isPending) : markAttendance.isPending) 
                ? (isEditMode ? 'Updating...' : 'Submitting...') 
                : (isEditMode ? 'Confirm & Update' : 'Confirm & Submit')
              }
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default TeacherAttendance