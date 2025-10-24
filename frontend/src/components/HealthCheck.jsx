/**
 * Health Check Component
 * Monitors application health and displays system status
 */

import React, { useState, useEffect } from 'react'
import { Activity, AlertCircle, CheckCircle, Clock, Server, Wifi, WifiOff } from 'lucide-react'
import Card from './Card'
import Button from './Button'
import monitoringService from '../utils/monitoringService.js'
import globalErrorHandler from '../utils/globalErrorHandler.js'
import config from '../config/index.js'

const HealthCheck = ({ className = '' }) => {
  const [healthData, setHealthData] = useState({
    status: 'checking',
    api: 'unknown',
    network: 'unknown',
    performance: null,
    errors: 0,
    lastUpdate: null
  })

  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    checkHealth()
    const interval = setInterval(checkHealth, 30000) // Check every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const checkHealth = async () => {
    try {
      const performance = monitoringService.getPerformanceReport()
      const errorStats = globalErrorHandler.getErrorStats()
      
      // Check API health
      const apiHealth = await checkAPIHealth()
      
      // Check network connectivity
      const networkHealth = navigator.onLine ? 'healthy' : 'offline'

      setHealthData({
        status: determineOverallStatus(apiHealth, networkHealth, errorStats),
        api: apiHealth,
        network: networkHealth,
        performance,
        errors: errorStats.criticalCount,
        lastUpdate: new Date().toISOString()
      })
    } catch (error) {
      setHealthData(prev => ({
        ...prev,
        status: 'error',
        lastUpdate: new Date().toISOString()
      }))
    }
  }

  const checkAPIHealth = async () => {
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)

      const response = await fetch(`${config.api.baseURL}/health`, {
        method: 'GET',
        signal: controller.signal
      })

      clearTimeout(timeoutId)

      if (response.ok) {
        return 'healthy'
      } else {
        return 'degraded'
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        return 'timeout'
      }
      return 'unhealthy'
    }
  }

  const determineOverallStatus = (api, network, errorStats) => {
    if (network === 'offline') return 'offline'
    if (api === 'unhealthy' || errorStats.criticalCount > 5) return 'critical'
    if (api === 'degraded' || errorStats.total > 10) return 'warning'
    if (api === 'healthy' && errorStats.criticalCount === 0) return 'healthy'
    return 'unknown'
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />
      case 'critical':
      case 'unhealthy':
        return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'offline':
        return <WifiOff className="w-4 h-4 text-gray-500" />
      default:
        return <Clock className="w-4 h-4 text-gray-400" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'critical':
      case 'unhealthy':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'offline':
        return 'text-gray-600 bg-gray-50 border-gray-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  // Only show in development or when there are issues
  const shouldShow = config.isDevelopment || 
    healthData.status === 'critical' || 
    healthData.status === 'offline' || 
    healthData.errors > 0

  if (!shouldShow && !isVisible) return null

  return (
    <div className={`fixed bottom-4 right-4 z-50 ${className}`}>
      {/* Status indicator */}
      <div 
        className={`
          inline-flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer
          transition-all duration-200 hover:shadow-md
          ${getStatusColor(healthData.status)}
        `}
        onClick={() => setIsVisible(!isVisible)}
      >
        <Activity className="w-4 h-4" />
        <span className="text-sm font-medium capitalize">
          {healthData.status}
        </span>
        {getStatusIcon(healthData.status)}
      </div>

      {/* Detailed health panel */}
      {isVisible && (
        <Card className="mt-2 w-80 shadow-lg">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">System Health</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </Button>
            </div>

            <div className="space-y-3">
              {/* API Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Server className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">API</span>
                </div>
                <div className="flex items-center gap-1">
                  {getStatusIcon(healthData.api)}
                  <span className="text-sm capitalize">{healthData.api}</span>
                </div>
              </div>

              {/* Network Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {healthData.network === 'healthy' ? 
                    <Wifi className="w-4 h-4 text-gray-500" /> : 
                    <WifiOff className="w-4 h-4 text-gray-500" />
                  }
                  <span className="text-sm">Network</span>
                </div>
                <div className="flex items-center gap-1">
                  {getStatusIcon(healthData.network)}
                  <span className="text-sm capitalize">{healthData.network}</span>
                </div>
              </div>

              {/* Error Count */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">Critical Errors</span>
                </div>
                <span className={`text-sm ${healthData.errors > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {healthData.errors}
                </span>
              </div>

              {/* Performance */}
              {healthData.performance && (
                <div className="pt-3 border-t border-gray-200">
                  <h4 className="text-sm font-medium mb-2">Performance</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                    <div>Session: {Math.round(healthData.performance.sessionDuration / 1000)}s</div>
                    <div>API Calls: {healthData.performance.apiCallsCount}</div>
                    <div>Avg Load: {healthData.performance.averageLoadTime}ms</div>
                    <div>Slow APIs: {healthData.performance.slowApiCalls}</div>
                  </div>
                </div>
              )}

              {/* Last Update */}
              {healthData.lastUpdate && (
                <div className="pt-3 border-t border-gray-200">
                  <div className="text-xs text-gray-500">
                    Last updated: {new Date(healthData.lastUpdate).toLocaleTimeString()}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-3 border-t border-gray-200 space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={checkHealth}
                  className="w-full"
                >
                  <Activity className="w-3 h-3 mr-1" />
                  Refresh
                </Button>
                
                {config.isDevelopment && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const report = monitoringService.getPerformanceReport()
                      console.log('Performance Report:', report)
                      console.log('Error Stats:', globalErrorHandler.getErrorStats())
                    }}
                    className="w-full text-xs"
                  >
                    Export Debug Data
                  </Button>
                )}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

export default HealthCheck