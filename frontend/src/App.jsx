import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'sonner'
import { AuthProvider } from './contexts/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import ErrorBoundary from './components/ErrorBoundary'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import AdminDashboard from './pages/AdminDashboard'
import TeacherDashboard from './pages/TeacherDashboard'
import StudentDashboard from './pages/StudentDashboard'
import NotFound from './pages/NotFound'
import DeveloperPage from './pages/DeveloperPage'
// import StudentProfile from './pages/StudentProfile'
// import StudentAttendance from './pages/StudentAttendance'
// import StudentResults from './pages/StudentResults'
// import StudentMaterials from './pages/StudentMaterials'
// import StudentNotices from './pages/StudentNotices'

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
})

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <div className="min-h-screen bg-gray-50">
              <Routes>
              {/* Public Routes */}
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
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
            <Toaster 
              position="top-right" 
              richColors 
              closeButton 
              duration={3000}
            />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
