import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, CheckCircle, XCircle, X } from 'lucide-react'
import { toast } from 'sonner'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Modal from '../../components/Modal'
import { Input, Select } from '../../components/Form'
import { useAuth } from '../../contexts/AuthContext'
import { useTeacherClasses, useTeacherStudents, useMarkAttendance, useClassAttendance, useUpdateAttendance } from '../../services/queries'

const TeacherAttendance = () => {
  const navigate = useNavigate()
  const { user, isLoading: authLoading } = useAuth()
  const teacherId = user?.teacher_id || user?.teacherId
  
  // Show loading while auth is being checked
  if (authLoading) {
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
  
  // Only call queries after we confirm teacherId exists
  const { data: myClasses = [] } = useTeacherClasses(teacherId)
  const { data: myStudents = [] } = useTeacherStudents(teacherId)
  const markAttendance = useMarkAttendance()
  const updateAttendance = useUpdateAttendance()
  
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [attendance, setAttendance] = useState({})
  const [showSubmitModal, setShowSubmitModal] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)

  // Get existing attendance for selected class and date
  const { data: existingAttendance = [] } = useClassAttendance(
    selectedClass, 
    selectedDate ? `${selectedDate}T00:00:00` : null
  )

  const classStudents = myStudents.filter(student => 
    selectedClass ? student.class_id === parseInt(selectedClass) : false
  )

  // Load existing attendance when class/date changes
  React.useEffect(() => {
    if (existingAttendance.length > 0) {
      const attendanceMap = {}
      existingAttendance.forEach(record => {
        attendanceMap[record.student_id] = {
          status: record.status,
          id: record.id
        }
      })
      setAttendance(attendanceMap)
      setIsEditMode(true)
    } else {
      // Only reset if we have a selected class (to avoid clearing on initial load)
      if (selectedClass) {
        setAttendance({})
        setIsEditMode(false)
      }
    }
  }, [existingAttendance, selectedClass])

  // Debug logging
  console.log('TeacherAttendance Debug:', {
    user,
    teacherId,
    myClasses: myClasses.length,
    myStudents: myStudents.length,
    selectedClass,
    selectedDate,
    classStudents: classStudents.length,
    attendance: Object.keys(attendance).length,
    attendanceData: attendance,
    existingAttendance: existingAttendance.length,
    isEditMode
  })

  const handleAttendanceChange = (studentId, status) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: isEditMode 
        ? { ...prev[studentId], status }
        : status
    }))
  }

  const handleSubmitAttendance = async () => {
    if (!selectedClass || !selectedDate || Object.keys(attendance).length === 0) {
      toast.error('Please select class, date and mark attendance')
      return
    }

    try {
      if (isEditMode) {
        // Update existing attendance records
        console.log('Updating attendance records:', attendance)
        
        const updates = Object.entries(attendance).map(([studentId, data]) => {
          if (data && data.id && data.status) {
            const originalRecord = existingAttendance.find(record => record.id === data.id)
            return updateAttendance.mutateAsync({
              attendanceId: data.id,
              student_id: originalRecord.student_id,
              class_id: originalRecord.class_id,
              date: originalRecord.date,
              status: data.status,
              remarks: originalRecord.remarks
            })
          }
          return Promise.resolve()
        })
        
        await Promise.all(updates)
        toast.success(`Attendance updated successfully for ${updates.length} students!`)
      } else {
        // Create new attendance records
        const dateTime = `${selectedDate}T00:00:00`
        
        const attendanceRecords = Object.entries(attendance).map(([studentId, status]) => ({
          student_id: parseInt(studentId),
          class_id: parseInt(selectedClass),
          date: dateTime,
          status: status,
          remarks: null
        }))
        
        console.log('Creating new attendance records:', attendanceRecords)
        
        await markAttendance.mutateAsync(attendanceRecords)
        toast.success(`Attendance marked successfully for ${attendanceRecords.length} students!`)
      }
      
      setShowSubmitModal(false)
      if (!isEditMode) {
        setAttendance({})
      }
    } catch (error) {
      console.error('Attendance submission error:', error)
      console.error('Error details:', error.response?.data || error.message)
      toast.error(`Failed to ${isEditMode ? 'update' : 'mark'} attendance: ${error.response?.data?.detail || error.message}`)
    }
  }

  const handleMarkAllPresent = () => {
    const newAttendance = {}
    classStudents.forEach(student => {
      newAttendance[student.id] = isEditMode 
        ? { ...attendance[student.id], status: 'present' }
        : 'present'
    })
    setAttendance(newAttendance)
    toast.success(`Marked all ${classStudents.length} students as present`)
  }

  const handleMarkAllAbsent = () => {
    const newAttendance = {}
    classStudents.forEach(student => {
      newAttendance[student.id] = isEditMode 
        ? { ...attendance[student.id], status: 'absent' }
        : 'absent'
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
                setAttendance({})
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
          
          {selectedClass && Object.keys(attendance).length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CheckCircle className="h-5 w-5 text-yellow-600" />
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-yellow-800">
                    Ready to mark attendance
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Select present/absent for each student below, then submit
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
                  <p className="text-sm text-gray-600 mt-1">
                    {classStudents.length} students • {Object.keys(attendance).length} marked
                  </p>
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
                  All Present
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleMarkAllAbsent}
                  disabled={classStudents.length === 0}
                  className="text-red-600 border-red-300 hover:bg-red-50 disabled:text-gray-400 disabled:border-gray-200 font-medium"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  All Absent
                </Button>
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
                          variant={(isEditMode ? attendance[student.id]?.status : attendance[student.id]) === 'present' ? 'default' : 'outline'}
                          onClick={() => handleAttendanceChange(student.id, 'present')}
                          className={`flex-1 sm:flex-none py-2 px-4 font-medium transition-all duration-200 ${
                            (isEditMode ? attendance[student.id]?.status : attendance[student.id]) === 'present' 
                              ? 'bg-green-600 hover:bg-green-700 text-white border-green-600 shadow-md' 
                              : 'text-green-600 border-green-300 hover:bg-green-50 hover:border-green-400'
                          }`}
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Present
                        </Button>
                        <Button
                          size="sm"
                          variant={(isEditMode ? attendance[student.id]?.status : attendance[student.id]) === 'absent' ? 'default' : 'outline'}
                          onClick={() => handleAttendanceChange(student.id, 'absent')}
                          className={`flex-1 sm:flex-none py-2 px-4 font-medium transition-all duration-200 ${
                            (isEditMode ? attendance[student.id]?.status : attendance[student.id]) === 'absent' 
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
                {Object.values(attendance).filter(item => 
                  isEditMode ? item?.status === 'present' : item === 'present'
                ).length}
              </div>
              <div className="text-sm font-medium text-green-700">Present</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg text-center border border-red-200">
              <div className="text-2xl font-bold text-red-600">
                {Object.values(attendance).filter(item => 
                  isEditMode ? item?.status === 'absent' : item === 'absent'
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
              loading={isEditMode ? updateAttendance.isPending : markAttendance.isPending}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700"
            >
              {(isEditMode ? updateAttendance.isPending : markAttendance.isPending) 
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