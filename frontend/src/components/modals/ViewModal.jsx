import React from 'react'
import { X, User } from 'lucide-react'
import Modal from '../Modal'
import Button from '../Button'

const ViewModal = ({
  isOpen,
  onClose,
  title,
  data,
  sections = [],
  actions = [],
  className = 'sm:max-w-lg',
  headerContent,
  footerContent
}) => {
  if (!data) return null

  const renderSection = (section) => (
    <div key={section.key} className="mb-6">
      {section.title && (
        <div className="flex items-center mb-3 pb-2 border-b border-gray-200">
          {section.icon && (
            <section.icon className="h-4 w-4 text-blue-600 mr-2" />
          )}
          <h3 className="text-sm font-semibold text-gray-900">{section.title}</h3>
        </div>
      )}
      <div className="space-y-3">
        {section.fields.map(field => (
          field.value && (
            <div key={field.key} className="flex justify-between items-start">
              <span className="text-sm text-gray-600 min-w-0 flex-1">{field.label}:</span>
              <span className={`text-sm text-gray-900 font-medium text-right min-w-0 flex-1 ${field.valueClass || ''}`}>
                {field.value}
              </span>
            </div>
          )
        ))}
      </div>
    </div>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={data.full_name || data.name || title}
      className={className}
    >
      <div className="max-h-[70vh] overflow-y-auto">
        {/* Header */}
        {headerContent || (
          <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-gray-200">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
              {data.photo_url ? (
                <img
                  src={data.photo_url}
                  alt={`${data.full_name || 'Profile'} photo`}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span className="text-lg font-semibold text-blue-600">
                  {(data.full_name || data.name || 'U').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-lg font-semibold text-gray-900 truncate">
                {data.full_name || data.name || title}
              </h2>
              {data.subtitle && (
                <p className="text-sm text-gray-600 truncate">{data.subtitle}</p>
              )}
              {data.details && (
                <p className="text-xs text-gray-500 truncate mt-1">{data.details}</p>
              )}
            </div>
          </div>
        )}

        {/* Content Sections */}
        <div className="space-y-6">
          {sections.length > 0 ? (
            sections.map(renderSection)
          ) : (
            <div className="text-center py-8">
              <User className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">No additional information available.</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {(actions.length > 0 || footerContent) && (
          <div className="flex justify-end space-x-2 pt-6 mt-6 border-t border-gray-200">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'outline'}
                size="sm"
                onClick={action.onClick}
                className={action.className}
              >
                {action.icon && <action.icon className="h-4 w-4 mr-1" />}
                {action.label}
              </Button>
            ))}
            {footerContent}
          </div>
        )}
      </div>
    </Modal>
  )
}

export default ViewModal