import { useState, useEffect, useRef } from 'react'
import { Send, Heart, MessageCircle, Calendar, TrendingUp, LogOut, Shield, AlertTriangle } from 'lucide-react'
import { useAuth } from '../services/AuthContext'
import { API_CONFIG } from '../config/api'

function PatientHome() {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [summary, setSummary] = useState(null)
  const [safetyStatus, setSafetyStatus] = useState(null)
  const [showSafetyAlert, setShowSafetyAlert] = useState(false)
  const messagesEndRef = useRef(null)
  const { logout } = useAuth()

  useEffect(() => {
    fetchSummary()
    fetchChatHistory()
    fetchSafetyStatus()
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchSummary = async () => {
    try {
      // Mock summary for now - will be replaced with actual API
      setSummary({
        average_mood: 0.7,
        mood_trend: 'positive',
        total_entries: 15,
        summary: 'You\'ve been making great progress! Keep up the positive momentum.'
      })
    } catch (error) {
      console.error('Error fetching summary:', error)
    }
  }

  const fetchChatHistory = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/patient/safety/chat/history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch chat history')
      }

      const data = await response.json()
      setMessages(data.chat_history || [])
    } catch (error) {
      console.error('Error fetching chat history:', error)
    }
  }

  const fetchSafetyStatus = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/patient/safety/safety-status`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch safety status')
      }

      const data = await response.json()
      setSafetyStatus(data)
    } catch (error) {
      console.error('Error fetching safety status:', error)
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
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/v1/patient/safety/chat/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: inputMessage
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

      setMessages(prev => [...prev, aiMessage])
      
      // Show safety alert if flagged
      if (data.flagged) {
        setShowSafetyAlert(true)
        // Auto-hide after 10 seconds
        setTimeout(() => setShowSafetyAlert(false), 10000)
      }
      
      // Refresh safety status
      await fetchSafetyStatus()
      
    } catch (error) {
      console.error('Error sending message:', error)
      alert('Failed to send message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const getMoodEmoji = (score) => {
    if (score > 0.7) return '😊'
    if (score > 0.4) return '😐'
    if (score > 0.2) return '😔'
    return '😢'
  }

  const getMoodTrendColor = (trend) => {
    switch (trend) {
      case 'positive': return 'text-green-600'
      case 'stable': return 'text-blue-600'
      case 'concerning': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Heart className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">CareBridge</h1>
                <p className="text-gray-600">Your AI Mental Health Companion</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              {safetyStatus && (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center',
                  backgroundColor: safetyStatus.safety_status === 'monitored' ? '#fef3c7' : '#d1fae5',
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${safetyStatus.safety_status === 'monitored' ? '#f59e0b' : '#10b981'}`
                }}>
                  <Shield style={{ 
                    width: '16px', 
                    height: '16px', 
                    marginRight: '6px',
                    color: safetyStatus.safety_status === 'monitored' ? '#f59e0b' : '#10b981'
                  }} />
                  <span style={{ 
                    fontSize: '12px', 
                    fontWeight: '500',
                    color: safetyStatus.safety_status === 'monitored' ? '#92400e' : '#065f46'
                  }}>
                    {safetyStatus.safety_status === 'monitored' ? 'MONITORED' : 'NORMAL'}
                  </span>
                </div>
              )}
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>Welcome back</p>
                <p style={{ fontWeight: '500', color: '#1f2937', margin: 0 }}>How are you feeling today?</p>
              </div>
              <button
                onClick={logout}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '8px 16px',
                  backgroundColor: '#dc2626',
                  color: 'white',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
                onMouseEnter={(e) => e.target.style.backgroundColor = '#b91c1c'}
                onMouseLeave={(e) => e.target.style.backgroundColor = '#dc2626'}
              >
                <LogOut style={{ width: '16px', height: '16px', marginRight: '8px' }} />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Safety Alert Banner */}
        {showSafetyAlert && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            animation: 'slideDown 0.3s ease-out'
          }}>
            <AlertTriangle style={{ 
              width: '20px', 
              height: '20px', 
              color: '#dc2626',
              marginRight: '12px',
              flexShrink: 0
            }} />
            <div>
              <h3 style={{ 
                fontSize: '16px', 
                fontWeight: '600', 
                color: '#dc2626',
                margin: '0 0 4px 0'
              }}>
                Safety Alert
              </h3>
              <p style={{ 
                fontSize: '14px', 
                color: '#991b1b',
                margin: 0
              }}>
                Your message has been reviewed by our safety system. A mental health professional has been notified and may reach out to you. If you're in immediate danger, please call your local emergency number.
              </p>
            </div>
            <button
              onClick={() => setShowSafetyAlert(false)}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                color: '#dc2626',
                cursor: 'pointer',
                fontSize: '18px',
                fontWeight: 'bold'
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Summary Card */}
        {summary && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Your Progress Summary
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{summary.average_mood?.toFixed(2) || 'N/A'}</div>
                <div className="text-sm text-gray-600">Average Mood</div>
              </div>
              <div className="text-center">
                <div className={`text-lg font-semibold ${getMoodTrendColor(summary.mood_trend)}`}>
                  {summary.mood_trend?.charAt(0).toUpperCase() + summary.mood_trend?.slice(1) || 'Unknown'}
                </div>
                <div className="text-sm text-gray-600">Mood Trend</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{summary.total_entries || 0}</div>
                <div className="text-sm text-gray-600">Total Entries</div>
              </div>
            </div>
            <p className="text-gray-700 mt-4 text-center">{summary.summary}</p>
          </div>
        )}

        {/* Chat Interface */}
        <div className="bg-white rounded-lg shadow-md h-96 flex flex-col">
          {/* Chat Header */}
          <div className="bg-blue-50 px-6 py-4 border-b border-gray-200 rounded-t-lg">
            <div className="flex items-center">
              <MessageCircle className="h-5 w-5 text-blue-600 mr-2" />
              <h3 className="font-semibold text-gray-800">Chat with Your AI Companion</h3>
            </div>
            <p className="text-sm text-gray-600 mt-1">Share your thoughts, feelings, or concerns. I'm here to listen.</p>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Start a conversation with your AI companion</p>
                <p className="text-sm">Share how you're feeling or what's on your mind</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  style={{ 
                    display: 'flex', 
                    justifyContent: message.speaker === 'patient' ? 'flex-end' : 'flex-start',
                    marginBottom: '16px'
                  }}
                >
                  <div
                    style={{
                      maxWidth: '70%',
                      padding: '12px 16px',
                      borderRadius: '12px',
                      backgroundColor: message.speaker === 'patient' ? '#3b82f6' : '#f3f4f6',
                      color: message.speaker === 'patient' ? 'white' : '#374151',
                      position: 'relative'
                    }}
                  >
                    <p style={{ margin: 0, fontSize: '14px', lineHeight: '1.4' }}>
                      {message.content}
                    </p>
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between', 
                      marginTop: '8px',
                      fontSize: '12px',
                      opacity: 0.7
                    }}>
                      <span>
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                      {message.flagged && (
                        <span style={{ 
                          display: 'flex', 
                          alignItems: 'center',
                          backgroundColor: '#fef2f2',
                          color: '#dc2626',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '10px'
                        }}>
                          <Shield style={{ width: '12px', height: '12px', marginRight: '2px' }} />
                          SAFETY REVIEWED
                        </span>
                      )}
                    </div>
                    {message.flagged && (
                      <div style={{
                        marginTop: '8px',
                        padding: '8px',
                        backgroundColor: '#fef2f2',
                        border: '1px solid #fecaca',
                        borderRadius: '6px',
                        fontSize: '12px',
                        color: '#dc2626'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                          <AlertTriangle style={{ width: '14px', height: '14px', marginRight: '4px' }} />
                          <strong>Safety Alert</strong>
                        </div>
                        <p style={{ margin: 0 }}>
                          Your message has been reviewed by our safety system. A mental health professional has been notified and may reach out to you.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
            {sending && (
              <div className="flex justify-start">
                <div className="bg-gray-100 text-gray-800 px-4 py-2 rounded-lg">
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    AI is thinking...
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Form */}
          <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Share your thoughts..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={sending}
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || sending}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </form>
        </div>

        {/* Quick Actions */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="/patient/journal"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow flex items-center"
          >
            <Calendar className="h-8 w-8 text-green-600 mr-4" />
            <div>
              <h3 className="font-semibold text-gray-800">Journal Entry</h3>
              <p className="text-sm text-gray-600">Record your mood and thoughts</p>
            </div>
          </a>
          <a
            href="/patient/history"
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow flex items-center"
          >
            <TrendingUp className="h-8 w-8 text-purple-600 mr-4" />
            <div>
              <h3 className="font-semibold text-gray-800">View History</h3>
              <p className="text-sm text-gray-600">See your progress over time</p>
            </div>
          </a>
        </div>
      </div>
    </div>
  )
}

export default PatientHome
