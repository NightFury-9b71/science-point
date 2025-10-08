import { Award, TrendingUp, Calendar } from 'lucide-react'
import Card from '../../components/Card'
import Table from '../../components/Table'
import { useAuth } from '../../contexts/AuthContext'
import { useStudentExamResults } from '../../services/queries'

function StudentResults() {
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
  
  const { data: examResults = [], isLoading, error } = useStudentExamResults(studentId)

  const getGradeColor = (grade) => {
    const gradeColors = {
      'A+': 'bg-green-100 text-green-800',
      'A': 'bg-green-100 text-green-800',
      'B+': 'bg-blue-100 text-blue-800',
      'B': 'bg-blue-100 text-blue-800',
      'C+': 'bg-yellow-100 text-yellow-800',
      'C': 'bg-yellow-100 text-yellow-800',
      'D': 'bg-orange-100 text-orange-800',
      'F': 'bg-red-100 text-red-800'
    }
    return gradeColors[grade] || 'bg-gray-100 text-gray-800'
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
        <p className="text-red-600">Failed to load exam results</p>
      </div>
    )
  }

  // Calculate stats
  const totalExams = examResults.length
  const totalMarks = examResults.reduce((sum, result) => sum + result.marks_obtained, 0)
  const totalPossible = examResults.reduce((sum, result) => sum + result.total_marks, 0)
  const averagePercentage = totalPossible > 0 ? Math.round((totalMarks / totalPossible) * 100) : 0

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Award className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">Exam Results</h1>
      </div>

      {/* Results Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <Card className="p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Award className="h-8 w-8 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{totalExams}</p>
              <p className="text-xs sm:text-sm text-gray-500">Total Exams</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{averagePercentage}%</p>
              <p className="text-xs sm:text-sm text-gray-500">Average</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Award className="h-8 w-8 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-lg sm:text-2xl font-bold text-gray-900">{totalMarks}</p>
              <p className="text-xs sm:text-sm text-gray-500">Total Marks</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Results Table */}
      <Card>
        <Card.Header>
          <Card.Title className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Detailed Results
          </Card.Title>
        </Card.Header>
        <Card.Content className="p-0 overflow-hidden">
          {/* Mobile View */}
          <div className="block lg:hidden">
            <div className="space-y-3 p-4">
              {examResults.map((result) => (
                <div key={result.id} className="p-3 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">Exam #{result.exam_id}</h4>
                      <p className="text-xs text-gray-600">Subject #{result.subject_id}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">{result.marks_obtained}/{result.total_marks}</p>
                      {result.grade && (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getGradeColor(result.grade)}`}>
                          {result.grade}
                        </span>
                      )}
                    </div>
                  </div>
                  {result.remarks && (
                    <p className="text-xs text-gray-500 mt-2">{result.remarks}</p>
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
                  <Table.Head>Exam</Table.Head>
                  <Table.Head>Subject</Table.Head>
                  <Table.Head>Marks Obtained</Table.Head>
                  <Table.Head>Total Marks</Table.Head>
                  <Table.Head>Percentage</Table.Head>
                  <Table.Head>Grade</Table.Head>
                  <Table.Head>Remarks</Table.Head>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {examResults.map((result) => (
                  <Table.Row key={result.id}>
                    <Table.Cell>Exam #{result.exam_id}</Table.Cell>
                    <Table.Cell>Subject #{result.subject_id}</Table.Cell>
                    <Table.Cell>
                      <span className="font-medium">{result.marks_obtained}</span>
                    </Table.Cell>
                    <Table.Cell>{result.total_marks}</Table.Cell>
                    <Table.Cell>
                      <span className="font-medium">
                        {Math.round((result.marks_obtained / result.total_marks) * 100)}%
                      </span>
                    </Table.Cell>
                    <Table.Cell>
                      {result.grade && (
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getGradeColor(result.grade)}`}>
                          {result.grade}
                        </span>
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      {result.remarks || 'No remarks'}
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
        </Card.Content>
      </Card>

      {examResults.length === 0 && (
        <div className="text-center py-8">
          <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No exam results found</p>
        </div>
      )}
    </div>
  )
}

export default StudentResults