import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'

function ProtectedRoute({ children, requiredRole = null }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid #e2e8f0',
          borderTop: '3px solid #0284c7',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check role-based access if required
  if (requiredRole && user.user_type !== requiredRole) {
    // Redirect to appropriate dashboard based on user type
    const redirectPath = user.user_type === 'admin' ? '/admin' :
                        user.user_type === 'doctor' ? '/doctor/dashboard' :
                        user.user_type === 'patient' ? '/patient' : '/'
    return <Navigate to={redirectPath} replace />
  }

  return children
}

export default ProtectedRoute