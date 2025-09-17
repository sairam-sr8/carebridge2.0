import React, { useState, useEffect } from 'react'
import API_CONFIG from '../config/api'

const DoctorPatients = () => {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [showProfile, setShowProfile] = useState(false)
  const [patientNotes, setPatientNotes] = useState([])
  const [patientAssessments, setPatientAssessments] = useState([])
  const [showAddNote, setShowAddNote] = useState(false)
  const [showAddPrompt, setShowAddPrompt] = useState(false)
  const [newNote, setNewNote] = useState({ title: '', content: '', note_type: 'session' })
  const [newPrompt, setNewPrompt] = useState({ title: '', content: '' })

  useEffect(() => {
    fetchPatients()
  }, [])

  const fetchPatients = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/doctor/patients`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setPatients(data.patients || [])
      }
    } catch (error) {
      console.error('Error fetching patients:', error)
    } finally {
      setLoading(false)
    }
  }

  const viewPatientProfile = async (patient) => {
    setSelectedPatient(patient)
    setShowProfile(true)
    
    // Fetch patient details
    await fetchPatientDetails(patient.id)
  }

  const fetchPatientDetails = async (patientId) => {
    try {
      const token = localStorage.getItem('access_token')
      
      // Fetch notes
      const notesResponse = await fetch(`${API_CONFIG.BASE_URL}/api/v1/doctor/patient/${patientId}/notes`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (notesResponse.ok) {
        const notesData = await notesResponse.json()
        console.log('📝 Notes data received:', notesData.notes)
        setPatientNotes(notesData.notes || [])
      }

      // Fetch assessments
      const assessmentsResponse = await fetch(`${API_CONFIG.BASE_URL}/api/v1/doctor/patient/${patientId}/assessments`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (assessmentsResponse.ok) {
        const assessmentsData = await assessmentsResponse.json()
        setPatientAssessments(assessmentsData.assessments || [])
      }
    } catch (error) {
      console.error('Error fetching patient details:', error)
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
        await fetchPatientDetails(selectedPatient.id)
      }
    } catch (error) {
      console.error('Error adding note:', error)
    }
  }

  const handleAddPrompt = async (e) => {
    e.preventDefault()
    if (!selectedPatient) return

    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/doctor/patient/${selectedPatient.id}/custom-prompt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newPrompt)
      })

      if (response.ok) {
        alert('Custom prompt added successfully!')
        setShowAddPrompt(false)
        setNewPrompt({ title: '', content: '' })
      }
    } catch (error) {
      console.error('Error adding custom prompt:', error)
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
        Assigned Patients
      </h1>

      {/* Patients List */}
      <div style={{
        background: 'white',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #eee',
          backgroundColor: '#f8f9fa'
        }}>
          <h2 style={{ margin: 0, color: '#333' }}>Patient List</h2>
        </div>
        <div>
          {patients.length > 0 ? (
            patients.map((patient, index) => (
              <div key={index} style={{
                padding: '20px',
                borderBottom: '1px solid #eee',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <h3 style={{ margin: '0 0 5px 0', fontSize: '16px', color: '#333' }}>
                    {patient.first_name} {patient.last_name}
                  </h3>
                  <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '14px' }}>
                    {patient.email}
                  </p>
                  <p style={{ margin: 0, color: '#999', fontSize: '12px' }}>
                    Last interaction: {patient.last_interaction ? new Date(patient.last_interaction).toLocaleString() : 'Never'}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => viewPatientProfile(patient)}
                    style={{
                      padding: '8px 16px',
                      backgroundColor: '#3498db',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '14px'
                    }}
                  >
                    View Profile
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={{
              padding: '40px',
              textAlign: 'center',
              color: '#666'
            }}>
              <p style={{ margin: 0, fontSize: '18px' }}>No patients assigned</p>
              <p style={{ margin: '10px 0 0 0', fontSize: '14px' }}>
                Patients will appear here when assigned to you
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Patient Profile Modal */}
      {showProfile && selectedPatient && (
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
            maxWidth: '1000px',
            width: '95%',
            maxHeight: '90vh',
            overflowY: 'auto'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '20px'
            }}>
              <h2 style={{ margin: 0, color: '#333' }}>
                Patient Profile - {selectedPatient.first_name} {selectedPatient.last_name}
              </h2>
              <button
                onClick={() => setShowProfile(false)}
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

            {/* Patient Info */}
            <div style={{
              background: '#f8f9fa',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '20px'
            }}>
              <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>Patient Information</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                <p style={{ margin: '5px 0', color: '#666' }}>
                  <strong>Email:</strong> {selectedPatient.email}
                </p>
                <p style={{ margin: '5px 0', color: '#666' }}>
                  <strong>Last Interaction:</strong> {selectedPatient.last_interaction ? new Date(selectedPatient.last_interaction).toLocaleString() : 'Never'}
                </p>
                <p style={{ margin: '5px 0', color: '#666' }}>
                  <strong>Last Mood:</strong> {selectedPatient.last_mood || 'Unknown'}
                </p>
                <p style={{ margin: '5px 0', color: '#666' }}>
                  <strong>Total Assessments:</strong> {patientAssessments.length}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '10px',
              marginBottom: '20px'
            }}>
              <button
                onClick={() => setShowAddNote(true)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Add Note
              </button>
              <button
                onClick={() => setShowAddPrompt(true)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Add Custom Prompt
              </button>
            </div>

            {/* Tabs */}
            <div style={{
              display: 'flex',
              gap: '20px',
              marginBottom: '20px'
            }}>
              <div style={{
                background: '#e8f4fd',
                padding: '15px',
                borderRadius: '8px',
                flex: 1
              }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Assessment History</h3>
                {patientAssessments.length > 0 ? (
                  <div>
                    {patientAssessments.map((assessment, index) => (
                      <div key={index} style={{
                        background: 'white',
                        padding: '15px',
                        borderRadius: '6px',
                        marginBottom: '10px',
                        borderLeft: '4px solid #3498db'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <strong style={{ color: '#333' }}>Assessment #{assessment.id}</strong>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: '500',
                            backgroundColor: assessment.severity_level === 'high' ? '#e74c3c' : 
                                           assessment.severity_level === 'medium' ? '#f39c12' : '#27ae60',
                            color: 'white'
                          }}>
                            {assessment.severity_level?.toUpperCase() || 'UNKNOWN'}
                          </span>
                        </div>
                        <p style={{ margin: '5px 0', color: '#666', fontSize: '14px' }}>
                          Risk Score: {assessment.risk_score || 'N/A'} | 
                          Created: {new Date(assessment.created_at).toLocaleString()}
                        </p>
                        {assessment.summary_text && (
                          <p style={{ margin: '5px 0', color: '#333', fontSize: '14px', fontStyle: 'italic' }}>
                            "{assessment.summary_text.substring(0, 100)}..."
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: 0, color: '#999', fontStyle: 'italic' }}>No assessments yet</p>
                )}
              </div>

              <div style={{
                background: '#f0f8f0',
                padding: '15px',
                borderRadius: '8px',
                flex: 1
              }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Notes ({patientNotes.length})</h3>
                {patientNotes.length > 0 ? (
                  <div>
                    {patientNotes.map((note) => {
                      console.log('🔍 Rendering note:', note.id, note.note_type, note.content?.substring(0, 50))
                      return (
                      <div key={note.id} style={{
                        background: note.note_type === 'conversation_summary' ? '#f0f8ff' : 'white',
                        padding: '15px',
                        borderRadius: '6px',
                        marginBottom: '10px',
                        borderLeft: note.note_type === 'conversation_summary' ? '4px solid #e74c3c' : '4px solid #27ae60'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <strong style={{ color: '#333' }}>{note.title}</strong>
                          <span style={{
                            padding: '2px 6px',
                            borderRadius: '3px',
                            fontSize: '10px',
                            fontWeight: '500',
                            backgroundColor: note.note_type === 'conversation_summary' ? '#e74c3c' :
                                           note.note_type === 'session' ? '#3498db' : 
                                           note.note_type === 'observation' ? '#f39c12' : '#27ae60',
                            color: 'white'
                          }}>
                            {note.note_type === 'conversation_summary' ? 'AI CHAT' : note.note_type.toUpperCase()}
                          </span>
                        </div>
                        <p style={{ margin: '5px 0', color: '#666', fontSize: '14px', lineHeight: '1.4' }}>
                          {note.note_type === 'conversation_summary' 
                            ? (note.content && note.content.length > 200 ? note.content.substring(0, 200) + '...' : note.content)
                            : note.content
                          }
                        </p>
                        <p style={{ margin: 0, color: '#999', fontSize: '12px' }}>
                          {new Date(note.created_at).toLocaleString()}
                        </p>
                      </div>
                      )
                    })}
                  </div>
                ) : (
                  <p style={{ margin: 0, color: '#999', fontStyle: 'italic' }}>No notes yet</p>
                )}
              </div>
            </div>

            <div style={{
              display: 'flex',
              gap: '10px',
              marginTop: '20px'
            }}>
              <button
                onClick={() => setShowProfile(false)}
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
        </div>
      )}

      {/* Add Note Modal */}
      {showAddNote && selectedPatient && (
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
          zIndex: 1001
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
              Add Note for {selectedPatient.first_name} {selectedPatient.last_name}
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

      {/* Add Custom Prompt Modal */}
      {showAddPrompt && selectedPatient && (
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
          zIndex: 1001
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
              Add Custom Prompt for {selectedPatient.first_name} {selectedPatient.last_name}
            </h2>
            
            <form onSubmit={handleAddPrompt}>
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Prompt Title
                </label>
                <input
                  type="text"
                  value={newPrompt.title}
                  onChange={(e) => setNewPrompt({...newPrompt, title: e.target.value})}
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
              
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                  Custom AI Prompt
                </label>
                <textarea
                  value={newPrompt.content}
                  onChange={(e) => setNewPrompt({...newPrompt, content: e.target.value})}
                  required
                  rows="6"
                  placeholder="Enter custom instructions for this patient's AI Buddy..."
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
                  Add Prompt
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddPrompt(false)}
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

export default DoctorPatients
