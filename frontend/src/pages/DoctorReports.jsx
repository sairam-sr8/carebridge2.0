import React, { useState, useEffect } from 'react'
import API_CONFIG from '../config/api'

const DoctorReports = () => {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [showAddNote, setShowAddNote] = useState(false)
  const [newNote, setNewNote] = useState({
    title: '',
    content: '',
    note_type: 'session'
  })

  useEffect(() => {
    fetchReports()
  }, [])

  const fetchReports = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/doctor/reports`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setReports(data.reports)
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddNote = async (e) => {
    e.preventDefault()
    if (!selectedPatient) return

    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/doctor/patient/${selectedPatient.id}/note`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newNote)
      })

      if (response.ok) {
        alert('Note added successfully!')
        setShowAddNote(false)
        setNewNote({ title: '', content: '', note_type: 'session' })
        fetchReports()
      }
    } catch (error) {
      console.error('Error adding note:', error)
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
        Patient Reports
      </h1>

      {/* Patient Reports */}
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
            Patient Reports ({reports.length})
          </h2>
        </div>

        {reports.length > 0 ? (
          <div>
            {reports.map((report) => (
              <div key={report.patient_id} style={{
                padding: '20px',
                borderBottom: '1px solid #eee'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '15px'
                }}>
                  <h3 style={{
                    margin: 0,
                    fontSize: '18px',
                    color: '#333'
                  }}>
                    {report.patient_name}
                  </h3>
                  <button
                    onClick={() => setSelectedPatient(report)}
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
                    Add Note
                  </button>
                </div>
                
                <p style={{
                  margin: '0 0 15px 0',
                  color: '#666',
                  fontSize: '14px'
                }}>
                  Email: {report.email}
                </p>

                {/* Notes */}
                <div>
                  <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>Notes ({report.notes.length})</h4>
                  {report.notes.length > 0 ? (
                    <div>
                      {report.notes.map((note) => (
                        <div key={note.id} style={{
                          padding: '15px',
                          background: '#f8f9fa',
                          borderRadius: '8px',
                          marginBottom: '10px'
                        }}>
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '8px'
                          }}>
                            <h5 style={{
                              margin: 0,
                              fontSize: '16px',
                              color: '#333'
                            }}>
                              {note.title}
                            </h5>
                            <span style={{
                              padding: '2px 6px',
                              borderRadius: '3px',
                              fontSize: '10px',
                              fontWeight: '500',
                              backgroundColor: note.note_type === 'session' ? '#3498db' : 
                                             note.note_type === 'observation' ? '#f39c12' : '#27ae60',
                              color: 'white'
                            }}>
                              {note.note_type.toUpperCase()}
                            </span>
                          </div>
                          <p style={{
                            margin: '0 0 8px 0',
                            color: '#666',
                            fontSize: '14px'
                          }}>
                            {note.content}
                          </p>
                          <p style={{
                            margin: 0,
                            color: '#999',
                            fontSize: '12px'
                          }}>
                            {new Date(note.created_at).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p style={{
                      margin: 0,
                      color: '#999',
                      fontStyle: 'italic'
                    }}>
                      No notes yet
                    </p>
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
              No patient reports available
            </p>
          </div>
        )}
      </div>

      {/* Add Note Modal */}
      {showAddNote && selectedPatient && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '30px',
            borderRadius: '10px',
            width: '90%',
            maxWidth: '500px',
            maxHeight: '80vh',
            overflow: 'auto'
          }}>
            <h2 style={{ marginBottom: '20px', color: '#333' }}>
              Add Note for {selectedPatient.patient_name}
            </h2>
            
            <form onSubmit={handleAddNote}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Title
                </label>
                <input
                  type="text"
                  value={newNote.title}
                  onChange={(e) => setNewNote({...newNote, title: e.target.value})}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '16px'
                  }}
                />
              </div>
              
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Note Type
                </label>
                <select
                  value={newNote.note_type}
                  onChange={(e) => setNewNote({...newNote, note_type: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '16px'
                  }}
                >
                  <option value="session">Session Note</option>
                  <option value="observation">Observation</option>
                  <option value="conversation_summary">Conversation Summary</option>
                </select>
              </div>
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Content
                </label>
                <textarea
                  value={newNote.content}
                  onChange={(e) => setNewNote({...newNote, content: e.target.value})}
                  required
                  rows="5"
                  style={{
                    width: '100%',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '16px',
                    resize: 'vertical'
                  }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  type="submit"
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#27ae60',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Add Note
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddNote(false)}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: '#95a5a6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default DoctorReports