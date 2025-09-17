import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import PatientSidebar from '../components/PatientSidebar'
import API_CONFIG from '../config/api'

const PatientHome = () => {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [buddyName, setBuddyName] = useState('AI Buddy')
  const [showBuddySettings, setShowBuddySettings] = useState(false)
  const [newBuddyName, setNewBuddyName] = useState('')
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBuddyName()
    loadChatHistory()
    fetchSummary()
  }, [])

  const loadBuddyName = () => {
    const saved = localStorage.getItem('buddyName')
    if (saved) {
      setBuddyName(saved)
    }
  }

  const loadChatHistory = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/patient/buddy-welcome`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        const welcomeMessage = {
          id: Date.now(),
          speaker: 'ai',
          content: data.ai_response,
          timestamp: new Date().toISOString()
        }
        setMessages([welcomeMessage])
      }
    } catch (error) {
      console.error('Error loading chat history:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchSummary = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/patient/summary`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        setSummary(data)
      }
    } catch (error) {
      console.error('Error fetching summary:', error)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputMessage.trim() || sending) return

    const userMessage = {
      id: Date.now(),
      speaker: 'patient',
      content: inputMessage,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setSending(true)

    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/patient/buddy-chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: inputMessage,
          buddy_name: buddyName
        })
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const data = await response.json()
      
      const aiMessage = {
        id: Date.now() + 1,
        speaker: 'ai',
        content: data.ai_response,
        timestamp: new Date().toISOString(),
        flagged: data.flagged,
        severity: data.severity
      }

      const newMessages = [...messages, userMessage, aiMessage]
      setMessages(newMessages)
      saveChatHistory(newMessages)
      
    } catch (error) {
      console.error('Error sending message:', error)
      setMessages(prev => prev.slice(0, -1)) // Remove user message on error
    } finally {
      setSending(false)
    }
  }

  const saveChatHistory = (messages) => {
    localStorage.setItem('chatHistory', JSON.stringify(messages))
  }

  const updateBuddyName = () => {
    if (newBuddyName.trim()) {
      setBuddyName(newBuddyName.trim())
      localStorage.setItem('buddyName', newBuddyName.trim())
      setNewBuddyName('')
      setShowBuddySettings(false)
      
      // Update existing AI messages with new buddy name
      setMessages(prev => prev.map(msg => 
        msg.speaker === 'ai' 
          ? { ...msg, content: msg.content.replace(/AI Buddy/g, newBuddyName.trim()) }
          : msg
      ))
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
        Patient Portal
      </h1>

      {/* Progress Summary */}
      <div style={{
        background: 'white',
        padding: '25px',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        marginBottom: '30px'
      }}>
        <h2 style={{ marginBottom: '20px', color: '#333' }}>Progress Summary</h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px'
        }}>
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '2rem', margin: '0 0 10px 0', color: '#3498db' }}>
              {summary?.total_entries || 0}
            </h3>
            <p style={{ margin: 0, color: '#666' }}>Total Entries</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '2rem', margin: '0 0 10px 0', color: '#27ae60' }}>
              {summary?.average_mood || 0}
            </h3>
            <p style={{ margin: 0, color: '#666' }}>Average Mood</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '2rem', margin: '0 0 10px 0', color: '#f39c12' }}>
              {summary?.positive_thoughts || 0}
            </h3>
            <p style={{ margin: 0, color: '#666' }}>Positive Thoughts</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ fontSize: '2rem', margin: '0 0 10px 0', color: '#e74c3c' }}>
              {summary?.concerns_flagged || 0}
            </h3>
            <p style={{ margin: 0, color: '#666' }}>Concerns Flagged</p>
          </div>
        </div>
      </div>

      {/* Chat Interface */}
      <div style={{
        background: 'white',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #eee',
          backgroundColor: '#f8f9fa',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, color: '#333' }}>
            Chat with your {buddyName}
          </h2>
          <button
            onClick={() => setShowBuddySettings(true)}
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
            Personalize
          </button>
        </div>
        
        <div style={{
          height: '400px',
          overflowY: 'auto',
          padding: '20px'
        }}>
          {messages.map((message) => (
            <div
              key={message.id}
              style={{
                marginBottom: '15px',
                display: 'flex',
                justifyContent: message.speaker === 'patient' ? 'flex-end' : 'flex-start'
              }}
            >
              <div
                style={{
                  maxWidth: '70%',
                  padding: '12px 16px',
                  borderRadius: '18px',
                  backgroundColor: message.speaker === 'patient' ? '#3498db' : '#f1f2f6',
                  color: message.speaker === 'patient' ? 'white' : '#333',
                  fontSize: '14px',
                  lineHeight: '1.4'
                }}
              >
                {message.content}
              </div>
            </div>
          ))}
          {sending && (
            <div style={{
              marginBottom: '15px',
              display: 'flex',
              justifyContent: 'flex-start'
            }}>
              <div style={{
                padding: '12px 16px',
                borderRadius: '18px',
                backgroundColor: '#f1f2f6',
                color: '#666',
                fontSize: '14px'
              }}>
                {buddyName} is thinking...
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSendMessage} style={{
          padding: '20px',
          borderTop: '1px solid #eee',
          display: 'flex',
          gap: '10px'
        }}>
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={`Message ${buddyName}...`}
            style={{
              flex: 1,
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '25px',
              fontSize: '16px',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            disabled={sending || !inputMessage.trim()}
            style={{
              padding: '12px 20px',
              backgroundColor: sending ? '#ccc' : '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '25px',
              cursor: sending ? 'not-allowed' : 'pointer',
              fontSize: '16px'
            }}
          >
            Send
          </button>
        </form>
      </div>

      {/* Quick Actions */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginTop: '30px'
      }}>
        <Link
          to="/patient/journal"
          style={{
            padding: '20px',
            backgroundColor: '#27ae60',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '10px',
            textAlign: 'center',
            fontWeight: '500',
            transition: 'background-color 0.3s ease'
          }}
        >
          Journal Entry
        </Link>
        <Link
          to="/patient/history"
          style={{
            padding: '20px',
            backgroundColor: '#f39c12',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '10px',
            textAlign: 'center',
            fontWeight: '500',
            transition: 'background-color 0.3s ease'
          }}
        >
          View History
        </Link>
      </div>

      {/* Buddy Settings Modal */}
      {showBuddySettings && (
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
            maxWidth: '400px',
            width: '90%'
          }}>
            <h2 style={{ marginBottom: '20px', color: '#333' }}>
              Personalize Your AI Buddy
            </h2>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
                Buddy Name
              </label>
              <input
                type="text"
                value={newBuddyName}
                onChange={(e) => setNewBuddyName(e.target.value)}
                placeholder="Enter buddy name"
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '16px'
                }}
              />
            </div>
            <div style={{
              display: 'flex',
              gap: '10px'
            }}>
              <button
                onClick={updateBuddyName}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#27ae60',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Save
              </button>
              <button
                onClick={() => setShowBuddySettings(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#95a5a6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PatientHome
