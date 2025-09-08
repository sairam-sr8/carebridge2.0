import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'
import { Eye, EyeOff, Heart, AlertCircle } from 'lucide-react'

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { user, login, loading, error, setError, getRedirectPath } = useAuth()
  const navigate = useNavigate()

  // Redirect if already logged in
  useEffect(() => {
    if (user && !loading) {
      navigate(getRedirectPath(user.user_type), { replace: true })
    }
  }, [user, loading, navigate, getRedirectPath])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Clear any previous errors
    setError('')
    
    // Basic validation
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields')
      return
    }

    if (!email.includes('@')) {
      setError('Please enter a valid email address')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setIsSubmitting(true)
    
    try {
      const userData = await login(email.trim(), password)
      // Navigate to appropriate dashboard
      navigate(getRedirectPath(userData.user_type), { replace: true })
    } catch (error) {
      // Error is handled by AuthContext
      console.error('Login failed:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Show loading spinner while checking existing session
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0f9ff 0%, #f1f5f9 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
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

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f9ff 0%, #f1f5f9 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{ maxWidth: '400px', width: '100%' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <Link to="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: '#0284c7',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '24px',
              fontWeight: 'bold',
              marginRight: '12px'
            }}>
              C
            </div>
            <h1 style={{
              fontSize: '28px',
              fontWeight: 'bold',
              color: '#1e293b',
              margin: 0
            }}>
              CareBridge
            </h1>
          </Link>
        </div>

        {/* Login Form */}
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          padding: '32px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#1e293b',
              margin: '0 0 8px 0'
            }}>
              Sign in to your account
            </h2>
            <p style={{
              color: '#64748b',
              margin: 0,
              fontSize: '14px'
            }}>
              Access your mental health dashboard
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center'
            }}>
              <AlertCircle style={{ width: '16px', height: '16px', color: '#dc2626', marginRight: '8px' }} />
              <span style={{ color: '#dc2626', fontSize: '14px' }}>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Email Field */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px'
              }}>
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                autoComplete="email"
                required
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => e.target.style.borderColor = '#0284c7'}
                onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
              />
            </div>

            {/* Password Field */}
            <div>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '6px'
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    paddingRight: '48px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px',
                    outline: 'none',
                    transition: 'border-color 0.2s',
                    boxSizing: 'border-box'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#0284c7'}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#6b7280',
                    padding: '4px'
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                width: '100%',
                background: isSubmitting ? '#94a3b8' : '#0284c7',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              onMouseEnter={(e) => {
                if (!isSubmitting) e.target.style.background = '#0369a1'
              }}
              onMouseLeave={(e) => {
                if (!isSubmitting) e.target.style.background = '#0284c7'
              }}
            >
              {isSubmitting ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid transparent',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    marginRight: '8px'
                  }}></div>
                  Signing in...
                </>
              ) : (
                <>
                  <Heart size={16} style={{ marginRight: '8px' }} />
                  Sign in
                </>
              )}
            </button>
          </form>

          {/* Footer */}
          <div style={{
            textAlign: 'center',
            marginTop: '24px',
            paddingTop: '20px',
            borderTop: '1px solid #e5e7eb'
          }}>
            <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
              Don't have an account?{' '}
              <Link to="/" style={{ color: '#0284c7', textDecoration: 'none', fontWeight: '500' }}>
                Contact your administrator
              </Link>
            </p>
          </div>
        </div>

        {/* Demo Credentials */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.8)',
          borderRadius: '8px',
          padding: '16px',
          marginTop: '16px',
          textAlign: 'center',
          fontSize: '12px',
          color: '#6b7280'
        }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: '500' }}>Demo Credentials:</p>
          <p style={{ margin: 0 }}>
            <strong>Admin:</strong> admin@carebridge.com / admin123<br />
            <strong>Doctor:</strong> doctor@carebridge.com / doctor123<br />
            <strong>Patient:</strong> patient@carebridge.com / patient123
          </p>
        </div>
      </div>

      {/* Add CSS animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default LoginPage