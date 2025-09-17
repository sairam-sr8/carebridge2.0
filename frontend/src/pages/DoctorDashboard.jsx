import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import API_CONFIG from '../config/api'

const DoctorDashboard = () => {
  const [stats, setStats] = useState(null)
  const [recentInteractions, setRecentInteractions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/doctor/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data.stats)
        setRecentInteractions(data.recent_interactions)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px'
      }}>
        Loading...
      </div>
    )
  }

  return (
    <div style={{ padding: '30px' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '30px', color: '#333' }}>
        Doctor Dashboard
      </h1>

      {/* Stats Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '20px',
        marginBottom: '40px'
      }}>
        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ fontSize: '2rem', margin: '0 0 10px 0', color: '#3498db' }}>
            {stats?.total_patients || 0}
          </h3>
          <p style={{ margin: 0, color: '#666' }}>Assigned Patients</p>
        </div>

        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ fontSize: '2rem', margin: '0 0 10px 0', color: '#e74c3c' }}>
            {stats?.active_alerts || 0}
          </h3>
          <p style={{ margin: 0, color: '#666' }}>Active Alerts</p>
        </div>

        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ fontSize: '2rem', margin: '0 0 10px 0', color: '#27ae60' }}>
            {stats?.avg_mood_score || 0}
          </h3>
          <p style={{ margin: 0, color: '#666' }}>Average Mood Score</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{
        background: 'white',
        padding: '25px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginBottom: '30px'
      }}>
        <h2 style={{ marginBottom: '20px', color: '#333' }}>Quick Actions</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px'
        }}>
          <Link
            to="/doctor/patients"
            style={{
              padding: '15px',
              backgroundColor: '#3498db',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              textAlign: 'center',
              fontWeight: '500',
              transition: 'background-color 0.3s ease'
            }}
          >
            View Patients
          </Link>
          <Link
            to="/doctor/triage"
            style={{
              padding: '15px',
              backgroundColor: '#f39c12',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              textAlign: 'center',
              fontWeight: '500',
              transition: 'background-color 0.3s ease'
            }}
          >
            Triage Dashboard
          </Link>
          <Link
            to="/doctor/alerts"
            style={{
              padding: '15px',
              backgroundColor: '#e74c3c',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              textAlign: 'center',
              fontWeight: '500',
              transition: 'background-color 0.3s ease'
            }}
          >
            View Alerts
          </Link>
          <Link
            to="/doctor/reports"
            style={{
              padding: '15px',
              backgroundColor: '#27ae60',
              color: 'white',
              textDecoration: 'none',
              borderRadius: '8px',
              textAlign: 'center',
              fontWeight: '500',
              transition: 'background-color 0.3s ease'
            }}
          >
            Patient Reports
          </Link>
        </div>
      </div>

      {/* Recent Interactions */}
      <div style={{
        background: 'white',
        padding: '25px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ marginBottom: '20px', color: '#333' }}>Recent Patient Interactions</h2>
        {recentInteractions.length > 0 ? (
          <div>
            {recentInteractions.map((interaction, index) => (
              <div key={index} style={{
                padding: '15px',
                borderBottom: '1px solid #eee',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <p style={{ margin: '0 0 5px 0', fontWeight: '500' }}>
                    {interaction.speaker === 'patient' ? 'Patient' : 'AI'} Interaction
                  </p>
                  <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                    {interaction.content}
                  </p>
                </div>
                <div style={{ textAlign: 'right', fontSize: '12px', color: '#999' }}>
                  {new Date(interaction.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
            No recent interactions
          </p>
        )}
      </div>
    </div>
  )
}

export default DoctorDashboard
