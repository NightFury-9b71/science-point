/**
 * Performance optimization utilities
 * Provides hooks and utilities for optimizing React app performance
 */

import { useEffect, useCallback, useMemo, useRef, useState } from 'react'
import config from '../config/index.js'
import monitoringService from './monitoringService.js'

// Simple debounce implementation
const debounce = (func, wait) => {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

// Hook for debounced values
export const useDebounce = (value, delay = config.ui.debounceDelay) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

// Hook for debounced callbacks
export const useDebouncedCallback = (callback, delay = config.ui.debounceDelay, deps = []) => {
  const debouncedCallback = useMemo(
    () => debounce(callback, delay),
    [...deps, delay]
  )

  return debouncedCallback
}

// Hook for intersection observer (lazy loading)
export const useIntersectionObserver = (options = {}) => {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const targetRef = useRef(null)

  useEffect(() => {
    const element = targetRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting)
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options
      }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [options])

  return [targetRef, isIntersecting]
}

// Hook for performance monitoring
export const usePerformanceMonitor = (componentName) => {
  const renderStartTime = useRef(performance.now())
  const mountTime = useRef(null)

  useEffect(() => {
    // Component mounted
    mountTime.current = performance.now()
    const mountDuration = mountTime.current - renderStartTime.current

    monitoringService.trackUserAction('component_mount', {
      componentName,
      mountDuration,
      timestamp: new Date().toISOString()
    })

    return () => {
      // Component unmounted
      const unmountTime = performance.now()
      const lifetimeDuration = unmountTime - mountTime.current

      monitoringService.trackUserAction('component_unmount', {
        componentName,
        lifetimeDuration,
        timestamp: new Date().toISOString()
      })
    }
  }, [componentName])

  // Track re-renders
  useEffect(() => {
    const renderEndTime = performance.now()
    const renderDuration = renderEndTime - renderStartTime.current

    if (renderDuration > 16) { // More than 1 frame (16ms)
      monitoringService.trackUserAction('slow_render', {
        componentName,
        renderDuration,
        timestamp: new Date().toISOString()
      })
    }

    renderStartTime.current = performance.now()
  })
}

// Hook for prefetching resources
export const usePrefetch = (resources = []) => {
  useEffect(() => {
    resources.forEach(resource => {
      if (resource.type === 'image') {
        const img = new Image()
        img.src = resource.url
      } else if (resource.type === 'fetch') {
        fetch(resource.url, { method: 'HEAD' }).catch(() => {
          // Silently fail prefetch
        })
      }
    })
  }, [resources])
}

// Hook for memory usage monitoring
export const useMemoryMonitor = (threshold = 50) => {
  const [memoryUsage, setMemoryUsage] = useState(null)
  const [isHighUsage, setIsHighUsage] = useState(false)

  useEffect(() => {
    const checkMemory = () => {
      if ('memory' in performance) {
        const memory = performance.memory
        const usedMB = Math.round(memory.usedJSHeapSize / 1024 / 1024)
        const totalMB = Math.round(memory.totalJSHeapSize / 1024 / 1024)
        const limitMB = Math.round(memory.jsHeapSizeLimit / 1024 / 1024)
        
        const usage = {
          used: usedMB,
          total: totalMB,
          limit: limitMB,
          percentage: Math.round((usedMB / limitMB) * 100)
        }

        setMemoryUsage(usage)
        setIsHighUsage(usage.percentage > threshold)

        if (usage.percentage > threshold) {
          monitoringService.trackUserAction('high_memory_usage', {
            memoryUsage: usage,
            timestamp: new Date().toISOString()
          })
        }
      }
    }

    checkMemory()
    const interval = setInterval(checkMemory, 10000) // Check every 10 seconds

    return () => clearInterval(interval)
  }, [threshold])

  return { memoryUsage, isHighUsage }
}

// Hook for viewport monitoring
export const useViewport = () => {
  const [viewport, setViewport] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
    isMobile: window.innerWidth < 768,
    isTablet: window.innerWidth >= 768 && window.innerWidth < 1024,
    isDesktop: window.innerWidth >= 1024
  })

  useEffect(() => {
    const handleResize = debounce(() => {
      const width = window.innerWidth
      const height = window.innerHeight

      setViewport({
        width,
        height,
        isMobile: width < 768,
        isTablet: width >= 768 && width < 1024,
        isDesktop: width >= 1024
      })
    }, 100)

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return viewport
}

// Hook for network status
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [connectionType, setConnectionType] = useState(null)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Get connection information if available
    if ('connection' in navigator) {
      const connection = navigator.connection
      setConnectionType(connection.effectiveType)

      const handleConnectionChange = () => {
        setConnectionType(connection.effectiveType)
      }

      connection.addEventListener('change', handleConnectionChange)

      return () => {
        window.removeEventListener('online', handleOnline)
        window.removeEventListener('offline', handleOffline)
        connection.removeEventListener('change', handleConnectionChange)
      }
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return { isOnline, connectionType }
}

// Utility for bundle analysis
export const analyzeBundleSize = () => {
  if (config.isDevelopment) {
    // This would integrate with webpack-bundle-analyzer in a real setup
    const scripts = Array.from(document.querySelectorAll('script[src]'))
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))

    const analysis = {
      scripts: scripts.length,
      styles: styles.length,
      scriptSizes: scripts.map(script => ({
        src: script.src,
        // In real implementation, you'd need to fetch and measure
        size: 'unknown'
      })),
      styleSizes: styles.map(style => ({
        href: style.href,
        size: 'unknown'
      }))
    }

    console.log('Bundle Analysis:', analysis)
    return analysis
  }
}

// Performance optimization recommendations
export const getPerformanceRecommendations = () => {
  const performance = monitoringService.getPerformanceReport()
  const recommendations = []

  if (performance.averageLoadTime > 3000) {
    recommendations.push({
      type: 'warning',
      message: 'Slow page load times detected',
      suggestion: 'Consider code splitting and lazy loading'
    })
  }

  if (performance.slowApiCalls > 5) {
    recommendations.push({
      type: 'warning',
      message: 'Multiple slow API calls detected',
      suggestion: 'Implement request caching and optimization'
    })
  }

  if (performance.errorCount > 10) {
    recommendations.push({
      type: 'error',
      message: 'High error rate detected',
      suggestion: 'Review error logs and implement fixes'
    })
  }

  return recommendations
}

// Image optimization utility
export const OptimizedImage = ({ src, alt, ...props }) => {
  const [imageSrc, setImageSrc] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(false)
  const [ref, isVisible] = useIntersectionObserver()

  useEffect(() => {
    if (isVisible && !imageSrc && !error) {
      const img = new Image()
      img.onload = () => {
        setImageSrc(src)
        setIsLoading(false)
      }
      img.onerror = () => {
        setError(true)
        setIsLoading(false)
      }
      img.src = src
    }
  }, [isVisible, src, imageSrc, error])

  return (
    <div ref={ref} {...props}>
      {isLoading && <div className="bg-gray-200 animate-pulse" />}
      {error && <div className="bg-gray-100 flex items-center justify-center text-gray-400">Failed to load</div>}
      {imageSrc && !error && (
        <img 
          src={imageSrc} 
          alt={alt} 
          loading="lazy"
          onLoad={() => setIsLoading(false)}
        />
      )}
    </div>
  )
}