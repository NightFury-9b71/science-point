/**
 * Application monitoring service
 * Tracks performance metrics, user behavior, and system health
 */

import Logger from './logger.js'
import config from '../config/index.js'

class MonitoringService {
  constructor() {
    this.isInitialized = false
    this.metrics = {
      performance: [],
      userActions: [],
      apiCalls: [],
      errors: []
    }
    this.startTime = performance.now()
    this.sessionId = this.generateSessionId()
  }

  init() {
    if (this.isInitialized) return

    // Initialize performance monitoring
    this.initPerformanceMonitoring()
    
    // Initialize user behavior tracking
    this.initUserTracking()
    
    // Initialize API monitoring
    this.initAPIMonitoring()

    this.isInitialized = true
    Logger.info('Monitoring service initialized', { sessionId: this.sessionId })
  }

  initPerformanceMonitoring() {
    // Track page load performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        this.trackPageLoad()
      }, 0)
    })

    // Track navigation timing
    if ('navigation' in performance) {
      this.trackNavigationTiming()
    }

    // Track largest contentful paint
    if ('PerformanceObserver' in window) {
      this.trackLCP()
      this.trackFID()
      this.trackCLS()
    }
  }

  initUserTracking() {
    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.trackVisibilityChange()
    })

    // Track user engagement
    this.trackUserEngagement()

    // Track route changes (for SPAs)
    this.trackRouteChanges()
  }

  initAPIMonitoring() {
    // This will be integrated with the API service
    // to automatically track API call performance
  }

  trackPageLoad() {
    const navigation = performance.getEntriesByType('navigation')[0]
    if (!navigation) return

    const metrics = {
      type: 'page_load',
      url: window.location.href,
      timing: {
        dns: navigation.domainLookupEnd - navigation.domainLookupStart,
        tcp: navigation.connectEnd - navigation.connectStart,
        request: navigation.responseStart - navigation.requestStart,
        response: navigation.responseEnd - navigation.responseStart,
        dom: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        load: navigation.loadEventEnd - navigation.loadEventStart,
        total: navigation.loadEventEnd - navigation.navigationStart
      },
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId
    }

    this.addMetric('performance', metrics)
    Logger.info('Page load metrics:', metrics)
  }

  trackNavigationTiming() {
    const navigation = performance.getEntriesByType('navigation')[0]
    if (!navigation) return

    const timing = {
      type: 'navigation_timing',
      url: window.location.href,
      redirects: navigation.redirectEnd - navigation.redirectStart,
      appCache: navigation.domainLookupStart - navigation.fetchStart,
      dns: navigation.domainLookupEnd - navigation.domainLookupStart,
      tcp: navigation.connectEnd - navigation.connectStart,
      request: navigation.responseStart - navigation.requestStart,
      response: navigation.responseEnd - navigation.responseStart,
      processing: navigation.loadEventStart - navigation.domLoading,
      onLoad: navigation.loadEventEnd - navigation.loadEventStart,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId
    }

    this.addMetric('performance', timing)
  }

  trackLCP() {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1]
      
      this.addMetric('performance', {
        type: 'lcp',
        value: lastEntry.startTime,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId
      })
    })

    observer.observe({ entryTypes: ['largest-contentful-paint'] })
  }

  trackFID() {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.addMetric('performance', {
          type: 'fid',
          value: entry.processingStart - entry.startTime,
          url: window.location.href,
          timestamp: new Date().toISOString(),
          sessionId: this.sessionId
        })
      }
    })

    observer.observe({ entryTypes: ['first-input'] })
  }

  trackCLS() {
    let clsValue = 0
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value
        }
      }

      this.addMetric('performance', {
        type: 'cls',
        value: clsValue,
        url: window.location.href,
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId
      })
    })

    observer.observe({ entryTypes: ['layout-shift'] })
  }

  trackVisibilityChange() {
    this.addMetric('userActions', {
      type: 'visibility_change',
      visible: !document.hidden,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId
    })
  }

  trackUserEngagement() {
    let engagementStart = Date.now()
    let isEngaged = true

    const trackEngagement = () => {
      if (isEngaged) {
        const duration = Date.now() - engagementStart
        
        this.addMetric('userActions', {
          type: 'engagement',
          duration,
          url: window.location.href,
          timestamp: new Date().toISOString(),
          sessionId: this.sessionId
        })
      }
      
      engagementStart = Date.now()
      isEngaged = true
    }

    // Track engagement on user interactions
    const events = ['click', 'scroll', 'keydown', 'mousemove']
    events.forEach(event => {
      document.addEventListener(event, () => {
        if (!isEngaged) {
          engagementStart = Date.now()
          isEngaged = true
        }
      }, { passive: true })
    })

    // Track disengagement
    document.addEventListener('blur', () => {
      isEngaged = false
      trackEngagement()
    })

    // Track engagement periodically
    setInterval(trackEngagement, 30000) // Every 30 seconds
  }

  trackRouteChanges() {
    // Track route changes for single page applications
    let currentUrl = window.location.href

    const trackRouteChange = () => {
      if (window.location.href !== currentUrl) {
        this.addMetric('userActions', {
          type: 'route_change',
          from: currentUrl,
          to: window.location.href,
          timestamp: new Date().toISOString(),
          sessionId: this.sessionId
        })
        currentUrl = window.location.href
      }
    }

    // Listen for history changes
    window.addEventListener('popstate', trackRouteChange)
    
    // Override pushState and replaceState
    const originalPushState = history.pushState
    const originalReplaceState = history.replaceState

    history.pushState = function(...args) {
      originalPushState.apply(this, args)
      setTimeout(trackRouteChange, 0)
    }

    history.replaceState = function(...args) {
      originalReplaceState.apply(this, args)
      setTimeout(trackRouteChange, 0)
    }
  }

  trackAPICall(method, url, duration, status, error = null) {
    const apiMetric = {
      type: 'api_call',
      method,
      url,
      duration,
      status,
      error: error ? error.toString() : null,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId
    }

    this.addMetric('apiCalls', apiMetric)

    // Log slow API calls
    if (duration > 5000) {
      Logger.warn('Slow API call detected:', apiMetric)
    }
  }

  trackUserAction(action, details = {}) {
    this.addMetric('userActions', {
      type: 'user_action',
      action,
      details,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId
    })
  }

  trackError(error, context = {}) {
    this.addMetric('errors', {
      type: 'application_error',
      error: error.toString(),
      stack: error.stack,
      context,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId
    })
  }

  addMetric(category, data) {
    if (!this.metrics[category]) {
      this.metrics[category] = []
    }

    this.metrics[category].push(data)

    // Limit array sizes to prevent memory issues
    if (this.metrics[category].length > 1000) {
      this.metrics[category] = this.metrics[category].slice(-500)
    }

    // Send to external monitoring service if enabled
    // Analytics integration removed
    // if (config.services.analytics.enabled) {
    //   this.sendToExternalService(category, data)
    // }
  }

  sendToExternalService(category, data) {
    // TODO: Integrate with analytics service (Google Analytics, Mixpanel, etc.)
    if (config.isDevelopment) {
      Logger.debug('Analytics event:', { category, data })
    }
  }

  getMetrics(category = null) {
    if (category) {
      return this.metrics[category] || []
    }
    return this.metrics
  }

  getPerformanceReport() {
    const performanceMetrics = this.metrics.performance
    const apiMetrics = this.metrics.apiCalls

    return {
      sessionId: this.sessionId,
      sessionDuration: Date.now() - this.startTime,
      pageLoads: performanceMetrics.filter(m => m.type === 'page_load').length,
      averageLoadTime: this.calculateAverageLoadTime(performanceMetrics),
      apiCallsCount: apiMetrics.length,
      slowApiCalls: apiMetrics.filter(m => m.duration > 3000).length,
      errorCount: this.metrics.errors.length,
      userEngagement: this.calculateEngagement(),
      timestamp: new Date().toISOString()
    }
  }

  calculateAverageLoadTime(metrics) {
    const loadMetrics = metrics.filter(m => m.type === 'page_load')
    if (loadMetrics.length === 0) return 0

    const totalTime = loadMetrics.reduce((sum, m) => sum + m.timing.total, 0)
    return Math.round(totalTime / loadMetrics.length)
  }

  calculateEngagement() {
    const engagementMetrics = this.metrics.userActions.filter(m => m.type === 'engagement')
    if (engagementMetrics.length === 0) return 0

    const totalEngagement = engagementMetrics.reduce((sum, m) => sum + m.duration, 0)
    return Math.round(totalEngagement / 1000) // Convert to seconds
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Clear old metrics to prevent memory leaks
  cleanup() {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000) // 24 hours ago

    Object.keys(this.metrics).forEach(category => {
      this.metrics[category] = this.metrics[category].filter(
        metric => new Date(metric.timestamp).getTime() > cutoffTime
      )
    })
  }
}

// Create singleton instance
const monitoringService = new MonitoringService()

export default monitoringService