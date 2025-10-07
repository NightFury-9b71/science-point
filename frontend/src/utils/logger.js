/**
 * Production-safe logging utility
 * Only logs errors in production, allows all logs in development
 */

import config from '../config/index.js'

const isDevelopment = config.isDevelopment
const isProduction = config.isProduction

class Logger {
  static log(...args) {
    if (config.logging.enableConsole) {
      console.log('[LOG]', ...args)
    }
  }

  static info(...args) {
    if (config.logging.enableConsole) {
      console.info('[INFO]', ...args)
    }
  }

  static warn(...args) {
    // Always show warnings
    console.warn('[WARN]', ...args)
  }

  static error(...args) {
    // Always show errors
    console.error('[ERROR]', ...args)
    
    // In production, you might want to send errors to a monitoring service
    if (isProduction) {
      // TODO: Integrate with error monitoring service (e.g., Sentry)
      // Sentry.captureException(args[0])
    }
  }

  static debug(...args) {
    if (config.logging.enableConsole && config.features.enableDebug) {
      console.debug('[DEBUG]', ...args)
    }
  }
}

export default Logger