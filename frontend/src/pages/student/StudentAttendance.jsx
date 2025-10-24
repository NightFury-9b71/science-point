import { Calendar, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react'
import Card from '../../components/Card'
import Table from '../../components/Table'
import { useAuth } from '../../contexts/AuthContext'
import { useStudentAttendance } from '../../services/queries'
import { useMemo } from 'react'

function StudentAttendance() {
  const { user } = useAuth()
  const studentId = user?.student_id || user?.studentId
  
  // Verify student authentication
  if (!studentId) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="text-yellow-600 mb-2">
            <svg className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-yellow-900 mb-2">Student Profile Incomplete</h3>
          <p className="text-yellow-700">
            Your student profile is not properly set up. Please contact the administrator.
          </p>
        </div>
      </div>
    )
  }
  
  const { data: attendance = [], isLoading, error } = useStudentAttendance(studentId)

  const attendanceStats = useMemo(() => {
    const present = attendance.filter(a => a.status === 'present').length
    const absent = attendance.filter(a => a.status === 'absent').length
    const late = attendance.filter(a => a.status === 'late').length
    const total = attendance.length
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0

    return { present, absent, late, total, percentage }
  }, [attendance])

  const getAttendanceIcon = (status) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="h-5 w-5 text-green-600" />
      case 'absent':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'late':
        return <Clock className="h-5 w-5 text-yellow-600" />
      default:
        return null
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Failed to load attendance data</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">My Attendance</h1>
      </div>

      {/* Attendance Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card className="p-4 sm:p-6">
          <div className="text-center">
            <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <p className="text-xl sm:text-2xl font-bold text-green-600">{attendanceStats.present}</p>
            <p className="text-xs sm:text-sm text-gray-500">Present</p>
          </div>
        </Card>
        
        <Card className="p-4 sm:p-6">
          <div className="text-center">
            <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
            <p className="text-xl sm:text-2xl font-bold text-red-600">{attendanceStats.absent}</p>
            <p className="text-xs sm:text-sm text-gray-500">Absent</p>
          </div>
        </Card>
        
        <Card className="p-4 sm:p-6">
          <div className="text-center">
            <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-xl sm:text-2xl font-bold text-yellow-600">{attendanceStats.late}</p>
            <p className="text-xs sm:text-sm text-gray-500">Late</p>
          </div>
        </Card>
        
        <Card className="p-4 sm:p-6">
          <div className="text-center">
            <TrendingUp className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-xl sm:text-2xl font-bold text-blue-600">{attendanceStats.percentage}%</p>
            <p className="text-xs sm:text-sm text-gray-500">Rate</p>
          </div>
        </Card>
      </div>

      {/* Attendance Records */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Attendance History
          </Card.Title>
        </Card.Header>
        <Card.Content className="p-0 overflow-hidden">
          {/* Mobile View */}
          <div className="block lg:hidden">
            <div className="space-y-3 p-4">
              {attendance.map((record) => (
                <div key={record.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getAttendanceIcon(record.status)}
                    <div>
                      <p className="font-medium text-gray-900 text-sm">
                        {new Date(record.date).toLocaleDateString()}
                      </p>
                      <p className="text-xs text-gray-600 capitalize">
                        {record.status}
                      </p>
                    </div>
                  </div>
                  {record.remarks && (
                    <p className="text-xs text-gray-500 max-w-20 truncate">{record.remarks}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Desktop View */}
          <div className="hidden lg:block">
            <Table>
              <Table.Header>
                <Table.Row>
                  <Table.Head>Date</Table.Head>
                  <Table.Head>Status</Table.Head>
                  <Table.Head>Remarks</Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {attendance.map((record) => (
                  <Table.Row key={record.id}>
                    <Table.Cell>
                      {new Date(record.date).toLocaleDateString()}
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex items-center space-x-2">
                        {getAttendanceIcon(record.status)}
                        <span className="capitalize">{record.status}</span>
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      {record.remarks || 'No remarks'}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
        </Card.Content>
      </Card>

      {attendance.length === 0 && (
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No attendance records found</p>
        </div>
      )}
    </div>
  )
}

export default StudentAttendance