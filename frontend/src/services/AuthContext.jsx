import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing token on app load
    const token = localStorage.getItem('access_token')
    if (token) {
      // Verify token and get user info
      fetchUserInfo(token)
    } else {
      setLoading(false)
    }
  }, [])

  const fetchUserInfo = async (token) => {
    try {
      const response = await fetch('http://localhost:8000/api/v1/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else {
        localStorage.removeItem('access_token')
      }
    } catch (error) {
      console.error('Error fetching user info:', error)
      localStorage.removeItem('access_token')
    } finally {
      setLoading(false)
    }
  }

  const login = async (email, password) => {
    try {
      console.log('🔐 Attempting login with:', { email, password: '***' });
      
      const response = await fetch('http://localhost:8000/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,  // Backend expects 'email' not 'username'
          password: password
        })
      })

      console.log('📡 Login response status:', response.status);

      if (response.ok) {
        const data = await response.json()
        console.log('✅ Login successful:', data);
        
        localStorage.setItem('access_token', data.access_token)
        setUser({
          id: data.user_id,
          email: data.email,
          user_type: data.user_type
        })
        return { success: true, user_type: data.user_type }
      } else {
        const error = await response.json()
        console.error('❌ Login failed:', error);
        return { success: false, error: error.detail || 'Login failed' }
      }
    } catch (error) {
      console.error('❌ Login network error:', error);
      return { success: false, error: 'Network error - check if backend is running' }
    }
  }

  const logout = () => {
    localStorage.removeItem('access_token')
    setUser(null)
  }

  const value = {
    user,
    login,
    logout,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
