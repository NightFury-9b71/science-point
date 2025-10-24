import React, { useState, useEffect } from 'react'
import { AlertTriangle, RefreshCw, LogOut, Clock } from 'lucide-react'
import Button from '../Button'
import Modal from '../Modal'
import tokenManager from '../../utils/tokenManager'

const TokenExpirationWarning = ({ 
  isOpen, 
  onClose, 
  onRefreshSession, 
  onLogout, 
  timeRemaining 
}) => {
  const [countdown, setCountdown] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    if (!isOpen || !timeRemaining) return

    const updateCountdown = () => {
      const remaining = Math.max(0, timeRemaining - (Date.now() - startTime))
      setCountdown(tokenManager.formatTimeRemaining(remaining))
      
      // Auto logout if time expires
      if (remaining <= 0) {
        handleLogout()
      }
    }

    const startTime = Date.now()
    updateCountdown()
    
    const interval = setInterval(updateCountdown, 1000)
    return () => clearInterval(interval)
  }, [isOpen, timeRemaining, onLogout])

  const handleRefreshSession = async () => {
    setIsRefreshing(true)
    try {
      await onRefreshSession()
      onClose()
    } catch (error) {
      console.error('Failed to refresh session:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleLogout = () => {
    onLogout()
    onClose()
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      title=""
      size="md"
      closeOnOutsideClick={false}
      showCloseButton={false}
    >
      <div className="text-center p-6">
        {/* Warning Icon */}
        <div className="mx-auto flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mb-6">
          <AlertTriangle className="h-8 w-8 text-amber-600" />
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Session Expiring Soon
        </h3>

        {/* Message */}
        <div className="text-gray-600 mb-6 space-y-2">
          <p>
            Your session will expire in{' '}
            <span className="font-semibold text-amber-600 inline-flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {countdown}
            </span>
          </p>
          <p className="text-sm">
            For security purposes, you'll be automatically logged out when your session expires.
            Would you like to extend your session?
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 sm:justify-center">
          <Button
            onClick={handleRefreshSession}
            disabled={isRefreshing}
            className="sm:order-1"
          >
            {isRefreshing ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Extend Session
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={handleLogout}
            disabled={isRefreshing}
            className="sm:order-2"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Logout Now
          </Button>
        </div>

        {/* Additional Info */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                <span className="text-blue-600 text-xs font-bold">💡</span>
              </div>
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-blue-900 mb-1">
                Stay logged in longer
              </p>
              <p className="text-xs text-blue-700">
                Enable "Remember Me" when logging in to stay signed in for up to 15 days.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default TokenExpirationWarning
