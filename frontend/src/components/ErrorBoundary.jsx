import React from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'
import Button from '../components/Button'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to console or error reporting service
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.state.error = error
    this.state.errorInfo = errorInfo
  }

  handleRefresh = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = '/'
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
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
                <Button
                  onClick={this.handleGoHome}
                  className="flex items-center justify-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Go Home
                </Button>
              </div>
            </div>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
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
                <span className="font-medium">EduManage Error Handler</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Error ID: {Date.now().toString(36)}
              </p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary