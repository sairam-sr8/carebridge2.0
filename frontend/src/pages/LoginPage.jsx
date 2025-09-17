import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'

const LoginPage = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isLoaded, setIsLoaded] = useState(false)
  const [focusedField, setFocusedField] = useState('')
  const { login } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 200)
    return () => clearTimeout(timer)
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await login(email, password)
      if (result.success) {
        // Success animation before redirect
        setTimeout(() => {
          if (result.user_type === 'admin') {
            navigate('/admin')
          } else if (result.user_type === 'doctor') {
            navigate('/doctor')
          } else if (result.user_type === 'patient') {
            navigate('/patient')
          }
        }, 800)
      } else {
        setError(result.error || 'Login failed')
      }
    } catch (err) {
      setError('Network error - please check if backend is running')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 50%, #8074c9 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      position: 'relative',
      overflow: 'hidden'
    }}>
      
      {/* Animated Background Elements */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background: `
          radial-gradient(circle at 20% 30%, rgba(255,255,255,0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 70%, rgba(168, 85, 247, 0.2) 0%, transparent 50%),
          radial-gradient(circle at 60% 20%, rgba(128, 116, 201, 0.15) 0%, transparent 50%)
        `,
        animation: 'backgroundDrift 15s ease-in-out infinite'
      }} />
      
      {/* Floating Orbs */}
      {[...Array(4)].map((_, i) => (
        <div key={i} style={{
          position: 'absolute',
          width: `${40 + i * 20}px`,
          height: `${40 + i * 20}px`,
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '50%',
          top: `${20 + i * 20}%`,
          left: `${10 + i * 20}%`,
          animation: `orbFloat ${6 + i * 2}s ease-in-out infinite ${i * 1}s`,
          backdropFilter: 'blur(2px)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }} />
      ))}

      {/* Premium Login Container */}
      <div style={{
        background: 'linear-gradient(145deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 250, 255, 0.9) 100%)',
        borderRadius: '30px',
        padding: '50px 45px',
        boxShadow: `
          0 40px 100px rgba(0, 0, 0, 0.3),
          0 0 0 1px rgba(255, 255, 255, 0.3),
          inset 0 1px 0 rgba(255, 255, 255, 0.5)
        `,
        width: '100%',
        maxWidth: '450px',
        backdropFilter: 'blur(30px)',
        border: '2px solid rgba(255, 255, 255, 0.2)',
        animation: isLoaded ? 'containerSlide 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)' : 'none',
        position: 'relative',
        overflow: 'hidden'
      }}>
        
        {/* Subtle Background Pattern */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'radial-gradient(circle at 50% 0%, rgba(128, 116, 201, 0.05) 0%, transparent 50%)',
          borderRadius: '30px'
        }} />
        
        {/* Premium Logo Section */}
        <div style={{ textAlign: 'center', marginBottom: '40px', position: 'relative', zIndex: 2 }}>
          <div style={{
            width: '100px',
            height: '100px',
            background: 'linear-gradient(135deg, #8074c9 0%, #a855f7 100%)',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 25px auto',
            boxShadow: '0 15px 40px rgba(128, 116, 201, 0.3)',
            animation: 'none',
            border: '4px solid rgba(255, 255, 255, 0.3)',
            backdropFilter: 'blur(10px)'
          }}>
            {/* Original CareBridge Logo */}
            <svg width="50" height="50" viewBox="0 0 100 100" style={{ fill: 'white' }}>
              {/* Bridge */}
              <path d="M10 70 Q50 50 90 70" stroke="white" strokeWidth="3" fill="none" />
              <path d="M10 73 Q50 53 90 73" stroke="white" strokeWidth="2" fill="none" />
              
              {/* Human figure */}
              <circle cx="50" cy="45" r="6" fill="white" />
              <rect x="47" y="51" width="6" height="12" fill="white" rx="1" />
              <rect x="45" y="54" width="3" height="8" fill="white" rx="1" />
              <rect x="52" y="54" width="3" height="8" fill="white" rx="1" />
              <rect x="47" y="63" width="2" height="6" fill="white" rx="1" />
              <rect x="51" y="63" width="2" height="6" fill="white" rx="1" />
            </svg>
          </div>
          
          <h1 style={{ 
            fontSize: '2.8rem', 
            fontWeight: '800', 
            background: 'linear-gradient(135deg, #8074c9 0%, #a855f7 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            marginBottom: '10px',
            letterSpacing: '-1px'
          }}>
            CareBridge
          </h1>
          <p style={{ 
            color: '#6b7280', 
            fontSize: '1.1rem',
            fontWeight: '500',
            margin: 0
          }}>
            AI-Powered Mental Health Platform
          </p>
        </div>

        {/* Premium Login Form */}
        <form onSubmit={handleSubmit} style={{ position: 'relative', zIndex: 2 }}>
          
          {/* Email Field */}
          <div style={{ marginBottom: '25px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              color: '#374151',
              fontSize: '0.95rem'
            }}>
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField('')}
              required
              style={{
                width: '100%',
                padding: '16px 20px',
                border: `2px solid ${focusedField === 'email' ? '#8074c9' : 'rgba(128, 116, 201, 0.2)'}`,
                borderRadius: '15px',
                fontSize: '16px',
                boxSizing: 'border-box',
                background: 'linear-gradient(135deg, #ffffff 0%, #fafbff 100%)',
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                outline: 'none',
                fontWeight: '500',
                boxShadow: focusedField === 'email' ? '0 0 0 3px rgba(128, 116, 201, 0.1), 0 8px 25px rgba(128, 116, 201, 0.15)' : '0 4px 15px rgba(0, 0, 0, 0.08)'
              }}
              placeholder="admin@carebridge.com"
            />
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: '30px' }}>
            <label style={{
              display: 'block',
              marginBottom: '8px',
              fontWeight: '600',
              color: '#374151',
              fontSize: '0.95rem'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField('')}
              required
              style={{
                width: '100%',
                padding: '16px 20px',
                border: `2px solid ${focusedField === 'password' ? '#8074c9' : 'rgba(128, 116, 201, 0.2)'}`,
                borderRadius: '15px',
                fontSize: '16px',
                boxSizing: 'border-box',
                background: 'linear-gradient(135deg, #ffffff 0%, #fafbff 100%)',
                transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                outline: 'none',
                fontWeight: '500',
                boxShadow: focusedField === 'password' ? '0 0 0 3px rgba(128, 116, 201, 0.1), 0 8px 25px rgba(128, 116, 201, 0.15)' : '0 4px 15px rgba(0, 0, 0, 0.08)'
              }}
              placeholder="admin123"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div style={{
              background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
              color: '#dc2626',
              padding: '15px 20px',
              borderRadius: '15px',
              marginBottom: '25px',
              fontSize: '14px',
              fontWeight: '500',
              border: '1px solid rgba(220, 38, 38, 0.2)',
              animation: 'errorShake 0.5s ease-in-out'
            }}>
              ⚠️ {error}
            </div>
          )}

          {/* Premium Submit Button */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '18px',
              background: loading ? 
                'linear-gradient(135deg, #d1d5db 0%, #9ca3af 100%)' : 
                'linear-gradient(135deg, #8074c9 0%, #a855f7 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '15px',
              fontSize: '16px',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
              boxShadow: loading ? 
                '0 8px 20px rgba(0, 0, 0, 0.1)' : 
                '0 12px 30px rgba(128, 116, 201, 0.4)',
              position: 'relative',
              overflow: 'hidden',
              letterSpacing: '0.5px'
            }}
            onMouseEnter={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(-2px) scale(1.02)'
                e.target.style.boxShadow = '0 20px 50px rgba(128, 116, 201, 0.5)'
              }
            }}
            onMouseLeave={(e) => {
              if (!loading) {
                e.target.style.transform = 'translateY(0) scale(1)'
                e.target.style.boxShadow = '0 12px 30px rgba(128, 116, 201, 0.4)'
              }
            }}
          >
            {loading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                Signing in...
              </div>
            ) : (
              'Sign In to CareBridge'
            )}
            
            {/* Button Shimmer Effect */}
            {!loading && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: '-100%',
                width: '100%',
                height: '100%',
                background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                animation: 'buttonShimmer 3s ease-in-out infinite 2s',
                borderRadius: '15px'
              }} />
            )}
          </button>
        </form>

        {/* Elegant Demo Credentials */}
        <div style={{
          marginTop: '35px',
          padding: '25px',
          background: 'linear-gradient(135deg, rgba(128, 116, 201, 0.08) 0%, rgba(168, 85, 247, 0.05) 100%)',
          borderRadius: '20px',
          fontSize: '14px',
          border: '1px solid rgba(128, 116, 201, 0.15)',
          position: 'relative',
          zIndex: 2
        }}>
          <h3 style={{ 
            marginBottom: '20px', 
            color: '#374151',
            fontSize: '1.1rem',
            fontWeight: '700',
            textAlign: 'center'
          }}>
            Demo Credentials
          </h3>
          
          {[
            { role: 'Admin', email: 'admin@carebridge.com', password: 'admin123', icon: '⚙' },
            { role: 'Doctor', email: 'doctor@carebridge.com', password: 'doctor123', icon: '⚕' },
            { role: 'Patient', email: 'patient@carebridge.com', password: 'patient123', icon: '👤' }
          ].map((cred, index) => (
            <div key={cred.role} style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: index < 2 ? '15px' : '0',
              padding: '12px',
              background: 'rgba(255, 255, 255, 0.5)',
              borderRadius: '12px',
              transition: 'all 0.3s ease',
              cursor: 'pointer'
            }}
            onClick={() => {
              setEmail(cred.email)
              setPassword(cred.password)
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.8)'
              e.target.style.transform = 'translateX(5px)'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(255, 255, 255, 0.5)'
              e.target.style.transform = 'translateX(0)'
            }}
            >
              <span style={{ fontSize: '18px', marginRight: '12px' }}>{cred.icon}</span>
              <div>
                <div style={{ fontWeight: '600', color: '#374151' }}>{cred.role}</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>{cred.email}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Back to Home */}
        <div style={{ textAlign: 'center', marginTop: '25px', position: 'relative', zIndex: 2 }}>
          <a 
            href="/" 
            style={{
              color: '#8074c9',
              textDecoration: 'none',
              fontSize: '15px',
              fontWeight: '600',
              transition: 'all 0.3s ease',
              padding: '8px 16px',
              borderRadius: '20px',
              background: 'rgba(128, 116, 201, 0.1)',
              border: '1px solid rgba(128, 116, 201, 0.2)'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = 'rgba(128, 116, 201, 0.2)'
              e.target.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'rgba(128, 116, 201, 0.1)'
              e.target.style.transform = 'translateY(0)'
            }}
          >
            ← Back to Home
          </a>
        </div>
      </div>

      {/* World-Class CSS Animations */}
      <style jsx>{`
        @keyframes containerSlide {
          0% { opacity: 0; transform: translateY(50px) scale(0.95); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        
        @keyframes logoSpin {
          0%, 100% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.05); }
        }
        
        @keyframes backgroundDrift {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.1) rotate(2deg); }
        }
        
        @keyframes orbFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.3; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 0.6; }
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes buttonShimmer {
          0% { left: -100%; }
          100% { left: 100%; }
        }
        
        @keyframes errorShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  )
}

export default LoginPage
