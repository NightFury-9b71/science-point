import React from 'react'
import { Loader2 } from 'lucide-react'

const LoadingSpinner = ({ 
  size = 'default', 
  text = 'Loading...', 
  fullScreen = false,
  className = '' 
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    default: 'w-6 h-6',
    large: 'w-8 h-8',
    xl: 'w-12 h-12'
  }

  const containerClasses = fullScreen 
    ? 'fixed inset-0 bg-white bg-opacity-80 flex items-center justify-center z-50'
    : 'flex items-center justify-center p-8'

  return (
    <div className={`${containerClasses} ${className}`}>
      <div className="flex flex-col items-center space-y-4">
        <Loader2 className={`${sizeClasses[size]} animate-spin text-blue-600`} />
        {text && (
          <p className="text-sm text-gray-600 animate-pulse">{text}</p>
        )}
      </div>
    </div>
  )
}

// Component-specific loading states
export const PageLoadingSpinner = () => (
  <LoadingSpinner 
    size="large" 
    text="Loading page..." 
    fullScreen={false}
    className="min-h-screen"
  />
)

export const ComponentLoadingSpinner = ({ text = 'Loading component...' }) => (
  <LoadingSpinner 
    size="default" 
    text={text} 
    className="min-h-32"
  />
)

export const ButtonLoadingSpinner = () => (
  <LoadingSpinner 
    size="small" 
    text="" 
    className="inline-flex"
  />
)

export default LoadingSpinner