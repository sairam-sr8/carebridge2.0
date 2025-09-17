import React, { useState, useEffect } from 'react'
import API_CONFIG from '../config/api'

const AdminDashboard = () => {
  const [stats, setStats] = useState(null)
  const [recentActivity, setRecentActivity] = useState([])
  const [triageAssessments, setTriageAssessments] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedAssessment, setSelectedAssessment] = useState(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('access_token')
      
      // Fetch dashboard stats
      const dashboardResponse = await fetch(`${API_CONFIG.BASE_URL}/api/v1/admin/dashboard`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (dashboardResponse.ok) {
        const data = await dashboardResponse.json()
        setStats(data.stats)
        setRecentActivity(data.recent_activity)
      }

      // Fetch triage assessments
      const triageResponse = await fetch(`${API_CONFIG.BASE_URL}/api/v1/triage/admin/assessments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (triageResponse.ok) {
        const triageData = await triageResponse.json()
        setTriageAssessments(triageData.assessments)
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const viewAssessmentDetails = (assessment) => {
    setSelectedAssessment(assessment)
    setShowDetailsModal(true)
  }

  const closeDetailsModal = () => {
    setShowDetailsModal(false)
    setSelectedAssessment(null)
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
        Admin Dashboard
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
            {stats?.total_doctors || 0}
          </h3>
          <p style={{ margin: 0, color: '#666' }}>Total Doctors</p>
        </div>

        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ fontSize: '2rem', margin: '0 0 10px 0', color: '#27ae60' }}>
            {stats?.total_patients || 0}
          </h3>
          <p style={{ margin: 0, color: '#666' }}>Total Patients</p>
        </div>

        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h3 style={{ fontSize: '2rem', margin: '0 0 10px 0', color: '#f39c12' }}>
            {stats?.total_interactions || 0}
          </h3>
          <p style={{ margin: 0, color: '#666' }}>Total Interactions</p>
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
          <h3 style={{ fontSize: '2rem', margin: '0 0 10px 0', color: '#8074c9' }}>
            {triageAssessments.length}
          </h3>
          <p style={{ margin: 0, color: '#666' }}>Triage Assessments</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div style={{
        background: 'white',
        padding: '25px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ marginBottom: '20px', color: '#333' }}>Recent Activity</h2>
        {recentActivity.length > 0 ? (
          <div>
            {recentActivity.map((activity, index) => (
              <div key={index} style={{
                padding: '15px',
                borderBottom: '1px solid #eee',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <p style={{ margin: '0 0 5px 0', fontWeight: '500' }}>
                    {activity.speaker === 'patient' ? 'Patient' : 'AI'} Interaction
                  </p>
                  <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                    {activity.content}
                  </p>
                </div>
                <div style={{ textAlign: 'right', fontSize: '12px', color: '#999' }}>
                  {new Date(activity.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
            No recent activity
          </p>
        )}
      </div>

      {/* Triage Assessments */}
      <div style={{
        background: 'white',
        padding: '25px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginTop: '30px'
      }}>
        <h2 style={{ marginBottom: '20px', color: '#333' }}>Recent Triage Assessments</h2>
        {triageAssessments.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Patient</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Email</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Severity</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Risk Score</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Date</th>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {triageAssessments.slice(0, 10).map((assessment) => (
                  <tr key={assessment.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px' }}>{assessment.patient_name}</td>
                    <td style={{ padding: '12px' }}>{assessment.patient_email}</td>
                    <td style={{ padding: '12px' }}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500',
                        background: assessment.severity_level === 'high' ? '#ffebee' : 
                                   assessment.severity_level === 'medium' ? '#fff3e0' : '#e8f5e8',
                        color: assessment.severity_level === 'high' ? '#c62828' : 
                               assessment.severity_level === 'medium' ? '#ef6c00' : '#2e7d32'
                      }}>
                        {assessment.severity_level.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>{assessment.risk_score}</td>
                    <td style={{ padding: '12px' }}>{new Date(assessment.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '12px' }}>
                      <button 
                        onClick={() => viewAssessmentDetails(assessment)}
                        style={{
                          background: '#8074c9',
                          color: 'white',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          transition: 'background-color 0.3s ease'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#6c5ce7'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#8074c9'}
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
            No triage assessments yet
          </p>
        )}
      </div>

      {/* Assessment Details Modal */}
      {showDetailsModal && selectedAssessment && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '10px',
            padding: '30px',
            maxWidth: '600px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{ margin: 0, color: '#333' }}>Assessment Details</h2>
              <button
                onClick={closeDetailsModal}
                style={{
                  background: '#e74c3c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ lineHeight: '1.6' }}>
              <div style={{ marginBottom: '15px' }}>
                <strong>Patient:</strong> {selectedAssessment.patient_name}
              </div>
              <div style={{ marginBottom: '15px' }}>
                <strong>Email:</strong> {selectedAssessment.patient_email}
              </div>
              <div style={{ marginBottom: '15px' }}>
                <strong>Date:</strong> {new Date(selectedAssessment.created_at).toLocaleString()}
              </div>
              <div style={{ marginBottom: '15px' }}>
                <strong>Risk Score:</strong> {selectedAssessment.risk_score}
              </div>
              <div style={{ marginBottom: '15px' }}>
                <strong>Severity Level:</strong> 
                <span style={{
                  marginLeft: '10px',
                  padding: '4px 8px',
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '500',
                  background: selectedAssessment.severity_level === 'high' ? '#ffebee' : 
                             selectedAssessment.severity_level === 'medium' ? '#fff3e0' : '#e8f5e8',
                  color: selectedAssessment.severity_level === 'high' ? '#c62828' : 
                         selectedAssessment.severity_level === 'medium' ? '#ef6c00' : '#2e7d32'
                }}>
                  {selectedAssessment.severity_level.toUpperCase()}
                </span>
              </div>
              
              {selectedAssessment.recommendations && (
                <div style={{ marginBottom: '15px' }}>
                  <strong>AI Recommendations:</strong>
                  <div style={{
                    marginTop: '10px',
                    padding: '15px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    border: '1px solid #e9ecef'
                  }}>
                    {selectedAssessment.recommendations}
                  </div>
                </div>
              )}
              
              {selectedAssessment.ai_analysis && (
                <div style={{ marginBottom: '15px' }}>
                  <strong>AI Analysis:</strong>
                  <div style={{
                    marginTop: '10px',
                    padding: '15px',
                    backgroundColor: '#f0f8ff',
                    borderRadius: '8px',
                    border: '1px solid #b3d9ff'
                  }}>
                    {typeof selectedAssessment.ai_analysis === 'string' 
                      ? selectedAssessment.ai_analysis 
                      : JSON.stringify(selectedAssessment.ai_analysis, null, 2)
                    }
                  </div>
                </div>
              )}
            </div>

            <div style={{ textAlign: 'center', marginTop: '20px' }}>
              <button
                onClick={closeDetailsModal}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '16px'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
