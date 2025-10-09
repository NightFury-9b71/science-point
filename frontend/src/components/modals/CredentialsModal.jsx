import React from 'react'
import { CheckCircle, Download, FileText } from 'lucide-react'
import Modal from '../Modal'
import Button from '../Button'

const CredentialsModal = ({
  isOpen,
  onClose,
  credentials,
  title = "Account Created Successfully!",
  entityType = "Account",
  onCopy,
  onPrint
}) => {
  if (!credentials) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      className="sm:max-w-lg"
    >
      <div className="space-y-6 p-2 sm:p-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            <h3 className="text-lg font-medium text-green-900">{entityType} Created</h3>
          </div>
          <p className="text-green-800 text-sm">
            {entityType.toLowerCase()} has been created successfully. Please share these login credentials securely.
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-3">Login Credentials</h4>
          <div className="space-y-3 text-sm">
            {credentials.fullName && (
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Name:</span>
                <span className="text-gray-900">{credentials.fullName}</span>
              </div>
            )}
            {credentials.rollNumber && (
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Roll Number:</span>
                <span className="text-gray-900">{credentials.rollNumber}</span>
              </div>
            )}
            {credentials.employeeId && (
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Employee ID:</span>
                <span className="text-gray-900">{credentials.employeeId}</span>
              </div>
            )}
            {credentials.username && (
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Username:</span>
                <span className="text-gray-900 font-mono">{credentials.username}</span>
              </div>
            )}
            {credentials.password && (
              <div className="flex justify-between items-center bg-yellow-50 p-2 rounded border">
                <span className="font-medium text-gray-700">Password:</span>
                <span className="text-gray-900 font-mono">{credentials.password}</span>
              </div>
            )}
            {credentials.email && (
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Email:</span>
                <span className="text-gray-900">{credentials.email}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 justify-end pt-4">
          {onCopy && (
            <Button
              variant="outline"
              onClick={onCopy}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Copy Credentials
            </Button>
          )}
          {onPrint && (
            <Button
              variant="outline"
              onClick={onPrint}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Print Credentials
            </Button>
          )}
          <Button onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export default CredentialsModal