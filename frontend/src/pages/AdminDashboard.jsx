import { useState, useEffect } from 'react'
import { useAuth } from '../services/AuthContext'

function AdminDashboard() {
  const { user, logout } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)

  const createUser = async (userData) => {
    setLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/auth/admin/create-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to create user')
      }

      const result = await response.json()
      alert(`User created successfully! User ID: ${result.user_id}`)
      return result
    } catch (error) {
      console.error('Create user error:', error)
      alert('Failed to create user: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateAdmin = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const adminData = {
      email: formData.get('email'),
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
      password: formData.get('password'),
      user_type: 'admin'
    }
    await createUser(adminData)
    e.target.reset()
  }

  const handleCreateDoctor = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const doctorData = {
      email: formData.get('email'),
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
      password: formData.get('password'),
      user_type: 'doctor',
      license_number: formData.get('license_number'),
      specialization: formData.get('specialization')
    }
    await createUser(doctorData)
    e.target.reset()
  }

  const handleCreatePatient = async (e) => {
    e.preventDefault()
    const formData = new FormData(e.target)
    const patientData = {
      email: formData.get('email'),
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name'),
      password: formData.get('password'),
      user_type: 'patient',
      phone: formData.get('phone'),
      emergency_contact: formData.get('emergency_contact'),
      emergency_phone: formData.get('emergency_phone'),
      doctor_id: 1 // Default doctor ID
    }
    await createUser(patientData)
    e.target.reset()
  }

  if (!user) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Loading...</h1>
        <p>Please wait while we load your admin dashboard.</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
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
              A
            </div>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#1e293b',
              margin: 0
            }}>
              CareBridge Admin
            </h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ color: '#1e293b', fontWeight: '500' }}>
                      Welcome, {user.user_name || user.name || 'Admin'}!
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
                        fontWeight: '500',
                        transition: 'background-color 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.background = '#b91c1c'}
                      onMouseLeave={(e) => e.target.style.background = '#dc2626'}
                    >
                      🚪 Logout
                    </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem 1rem'
      }}>
        <h2 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: '#1e293b',
          marginBottom: '2rem'
        }}>
          Admin Dashboard
        </h2>

        {/* Quick Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0284c7' }}>👥</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>0</div>
            <div style={{ color: '#64748b' }}>Total Users</div>
          </div>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#059669' }}>👨‍⚕️</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>0</div>
            <div style={{ color: '#64748b' }}>Doctors</div>
          </div>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626' }}>🏥</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>0</div>
            <div style={{ color: '#64748b' }}>Patients</div>
          </div>
          <div style={{
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            padding: '1.5rem',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#7c3aed' }}>👑</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1e293b' }}>1</div>
            <div style={{ color: '#64748b' }}>Admins</div>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
          gap: '2rem',
          marginBottom: '2rem'
        }}>
          {/* Create Admin Form */}
          <div style={{
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            padding: '2rem'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: '#1e293b',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center'
            }}>
              <span style={{ marginRight: '8px' }}>👑</span>
              Create Admin Account
            </h3>
            <form onSubmit={handleCreateAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                type="email"
                name="email"
                placeholder="Email"
                required
                style={{
                  padding: '12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <input
                type="text"
                name="first_name"
                placeholder="First Name"
                required
                style={{
                  padding: '12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <input
                type="text"
                name="last_name"
                placeholder="Last Name"
                required
                style={{
                  padding: '12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                required
                style={{
                  padding: '12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '12px',
                  background: loading ? '#94a3b8' : '#7c3aed',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Creating...' : 'Create Admin'}
              </button>
            </form>
          </div>

          {/* Create Doctor Form */}
          <div style={{
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            padding: '2rem'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: '#1e293b',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center'
            }}>
              <span style={{ marginRight: '8px' }}>👨‍⚕️</span>
              Create Doctor Account
            </h3>
            <form onSubmit={handleCreateDoctor} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                type="email"
                name="email"
                placeholder="Email"
                required
                style={{
                  padding: '12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <input
                type="text"
                name="first_name"
                placeholder="First Name"
                required
                style={{
                  padding: '12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <input
                type="text"
                name="last_name"
                placeholder="Last Name"
                required
                style={{
                  padding: '12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                required
                style={{
                  padding: '12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <input
                type="text"
                name="license_number"
                placeholder="License Number"
                required
                style={{
                  padding: '12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <input
                type="text"
                name="specialization"
                placeholder="Specialization"
                style={{
                  padding: '12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '12px',
                  background: loading ? '#94a3b8' : '#0284c7',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Creating...' : 'Create Doctor'}
              </button>
            </form>
          </div>

          {/* Create Patient Form */}
          <div style={{
            background: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            padding: '2rem'
          }}>
            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: '#1e293b',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center'
            }}>
              <span style={{ marginRight: '8px' }}>🏥</span>
              Create Patient Account
            </h3>
            <form onSubmit={handleCreatePatient} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <input
                type="email"
                name="email"
                placeholder="Email"
                required
                style={{
                  padding: '12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <input
                type="text"
                name="first_name"
                placeholder="First Name"
                required
                style={{
                  padding: '12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <input
                type="text"
                name="last_name"
                placeholder="Last Name"
                required
                style={{
                  padding: '12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <input
                type="password"
                name="password"
                placeholder="Password"
                required
                style={{
                  padding: '12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <input
                type="tel"
                name="phone"
                placeholder="Phone Number"
                style={{
                  padding: '12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <input
                type="text"
                name="emergency_contact"
                placeholder="Emergency Contact"
                style={{
                  padding: '12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <input
                type="tel"
                name="emergency_phone"
                placeholder="Emergency Phone"
                style={{
                  padding: '12px',
                  border: '1px solid #cbd5e1',
                  borderRadius: '8px',
                  fontSize: '14px'
                }}
              />
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '12px',
                  background: loading ? '#94a3b8' : '#dc2626',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Creating...' : 'Create Patient'}
              </button>
            </form>
          </div>
        </div>

        {/* System Status */}
        <div style={{
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          padding: '2rem'
        }}>
          <h3 style={{
            fontSize: '1.25rem',
            fontWeight: 'bold',
            color: '#1e293b',
            marginBottom: '1rem'
          }}>
            System Status
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0284c7' }}>✅</div>
              <div>Backend API</div>
              <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Running</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#059669' }}>✅</div>
              <div>Authentication</div>
              <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Active</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0284c7' }}>✅</div>
              <div>Database</div>
              <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Connected</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default AdminDashboard