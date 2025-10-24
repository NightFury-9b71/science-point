import React from 'react'
import { X } from 'lucide-react'

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  className = '',
  size = 'lg',
  closeOnOutsideClick = true,
  showCloseButton = true
}) => {
  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl'
  }

  const handleBackdropClick = (e) => {
    if (closeOnOutsideClick && e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50"
        onClick={handleBackdropClick}
      ></div>

      {/* Modal Content */}
      <div className={`relative bg-white rounded-lg shadow-xl ${sizeClasses[size]} w-full max-h-screen overflow-y-auto ${className}`}>
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            {title && (
              <h3 className="text-lg font-medium text-gray-900">
                {title}
              </h3>
            )}
            {showCloseButton && (
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="h-5 w-5 text-gray-400" />
              </button>
            )}
          </div>
        )}
        
        {/* Content */}
        <div className={title || showCloseButton ? "px-6 py-4" : ""}>
          {children}
        </div>
      </div>
    </div>
  )
}

export default Modal