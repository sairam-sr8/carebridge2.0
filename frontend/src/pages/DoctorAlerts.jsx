import React, { useState, useEffect } from 'react'
import API_CONFIG from '../config/api'

const DoctorAlerts = () => {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAlerts()
  }, [])

  const fetchAlerts = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/doctor/alerts`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setAlerts(data.alerts || [])
      }
    } catch (error) {
      console.error('Error fetching alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleResolveAlert = async (alertId) => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/doctor/alert/${alertId}/resolve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        alert('Alert resolved successfully!')
        fetchAlerts()
      }
    } catch (error) {
      console.error('Error resolving alert:', error)
    }
  }

  const handleAcknowledgeAlert = async (alertId) => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/doctor/alert/${alertId}/acknowledge`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        alert('Alert acknowledged successfully!')
        fetchAlerts()
      }
    } catch (error) {
      console.error('Error acknowledging alert:', error)
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 5: return '#e74c3c'
      case 4: return '#f39c12'
      case 3: return '#f1c40f'
      case 2: return '#27ae60'
      case 1: return '#3498db'
      default: return '#95a5a6'
    }
  }

  const getSeverityText = (severity) => {
    switch (severity) {
      case 5: return 'Critical'
      case 4: return 'High'
      case 3: return 'Medium'
      case 2: return 'Low'
      case 1: return 'Info'
      default: return 'Unknown'
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
        Patient Alerts
      </h1>

      {/* Alerts List */}
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
            Active Alerts ({alerts.length})
          </h2>
        </div>

        {alerts.length > 0 ? (
          <div>
            {alerts.map((alert) => (
              <div key={alert.id} style={{
                padding: '20px',
                borderBottom: '1px solid #eee',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '10px'
                  }}>
                    <h3 style={{
                      margin: 0,
                      fontSize: '18px',
                      color: '#333'
                    }}>
                      {alert.title}
                    </h3>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: getSeverityColor(alert.severity),
                      color: 'white'
                    }}>
                      {getSeverityText(alert.severity)}
                    </span>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: alert.alert_type === 'high_risk' ? '#e74c3c' : 
                                     alert.alert_type === 'crisis' ? '#8e44ad' : '#3498db',
                      color: 'white'
                    }}>
                      {alert.alert_type.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  
                  <p style={{
                    margin: '0 0 10px 0',
                    color: '#666',
                    fontSize: '14px'
                  }}>
                    <strong>Patient ID:</strong> {alert.patient_id}
                  </p>
                  
                  <p style={{
                    margin: '0 0 10px 0',
                    color: '#333',
                    fontSize: '14px'
                  }}>
                    {alert.message}
                  </p>
                  
                  <p style={{
                    margin: 0,
                    color: '#999',
                    fontSize: '12px'
                  }}>
                    Created: {new Date(alert.created_at).toLocaleString()}
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {!alert.is_acknowledged && (
                    <button
                      onClick={() => handleAcknowledgeAlert(alert.id)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#3498db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '14px',
                        cursor: 'pointer'
                      }}
                    >
                      Acknowledge
                    </button>
                  )}
                  
                  {alert.is_acknowledged && !alert.is_resolved && (
                    <button
                      onClick={() => handleResolveAlert(alert.id)}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#27ae60',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '14px',
                        cursor: 'pointer'
                      }}
                    >
                      Resolve
                    </button>
                  )}
                  
                  {alert.is_acknowledged && (
                    <span style={{
                      padding: '8px 16px',
                      backgroundColor: '#27ae60',
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '14px',
                      textAlign: 'center'
                    }}>
                      ✓ Acknowledged
                    </span>
                  )}

                  {alert.is_resolved && (
                    <span style={{
                      padding: '8px 16px',
                      backgroundColor: '#95a5a6',
                      color: 'white',
                      borderRadius: '4px',
                      fontSize: '14px',
                      textAlign: 'center'
                    }}>
                      ✓ Resolved
                    </span>
                  )}
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
              No active alerts
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default DoctorAlerts
