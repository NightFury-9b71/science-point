import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import serviceWorkerManager from './utils/serviceWorkerManager.js'
import config from './config/index.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register service worker in production
if (config.isProduction) {
  serviceWorkerManager.register()
  serviceWorkerManager.checkInstallability()
  serviceWorkerManager.setupOfflineDetection()
}
