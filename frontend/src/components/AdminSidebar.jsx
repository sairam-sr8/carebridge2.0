import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../services/AuthContext'

const AdminSidebar = ({ activeTab, setActiveTab }) => {
  const { logout } = useAuth()
  const location = useLocation()

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', path: '/admin' },
    { id: 'users', label: 'User Management', path: '/admin/users' },
    { id: 'activity', label: 'Activity Monitor', path: '/admin/activity' }
  ]

  const handleLogout = () => {
    logout()
  }

  return (
    <div style={{
      width: '250px',
      background: '#2c3e50',
      color: 'white',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 0'
    }}>
      {/* Logo */}
      <div style={{
        textAlign: 'center',
        padding: '20px',
        borderBottom: '1px solid #34495e',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '10px' }}>
          <svg width="40" height="40" viewBox="0 0 100 100" style={{ marginRight: '10px' }}>
            <path d="M20 80 Q50 50 80 80" stroke="#3498db" strokeWidth="4" fill="none"/>
            <circle cx="30" cy="70" r="8" fill="#3498db"/>
            <circle cx="70" cy="70" r="8" fill="#3498db"/>
            <path d="M50 45 L50 25 M40 35 L60 35" stroke="#27ae60" strokeWidth="3" strokeLinecap="round"/>
          </svg>
          <h2 style={{ margin: 0, fontSize: '1.5rem' }}>CareBridge</h2>
        </div>
        <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', opacity: 0.8 }}>Admin Portal</p>
      </div>

      {/* Menu Items */}
      <nav style={{ padding: '0 20px', flex: '1' }}>
        {menuItems.map(item => (
          <Link
            key={item.id}
            to={item.path}
            onClick={() => setActiveTab(item.id)}
            style={{
              display: 'block',
              padding: '15px 20px',
              color: location.pathname === item.path ? '#3498db' : 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              marginBottom: '5px',
              transition: 'all 0.3s ease',
              backgroundColor: location.pathname === item.path ? 'rgba(52, 152, 219, 0.1)' : 'transparent'
            }}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Logout Button */}
      <div style={{
        marginTop: 'auto',
        padding: '20px'
      }}>
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '16px',
            fontWeight: '500',
            transition: 'background-color 0.3s ease'
          }}
        >
          Logout
        </button>
      </div>
    </div>
  )
}

export default AdminSidebar
