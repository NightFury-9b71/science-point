import React, { useEffect, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import globalErrorHandler from './utils/globalErrorHandler.js'
import monitoringService from './utils/monitoringService.js'
import securityManager from './utils/securityManager.js'
import config from './config/index.js'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import HealthCheck from './components/HealthCheck'
import { PageLoadingSpinner } from './components/LoadingSpinner'

// Lazy load components for better performance
const LandingPage = React.lazy(() => import('./pages/LandingPage'))
const LoginPage = React.lazy(() => import('./pages/LoginPage'))
const AdmissionForm = React.lazy(() => import('./pages/AdmissionForm'))
const AdminDashboard = React.lazy(() => import('./pages/AdminDashboard'))
const TeacherDashboard = React.lazy(() => import('./pages/TeacherDashboard'))
const StudentDashboard = React.lazy(() => import('./pages/StudentDashboard'))
const NotFound = React.lazy(() => import('./pages/NotFound'))
const DeveloperPage = React.lazy(() => import('./pages/DeveloperPage'))
// import StudentProfile from './pages/StudentProfile'
// import StudentAttendance from './pages/StudentAttendance'
// import StudentResults from './pages/StudentResults'
// import StudentMaterials from './pages/StudentMaterials'
// import StudentNotices from './pages/StudentNotices'

// Create a client with production-ready configuration
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: config.isProduction ? 3 : 1,
      staleTime: config.ui.cacheTimeout * 1000,
      cacheTime: config.ui.cacheTimeout * 2 * 1000,
      refetchOnReconnect: true,
      networkMode: 'online'
    },
    mutations: {
      retry: config.isProduction ? 2 : 0,
      networkMode: 'online'
    }
  },
})

function App() {
  // Initialize error handling and monitoring
  useEffect(() => {
    // Initialize global error handler
    globalErrorHandler.init()
    
    // Initialize monitoring service
    monitoringService.init()

    // Initialize security measures
    securityManager.applyClientSecurityMeasures()

    // Performance monitoring cleanup
    const cleanup = () => {
      monitoringService.cleanup()
    }

    // Cleanup on page unload
    window.addEventListener('beforeunload', cleanup)
    
    return () => {
      window.removeEventListener('beforeunload', cleanup)
    }
  }, [])

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-gray-50">
              <Suspense fallback={<PageLoadingSpinner />}>
                <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/admission" element={<AdmissionForm />} />
              <Route path="/developer" element={<DeveloperPage />} />
              
              {/* Protected Routes */}
              <Route path="/admin-dashboard/*" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Layout>
                    <AdminDashboard />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/teacher/*" element={
                <ProtectedRoute allowedRoles={['teacher']}>
                  <Layout>
                    <TeacherDashboard />
                  </Layout>
                </ProtectedRoute>
              } />
              
              <Route path="/student/*" element={
                <ProtectedRoute allowedRoles={['student']}>
                  <Layout>
                    <StudentDashboard />
                  </Layout>
                </ProtectedRoute>
              } />
              
              {/* 404 Not Found route */}
              <Route path="/404" element={<NotFound />} />
              
              {/* Fallback route */}
              <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            <Toaster 
              position="top-right" 
              richColors 
              closeButton 
              duration={config.ui.toastTimeout}
              theme={config.isDevelopment ? 'light' : 'system'}
            />
            <HealthCheck />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
