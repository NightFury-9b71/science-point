import React from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import { toast } from 'sonner'
import Button from '../components/Button'
import Logger from '../utils/logger.js'
import config from '../config/index.js'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null, 
      eventId: null,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    const errorId = this.generateErrorId()
    
    // Log error with comprehensive details
    Logger.error('React Error Boundary caught an error:', {
      error: error.toString(),
      errorInfo,
      componentStack: errorInfo.componentStack,
      errorId,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getCurrentUserId(),
      retryCount: this.state.retryCount
    })

    // Update state with error details
    this.setState({
      error,
      errorInfo,
      eventId: errorId
    })

    // Report to external service if enabled
    if (config.services.sentry.enabled) {
      this.reportToSentry(error, errorInfo, errorId)
    }

    // Show user-friendly error notification
    toast.error('Something went wrong. We\'ve been notified and are looking into it.', {
      duration: 5000
    })
  }

  generateErrorId = () => {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  getCurrentUserId = () => {
    try {
      const userData = localStorage.getItem(config.auth.userKey)
      return userData ? JSON.parse(userData).id : 'anonymous'
    } catch {
      return 'anonymous'
    }
  }

  reportToSentry = (error, errorInfo, errorId) => {
    // Prepare error data for external reporting
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId,
      level: 'error',
      tags: {
        component: 'ErrorBoundary',
        environment: config.app.environment
      },
      user: {
        id: this.getCurrentUserId()
      },
      extra: {
        retryCount: this.state.retryCount,
        props: this.props.fallbackProps || {}
      }
    }

    // TODO: Integrate with actual Sentry SDK
    // Sentry.captureException(error, { contexts: { react: errorData } })
    
    Logger.info('Error reported to monitoring service:', errorData)
  }

  handleRefresh = () => {
    if (this.state.retryCount < 3) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        eventId: null,
        retryCount: prevState.retryCount + 1
      }))

      // Force component remount
      if (this.props.onRetry) {
        this.props.onRetry()
      }
    } else {
      window.location.reload()
    }
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  handleReportBug = () => {
    const bugReport = {
      errorId: this.state.eventId,
      error: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    }

    navigator.clipboard.writeText(JSON.stringify(bugReport, null, 2))
    toast.success('Error details copied to clipboard')
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full space-y-8 text-center">
            {/* Error Icon */}
            <div className="relative">
              <div className="flex justify-center">
                <AlertTriangle className="h-24 w-24 text-red-500 animate-pulse" />
              </div>
              
              {/* Floating Error Elements */}
              <div className="absolute top-4 left-8 animate-bounce">
                <Bug className="h-6 w-6 text-orange-400 opacity-60" />
              </div>
              <div className="absolute top-8 right-8 animate-bounce" style={{ animationDelay: '0.5s' }}>
                <RefreshCw className="h-8 w-8 text-red-400 opacity-60" />
              </div>
            </div>

            {/* Error Message */}
            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900">
                Something Went Wrong
              </h1>
              <p className="text-lg text-gray-600 max-w-sm mx-auto">
                We encountered an unexpected error. Don't worry, our team has been notified.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={this.handleRefresh}
                  variant="outline"
                  className="flex items-center justify-center gap-2"
                  disabled={this.state.retryCount >= 3}
                >
                  <RefreshCw className="h-4 w-4" />
                  {this.state.retryCount >= 3 ? 'Reload Page' : `Try Again (${3 - this.state.retryCount} left)`}
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  className="flex items-center justify-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Go Home
                </Button>
                {config.isDevelopment && (
                  <Button
                    onClick={this.handleReportBug}
                    variant="secondary"
                    className="flex items-center justify-center gap-2"
                  >
                    <Bug className="h-4 w-4" />
                    Copy Error Details
                  </Button>
                )}
              </div>
            </div>

            {/* Error Details (Development Only) */}
            {config.isDevelopment && this.state.error && (
              <div className="bg-white rounded-lg shadow-lg p-6 space-y-4 text-left">
                <h3 className="text-lg font-semibold text-red-900 flex items-center gap-2">
                  <Bug className="h-5 w-5" />
                  Debug Information
                </h3>
                <div className="space-y-2">
                  <div>
                    <h4 className="font-medium text-gray-900">Error:</h4>
                    <p className="text-sm text-red-600 font-mono bg-red-50 p-2 rounded border">
                      {this.state.error.toString()}
                    </p>
                  </div>
                  {this.state.errorInfo && (
                    <div>
                      <h4 className="font-medium text-gray-900">Stack Trace:</h4>
                      <pre className="text-xs text-gray-600 bg-gray-50 p-2 rounded border overflow-auto max-h-32">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Help Options */}
            <div className="bg-white rounded-lg shadow-lg p-6 space-y-3">
              <h3 className="text-lg font-semibold text-gray-900">
                Need Help?
              </h3>
              <div className="space-y-2 text-sm">
                <p className="text-gray-600">
                  If this problem persists, please try the following:
                </p>
                <ul className="text-left text-gray-700 space-y-1 list-disc list-inside">
                  <li>Refresh the page or clear your browser cache</li>
                  <li>Check your internet connection</li>
                  <li>Try accessing the site from a different browser</li>
                  <li>Contact your system administrator if the issue continues</li>
                </ul>
              </div>
            </div>

            {/* Branding */}
            <div className="pt-8 border-t border-gray-200">
              <div className="flex items-center justify-center gap-2 text-gray-600">
                <AlertTriangle className="h-5 w-5" />
                <span className="font-medium">Science Point Error Handler</span>
              </div>
              {this.state.eventId && (
                <p className="text-xs text-gray-500 mt-1">
                  Error ID: {this.state.eventId}
                </p>
              )}
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// HOC for wrapping components with error boundary
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
  const WrappedComponent = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`
  return WrappedComponent
}

// Hook for programmatic error reporting
export const useErrorReporting = () => {
  const reportError = (error, context = {}) => {
    const errorId = `manual_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    Logger.error('Manual error report:', {
      error: error.toString(),
      stack: error.stack,
      context,
      errorId,
      timestamp: new Date().toISOString(),
      url: window.location.href
    })

    if (config.services.sentry.enabled) {
      // TODO: Report to Sentry
      // Sentry.captureException(error, { extra: context, tags: { errorId } })
    }

    return errorId
  }

  return { reportError }
}

export default ErrorBoundary