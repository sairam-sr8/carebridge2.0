import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'
import { 
  LayoutDashboard, 
  Users, 
  AlertTriangle, 
  BarChart3, 
  Settings,
  Heart,
  LogOut
} from 'lucide-react'

function DoctorSidebar() {
  const location = useLocation()
  const { logout } = useAuth()
  
  const menuItems = [
    { path: '/doctor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/doctor/patients', label: 'Patients', icon: Users },
    { path: '/doctor/alerts', label: 'Alerts', icon: AlertTriangle },
    { path: '/doctor/reports', label: 'Reports', icon: BarChart3 },
    { path: '/doctor/settings', label: 'Settings', icon: Settings },
  ]

  return (
    <div style={{
      width: '256px',
      background: 'white',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      height: '100vh',
      display: 'flex',
      flexDirection: 'column'
    }}>
      {/* Logo */}
      <div style={{ padding: '24px', borderBottom: '1px solid #e2e8f0' }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
          <Heart style={{ height: '32px', width: '32px', color: '#0284c7' }} />
          <span style={{ marginLeft: '8px', fontSize: '20px', fontWeight: 'bold', color: '#1e293b' }}>CareBridge</span>
        </Link>
        <p style={{ fontSize: '14px', color: '#475569', marginTop: '4px' }}>Doctor Portal</p>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '16px' }}>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path
            
            return (
              <li key={item.path} style={{ marginBottom: '8px' }}>
                <Link
                  to={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    transition: 'all 0.2s',
                    background: isActive ? '#eff6ff' : 'transparent',
                    color: isActive ? '#1d4ed8' : '#475569',
                    borderRight: isActive ? '2px solid #1d4ed8' : 'none'
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.target.style.background = '#f8fafc'
                      e.target.style.color = '#1e293b'
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.target.style.background = 'transparent'
                      e.target.style.color = '#475569'
                    }
                  }}
                >
                  <Icon style={{ height: '20px', width: '20px', marginRight: '12px' }} />
                  {item.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User Info */}
      <div style={{ padding: '16px', borderTop: '1px solid #e2e8f0' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: '#dbeafe',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{ color: '#1d4ed8', fontWeight: '600', fontSize: '14px' }}>DR</span>
          </div>
          <div style={{ marginLeft: '12px', flex: 1 }}>
            <p style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b', margin: 0 }}>Dr. Smith</p>
            <p style={{ fontSize: '12px', color: '#475569', margin: 0 }}>Psychiatrist</p>
          </div>
        </div>
        
        {/* Logout Button */}
        <button
          onClick={logout}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px',
            marginTop: '8px',
            background: '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            transition: 'background-color 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.background = '#b91c1c'}
          onMouseLeave={(e) => e.target.style.background = '#dc2626'}
        >
          <LogOut style={{ height: '16px', width: '16px', marginRight: '8px' }} />
          Logout
        </button>
      </div>
    </div>
  )
}

export default DoctorSidebar
