import { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { toast } from 'sonner'

export const useAuthGuard = (requiredRoles = []) => {
  const { isAuthenticated, user, hasPermission } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => {
    const checkAuthOnNavigation = () => {
      if (!isAuthenticated) {
        navigate('/login', { state: { from: location } })
        return
      }

      // Check role permissions
      if (requiredRoles.length > 0 && !hasPermission(requiredRoles)) {
        toast.error('You don\'t have permission to access this page')
        
        // Redirect to appropriate dashboard based on user role
        const userRole = user?.role
        if (userRole) {
          navigate(`/${userRole}-dashboard`, { replace: true })
        } else {
          navigate('/login', { replace: true })
        }
        return
      }
    }

    checkAuthOnNavigation()
  }, [location.pathname, isAuthenticated, user, hasPermission, navigate, requiredRoles])

  return {
    isAuthenticated,
    user,
    hasPermission: (roles) => hasPermission(roles)
  }
}

export default useAuthGuard