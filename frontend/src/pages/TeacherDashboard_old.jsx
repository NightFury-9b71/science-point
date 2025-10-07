import React, { useState, useEffect } from 'react'
import { 
  Users, 
  BookOpen, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Plus,
  Upload,
  FileText,
  Award
} from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import Table from '../components/Table'
import Modal from '../components/Modal'
import { Input, Select, TextArea } from '../components/Form'
import { teacherAPI, adminAPI } from '../services/api'

const TeacherDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview')
  const [loading, setLoading] = useState(false)
  
  // Mock teacher ID - in real app this would come from authentication
  const teacherId = 1
  
  // Data state
  const [myClasses, setMyClasses] = useState([])
  const [myStudents, setMyStudents] = useState([])
  const [mySubjects, setMySubjects] = useState([])
  const [attendance, setAttendance] = useState([])
  const [exams, setExams] = useState([])
  const [examResults, setExamResults] = useState([])
  const [studyMaterials, setStudyMaterials] = useState([])
  const [notices, setNotices] = useState([])
  
  // Modal states
  const [showAttendanceModal, setShowAttendanceModal] = useState(false)
  const [showExamModal, setShowExamModal] = useState(false)
  const [showResultModal, setShowResultModal] = useState(false)
  const [showMaterialModal, setShowMaterialModal] = useState(false)
  
  // Selected class for attendance
  const [selectedClass, setSelectedClass] = useState(null)
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0])
  const [studentAttendance, setStudentAttendance] = useState({})
  
  // Form states
  const [examForm, setExamForm] = useState({
    name: '',
    exam_date: '',
    max_marks: 100,
    duration_minutes: 120,
    subject_id: '',
    class_id: ''
  })
  
  const [resultForm, setResultForm] = useState({
    exam_id: '',
    student_id: '',
    marks_obtained: 0,
    grade: '',
    remarks: ''
  })
  
  const [materialForm, setMaterialForm] = useState({
    title: '',
    description: '',
    subject_id: '',
    file_type: 'PDF',
    is_public: true
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [classesRes, studentsRes, subjectsRes, examsRes, materialsRes, noticesRes] = await Promise.all([
        teacherAPI.getMyClasses(teacherId),
        teacherAPI.getMyStudents(teacherId),
        teacherAPI.getMySubjects(teacherId),
        teacherAPI.getMyExams(teacherId),
        teacherAPI.getMyStudyMaterials(),
        teacherAPI.getNotices()
      ])
      
      setMyClasses(classesRes.data)
      setMyStudents(studentsRes.data)
      setMySubjects(subjectsRes.data)
      setExams(examsRes.data)
      setStudyMaterials(materialsRes.data)
      setNotices(noticesRes.data)
    } catch (error) {
      console.error('Error loading teacher data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAttendance = async (e) => {
    e.preventDefault()
    try {
      const attendancePromises = Object.entries(studentAttendance).map(([studentId, status]) => {
        return teacherAPI.markAttendance({
          student_id: parseInt(studentId),
          class_id: selectedClass.id,
          date: `${attendanceDate}T09:00:00`,
          status,
          remarks: ''
        })
      })
      
      await Promise.all(attendancePromises)
      setShowAttendanceModal(false)
      setSelectedClass(null)
      setStudentAttendance({})
      alert('Attendance marked successfully!')
    } catch (error) {
      console.error('Error marking attendance:', error)
      alert('Error marking attendance')
    }
  }

  const handleCreateExam = async (e) => {
    e.preventDefault()
    try {
      await teacherAPI.createExam({
        ...examForm,
        exam_date: `${examForm.exam_date}T10:00:00`,
        subject_id: parseInt(examForm.subject_id),
        class_id: parseInt(examForm.class_id),
        max_marks: parseInt(examForm.max_marks),
        duration_minutes: parseInt(examForm.duration_minutes)
      })
      setShowExamModal(false)
      setExamForm({
        name: '', exam_date: '', max_marks: 100, duration_minutes: 120, subject_id: '', class_id: ''
      })
      loadData()
    } catch (error) {
      console.error('Error creating exam:', error)
    }
  }

  const handleRecordResult = async (e) => {
    e.preventDefault()
    try {
      await teacherAPI.recordExamResult({
        ...resultForm,
        exam_id: parseInt(resultForm.exam_id),
        student_id: parseInt(resultForm.student_id),
        marks_obtained: parseFloat(resultForm.marks_obtained)
      })
      setShowResultModal(false)
      setResultForm({ exam_id: '', student_id: '', marks_obtained: 0, grade: '', remarks: '' })
      alert('Result recorded successfully!')
    } catch (error) {
      console.error('Error recording result:', error)
    }
  }

  const handleUploadMaterial = async (e) => {
    e.preventDefault()
    try {
      await teacherAPI.uploadStudyMaterial({
        ...materialForm,
        subject_id: parseInt(materialForm.subject_id),
        file_path: `/materials/${materialForm.title.toLowerCase().replace(/\s+/g, '_')}.${materialForm.file_type.toLowerCase()}`
      })
      setShowMaterialModal(false)
      setMaterialForm({ title: '', description: '', subject_id: '', file_type: 'PDF', is_public: true })
      loadData()
    } catch (error) {
      console.error('Error uploading material:', error)
    }
  }

  const openAttendanceModal = (classData) => {
    setSelectedClass(classData)
    // Initialize attendance state for all students in the class
    const classStudents = myStudents.filter(student => student.class_id === classData.id)
    const initialAttendance = {}
    classStudents.forEach(student => {
      initialAttendance[student.id] = 'present'
    })
    setStudentAttendance(initialAttendance)
    setShowAttendanceModal(true)
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  // Get students for selected class
  const selectedClassStudents = selectedClass ? 
    myStudents.filter(student => student.class_id === selectedClass.id) : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
        <div className="text-sm text-gray-600">
          Welcome back, Teacher!
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['overview', 'classes', 'attendance', 'exams', 'materials', 'notices'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <Card.Content className="flex items-center">
                <div className="flex-shrink-0">
                  <BookOpen className="h-8 w-8 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{myClasses.length}</p>
                  <p className="text-sm text-gray-500">My Classes</p>
                </div>
              </Card.Content>
            </Card>

            <Card>
              <Card.Content className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="h-8 w-8 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{myStudents.length}</p>
                  <p className="text-sm text-gray-500">My Students</p>
                </div>
              </Card.Content>
            </Card>

            <Card>
              <Card.Content className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="h-8 w-8 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{mySubjects.length}</p>
                  <p className="text-sm text-gray-500">Subjects</p>
                </div>
              </Card.Content>
            </Card>

            <Card>
              <Card.Content className="flex items-center">
                <div className="flex-shrink-0">
                  <Award className="h-8 w-8 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{exams.length}</p>
                  <p className="text-sm text-gray-500">Exams Created</p>
                </div>
              </Card.Content>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <Card.Header>
                <Card.Title>My Classes</Card.Title>
              </Card.Header>
              <Card.Content>
                <div className="space-y-3">
                  {myClasses.slice(0, 5).map((cls) => (
                    <div key={cls.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">{cls.name}</h4>
                        <p className="text-sm text-gray-600">Grade {cls.grade} | Capacity: {cls.capacity}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => openAttendanceModal(cls)}
                      >
                        Mark Attendance
                      </Button>
                    </div>
                  ))}
                </div>
              </Card.Content>
            </Card>

            <Card>
              <Card.Header>
                <Card.Title>Recent Notices</Card.Title>
              </Card.Header>
              <Card.Content>
                {notices.length > 0 ? (
                  <div className="space-y-3">
                    {notices.slice(0, 5).map((notice) => (
                      <div key={notice.id} className="border-l-4 border-blue-500 pl-4 py-2">
                        <h4 className="font-medium text-gray-900">{notice.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{notice.content.substring(0, 100)}...</p>
                        <p className="text-xs text-gray-400 mt-2">
                          {new Date(notice.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No recent notices</p>
                )}
              </Card.Content>
            </Card>
          </div>
        </div>
      )}

      {/* Classes Tab */}
      {activeTab === 'classes' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">My Classes</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {myClasses.map((cls) => (
              <Card key={cls.id}>
                <Card.Header>
                  <Card.Title>{cls.name}</Card.Title>
                </Card.Header>
                <Card.Content>
                  <div className="space-y-2">
                    <p><span className="font-medium">Grade:</span> {cls.grade}</p>
                    <p><span className="font-medium">Section:</span> {cls.section || 'N/A'}</p>
                    <p><span className="font-medium">Capacity:</span> {cls.capacity}</p>
                    <p><span className="font-medium">Academic Year:</span> {cls.academic_year || 'N/A'}</p>
                  </div>
                  <div className="mt-4 space-y-2">
                    <Button
                      className="w-full"
                      onClick={() => openAttendanceModal(cls)}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Mark Attendance
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setExamForm({ ...examForm, class_id: cls.id })
                        setShowExamModal(true)
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Exam
                    </Button>
                  </div>
                </Card.Content>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Attendance Tab */}
      {activeTab === 'attendance' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Attendance Management</h2>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {myClasses.map((cls) => (
              <Card key={cls.id}>
                <Card.Header>
                  <div className="flex justify-between items-center">
                    <Card.Title>{cls.name}</Card.Title>
                    <Button
                      size="sm"
                      onClick={() => openAttendanceModal(cls)}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      Mark Today
                    </Button>
                  </div>
                </Card.Header>
                <Card.Content>
                  <p className="text-gray-600">
                    Students: {myStudents.filter(s => s.class_id === cls.id).length}
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Last updated: {new Date().toLocaleDateString()}
                  </p>
                </Card.Content>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Exams Tab */}
      {activeTab === 'exams' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Exams & Results</h2>
            <div className="space-x-2">
              <Button onClick={() => setShowExamModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Exam
              </Button>
              <Button variant="outline" onClick={() => setShowResultModal(true)}>
                <Award className="h-4 w-4 mr-2" />
                Record Result
              </Button>
            </div>
          </div>
          
          <Card>
            <Card.Content className="p-0">
              <Table>
                <Table.Header>
                  <Table.Row>
                    <Table.Head>Exam Name</Table.Head>
                    <Table.Head>Date</Table.Head>
                    <Table.Head>Max Marks</Table.Head>
                    <Table.Head>Duration</Table.Head>
                    <Table.Head>Class</Table.Head>
                    <Table.Head>Actions</Table.Head>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {exams.map((exam) => (
                    <Table.Row key={exam.id}>
                      <Table.Cell>{exam.name}</Table.Cell>
                      <Table.Cell>{new Date(exam.exam_date).toLocaleDateString()}</Table.Cell>
                      <Table.Cell>{exam.max_marks}</Table.Cell>
                      <Table.Cell>{exam.duration_minutes} min</Table.Cell>
                      <Table.Cell>Class {exam.class_id}</Table.Cell>
                      <Table.Cell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setResultForm({ ...resultForm, exam_id: exam.id })
                            setShowResultModal(true)
                          }}
                        >
                          Add Results
                        </Button>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            </Card.Content>
          </Card>
        </div>
      )}

      {/* Materials Tab */}
      {activeTab === 'materials' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Study Materials</h2>
            <Button onClick={() => setShowMaterialModal(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Material
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {studyMaterials.map((material) => (
              <Card key={material.id}>
                <Card.Content>
                  <div className="flex items-start space-x-3">
                    <FileText className="h-8 w-8 text-blue-600 flex-shrink-0" />
                    <div>
                      <h3 className="font-medium text-gray-900">{material.title}</h3>
                      <p className="text-sm text-gray-600 mt-1">{material.description}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-gray-500">{material.file_type}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          material.is_public 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {material.is_public ? 'Public' : 'Private'}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card.Content>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Notices Tab */}
      {activeTab === 'notices' && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Notices</h2>
          
          <Card>
            <Card.Content>
              <div className="space-y-4">
                {notices.map((notice) => (
                  <div key={notice.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-semibold text-gray-900">{notice.title}</h3>
                        <p className="text-gray-600 mt-2">{notice.content}</p>
                        <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                          <span>{new Date(notice.created_at).toLocaleDateString()}</span>
                          {notice.is_urgent && (
                            <span className="bg-red-100 text-red-800 px-2 py-1 rounded">
                              Urgent
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card.Content>
          </Card>
        </div>
      )}

      {/* Attendance Modal */}
      <Modal
        isOpen={showAttendanceModal}
        onClose={() => setShowAttendanceModal(false)}
        title={`Mark Attendance - ${selectedClass?.name}`}
        className="sm:max-w-2xl"
      >
        {selectedClass && (
          <form onSubmit={handleMarkAttendance} className="space-y-4">
            <Input
              label="Date"
              type="date"
              value={attendanceDate}
              onChange={(e) => setAttendanceDate(e.target.value)}
              required
            />
            
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">
                Students Attendance
              </label>
              {selectedClassStudents.map((student) => (
                <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{student.user?.full_name || 'Unknown'}</p>
                    <p className="text-sm text-gray-500">Roll: {student.roll_number}</p>
                  </div>
                  <div className="flex space-x-2">
                    {['present', 'absent', 'late'].map((status) => (
                      <label key={status} className="flex items-center">
                        <input
                          type="radio"
                          name={`attendance_${student.id}`}
                          value={status}
                          checked={studentAttendance[student.id] === status}
                          onChange={(e) => setStudentAttendance({
                            ...studentAttendance,
                            [student.id]: e.target.value
                          })}
                          className="mr-1"
                        />
                        <span className="capitalize text-sm">{status}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={() => setShowAttendanceModal(false)}>
                Cancel
              </Button>
              <Button type="submit">Mark Attendance</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Create Exam Modal */}
      <Modal
        isOpen={showExamModal}
        onClose={() => setShowExamModal(false)}
        title="Create New Exam"
        className="sm:max-w-md"
      >
        <form onSubmit={handleCreateExam} className="space-y-4">
          <Input
            label="Exam Name"
            value={examForm.name}
            onChange={(e) => setExamForm({ ...examForm, name: e.target.value })}
            required
          />
          <Input
            label="Exam Date"
            type="date"
            value={examForm.exam_date}
            onChange={(e) => setExamForm({ ...examForm, exam_date: e.target.value })}
            required
          />
          <Input
            label="Maximum Marks"
            type="number"
            value={examForm.max_marks}
            onChange={(e) => setExamForm({ ...examForm, max_marks: parseInt(e.target.value) })}
            required
          />
          <Input
            label="Duration (minutes)"
            type="number"
            value={examForm.duration_minutes}
            onChange={(e) => setExamForm({ ...examForm, duration_minutes: parseInt(e.target.value) })}
            required
          />
          <Select
            label="Subject"
            value={examForm.subject_id}
            onChange={(e) => setExamForm({ ...examForm, subject_id: e.target.value })}
            options={mySubjects.map(subject => ({ value: subject.id, label: subject.name }))}
            required
          />
          <Select
            label="Class"
            value={examForm.class_id}
            onChange={(e) => setExamForm({ ...examForm, class_id: e.target.value })}
            options={myClasses.map(cls => ({ value: cls.id, label: cls.name }))}
            required
          />
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => setShowExamModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Create Exam</Button>
          </div>
        </form>
      </Modal>

      {/* Record Result Modal */}
      <Modal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        title="Record Exam Result"
        className="sm:max-w-md"
      >
        <form onSubmit={handleRecordResult} className="space-y-4">
          <Select
            label="Exam"
            value={resultForm.exam_id}
            onChange={(e) => setResultForm({ ...resultForm, exam_id: e.target.value })}
            options={exams.map(exam => ({ value: exam.id, label: exam.name }))}
            required
          />
          <Select
            label="Student"
            value={resultForm.student_id}
            onChange={(e) => setResultForm({ ...resultForm, student_id: e.target.value })}
            options={myStudents.map(student => ({ 
              value: student.id, 
              label: `${student.user?.full_name || 'Unknown'} (${student.roll_number})` 
            }))}
            required
          />
          <Input
            label="Marks Obtained"
            type="number"
            step="0.5"
            value={resultForm.marks_obtained}
            onChange={(e) => setResultForm({ ...resultForm, marks_obtained: parseFloat(e.target.value) })}
            required
          />
          <Input
            label="Grade"
            value={resultForm.grade}
            onChange={(e) => setResultForm({ ...resultForm, grade: e.target.value })}
            placeholder="A+, A, B+, etc."
          />
          <TextArea
            label="Remarks"
            value={resultForm.remarks}
            onChange={(e) => setResultForm({ ...resultForm, remarks: e.target.value })}
            placeholder="Optional remarks about the performance"
          />
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => setShowResultModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Record Result</Button>
          </div>
        </form>
      </Modal>

      {/* Upload Material Modal */}
      <Modal
        isOpen={showMaterialModal}
        onClose={() => setShowMaterialModal(false)}
        title="Upload Study Material"
        className="sm:max-w-md"
      >
        <form onSubmit={handleUploadMaterial} className="space-y-4">
          <Input
            label="Title"
            value={materialForm.title}
            onChange={(e) => setMaterialForm({ ...materialForm, title: e.target.value })}
            required
          />
          <TextArea
            label="Description"
            value={materialForm.description}
            onChange={(e) => setMaterialForm({ ...materialForm, description: e.target.value })}
          />
          <Select
            label="Subject"
            value={materialForm.subject_id}
            onChange={(e) => setMaterialForm({ ...materialForm, subject_id: e.target.value })}
            options={mySubjects.map(subject => ({ value: subject.id, label: subject.name }))}
            required
          />
          <Select
            label="File Type"
            value={materialForm.file_type}
            onChange={(e) => setMaterialForm({ ...materialForm, file_type: e.target.value })}
            options={[
              { value: 'PDF', label: 'PDF Document' },
              { value: 'DOC', label: 'Word Document' },
              { value: 'PPT', label: 'Presentation' },
              { value: 'VIDEO', label: 'Video' },
              { value: 'AUDIO', label: 'Audio' }
            ]}
            required
          />
          <div className="flex items-center">
            <input
              type="checkbox"
              id="public"
              checked={materialForm.is_public}
              onChange={(e) => setMaterialForm({ ...materialForm, is_public: e.target.checked })}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="public" className="ml-2 block text-sm text-gray-900">
              Make this material public to all students
            </label>
          </div>
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={() => setShowMaterialModal(false)}>
              Cancel
            </Button>
            <Button type="submit">Upload Material</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default TeacherDashboard