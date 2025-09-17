import React, { useState, useEffect } from 'react'
import API_CONFIG from '../config/api'

const PatientJournal = () => {
  const [mood, setMood] = useState('neutral')
  const [thoughts, setThoughts] = useState('')
  const [saving, setSaving] = useState(false)
  const [journalEntries, setJournalEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchJournalEntries()
  }, [])

  const fetchJournalEntries = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/patient/history`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        // Filter journal entries
        const journalData = data.history.filter(entry => entry.type === 'journal')
        setJournalEntries(journalData)
      }
    } catch (error) {
      console.error('Error fetching journal entries:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!thoughts.trim()) return

    setSaving(true)
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/patient/journal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ mood, thoughts })
      })

      if (response.ok) {
        alert('Journal entry saved successfully!')
        setThoughts('')
        setMood('neutral')
        fetchJournalEntries()
      } else {
        alert('Error saving journal entry')
      }
    } catch (error) {
      console.error('Error saving journal entry:', error)
      alert('Error saving journal entry')
    } finally {
      setSaving(false)
    }
  }

  const getMoodEmoji = (mood) => {
    switch (mood) {
      case 'excellent': return '😊'
      case 'good': return '🙂'
      case 'neutral': return '😐'
      case 'not great': return '😔'
      case 'terrible': return '😢'
      default: return '😐'
    }
  }

  const getMoodColor = (mood) => {
    switch (mood) {
      case 'excellent': return '#27ae60'
      case 'good': return '#2ecc71'
      case 'neutral': return '#f39c12'
      case 'not great': return '#e67e22'
      case 'terrible': return '#e74c3c'
      default: return '#95a5a6'
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
        Journal
      </h1>

      {/* Journal Entry Form */}
      <div style={{
        background: 'white',
        padding: '25px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginBottom: '30px'
      }}>
        <h2 style={{ marginBottom: '20px', color: '#333' }}>New Journal Entry</h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: '500' }}>
              How are you feeling today?
            </label>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
              gap: '10px'
            }}>
              {['excellent', 'good', 'neutral', 'not great', 'terrible'].map((moodOption) => (
                <button
                  key={moodOption}
                  type="button"
                  onClick={() => setMood(moodOption)}
                  style={{
                    padding: '15px',
                    border: mood === moodOption ? '2px solid #3498db' : '2px solid #e0e0e0',
                    borderRadius: '8px',
                    background: 'white',
                    cursor: 'pointer',
                    fontSize: '16px',
                    textAlign: 'center',
                    transition: 'all 0.3s ease',
                    backgroundColor: mood === moodOption ? '#f8f9fa' : 'white'
                  }}
                >
                  <div style={{ fontSize: '24px', marginBottom: '5px' }}>
                    {getMoodEmoji(moodOption)}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    textTransform: 'capitalize',
                    color: getMoodColor(moodOption)
                  }}>
                    {moodOption}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '10px', fontWeight: '500' }}>
              What's on your mind?
            </label>
            <textarea
              value={thoughts}
              onChange={(e) => setThoughts(e.target.value)}
              placeholder="Share your thoughts, feelings, or experiences..."
              rows="6"
              style={{
                width: '100%',
                padding: '15px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '16px',
                resize: 'vertical',
                fontFamily: 'inherit'
              }}
            />
          </div>

          <button
            type="submit"
            disabled={saving || !thoughts.trim()}
            style={{
              padding: '15px 30px',
              backgroundColor: saving || !thoughts.trim() ? '#95a5a6' : '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: saving || !thoughts.trim() ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease'
            }}
          >
            {saving ? 'Saving...' : 'Save Entry'}
          </button>
        </form>
      </div>

      {/* Journal Entries History */}
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
            Journal History ({journalEntries.length})
          </h2>
        </div>

        {journalEntries.length > 0 ? (
          <div>
            {journalEntries.map((entry, index) => {
              const entryData = JSON.parse(entry.content || '{}')
              return (
                <div key={entry.id} style={{
                  padding: '20px',
                  borderBottom: '1px solid #eee'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '10px'
                  }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}>
                      <span style={{ fontSize: '24px' }}>
                        {getMoodEmoji(entryData.mood || 'neutral')}
                      </span>
                      <span style={{
                        fontSize: '16px',
                        fontWeight: '500',
                        color: getMoodColor(entryData.mood || 'neutral'),
                        textTransform: 'capitalize'
                      }}>
                        {entryData.mood || 'neutral'}
                      </span>
                    </div>
                    <span style={{
                      fontSize: '12px',
                      color: '#999'
                    }}>
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  </div>
                  
                  <p style={{
                    margin: 0,
                    color: '#333',
                    fontSize: '14px',
                    lineHeight: '1.6'
                  }}>
                    {entryData.thoughts || 'No thoughts recorded'}
                  </p>
                </div>
              )
            })}
          </div>
        ) : (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#666'
          }}>
            <p style={{ margin: 0, fontSize: '18px' }}>
              No journal entries yet. Start writing to track your thoughts and feelings!
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default PatientJournal