import { useState, useEffect } from 'react'
import api from '../services/api'

const AdminCompliance = () => {
  const [auditEvents, setAuditEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    fetchAuditLog()
  }, [])

  const fetchAuditLog = async () => {
    try {
      const response = await api.get('/admin/audit')
      setAuditEvents(response.data)
    } catch (error) {
      console.error('Error fetching audit log:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredEvents = auditEvents.filter(event => {
    if (filter === 'all') return true
    return event.event_type === filter
  })

  const getEventIcon = (eventType) => {
    switch (eventType) {
      case 'patient_interaction': return '💬'
      case 'alert_created': return '🚨'
      case 'note_created': return '📝'
      default: return '📋'
    }
  }

  const getEventColor = (eventType) => {
    switch (eventType) {
      case 'patient_interaction': return 'bg-blue-100 text-blue-800'
      case 'alert_created': return 'bg-red-100 text-red-800'
      case 'note_created': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString()
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="bg-white p-4 rounded-lg shadow">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-800 mb-2">Compliance & Audit Log</h1>
        <p className="text-secondary-600">Monitor system activity and compliance events</p>
      </div>

      {/* Filter Controls */}
      <div className="mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All Events ({auditEvents.length})
          </button>
          <button
            onClick={() => setFilter('patient_interaction')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === 'patient_interaction' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Interactions ({auditEvents.filter(e => e.event_type === 'patient_interaction').length})
          </button>
          <button
            onClick={() => setFilter('alert_created')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === 'alert_created' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Alerts ({auditEvents.filter(e => e.event_type === 'alert_created').length})
          </button>
          <button
            onClick={() => setFilter('note_created')}
            className={`px-4 py-2 rounded-lg font-medium ${
              filter === 'note_created' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Notes ({auditEvents.filter(e => e.event_type === 'note_created').length})
          </button>
        </div>
      </div>

      {/* Audit Events List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Audit Events</h3>
          <p className="text-sm text-gray-500">Last 100 events across the system</p>
        </div>
        
        {filteredEvents.length === 0 ? (
          <div className="p-6 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No events found</h3>
            <p className="mt-1 text-sm text-gray-500">No audit events match the current filter.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredEvents.map((event) => (
              <div key={event.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${getEventColor(event.event_type)}`}>
                      {getEventIcon(event.event_type)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-gray-900">
                        {event.description}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatTimestamp(event.timestamp)}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                      <span>Type: {event.event_type.replace('_', ' ')}</span>
                      <span>User: {event.user_type}</span>
                      <span>ID: {event.user_id}</span>
                    </div>
                    {event.details && Object.keys(event.details).length > 0 && (
                      <div className="mt-3">
                        <details className="group">
                          <summary className="cursor-pointer text-sm text-blue-600 hover:text-blue-800">
                            View Details
                          </summary>
                          <div className="mt-2 p-3 bg-gray-50 rounded-lg">
                            <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                              {JSON.stringify(event.details, null, 2)}
                            </pre>
                          </div>
                        </details>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminCompliance
