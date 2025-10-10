/**
 * Global error handler for unhandled errors and promise rejections
 * Provides centralized error monitoring and reporting
 */

import Logger from './logger.js'
import config from '../config/index.js'
import { toast } from 'sonner'

class GlobalErrorHandler {
  constructor() {
    this.isInitialized = false
    this.errorQueue = []
    this.maxQueueSize = 50
  }

  init() {
    if (this.isInitialized) return

    // Handle unhandled JavaScript errors
    window.addEventListener('error', this.handleError.bind(this))
    
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', this.handlePromiseRejection.bind(this))
    
    // Handle resource loading errors
    window.addEventListener('error', this.handleResourceError.bind(this), true)

    this.isInitialized = true
    Logger.info('Global error handler initialized')
  }

  handleError(event) {
    const error = {
      type: 'javascript',
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
      stack: event.error?.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    }

    this.logError(error)
    this.reportError(error)

    // Show user notification for critical errors
    if (this.isCriticalError(error)) {
      toast.error('A critical error occurred. Please refresh the page if the issue persists.')
    }
  }

  handlePromiseRejection(event) {
    const error = {
      type: 'promise_rejection',
      reason: event.reason,
      message: event.reason?.message || 'Unhandled promise rejection',
      stack: event.reason?.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent
    }

    this.logError(error)
    this.reportError(error)

    // Prevent the default behavior (logging to console)
    if (config.isProduction) {
      event.preventDefault()
    }
  }

  handleResourceError(event) {
    // Only handle resource loading errors
    if (event.target === window) return

    const error = {
      type: 'resource',
      element: event.target.tagName,
      source: event.target.src || event.target.href,
      message: `Failed to load resource: ${event.target.src || event.target.href}`,
      timestamp: new Date().toISOString(),
      url: window.location.href
    }

    this.logError(error)
    
    // Don't show notifications for resource errors unless critical
    if (this.isCriticalResource(event.target)) {
      toast.warning('Some resources failed to load. Please check your internet connection.')
    }
  }

  logError(error) {
    Logger.error('Global error handler caught error:', error)
    
    // Add to error queue for batch processing
    this.addToQueue(error)
  }

  reportError(error) {
    // Sentry integration removed - error logging handled by Logger
    // if (!config.services.sentry.enabled) return

    // TODO: Integrate with Sentry or other monitoring service
    const errorData = {
      ...error,
      errorId: this.generateErrorId(),
      userId: this.getCurrentUserId(),
      sessionId: this.getSessionId(),
      buildVersion: config.app.version,
      environment: config.app.environment
    }

    // Sentry.captureException(new Error(error.message), {
    //   extra: errorData,
    //   tags: {
    //     errorType: error.type,
    //     environment: config.app.environment
    //   }
    // })

    Logger.info('Error reported to monitoring service:', errorData)
  }

  addToQueue(error) {
    this.errorQueue.push(error)
    
    // Limit queue size to prevent memory issues
    if (this.errorQueue.length > this.maxQueueSize) {
      this.errorQueue.shift()
    }
  }

  getErrorQueue() {
    return [...this.errorQueue]
  }

  clearErrorQueue() {
    this.errorQueue = []
  }

  isCriticalError(error) {
    const criticalPatterns = [
      /chunk.*failed/i,
      /loading.*failed/i,
      /network.*error/i,
      /auth.*error/i,
      /security.*error/i
    ]

    return criticalPatterns.some(pattern => 
      pattern.test(error.message) || pattern.test(error.stack)
    )
  }

  isCriticalResource(element) {
    // Critical resources that should show notifications
    const criticalTags = ['SCRIPT', 'LINK']
    const criticalSources = [
      /main.*\.js$/,
      /vendor.*\.js$/,
      /app.*\.css$/,
      /main.*\.css$/
    ]

    if (criticalTags.includes(element.tagName)) {
      const source = element.src || element.href
      return criticalSources.some(pattern => pattern.test(source))
    }

    return false
  }

  generateErrorId() {
    return `global_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  getCurrentUserId() {
    try {
      const userData = localStorage.getItem(config.auth.userKey)
      return userData ? JSON.parse(userData).id : 'anonymous'
    } catch {
      return 'anonymous'
    }
  }

  getSessionId() {
    let sessionId = sessionStorage.getItem('sessionId')
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      sessionStorage.setItem('sessionId', sessionId)
    }
    return sessionId
  }

  // Manual error reporting method
  reportManualError(error, context = {}) {
    const errorData = {
      type: 'manual',
      error: error.toString(),
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      url: window.location.href
    }

    this.logError(errorData)
    this.reportError(errorData)

    return errorData
  }

  // Get error statistics
  getErrorStats() {
    const stats = {
      total: this.errorQueue.length,
      byType: {},
      recent: this.errorQueue.slice(-10),
      criticalCount: 0
    }

    this.errorQueue.forEach(error => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1
      if (this.isCriticalError(error)) {
        stats.criticalCount++
      }
    })

    return stats
  }
}

// Create singleton instance
const globalErrorHandler = new GlobalErrorHandler()

export default globalErrorHandler