import React, { useState, useEffect } from 'react'
import Modal from '../Modal'
import Button from '../Button'
import { Input, Select } from '../Form'

const FormModal = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  fields,
  initialData = {},
  data, // New prop for dynamic data updates
  submitText = 'Save',
  cancelText = 'Cancel',
  isLoading = false,
  className = 'sm:max-w-md',
  onFieldChange, // New prop for field change callbacks
  children
}) => {
  const [formData, setFormData] = useState(initialData)

  // Reset form data when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      setFormData(initialData || {})
    }
  }, [isOpen, initialData])

  // Update form data when data prop changes
  useEffect(() => {
    if (data && isOpen) {
      setFormData(data)
    }
  }, [data, isOpen])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(formData)
  }

  const handleFieldChange = (fieldName, value) => {
    setFormData(prev => {
      // Handle nested field names with dot notation (e.g., 'user.full_name')
      const keys = fieldName.split('.')
      const newData = { ...prev }
      
      if (keys.length === 1) {
        // Simple field name
        newData[fieldName] = value
      } else {
        // Nested field name (e.g., 'user.full_name')
        let current = newData
        for (let i = 0; i < keys.length - 1; i++) {
          const key = keys[i]
          if (!current[key] || typeof current[key] !== 'object') {
            current[key] = {}
          }
          current = current[key]
        }
        current[keys[keys.length - 1]] = value
      }
      
      // Call onFieldChange if provided
      if (onFieldChange) {
        onFieldChange(fieldName, value, newData)
      }
      
      return newData
    })
  }

  const getNestedValue = (obj, path) => {
    return path.split('.').reduce((current, key) => current?.[key], obj) || ''
  }

  const renderField = (field) => {
    const value = getNestedValue(formData, field.name)

    switch (field.type) {
      case 'select':
        return (
          <Select
            key={field.name}
            label={field.label}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            options={field.options || []}
            required={field.required}
            {...field.props}
          />
        )
      case 'textarea':
        return (
          <div key={field.name} className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={value}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              required={field.required}
              rows={field.rows || 3}
              {...field.props}
            />
          </div>
        )
      default:
        return (
          <Input
            key={field.name}
            label={field.label}
            type={field.type || 'text'}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            required={field.required}
            placeholder={field.placeholder}
            {...field.props}
          />
        )
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      className={className}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map(renderField)}

        {children}

        <div className="flex flex-col-reverse sm:flex-row justify-end space-y-2 space-y-reverse sm:space-y-0 sm:space-x-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            type="submit"
            loading={isLoading}
          >
            {submitText}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default FormModal