import { jwtDecode } from 'jwt-decode'
import config from '../config/index.js'
import Logger from './logger.js'

class TokenManager {
  constructor() {
    this.tokenKey = config.auth.tokenKey
    this.userKey = config.auth.userKey
    this.rememberMeKey = 'rememberMe'
    this.expirationWarningKey = 'tokenExpirationWarning'
    this.warningThreshold = 5 * 60 * 1000 // 5 minutes in milliseconds
  }

  /**
   * Decode JWT token and extract payload
   * @param {string} token - JWT token
   * @returns {object|null} - Decoded token payload or null if invalid
   */
  decodeToken(token) {
    try {
      if (!token) return null
      return jwtDecode(token)
    } catch (error) {
      Logger.error('Failed to decode token:', error)
      return null
    }
  }

  /**
   * Check if token is expired
   * @param {string} token - JWT token
   * @returns {boolean} - True if token is expired
   */
  isTokenExpired(token) {
    try {
      const decoded = this.decodeToken(token)
      if (!decoded || !decoded.exp) return true
      
      const currentTime = Date.now() / 1000
      return decoded.exp < currentTime
    } catch (error) {
      Logger.error('Error checking token expiration:', error)
      return true
    }
  }

  /**
   * Get token expiration time in milliseconds
   * @param {string} token - JWT token
   * @returns {number|null} - Expiration time in milliseconds or null
   */
  getTokenExpiration(token) {
    try {
      const decoded = this.decodeToken(token)
      if (!decoded || !decoded.exp) return null
      
      return decoded.exp * 1000 // Convert to milliseconds
    } catch (error) {
      Logger.error('Error getting token expiration:', error)
      return null
    }
  }

  /**
   * Check if token will expire soon (within warning threshold)
   * @param {string} token - JWT token
   * @returns {boolean} - True if token expires soon
   */
  isTokenExpiringSoon(token) {
    try {
      const expirationTime = this.getTokenExpiration(token)
      if (!expirationTime) return true
      
      const currentTime = Date.now()
      const timeUntilExpiration = expirationTime - currentTime
      
      return timeUntilExpiration <= this.warningThreshold && timeUntilExpiration > 0
    } catch (error) {
      Logger.error('Error checking token expiration warning:', error)
      return true
    }
  }

  /**
   * Get time remaining until token expires
   * @param {string} token - JWT token
   * @returns {number} - Time remaining in milliseconds (0 if expired)
   */
  getTimeUntilExpiration(token) {
    try {
      const expirationTime = this.getTokenExpiration(token)
      if (!expirationTime) return 0
      
      const currentTime = Date.now()
      const timeRemaining = expirationTime - currentTime
      
      return Math.max(0, timeRemaining)
    } catch (error) {
      Logger.error('Error calculating time until expiration:', error)
      return 0
    }
  }

  /**
   * Format remaining time as human readable string
   * @param {number} milliseconds - Time in milliseconds
   * @returns {string} - Formatted time string
   */
  formatTimeRemaining(milliseconds) {
    if (milliseconds <= 0) return 'Expired'
    
    const minutes = Math.floor(milliseconds / 60000)
    const seconds = Math.floor((milliseconds % 60000) / 1000)
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    } else {
      return `${seconds}s`
    }
  }

  /**
   * Store token with optional remember me setting
   * @param {string} token - JWT token
   * @param {object} user - User data
   * @param {boolean} rememberMe - Whether to remember user
   */
  storeToken(token, user, rememberMe = false) {
    try {
      // Always store in localStorage for session persistence
      localStorage.setItem(this.tokenKey, token)
      localStorage.setItem(this.userKey, JSON.stringify(user))
      localStorage.setItem(this.rememberMeKey, JSON.stringify(rememberMe))
      
      // Reset expiration warning flag
      localStorage.removeItem(this.expirationWarningKey)
      
      Logger.info('Token stored successfully', { rememberMe })
    } catch (error) {
      Logger.error('Error storing token:', error)
    }
  }

  /**
   * Get stored token
   * @returns {string|null} - Stored token or null
   */
  getToken() {
    try {
      return localStorage.getItem(this.tokenKey)
    } catch (error) {
      Logger.error('Error retrieving token:', error)
      return null
    }
  }

  /**
   * Get stored user data
   * @returns {object|null} - Stored user data or null
   */
  getUser() {
    try {
      const userData = localStorage.getItem(this.userKey)
      return userData ? JSON.parse(userData) : null
    } catch (error) {
      Logger.error('Error retrieving user data:', error)
      return null
    }
  }

  /**
   * Check if remember me is enabled
   * @returns {boolean} - True if remember me is enabled
   */
  isRememberMeEnabled() {
    try {
      const rememberMe = localStorage.getItem(this.rememberMeKey)
      return rememberMe ? JSON.parse(rememberMe) : false
    } catch (error) {
      Logger.error('Error checking remember me setting:', error)
      return false
    }
  }

  /**
   * Check if expiration warning has been shown
   * @returns {boolean} - True if warning has been shown
   */
  hasShownExpirationWarning() {
    try {
      return localStorage.getItem(this.expirationWarningKey) === 'true'
    } catch (error) {
      Logger.error('Error checking expiration warning flag:', error)
      return false
    }
  }

  /**
   * Mark expiration warning as shown
   */
  markExpirationWarningShown() {
    try {
      localStorage.setItem(this.expirationWarningKey, 'true')
    } catch (error) {
      Logger.error('Error marking expiration warning as shown:', error)
    }
  }

  /**
   * Clear all authentication data
   */
  clearAuth() {
    try {
      localStorage.removeItem(this.tokenKey)
      localStorage.removeItem(this.userKey)
      localStorage.removeItem(this.rememberMeKey)
      localStorage.removeItem(this.expirationWarningKey)
      
      Logger.info('Authentication data cleared')
    } catch (error) {
      Logger.error('Error clearing authentication data:', error)
    }
  }

  /**
   * Validate current token and return status
   * @returns {object} - Token validation status
   */
  validateToken() {
    const token = this.getToken()
    const user = this.getUser()
    
    if (!token || !user) {
      return {
        isValid: false,
        isExpired: false,
        isExpiringSoon: false,
        timeRemaining: 0,
        reason: 'No token or user data found'
      }
    }

    const isExpired = this.isTokenExpired(token)
    const isExpiringSoon = !isExpired && this.isTokenExpiringSoon(token)
    const timeRemaining = this.getTimeUntilExpiration(token)

    return {
      isValid: !isExpired,
      isExpired,
      isExpiringSoon,
      timeRemaining,
      timeRemainingFormatted: this.formatTimeRemaining(timeRemaining),
      reason: isExpired ? 'Token is expired' : 'Token is valid'
    }
  }

  /**
   * Check if user should stay logged in based on remember me and token validity
   * @returns {boolean} - True if user should stay logged in
   */
  shouldStayLoggedIn() {
    const tokenStatus = this.validateToken()
    const rememberMe = this.isRememberMeEnabled()
    
    // If remember me is enabled and token is not expired, stay logged in
    if (rememberMe && tokenStatus.isValid) {
      return true
    }
    
    // If remember me is disabled, only stay logged in for valid tokens in same session
    if (!rememberMe && tokenStatus.isValid) {
      return true
    }
    
    return false
  }
}

const tokenManager = new TokenManager()
export default tokenManager
