import React from 'react'
import { useAuth } from '../contexts/AuthContext'

const withAuthGuard = (WrappedComponent, requiredRoles = []) => {
  return function AuthGuardedComponent(props) {
    const { isAuthenticated, user, hasPermission } = useAuth()

    if (!isAuthenticated) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <p className="text-gray-600">Authentication required</p>
          </div>
        </div>
      )
    }

    if (requiredRoles.length > 0 && !hasPermission(requiredRoles)) {
      return (
        <div className="flex items-center justify-center py-8">
          <div className="text-center p-6 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-red-500 mb-4">
              <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-red-900 mb-2">Access Restricted</h3>
            <p className="text-red-700 mb-4">
              You don't have permission to view this content.
            </p>
            <p className="text-sm text-red-600">
              Your role: <span className="font-medium">{user?.role}</span>
              {requiredRoles.length > 0 && (
                <>
                  <br />
                  Required: <span className="font-medium">{requiredRoles.join(' or ')}</span>
                </>
              )}
            </p>
          </div>
        </div>
      )
    }

    return <WrappedComponent {...props} />
  }
}

export default withAuthGuard