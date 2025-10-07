import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, ArrowLeft, Search, Edit, BookOpen } from 'lucide-react'
import { toast } from 'sonner'
import Card from '../../components/Card'
import Button from '../../components/Button'
import Table from '../../components/Table'
import Modal from '../../components/Modal'
import { Input, Select } from '../../components/Form'
import { useSubjects, useClasses, useTeachers, useCreateSubject, useUpdateSubject } from '../../services/queries'

const AdminSubjects = () => {
  const navigate = useNavigate()
  const { data: subjects, isLoading } = useSubjects()
  const { data: classes } = useClasses()
  const { data: teachers } = useTeachers()
  const createSubject = useCreateSubject()
  const updateSubject = useUpdateSubject()
  
  const [showModal, setShowModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedSubject, setSelectedSubject] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedClass, setSelectedClass] = useState('')
  const [selectedTeacher, setSelectedTeacher] = useState('')
  const [form, setForm] = useState({
    name: '', code: '', credits: 3, class_id: '', teacher_id: ''
  })
  const [editForm, setEditForm] = useState({
    name: '', code: '', credits: 3, class_id: '', teacher_id: ''
  })

  // Filter and sort subjects
  const filteredSubjects = (subjects || [])
    .filter(subject => {
      const matchesSearch = !searchQuery || 
        subject.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subject.code?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesClass = !selectedClass || subject.class_id?.toString() === selectedClass
      const matchesTeacher = !selectedTeacher || subject.teacher_id?.toString() === selectedTeacher
      
      return matchesSearch && matchesClass && matchesTeacher
    })
    .sort((a, b) => a.name?.localeCompare(b.name) || 0)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const subjectData = {
        ...form,
        credits: parseInt(form.credits) || 3,
        class_id: parseInt(form.class_id) || null,
        teacher_id: parseInt(form.teacher_id) || null
      }
      
      await createSubject.mutateAsync(subjectData)
      toast.success('Subject created successfully!')
      setShowModal(false)
      setForm({ name: '', code: '', credits: 3, class_id: '', teacher_id: '' })
    } catch (error) {
      toast.error('Failed to create subject. Please try again.')
      console.error('Create subject error:', error)
    }
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    
    try {
      const subjectData = {
        ...editForm,
        credits: parseInt(editForm.credits) || 3,
        class_id: parseInt(editForm.class_id) || null,
        teacher_id: parseInt(editForm.teacher_id) || null
      }
      
      await updateSubject.mutateAsync({ id: selectedSubject.id, ...subjectData })
      toast.success('Subject updated successfully!')
      setShowEditModal(false)
      setSelectedSubject(null)
    } catch (error) {
      toast.error('Failed to update subject. Please try again.')
      console.error('Update subject error:', error)
    }
  }

  const handleEdit = (subject) => {
    setSelectedSubject(subject)
    setEditForm({
      name: subject.name || '',
      code: subject.code || '',
      credits: subject.credits || 3,
      class_id: subject.class_id?.toString() || '',
      teacher_id: subject.teacher_id?.toString() || ''
    })
    setShowEditModal(true)
  }

  const getClassName = (classId) => {
    const classObj = classes?.find(cls => cls.id === classId)
    return classObj?.name || `Class ${classId}`
  }

  const getTeacherName = (teacherId) => {
    const teacher = teachers?.find(t => t.id === teacherId)
    return teacher?.user?.full_name || `Teacher ${teacherId}`
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/admin-dashboard')}
            className="lg:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Subject Management</h2>
            <p className="text-sm text-gray-600 mt-1">Manage subjects and assign teachers</p>
          </div>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add Subject
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4 sm:p-6">
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by subject name or code..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            {/* Class Filter */}
            <div className="w-full sm:w-48">
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <option value="">All Classes</option>
                {classes?.map(cls => (
                  <option key={cls.id} value={cls.id}>{cls.name}</option>
                ))}
              </select>
            </div>
            
            {/* Teacher Filter */}
            <div className="w-full sm:w-48">
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
              >
                <option value="">All Teachers</option>
                {teachers?.map(teacher => (
                  <option key={teacher.id} value={teacher.id}>{teacher.user?.full_name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Showing {filteredSubjects.length} of {subjects?.length || 0} subjects
            </div>
            
            {(searchQuery || selectedClass || selectedTeacher) && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('')
                  setSelectedClass('')
                  setSelectedTeacher('')
                }}
              >
                Clear Filters
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Subjects Table */}
      <Card>
        <Card.Content className="p-0">
          {filteredSubjects?.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <Table.Header>
                  <Table.Row>
                    <Table.Head>Subject Name</Table.Head>
                    <Table.Head>Code</Table.Head>
                    <Table.Head>Credits</Table.Head>
                    <Table.Head>Class</Table.Head>
                    <Table.Head>Teacher</Table.Head>
                    <Table.Head>Actions</Table.Head>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {filteredSubjects.map((subject) => (
                    <Table.Row key={subject.id}>
                      <Table.Cell>
                        <div className="flex items-center space-x-2">
                          <BookOpen className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">{subject.name}</span>
                        </div>
                      </Table.Cell>
                      <Table.Cell>{subject.code}</Table.Cell>
                      <Table.Cell>{subject.credits}</Table.Cell>
                      <Table.Cell>{getClassName(subject.class_id)}</Table.Cell>
                      <Table.Cell>
                        {subject.teacher_id ? (
                          <span className="text-green-600 font-medium">
                            {getTeacherName(subject.teacher_id)}
                          </span>
                        ) : (
                          <span className="text-gray-400">No teacher assigned</span>
                        )}
                      </Table.Cell>
                      <Table.Cell>
                        <Button size="sm" variant="outline" onClick={() => handleEdit(subject)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table>
            </div>
          ) : (
            <div className="p-8 text-center">
              <p className="text-gray-500">No subjects found matching your filters.</p>
            </div>
          )}
        </Card.Content>
      </Card>

      {/* Create Subject Modal */}
      <Modal 
        isOpen={showModal} 
        onClose={() => setShowModal(false)}
        title="Add New Subject"
        className="sm:max-w-lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Subject Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Subject Code"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value })}
            required
          />
          <Input
            label="Credits"
            type="number"
            min="1"
            max="10"
            value={form.credits}
            onChange={(e) => setForm({ ...form, credits: e.target.value })}
            required
          />
          <Select
            label="Class"
            value={form.class_id}
            onChange={(e) => setForm({ ...form, class_id: e.target.value })}
            options={[
              { value: '', label: 'Select class' },
              ...(classes?.map(cls => ({ 
                value: cls.id, 
                label: cls.name 
              })) || [])
            ]}
            required
          />
          <Select
            label="Assign Teacher"
            value={form.teacher_id}
            onChange={(e) => setForm({ ...form, teacher_id: e.target.value })}
            options={[
              { value: '', label: 'No teacher assigned' },
              ...(teachers?.map(teacher => ({ 
                value: teacher.id, 
                label: teacher.user?.full_name || `Teacher ${teacher.id}` 
              })) || [])
            ]}
          />
          <div className="flex flex-col-reverse sm:flex-row justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3">
            <Button type="button" variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createSubject.isPending}>
              Add Subject
            </Button>
          </div>
        </form>
      </Modal>

      {/* Edit Subject Modal */}
      <Modal 
        isOpen={showEditModal} 
        onClose={() => setShowEditModal(false)}
        title="Edit Subject"
        className="sm:max-w-lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <Input
            label="Subject Name"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            required
          />
          <Input
            label="Subject Code"
            value={editForm.code}
            onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
            required
          />
          <Input
            label="Credits"
            type="number"
            min="1"
            max="10"
            value={editForm.credits}
            onChange={(e) => setEditForm({ ...editForm, credits: e.target.value })}
            required
          />
          <Select
            label="Class"
            value={editForm.class_id}
            onChange={(e) => setEditForm({ ...editForm, class_id: e.target.value })}
            options={[
              { value: '', label: 'Select class' },
              ...(classes?.map(cls => ({ 
                value: cls.id, 
                label: cls.name 
              })) || [])
            ]}
            required
          />
          <Select
            label="Assign Teacher"
            value={editForm.teacher_id}
            onChange={(e) => setEditForm({ ...editForm, teacher_id: e.target.value })}
            options={[
              { value: '', label: 'No teacher assigned' },
              ...(teachers?.map(teacher => ({ 
                value: teacher.id, 
                label: teacher.user?.full_name || `Teacher ${teacher.id}` 
              })) || [])
            ]}
          />
          <div className="flex flex-col-reverse sm:flex-row justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3">
            <Button type="button" variant="outline" onClick={() => setShowEditModal(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={updateSubject.isPending}>
              Update Subject
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default AdminSubjects