import React from 'react'

const Modal = ({ isOpen, onClose, title, children, className = '' }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className={`relative bg-white rounded-lg shadow-xl max-w-lg w-full max-h-screen overflow-y-auto ${className}`}>
        {/* Header */}
        {title && (
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              {title}
            </h3>
          </div>
        )}
        
        {/* Content */}
        <div className="px-6 py-4">
          {children}
        </div>
      </div>
    </div>
  )
}

export default Modal