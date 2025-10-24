/**
 * Security utilities and configurations
 * Provides security headers, CSP, and other security measures
 */

import config from '../config/index.js'
import Logger from './logger.js'

class SecurityManager {
  constructor() {
    this.cspNonce = this.generateNonce()
    this.trustedDomains = config.security.trustedDomains
  }

  // Generate CSP nonce for inline scripts
  generateNonce() {
    const array = new Uint8Array(16)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  // Content Security Policy configuration
  getCSPDirectives() {
    const isProduction = config.isProduction
    const isDevelopment = config.isDevelopment
    const apiBaseUrl = config.api.baseURL

    // Parse API URL to get origin, handle cases where it might not be a full URL
    let apiOrigin
    try {
      apiOrigin = new URL(apiBaseUrl).origin
    } catch {
      // If API URL is not a valid URL, assume it's localhost
      apiOrigin = apiBaseUrl.startsWith('http') ? apiBaseUrl : `http://${apiBaseUrl}`
    }

    return {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        ...(isProduction ? [] : ["'unsafe-eval'"]), // Allow eval in development for HMR
        `'nonce-${this.cspNonce}'`,
        'https://cdn.jsdelivr.net' // For any CDN scripts
        // Analytics integration removed
        // ...(config.services.analytics.enabled ? ['https://www.google-analytics.com'] : [])
      ],
      'style-src': [
        "'self'",
        "'unsafe-inline'", // Tailwind and inline styles
        'https://fonts.googleapis.com'
      ],
      'font-src': [
        "'self'",
        'https://fonts.gstatic.com',
        'data:'
      ],
      'img-src': [
        "'self'",
        'data:',
        'blob:',
        apiOrigin,
        'https://res.cloudinary.com', // Cloudinary image delivery
        'https://cloudinary.com'
        // CDN integration removed
        // ...(config.services.cdn.baseURL ? [config.services.cdn.baseURL] : [])
      ],
      'connect-src': [
        "'self'",
        'null', // Allow null origin in development
        apiOrigin,
        'https://api.cloudinary.com', // Cloudinary upload API
        'https://res.cloudinary.com', // Cloudinary resource API
        'https://*.cloudinary.com', // Any Cloudinary subdomain
        'https://cloudinary.com', // Base Cloudinary domain
        ...(isDevelopment ? ['http://localhost:*', 'http://127.0.0.1:*'] : []), // Allow localhost in development
        // Sentry and analytics integration removed
        // ...(config.services.sentry.enabled ? ['https://sentry.io'] : []),
        // ...(config.services.analytics.enabled ? ['https://www.google-analytics.com'] : []),
        ...(isProduction ? [] : ['ws:', 'wss:']) // WebSocket for dev server
      ],
      'frame-src': ["'none'"],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': [
        "'self'",
        'https://api.cloudinary.com' // Allow form submissions to Cloudinary
      ],
      'frame-ancestors': ["'none'"],
      'upgrade-insecure-requests': isProduction ? [] : null, // Only in production
      'block-all-mixed-content': isProduction ? [] : null // Only in production
    }
  }

  // Generate CSP header value
  generateCSPHeader() {
    const directives = this.getCSPDirectives()
    
    return Object.entries(directives)
      .filter(([_, value]) => value !== null)
      .map(([directive, sources]) => {
        if (Array.isArray(sources) && sources.length > 0) {
          return `${directive} ${sources.join(' ')}`
        } else if (Array.isArray(sources) && sources.length === 0) {
          return directive
        }
        return null
      })
      .filter(Boolean)
      .join('; ')
  }

  // Security headers configuration
  getSecurityHeaders() {
    return {
      // Content Security Policy
      'Content-Security-Policy': this.generateCSPHeader(),
      
      // Strict Transport Security (HTTPS only)
      'Strict-Transport-Security': config.security.httpsOnly 
        ? 'max-age=31536000; includeSubDomains; preload' 
        : null,
      
      // Prevent MIME type sniffing
      'X-Content-Type-Options': 'nosniff',
      
      // XSS Protection
      'X-XSS-Protection': '1; mode=block',
      
      // Frame Options
      'X-Frame-Options': 'DENY',
      
      // Referrer Policy
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      
      // Permissions Policy (Feature Policy)
      'Permissions-Policy': [
        'accelerometer=()',
        'camera=()',
        'geolocation=()',
        'gyroscope=()',
        'magnetometer=()',
        'microphone=()',
        'payment=()',
        'usb=()'
      ].join(', ')
    }
  }

  // Apply security headers (for client-side enforcement)
  applyClientSecurityMeasures() {
    // Remove any existing CSP meta tags first
    const existingCSPTags = document.querySelectorAll('meta[http-equiv="Content-Security-Policy"]')
    existingCSPTags.forEach(tag => tag.remove())
    
    // Completely disable CSP in development mode
    if (config.isDevelopment) {
      Logger.info('CSP disabled in development mode - removed any existing CSP tags')
      return
    }

    // Apply CSP only if explicitly enabled in production
    if (config.security.enableCSP) {
      const cspHeader = this.generateCSPHeader()
      const meta = document.createElement('meta')
      meta.httpEquiv = 'Content-Security-Policy'
      meta.content = cspHeader
      document.head.appendChild(meta)
      Logger.info('CSP meta tag applied:', cspHeader)
    } else {
      Logger.info('CSP disabled via configuration')
    }

    // Add security-related attributes to forms
    this.secureFormsAndLinks()

    // Set up security monitoring
    this.setupSecurityMonitoring()
  }

  secureFormsAndLinks() {
    // Add rel="noopener noreferrer" to external links
    document.addEventListener('DOMContentLoaded', () => {
      const externalLinks = document.querySelectorAll('a[href^="http"]:not([href*="' + window.location.hostname + '"])')
      
      externalLinks.forEach(link => {
        if (!link.rel.includes('noopener')) {
          link.rel += ' noopener'
        }
        if (!link.rel.includes('noreferrer')) {
          link.rel += ' noreferrer'
        }
      })
    })

    // Ensure forms use HTTPS in production
    if (config.isProduction && config.security.httpsOnly) {
      document.addEventListener('DOMContentLoaded', () => {
        const forms = document.querySelectorAll('form')
        
        forms.forEach(form => {
          if (form.action && !form.action.startsWith('https://')) {
            Logger.warn('Form with non-HTTPS action detected:', form.action)
          }
        })
      })
    }
  }

  setupSecurityMonitoring() {
    // Monitor CSP violations
    document.addEventListener('securitypolicyviolation', (event) => {
      const violation = {
        blockedURI: event.blockedURI,
        violatedDirective: event.violatedDirective,
        originalPolicy: event.originalPolicy,
        sourceFile: event.sourceFile,
        lineNumber: event.lineNumber,
        columnNumber: event.columnNumber,
        timestamp: new Date().toISOString()
      }

      Logger.error('CSP Violation detected:', violation)

      // Report to external service if configured
      // Sentry integration removed
      // if (config.services.sentry.enabled) {
      //   // TODO: Send to Sentry
      //   // Sentry.captureException(new Error('CSP Violation'), { extra: violation })
      // }
    })

    // Monitor for potential XSS attempts
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              this.scanForSuspiciousContent(node)
            }
          })
        }
      })
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })
  }

  scanForSuspiciousContent(element) {
    // Check for suspicious attributes or content
    const suspiciousPatterns = [
      /javascript:/i,
      /data:text\/html/i,
      /vbscript:/i,
      /<script/i,
      /on\w+\s*=/i // Event handlers
    ]

    // Check element attributes
    if (element.attributes) {
      Array.from(element.attributes).forEach(attr => {
        suspiciousPatterns.forEach(pattern => {
          if (pattern.test(attr.name) || pattern.test(attr.value)) {
            Logger.warn('Suspicious content detected:', {
              element: element.tagName,
              attribute: attr.name,
              value: attr.value
            })
          }
        })
      })
    }

    // Check element content
    if (element.innerHTML) {
      suspiciousPatterns.forEach(pattern => {
        if (pattern.test(element.innerHTML)) {
          Logger.warn('Suspicious HTML content detected:', {
            element: element.tagName,
            content: element.innerHTML.substring(0, 100)
          })
        }
      })
    }
  }

  // Sanitize user input
  sanitizeInput(input) {
    if (typeof input !== 'string') return input

    // Basic HTML entity encoding
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
  }

  // Validate URLs
  isValidURL(url) {
    try {
      const urlObject = new URL(url)
      
      // Check against trusted domains
      if (this.trustedDomains.length > 0) {
        return this.trustedDomains.some(domain => {
          if (domain.startsWith('*.')) {
            const baseDomain = domain.substring(2)
            return urlObject.hostname.endsWith(baseDomain)
          }
          return urlObject.hostname === domain
        })
      }

      // Basic validation for same origin
      return urlObject.origin === window.location.origin
    } catch {
      return false
    }
  }

  // Generate secure random token
  generateSecureToken(length = 32) {
    const array = new Uint8Array(length)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  // Hash password client-side (additional layer)
  async hashPassword(password, salt) {
    const encoder = new TextEncoder()
    const data = encoder.encode(password + salt)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }

  // Get current security status
  getSecurityStatus() {
    return {
      httpsEnabled: location.protocol === 'https:',
      cspEnabled: config.security.enableCSP,
      secureContext: window.isSecureContext,
      cookieSecure: document.cookie.includes('Secure'),
      nonceGenerated: !!this.cspNonce,
      trustedDomains: this.trustedDomains.length
    }
  }
}

// Create singleton instance
const securityManager = new SecurityManager()

export default securityManager