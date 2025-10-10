import React from 'react'
import { CheckCircle, Edit } from 'lucide-react'
import Modal from '../Modal'
import Button from '../Button'

const ViewModal = ({
  isOpen,
  onClose,
  title,
  data,
  sections = [],
  actions = [],
  className = 'sm:max-w-xl',
  headerContent,
  footerContent
}) => {
  if (!data) return null

  const renderSection = (section) => (
    <div key={section.key} className={`rounded-lg p-3 border ${section.className || 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100'}`}>
      {section.title && (
        <div className="flex items-center mb-2">
          {section.icon && <section.icon className={`h-4 w-4 ${section.iconColor || 'text-blue-600'} mr-2`} />}
          <h3 className="text-sm font-bold text-gray-800">{section.title}</h3>
        </div>
      )}
      <div className={`grid grid-cols-1 gap-2 text-sm ${section.gridClass || ''}`}>
        {section.fields.map(field => (
          <div key={field.key}>
            <label className={`text-xs font-semibold ${field.labelColor || 'text-blue-600'}`}>{field.label}</label>
            <p className={`text-gray-900 ${field.valueClass || 'font-medium'}`}>
              {field.value || 'N/A'}
            </p>
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title=""
      className={className}
    >
      <div>
        {/* Custom Header */}
        {headerContent || (
          <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white p-4 -m-6 mb-3 rounded-t-lg relative overflow-hidden">
            <div className="relative flex items-center space-x-3">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-lg bg-white flex items-center justify-center flex-shrink-0">
                {data.photo_url || (data.photo_path && (data.photo_path.startsWith('http') || data.photo_path.startsWith('https'))) ? (
                  <img
                    src={data.photo_url || data.photo_path}
                    alt={`${data.full_name || 'Profile'} photo`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xl font-bold text-gray-600">
                    {(data.full_name || data.name || 'U').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold truncate">{data.full_name || data.name || title}</h2>
                {data.subtitle && <p className="text-sm text-blue-100">{data.subtitle}</p>}
                {data.details && <p className="text-sm text-blue-200 truncate">{data.details}</p>}
                <div className="flex gap-2 mt-2">
                  {data.badges?.map((badge, index) => (
                    <span key={index} className="text-xs bg-white/20 px-2 py-1 rounded">
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Content Sections */}
        <div className="space-y-3 px-2">
          {sections.map(renderSection)}
        </div>

        {/* Custom Footer */}
        {footerContent || (
          <div className="flex flex-wrap gap-2 justify-end pt-4 mt-4 border-t border-gray-200 px-2">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'outline'}
                size="sm"
                onClick={action.onClick}
                className={`text-xs ${action.className || ''}`}
              >
                {action.icon && <action.icon className="h-3 w-3 mr-1" />}
                {action.label}
              </Button>
            ))}
            <Button
              size="sm"
              onClick={onClose}
              className="text-xs bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Close
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}

export default ViewModal