import React, { useState, useEffect } from 'react'
import API_CONFIG from '../config/api'

const AdminActivityMonitor = () => {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [timeRange, setTimeRange] = useState('24h')

  useEffect(() => {
    fetchActivities()
  }, [filter, timeRange])

  const fetchActivities = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/admin/activities?filter=${filter}&timeRange=${timeRange}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setActivities(data.activities)
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
    } finally {
      setLoading(false)
    }
  }

  const getActivityIcon = (type) => {
    switch (type) {
      case 'user_login':
        return '🔐'
      case 'ai_interaction':
        return '🤖'
      case 'doctor_assignment':
        return '👨‍⚕️'
      case 'alert_created':
        return '⚠️'
      case 'appointment_scheduled':
        return '📅'
      default:
        return '📝'
    }
  }

  const getActivityColor = (type) => {
    switch (type) {
      case 'user_login':
        return '#3498db'
      case 'ai_interaction':
        return '#9b59b6'
      case 'doctor_assignment':
        return '#27ae60'
      case 'alert_created':
        return '#e74c3c'
      case 'appointment_scheduled':
        return '#f39c12'
      default:
        return '#95a5a6'
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
        Activity Monitor
      </h1>

      {/* Filters */}
      <div style={{
        background: 'white',
        padding: '20px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginBottom: '30px'
      }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '15px'
        }}>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              Filter Type
            </label>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '16px'
              }}
            >
              <option value="all">All Activities</option>
              <option value="user_login">User Logins</option>
              <option value="ai_interaction">AI Interactions</option>
              <option value="doctor_assignment">Doctor Assignments</option>
              <option value="alert_created">Alerts</option>
              <option value="appointment_scheduled">Appointments</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              Time Range
            </label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '16px'
              }}
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Activities List */}
      <div style={{
        background: 'white',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #eee',
          background: '#f8f9fa'
        }}>
          <h2 style={{ margin: 0, color: '#333' }}>
            System Activities ({activities.length})
          </h2>
        </div>

        {activities.length > 0 ? (
          <div>
            {activities.map((activity, index) => (
              <div key={activity.id} style={{
                padding: '20px',
                borderBottom: '1px solid #eee',
                display: 'flex',
                alignItems: 'center',
                gap: '15px'
              }}>
                <div style={{
                  fontSize: '24px',
                  width: '40px',
                  textAlign: 'center'
                }}>
                  {getActivityIcon(activity.type)}
                </div>
                
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '5px'
                  }}>
                    <h3 style={{
                      margin: 0,
                      fontSize: '16px',
                      color: getActivityColor(activity.type)
                    }}>
                      {activity.type.replace('_', ' ').toUpperCase()}
                    </h3>
                    <span style={{
                      fontSize: '12px',
                      color: '#999'
                    }}>
                      {new Date(activity.timestamp).toLocaleString()}
                    </span>
                  </div>
                  
                  <p style={{
                    margin: '0 0 5px 0',
                    color: '#666',
                    fontSize: '14px'
                  }}>
                    <strong>User:</strong> {activity.user}
                  </p>
                  
                  <p style={{
                    margin: 0,
                    color: '#333',
                    fontSize: '14px'
                  }}>
                    {activity.details}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#666'
          }}>
            <p style={{ margin: 0, fontSize: '18px' }}>
              No activities found for the selected filters
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminActivityMonitor