import React, { useState, useEffect } from 'react'
import API_CONFIG from '../config/api'

const DoctorTriageDashboard = () => {
  const [triageItems, setTriageItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [showAssessment, setShowAssessment] = useState(false)

  useEffect(() => {
    fetchTriageItems()
  }, [])

  const fetchTriageItems = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/doctor/triage`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setTriageItems(data.triage_items)
      }
    } catch (error) {
      console.error('Error fetching triage items:', error)
    } finally {
      setLoading(false)
    }
  }

  const viewPatientAssessment = async (triageItem) => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/triage/assessment/${triageItem.assessment_id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSelectedPatient({ ...triageItem, assessment: data })
        setShowAssessment(true)
      }
    } catch (error) {
      console.error('Error fetching assessment details:', error)
    }
  }

  const handleAcceptAppointment = async (appointmentId) => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/doctor/appointment/${appointmentId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        alert('Appointment accepted successfully!')
        fetchTriageItems()
      }
    } catch (error) {
      console.error('Error accepting appointment:', error)
    }
  }

  const handleRescheduleAppointment = async (appointmentId) => {
    const newDate = prompt('Enter new appointment date (YYYY-MM-DD):')
    if (newDate) {
      try {
        const token = localStorage.getItem('access_token')
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/doctor/appointment/${appointmentId}/reschedule`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ new_date: newDate })
        })

        if (response.ok) {
          alert('Appointment rescheduled successfully!')
          fetchTriageItems()
        }
      } catch (error) {
        console.error('Error rescheduling appointment:', error)
      }
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
        Triage Dashboard
      </h1>

      {/* Triage Items */}
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
            Assigned Triage Items ({triageItems.length})
          </h2>
        </div>

        {triageItems.length > 0 ? (
          <div>
            {triageItems.map((item) => (
              <div key={item.id} style={{
                padding: '20px',
                borderBottom: '1px solid #eee',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
              }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    margin: '0 0 5px 0',
                    fontSize: '18px',
                    color: '#333'
                  }}>
                    {item.patient_name}
                  </h3>
                  <p style={{
                    margin: '0 0 5px 0',
                    color: '#666',
                    fontSize: '14px'
                  }}>
                    {item.patient_email}
                  </p>
                  <div style={{ display: 'flex', gap: '15px', marginBottom: '10px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: item.priority === 'urgent' ? '#e74c3c' : 
                                     item.priority === 'high' ? '#f39c12' : 
                                     item.priority === 'medium' ? '#f1c40f' : '#27ae60',
                      color: 'white'
                    }}>
                      {item.priority.toUpperCase()}
                    </span>
                    
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: item.severity_level === 'high' ? '#e74c3c' : 
                                     item.severity_level === 'medium' ? '#f39c12' : '#27ae60',
                      color: 'white'
                    }}>
                      {item.severity_level.toUpperCase()} RISK
                    </span>

                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: '500',
                      backgroundColor: item.status === 'assigned' ? '#3498db' : 
                                     item.status === 'resolved' ? '#27ae60' : '#95a5a6',
                      color: 'white'
                    }}>
                      {item.status.toUpperCase()}
                    </span>
                  </div>
                  
                  <p style={{
                    margin: '0 0 5px 0',
                    color: '#666',
                    fontSize: '12px'
                  }}>
                    Risk Score: {item.risk_score || 'N/A'} | Created: {new Date(item.created_at).toLocaleString()}
                  </p>
                </div>

                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <button
                    onClick={() => viewPatientAssessment(item)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#3498db',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    View Assessment
                  </button>
                  
                  <button
                    onClick={() => handleAcceptAppointment(item.id)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#27ae60',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Accept
                  </button>
                  
                  <button
                    onClick={() => handleRescheduleAppointment(item.id)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#f39c12',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer'
                    }}
                  >
                    Reschedule
                  </button>
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
              No triage items assigned to you
            </p>
          </div>
        )}
      </div>

      {/* Assessment Details Modal */}
      {showAssessment && selectedPatient && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '10px',
            padding: '30px',
            maxWidth: '800px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{ margin: 0, color: '#333' }}>
                Assessment Details - {selectedPatient.patient_name}
              </h2>
              <button
                onClick={() => setShowAssessment(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#999'
                }}
              >
                ×
              </button>
            </div>

            {selectedPatient.assessment && (
              <div>
                {/* Patient Info */}
                <div style={{
                  background: '#f8f9fa',
                  padding: '15px',
                  borderRadius: '8px',
                  marginBottom: '20px'
                }}>
                  <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Patient Information</h3>
                  <p style={{ margin: '5px 0', color: '#666' }}>
                    <strong>Name:</strong> {selectedPatient.patient_name}
                  </p>
                  <p style={{ margin: '5px 0', color: '#666' }}>
                    <strong>Email:</strong> {selectedPatient.patient_email}
                  </p>
                  <p style={{ margin: '5px 0', color: '#666' }}>
                    <strong>Risk Score:</strong> {selectedPatient.assessment.risk_score || 'N/A'}
                  </p>
                  <p style={{ margin: '5px 0', color: '#666' }}>
                    <strong>Severity Level:</strong> {selectedPatient.assessment.severity_level || 'N/A'}
                  </p>
                </div>

                {/* Assessment Summary */}
                {selectedPatient.assessment.summary_text && (
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Assessment Summary</h3>
                    <div style={{
                      background: '#e8f4fd',
                      padding: '15px',
                      borderRadius: '8px',
                      borderLeft: '4px solid #3498db'
                    }}>
                      <p style={{ margin: 0, color: '#333', lineHeight: '1.6' }}>
                        {selectedPatient.assessment.summary_text}
                      </p>
                    </div>
                  </div>
                )}

                {/* AI Insights */}
                {selectedPatient.assessment.ai_insights && (
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>AI Analysis</h3>
                    <div style={{
                      background: '#f0f8f0',
                      padding: '15px',
                      borderRadius: '8px',
                      borderLeft: '4px solid #27ae60'
                    }}>
                      <p style={{ margin: 0, color: '#333', lineHeight: '1.6' }}>
                        {selectedPatient.assessment.ai_insights}
                      </p>
                    </div>
                  </div>
                )}

                {/* Interpretations */}
                {selectedPatient.assessment.interpretations && (
                  <div style={{ marginBottom: '20px' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Mental Health Indicators</h3>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '10px'
                    }}>
                      {Object.entries(selectedPatient.assessment.interpretations).map(([category, level]) => (
                        <div key={category} style={{
                          background: level === 'Severe' || level === 'High' ? '#ffeaea' : 
                                     level === 'Moderate' || level === 'Mild' ? '#fff3cd' : '#e8f5e8',
                          padding: '10px',
                          borderRadius: '6px',
                          textAlign: 'center'
                        }}>
                          <strong style={{ color: '#333' }}>{category}</strong>
                          <br />
                          <span style={{
                            color: level === 'Severe' || level === 'High' ? '#e74c3c' : 
                                   level === 'Moderate' || level === 'Mild' ? '#f39c12' : '#27ae60',
                            fontWeight: '500'
                          }}>
                            {level}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div style={{
                  display: 'flex',
                  gap: '10px',
                  marginTop: '20px'
                }}>
                  <button
                    onClick={() => setShowAssessment(false)}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#95a5a6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer'
                    }}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default DoctorTriageDashboard