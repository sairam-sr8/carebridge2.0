import { useState, useEffect, useRef } from 'react'
import { Send, Heart, MessageCircle, Calendar, TrendingUp, LogOut } from 'lucide-react'
import { useAuth } from '../services/AuthContext'
import { patientsAPI } from '../services/api'

function PatientHome() {
  const [messages, setMessages] = useState([])
  const [inputMessage, setInputMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [summary, setSummary] = useState(null)
  const messagesEndRef = useRef(null)
  const { logout } = useAuth()

  useEffect(() => {
    fetchSummary()
    fetchHistory()
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const fetchSummary = async () => {
    try {
      const response = await patientsAPI.getSummary()
      setSummary(response.data)
    } catch (error) {
      console.error('Error fetching summary:', error)
    }
  }

  const fetchHistory = async () => {
    try {
      const response = await patientsAPI.getHistory()
      setMessages(response.data)
    } catch (error) {
      console.error('Error fetching history:', error)
    }
  }

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (!inputMessage.trim() || sending) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setSending(true)

    try {
      const response = await patientsAPI.sendChat(inputMessage)
      
      const aiMessage = {
        id: Date.now() + 1,
        type: 'ai',
        content: response.data.response,
        timestamp: new Date().toISOString(),
        red_flags: response.data.red_flags || []
      }

      setMessages(prev => [...prev, aiMessage])
      
      // Show red flag alert if detected
      if (response.data.red_flags && response.data.red_flags.length > 0) {
        alert(`⚠️ We've detected some concerning patterns in your message. Please consider reaching out to your doctor or a crisis helpline if you need immediate support.`)
      }
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
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm text-gray-600">Welcome back</p>
                <p className="font-medium text-gray-800">How are you feeling today?</p>
              </div>
              <button
                onClick={logout}
                className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
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
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs opacity-70">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </span>
                      {message.sentiment_score && (
                        <span className="text-xs opacity-70">
                          {getMoodEmoji(message.sentiment_score)}
                        </span>
                      )}
                    </div>
                    {message.red_flags && message.red_flags.length > 0 && (
                      <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-xs text-red-700">
                        ⚠️ We've detected some concerning patterns. Please consider reaching out for support.
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
