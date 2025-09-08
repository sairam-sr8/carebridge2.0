import { useState, useEffect } from 'react'
import { ArrowLeft, Save, Calendar, Heart, AlertTriangle } from 'lucide-react'
import { patientsAPI } from '../services/api'

function PatientJournal() {
  const [mood, setMood] = useState(0)
  const [content, setContent] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [history, setHistory] = useState([])

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const response = await patientsAPI.getHistory()
      setHistory(response.data.filter(entry => entry.type === 'journal'))
    } catch (error) {
      console.error('Error fetching history:', error)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (content.length < 10) {
      alert('Please write at least 10 characters in your journal entry.')
      return
    }

    setSaving(true)
    try {
      const response = await patientsAPI.createJournal({ mood, content })
      
      // Show success message
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      
      // Reset form
      setContent('')
      setMood(0)
      
      // Refresh history
      await fetchHistory()
      
      // Show red flag alert if detected
      if (response.data.red_flags && response.data.red_flags.length > 0) {
        alert(`⚠️ We've detected some concerning patterns in your journal entry. Please consider reaching out to your doctor or a crisis helpline if you need immediate support.`)
      }
    } catch (error) {
      console.error('Error saving journal entry:', error)
      alert('Failed to save journal entry. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const getMoodEmoji = (moodValue) => {
    switch (moodValue) {
      case 2: return '😊'
      case 1: return '🙂'
      case 0: return '😐'
      case -1: return '😔'
      case -2: return '😢'
      default: return '😐'
    }
  }

  const getMoodLabel = (moodValue) => {
    switch (moodValue) {
      case 2: return 'Very Positive'
      case 1: return 'Positive'
      case 0: return 'Neutral'
      case -1: return 'Negative'
      case -2: return 'Very Negative'
      default: return 'Neutral'
    }
  }

  const getMoodColor = (moodValue) => {
    if (moodValue >= 1) return 'text-green-600'
    if (moodValue === 0) return 'text-gray-600'
    return 'text-red-600'
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #f0fdf4 0%, #dbeafe 100%)' 
    }}>
      {/* Header */}
      <div style={{ background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '24px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <a href="/patient" style={{ marginRight: '16px', color: '#6b7280', textDecoration: 'none' }}>
                <ArrowLeft style={{ height: '24px', width: '24px' }} />
              </a>
              <div>
                <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>Journal Entry</h1>
                <p style={{ color: '#6b7280', margin: 0 }}>Record your thoughts and feelings</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#6b7280' }}>
              <Calendar style={{ height: '16px', width: '16px', marginRight: '4px' }} />
              {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '24px 16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(1, minmax(0, 1fr))', gap: '24px' }}>
          {/* Journal Form */}
          <div style={{ gridColumn: 'span 2' }}>
            <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', padding: '24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '24px' }}>How are you feeling today?</h2>
              
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Mood Rating */}
                <div>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '16px' }}>
                    Rate your current mood (-2 to +2)
                  </label>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
                    {[-2, -1, 0, 1, 2].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setMood(value)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          padding: '12px',
                          borderRadius: '8px',
                          border: '2px solid',
                          borderColor: mood === value ? '#3b82f6' : '#e5e7eb',
                          background: mood === value ? '#eff6ff' : 'transparent',
                          transition: 'all 0.2s',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) => {
                          if (mood !== value) {
                            e.target.style.borderColor = '#d1d5db'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (mood !== value) {
                            e.target.style.borderColor = '#e5e7eb'
                          }
                        }}
                      >
                        <span style={{ fontSize: '24px', marginBottom: '4px' }}>{getMoodEmoji(value)}</span>
                        <span style={{ 
                          fontSize: '14px', 
                          fontWeight: '500', 
                          color: getMoodColor(value).replace('text-', '').replace('-600', '#dc2626').replace('green-600', '#16a34a').replace('gray-600', '#6b7280')
                        }}>
                          {value}
                        </span>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>
                          {getMoodLabel(value)}
                        </span>
                      </button>
                    ))}
                  </div>
                  {mood !== 0 && (
                    <p style={{ textAlign: 'center', fontSize: '14px', color: '#6b7280', marginTop: '8px' }}>
                      Selected: {getMoodEmoji(mood)} {getMoodLabel(mood)} ({mood})
                    </p>
                  )}
                </div>

                {/* Journal Content */}
                <div>
                  <label htmlFor="content" style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
                    What's on your mind? (Minimum 10 characters)
                  </label>
                  <textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={8}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      outline: 'none',
                      resize: 'vertical'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#3b82f6'
                      e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d1d5db'
                      e.target.style.boxShadow = 'none'
                    }}
                    placeholder="Write about your day, your feelings, or anything that's on your mind..."
                  />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <p style={{ fontSize: '14px', color: '#6b7280' }}>
                      {content.length}/10 characters minimum
                    </p>
                    {content.length >= 10 && (
                      <p style={{ fontSize: '14px', color: '#16a34a', display: 'flex', alignItems: 'center' }}>
                        <Heart style={{ height: '16px', width: '16px', marginRight: '4px' }} />
                        Ready to save
                      </p>
                    )}
                  </div>
                </div>

                {/* Submit Button */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    Your entries are private and secure
                  </div>
                  <button
                    type="submit"
                    disabled={saving || content.length < 10}
                    style={{
                      background: '#2563eb',
                      color: 'white',
                      padding: '8px 24px',
                      borderRadius: '8px',
                      border: 'none',
                      cursor: saving || content.length < 10 ? 'not-allowed' : 'pointer',
                      opacity: saving || content.length < 10 ? 0.5 : 1,
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      if (!saving && content.length >= 10) {
                        e.target.style.background = '#1d4ed8'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!saving && content.length >= 10) {
                        e.target.style.background = '#2563eb'
                      }
                    }}
                  >
                    {saving ? (
                      <>
                        <div style={{
                          animation: 'spin 1s linear infinite',
                          borderRadius: '50%',
                          height: '16px',
                          width: '16px',
                          border: '2px solid transparent',
                          borderTopColor: 'white',
                          marginRight: '8px'
                        }}></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save style={{ height: '16px', width: '16px', marginRight: '8px' }} />
                        Save Entry
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* Success Message */}
              {saved && (
                <div style={{ 
                  marginTop: '16px', 
                  padding: '16px', 
                  background: '#dcfce7', 
                  border: '1px solid #bbf7d0', 
                  borderRadius: '8px', 
                  display: 'flex', 
                  alignItems: 'center' 
                }}>
                  <Heart style={{ height: '20px', width: '20px', color: '#16a34a', marginRight: '8px' }} />
                  <span style={{ color: '#166534' }}>Journal entry saved successfully!</span>
                </div>
              )}
            </div>
          </div>

          {/* Recent Entries */}
          <div style={{ gridColumn: 'span 1' }}>
            <div style={{ background: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', padding: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', marginBottom: '16px' }}>Recent Entries</h3>
              
              {history.length === 0 ? (
                <p style={{ color: '#6b7280', textAlign: 'center', padding: '16px 0' }}>No journal entries yet</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {history.slice(0, 5).map((entry) => (
                    <div key={entry.id} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontSize: '24px' }}>{getMoodEmoji(entry.sentiment_score * 4 - 2)}</span>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>
                          {formatDate(entry.created_at)}
                        </span>
                      </div>
                      <p style={{ 
                        fontSize: '14px', 
                        color: '#374151', 
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden'
                      }}>
                        {entry.content}
                      </p>
                      {entry.red_flags && entry.red_flags.length > 0 && (
                        <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', fontSize: '12px', color: '#dc2626' }}>
                          <AlertTriangle style={{ height: '12px', width: '12px', marginRight: '4px' }} />
                          Red flags detected
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PatientJournal
