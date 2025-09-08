import { Link } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'

function SimpleHomePage() {
  const { user, logout } = useAuth()
  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f0f9ff 0%, #f1f5f9 100%)',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <header style={{ 
        background: 'white', 
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        padding: '1rem 0'
      }}>
        <div style={{ 
          maxWidth: '1200px', 
          margin: '0 auto', 
          padding: '0 1rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              width: '32px',
              height: '32px',
              background: '#0284c7',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              marginRight: '8px'
            }}>
              C
            </div>
            <h1 style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              color: '#1e293b',
              margin: 0
            }}>
              CareBridge
            </h1>
          </div>
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span style={{ color: '#1e293b', fontWeight: '500' }}>
                Welcome, {user.name || user.email}!
              </span>
              <button
                onClick={logout}
                style={{
                  background: '#dc2626',
                  color: 'white',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontWeight: '500'
                }}
              >
                Logout
              </button>
            </div>
          ) : (
            <Link 
              to="/login" 
              style={{
                background: '#0284c7',
                color: 'white',
                padding: '8px 16px',
                borderRadius: '8px',
                textDecoration: 'none',
                fontWeight: '500'
              }}
            >
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main style={{ 
        maxWidth: '1200px', 
        margin: '0 auto', 
        padding: '3rem 1rem',
        textAlign: 'center'
      }}>
        <h1 style={{ 
          fontSize: '3rem', 
          fontWeight: 'bold', 
          color: '#1e293b',
          marginBottom: '1.5rem'
        }}>
          {user ? `Welcome to CareBridge, ${user.name || user.email}!` : 'CareBridge Demo Running'}
        </h1>
        <p style={{ 
          fontSize: '1.25rem', 
          color: '#475569',
          marginBottom: '2rem',
          maxWidth: '800px',
          margin: '0 auto 2rem auto'
        }}>
          A comprehensive mental health triage platform connecting patients, doctors, and administrators 
          with AI-powered insights and crisis management.
        </p>
        
        <div style={{ 
          display: 'flex', 
          gap: '1rem', 
          justifyContent: 'center',
          flexWrap: 'wrap',
          marginBottom: '3rem'
        }}>
          <Link 
            to="/login" 
            style={{
              background: '#0284c7',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '500',
              fontSize: '1.125rem'
            }}
          >
            Get Started
          </Link>
          <Link 
            to="/test" 
            style={{
              background: '#e2e8f0',
              color: '#1e293b',
              padding: '12px 24px',
              borderRadius: '8px',
              textDecoration: 'none',
              fontWeight: '500',
              fontSize: '1.125rem'
            }}
          >
            Test API
          </Link>
        </div>

        {/* Features Grid */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem',
          marginTop: '3rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            padding: '2rem',
            textAlign: 'center'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: '#0284c7',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto',
              fontSize: '1.5rem'
            }}>
              👥
            </div>
            <h3 style={{ 
              fontSize: '1.25rem', 
              fontWeight: '600', 
              color: '#1e293b',
              marginBottom: '0.5rem'
            }}>
              For Patients
            </h3>
            <p style={{ color: '#475569' }}>
              AI companion chat, journaling, and personalized mental health support.
            </p>
          </div>
          
          <div style={{
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            padding: '2rem',
            textAlign: 'center'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: '#0284c7',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto',
              fontSize: '1.5rem'
            }}>
              🧠
            </div>
            <h3 style={{ 
              fontSize: '1.25rem', 
              fontWeight: '600', 
              color: '#1e293b',
              marginBottom: '0.5rem'
            }}>
              For Doctors
            </h3>
            <p style={{ color: '#475569' }}>
              Dashboard with patient summaries, notes, and AI-powered alerts.
            </p>
          </div>
          
          <div style={{
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            padding: '2rem',
            textAlign: 'center'
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              background: '#0284c7',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem auto',
              fontSize: '1.5rem'
            }}>
              🛡️
            </div>
            <h3 style={{ 
              fontSize: '1.25rem', 
              fontWeight: '600', 
              color: '#1e293b',
              marginBottom: '0.5rem'
            }}>
              For Admins
            </h3>
            <p style={{ color: '#475569' }}>
              Oversight, compliance monitoring, and crisis coordination tools.
            </p>
          </div>
        </div>

        {/* Quick Access Section */}
        <div style={{
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          padding: '2rem',
          marginTop: '3rem'
        }}>
          <h2 style={{ 
            fontSize: '1.5rem', 
            fontWeight: 'bold', 
            color: '#1e293b',
            marginBottom: '1.5rem',
            textAlign: 'center'
          }}>
            Quick Access
          </h2>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1rem'
          }}>
            <Link 
              to="/login" 
              style={{
                padding: '1rem',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                textDecoration: 'none',
                color: '#1e293b',
                textAlign: 'center',
                background: '#f8fafc'
              }}
            >
              <h3 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Patient Portal</h3>
              <p style={{ fontSize: '0.875rem', color: '#475569', margin: 0 }}>
                Access your mental health dashboard
              </p>
            </Link>
            <Link 
              to="/admin" 
              style={{
                padding: '1rem',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                textDecoration: 'none',
                color: '#1e293b',
                textAlign: 'center',
                background: '#f8fafc'
              }}
            >
              <h3 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>Admin Console</h3>
              <p style={{ fontSize: '0.875rem', color: '#475569', margin: 0 }}>
                System overview and user management
              </p>
            </Link>
            <Link 
              to="/test" 
              style={{
                padding: '1rem',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                textDecoration: 'none',
                color: '#1e293b',
                textAlign: 'center',
                background: '#f8fafc'
              }}
            >
              <h3 style={{ fontWeight: '600', marginBottom: '0.5rem' }}>API Test</h3>
              <p style={{ fontSize: '0.875rem', color: '#475569', margin: 0 }}>
                Test backend API connection
              </p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  )
}

export default SimpleHomePage
