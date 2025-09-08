import { createContext, useContext, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_CONFIG } from '../config/api'

const AuthContext = createContext()

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Check for existing session on mount
  useEffect(() => {
    checkExistingSession()
  }, [])

  const checkExistingSession = () => {
    try {
      const token = localStorage.getItem('access_token')
      const userType = localStorage.getItem('user_type')
      const userName = localStorage.getItem('user_name')
      const userEmail = localStorage.getItem('user_email')
      
      if (token && userType && userName) {
        setUser({
          email: userEmail,
          user_type: userType,
          user_name: userName,
          access_token: token
        })
      }
    } catch (error) {
      console.error('Error checking existing session:', error)
      clearSession()
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    setLoading(true)
    setError('')
    
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH.LOGIN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Login failed')
      }

      const data = await response.json()
      
      // Store session data
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('user_type', data.user_type)
      localStorage.setItem('user_name', data.user_name)
      localStorage.setItem('user_email', email)
      
      const userData = {
        email,
        user_type: data.user_type,
        user_name: data.user_name,
        access_token: data.access_token
      }
      
      setUser(userData)
      return userData
      
    } catch (error) {
      setError(error.message)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    clearSession()
    setUser(null)
  }

  const clearSession = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user_type')
    localStorage.removeItem('user_name')
    localStorage.removeItem('user_email')
  }

  const getRedirectPath = (userType) => {
    switch (userType) {
      case 'admin':
        return '/admin'
      case 'doctor':
        return '/doctor/dashboard'
      case 'patient':
        return '/patient'
      default:
        return '/'
    }
  }

  const value = {
    user,
    login,
    logout,
    loading,
    error,
    setError,
    getRedirectPath
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}