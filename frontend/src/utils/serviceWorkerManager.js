/**
 * Service Worker registration and management
 * Handles SW lifecycle and provides utilities for PWA features
 */

import Logger from './logger.js'
import config from '../config/index.js'
import { toast } from 'sonner'

class ServiceWorkerManager {
  constructor() {
    this.registration = null
    this.isSupported = 'serviceWorker' in navigator
    this.updateAvailable = false
  }

  async register() {
    if (!this.isSupported || !config.getPerformanceConfig().enableServiceWorker) {
      Logger.info('Service Worker not supported or disabled')
      return null
    }

    try {
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      })

      Logger.info('Service Worker registered successfully:', this.registration.scope)

      // Handle service worker updates
      this.handleUpdates()

      // Listen for messages from service worker
      this.setupMessageListener()

      return this.registration
    } catch (error) {
      Logger.error('Service Worker registration failed:', error)
      return null
    }
  }

  handleUpdates() {
    if (!this.registration) return

    // Check for updates
    this.registration.addEventListener('updatefound', () => {
      const newWorker = this.registration.installing

      if (newWorker) {
        Logger.info('Service Worker update found')

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New service worker is available
            this.updateAvailable = true
            this.showUpdateNotification()
          }
        })
      }
    })

    // Listen for controlling service worker changes
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      Logger.info('Service Worker controller changed')
      if (this.updateAvailable) {
        window.location.reload()
      }
    })
  }

  setupMessageListener() {
    navigator.serviceWorker.addEventListener('message', (event) => {
      Logger.info('Message from Service Worker:', event.data)
      
      // Handle different message types
      if (event.data.type === 'CACHE_UPDATED') {
        toast.success('App updated and ready for offline use')
      }
    })
  }

  showUpdateNotification() {
    toast.info('A new version is available!', {
      duration: 10000,
      action: {
        label: 'Update',
        onClick: () => this.updateServiceWorker()
      }
    })
  }

  updateServiceWorker() {
    if (!this.registration || !this.registration.waiting) {
      Logger.warn('No waiting service worker available')
      return
    }

    // Tell the waiting service worker to skip waiting
    this.registration.waiting.postMessage({ type: 'SKIP_WAITING' })
  }

  async getCacheStats() {
    if (!this.registration || !this.registration.active) {
      return null
    }

    return new Promise((resolve) => {
      const messageChannel = new MessageChannel()
      
      messageChannel.port1.onmessage = (event) => {
        resolve(event.data)
      }

      this.registration.active.postMessage(
        { type: 'GET_CACHE_STATS' },
        [messageChannel.port2]
      )
    })
  }

  async clearCaches() {
    try {
      const cacheNames = await caches.keys()
      await Promise.all(
        cacheNames.map(cacheName => caches.delete(cacheName))
      )
      Logger.info('All caches cleared')
      toast.success('Cache cleared successfully')
    } catch (error) {
      Logger.error('Failed to clear caches:', error)
      toast.error('Failed to clear cache')
    }
  }

  // Background sync for offline actions
  async registerBackgroundSync(tag = 'background-sync') {
    if (!this.registration || !this.registration.sync) {
      Logger.warn('Background sync not supported')
      return false
    }

    try {
      await this.registration.sync.register(tag)
      Logger.info('Background sync registered:', tag)
      return true
    } catch (error) {
      Logger.error('Background sync registration failed:', error)
      return false
    }
  }

  // Push notifications
  async requestNotificationPermission() {
    if (!('Notification' in window)) {
      Logger.warn('Notifications not supported')
      return false
    }

    let permission = Notification.permission

    if (permission === 'default') {
      permission = await Notification.requestPermission()
    }

    if (permission === 'granted') {
      Logger.info('Notification permission granted')
      return true
    } else {
      Logger.warn('Notification permission denied')
      return false
    }
  }

  async subscribeToPushNotifications() {
    if (!this.registration) {
      Logger.warn('Service Worker not registered')
      return null
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(config.vapidPublicKey || '')
      })

      Logger.info('Push subscription created:', subscription)
      return subscription
    } catch (error) {
      Logger.error('Failed to subscribe to push notifications:', error)
      return null
    }
  }

  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  // Check if app is installable (PWA)
  checkInstallability() {
    let deferredPrompt = null

    window.addEventListener('beforeinstallprompt', (e) => {
      Logger.info('App is installable')
      e.preventDefault()
      deferredPrompt = e

      // Show install prompt
      this.showInstallPrompt(deferredPrompt)
    })

    window.addEventListener('appinstalled', () => {
      Logger.info('App installed successfully')
      toast.success('App installed successfully!')
      deferredPrompt = null
    })
  }

  showInstallPrompt(deferredPrompt) {
    toast.info('Install Science Point app for better experience!', {
      duration: 15000,
      action: {
        label: 'Install',
        onClick: async () => {
          if (deferredPrompt) {
            deferredPrompt.prompt()
            const { outcome } = await deferredPrompt.userChoice
            Logger.info('Install prompt outcome:', outcome)
            deferredPrompt = null
          }
        }
      }
    })
  }

  // Offline detection
  setupOfflineDetection() {
    const updateOnlineStatus = () => {
      if (navigator.onLine) {
        toast.success('Back online!')
        Logger.info('App back online')
      } else {
        toast.warning('App is offline. Some features may be limited.')
        Logger.warn('App went offline')
      }
    }

    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    // Initial status
    if (!navigator.onLine) {
      updateOnlineStatus()
    }
  }

  // Get service worker status
  getStatus() {
    return {
      isSupported: this.isSupported,
      isRegistered: !!this.registration,
      isActive: !!(this.registration && this.registration.active),
      updateAvailable: this.updateAvailable,
      scope: this.registration?.scope
    }
  }
}

// Create singleton instance
const serviceWorkerManager = new ServiceWorkerManager()

export default serviceWorkerManager