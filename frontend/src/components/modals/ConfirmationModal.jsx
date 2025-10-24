import React from 'react'
import Modal from '../Modal'
import Button from '../Button'

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'destructive',
  isLoading = false,
  children,
  icon: Icon,
  iconColor = 'text-red-600'
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      className="sm:max-w-md"
    >
      <div className="space-y-4 p-2 sm:p-4">
        {(Icon || message) && (
          <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${!Icon ? 'hidden' : ''}`}>
            {Icon && (
              <div className="flex items-center mb-3">
                <div className="flex-shrink-0">
                  <Icon className={`h-5 w-5 ${iconColor}`} />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-red-900">{title}</h3>
                </div>
              </div>
            )}
            {message && (
              <p className="text-red-800 text-sm">
                {message}
              </p>
            )}
          </div>
        )}

        {children}

        <div className="flex gap-3 justify-end pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            {cancelText}
          </Button>
          <Button
            variant={confirmVariant}
            onClick={onConfirm}
            loading={isLoading}
            className={confirmVariant === 'destructive' ? 'bg-red-600 hover:bg-red-700 text-white' : ''}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default ConfirmationModal