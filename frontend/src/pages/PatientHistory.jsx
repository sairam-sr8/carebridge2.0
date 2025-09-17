import React, { useState, useEffect } from 'react'
import API_CONFIG from '../config/api'

const PatientHistory = () => {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/patient/history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setHistory(data.history)
      }
    } catch (error) {
      console.error('Error fetching history:', error)
    } finally {
      setLoading(false)
    }
  }

  const getInteractionIcon = (type, speaker) => {
    if (type === 'journal') return '📝'
    if (type === 'triage') return '🔍'
    if (speaker === 'ai') return '🤖'
    if (speaker === 'patient') return '👤'
    return '💬'
  }

  const getInteractionColor = (type, speaker) => {
    if (type === 'journal') return '#f39c12'
    if (type === 'triage') return '#9b59b6'
    if (speaker === 'ai') return '#3498db'
    if (speaker === 'patient') return '#27ae60'
    return '#95a5a6'
  }

  const getMoodEmoji = (mood) => {
    switch (mood) {
      case 'low': return '😔'
      case 'neutral': return '😐'
      case 'anxious': return '😰'
      case 'irritable': return '😠'
      case 'positive': return '😊'
      default: return '😐'
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
        History
      </h1>

      {/* History Timeline */}
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
            Activity History ({history.length})
          </h2>
        </div>

        {history.length > 0 ? (
          <div style={{ padding: '20px' }}>
            {history.map((entry, index) => (
              <div key={entry.id} style={{
                display: 'flex',
                gap: '15px',
                marginBottom: '20px',
                position: 'relative'
              }}>
                {/* Timeline line */}
                {index < history.length - 1 && (
                  <div style={{
                    position: 'absolute',
                    left: '20px',
                    top: '40px',
                    bottom: '-20px',
                    width: '2px',
                    backgroundColor: '#e0e0e0'
                  }} />
                )}
                
                {/* Icon */}
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: getInteractionColor(entry.type, entry.speaker),
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  flexShrink: 0,
                  zIndex: 1
                }}>
                  {getInteractionIcon(entry.type, entry.speaker)}
                </div>
                
                {/* Content */}
                <div style={{ flex: 1 }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '8px'
                  }}>
                    <h3 style={{
                      margin: 0,
                      fontSize: '16px',
                      color: '#333'
                    }}>
                      {entry.type === 'journal' ? 'Journal Entry' :
                       entry.type === 'triage' ? 'Triage Assessment' :
                       entry.speaker === 'ai' ? 'AI Buddy Response' :
                       'Your Message'}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {entry.mood && (
                        <span style={{ fontSize: '18px' }}>
                          {getMoodEmoji(entry.mood)}
                        </span>
                      )}
                      <span style={{
                        fontSize: '12px',
                        color: '#999'
                      }}>
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  <div style={{
                    background: '#f8f9fa',
                    padding: '15px',
                    borderRadius: '8px',
                    marginBottom: '10px'
                  }}>
                    <p style={{
                      margin: 0,
                      color: '#333',
                      fontSize: '14px',
                      lineHeight: '1.6',
                      whiteSpace: 'pre-wrap'
                    }}>
                      {entry.content}
                    </p>
                  </div>
                  
                  <div style={{
                    display: 'flex',
                    gap: '10px',
                    alignItems: 'center'
                  }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: '500',
                      backgroundColor: entry.type === 'journal' ? '#f39c12' :
                                     entry.type === 'triage' ? '#9b59b6' :
                                     entry.speaker === 'ai' ? '#3498db' : '#27ae60',
                      color: 'white'
                    }}>
                      {entry.type.toUpperCase()}
                    </span>
                    
                    {entry.mood && (
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: '500',
                        backgroundColor: '#e8f4fd',
                        color: '#2980b9'
                      }}>
                        {entry.mood.toUpperCase()}
                      </span>
                    )}
                  </div>
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
              No history available yet. Start using the app to see your activity here!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default PatientHistory