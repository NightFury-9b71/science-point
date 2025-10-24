/**
 * Application configuration management
 * Centralized configuration that adapts to different environments
 */

class Config {
  constructor() {
    this.env = import.meta.env.MODE || 'development'
    this.isDevelopment = this.env === 'development'
    this.isProduction = import.meta.env.PROD
    this.isStaging = this.env === 'staging'
  }

  // App metadata
  get app() {
    return {
      name: import.meta.env.VITE_APP_NAME || 'Science Point',
      version: import.meta.env.VITE_APP_VERSION || '1.0.0',
      environment: this.env
    }
  }

  // API configuration
  get api() {
    return {
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001',
      timeout: parseInt(import.meta.env.VITE_API_TIMEOUT || '10000'),
      retryAttempts: 3,
      retryDelay: 1000
    }
  }

  // Frontend configuration
  get frontend() {
    return {
      baseURL: import.meta.env.VITE_FRONTEND_BASE_URL || 'http://localhost:3000',
    }
  }

  // Authentication configuration
  get auth() {
    return {
      tokenKey: 'token',
      userKey: 'user',
      tokenExpiry: parseInt(import.meta.env.VITE_AUTH_TOKEN_EXPIRY || '86400'),
      refreshThreshold: 300 // 5 minutes before expiry
    }
  }

  // Feature flags
  get features() {
    return {
      enableDebug: import.meta.env.VITE_ENABLE_DEBUG === 'true',
      enableMockData: import.meta.env.VITE_ENABLE_MOCK_DATA === 'true',
      enableDevTools: import.meta.env.VITE_ENABLE_DEV_TOOLS === 'true',
      enableConsoleLogs: import.meta.env.VITE_ENABLE_CONSOLE_LOGS === 'true',
      enableErrorReporting: import.meta.env.VITE_ERROR_REPORTING_ENABLED === 'true'
    }
  }

  // UI configuration
  get ui() {
    return {
      paginationLimit: parseInt(import.meta.env.VITE_PAGINATION_LIMIT || '25'),
      fileUploadMaxSize: parseInt(import.meta.env.VITE_FILE_UPLOAD_MAX_SIZE || '524288000'), // 500MB for larger files
      cacheTimeout: parseInt(import.meta.env.VITE_CACHE_TTL || '300'),
      debounceDelay: 300,
      toastTimeout: 5000
    }
  }

  // Cloudinary configuration
  get cloudinary() {
    const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
    const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET
    const apiKey = import.meta.env.VITE_CLOUDINARY_API_KEY

    if (!cloudName || !uploadPreset) {
      console.warn('Cloudinary configuration incomplete. Upload functionality may not work.')
    }

    return {
      apiKey: apiKey,
      cloudName: cloudName,
      uploadPreset: uploadPreset,
      uploadUrl: cloudName ? `https://api.cloudinary.com/v1_1/${cloudName}/upload` : '',
      // Helper to check if configuration is valid
      isConfigured: Boolean(cloudName && uploadPreset)
    }
  }

  // Security configuration
  get security() {
    return {
      httpsOnly: import.meta.env.VITE_ENABLE_HTTPS_ONLY === 'true',
      enableCSP: import.meta.env.VITE_ENABLE_CSP === 'true',
      trustedDomains: [
        'localhost',
        'sciencepoint.com',
        '*.sciencepoint.com',
        'science-point.onrender.com',
        'science-point-backend.onrender.com',
        'api.cloudinary.com',
        '*.cloudinary.com',
        'res.cloudinary.com',
        'cloudinary.com'
      ]
    }
  }

  // Logging configuration
  get logging() {
    return {
      level: this.isDevelopment ? 'debug' : 'error',
      enableConsole: this.features.enableConsoleLogs,
      enableRemote: this.features.enableErrorReporting && this.isProduction
    }
  }

  // Get configuration for a specific key with fallback
  get(key, fallback = null) {
    const keys = key.split('.')
    let value = this

    for (const k of keys) {
      value = value[k]
      if (value === undefined) {
        return fallback
      }
    }

    return value
  }

  // Validate required environment variables
  validateRequiredEnv() {
    const required = [
      'VITE_API_BASE_URL'
    ]

    const missing = required.filter(key => !import.meta.env[key])
    
    if (missing.length > 0) {
      const errorMsg = `Missing required environment variables: ${missing.join(', ')}`
      console.error(errorMsg)
      
      if (this.isProduction) {
        throw new Error(errorMsg)
      }
    }
  }

  // Environment-specific configurations
  getDatabaseConfig() {
    if (this.isDevelopment) {
      return {
        queryRetries: 3,
        cacheTimeout: 5 * 60 * 1000, // 5 minutes
        enableQueryDevTools: true
      }
    }
    
    return {
      queryRetries: 5,
      cacheTimeout: 15 * 60 * 1000, // 15 minutes
      enableQueryDevTools: false
    }
  }

  getPerformanceConfig() {
    return {
      enableLazyLoading: true,
      chunkSizeLimit: this.isProduction ? 500 : 1000, // KB
      enableGzip: this.isProduction,
      enableBrotli: this.isProduction,
      enableServiceWorker: this.isProduction
    }
  }
}

// Create and validate configuration instance
const config = new Config()

// Validate required environment variables on initialization
config.validateRequiredEnv()

export default config