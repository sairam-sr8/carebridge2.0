import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { 
  ArrowLeft, 
  Calendar, 
  Phone, 
  Mail, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown,
  FileText,
  Activity,
  Heart,
  Clock,
  Plus
} from 'lucide-react'
import { doctorsAPI } from '../services/api'
import AddNoteModal from '../components/AddNoteModal'

function PatientDetail() {
  const { id } = useParams()
  const [patientData, setPatientData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showAddNoteModal, setShowAddNoteModal] = useState(false)

  useEffect(() => {
    fetchPatientSummary()
  }, [id])

  const fetchPatientSummary = async () => {
    try {
      const response = await doctorsAPI.getPatientSummary(id)
      setPatientData(response.data)
    } catch (error) {
      console.error('Error fetching patient summary:', error)
      setError('Failed to load patient data')
    } finally {
      setLoading(false)
    }
  }

  const handleNoteAdded = () => {
    // Refresh patient data to show new note
    fetchPatientSummary()
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const getMoodColor = (score) => {
    if (score > 0.7) return 'text-green-600'
    if (score > 0.4) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getMoodIcon = (trend) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Activity className="h-4 w-4 text-blue-600" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (error || !patientData) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-secondary-800 mb-2">Error Loading Patient</h3>
          <p className="text-secondary-600 mb-4">{error || 'Patient not found'}</p>
          <Link to="/doctor/patients" className="btn-primary">
            Back to Patients
          </Link>
        </div>
      </div>
    )
  }

  const { patient, ai_summary, mood_trend, red_flags, last_contact, notes_preview, active_alerts, stats } = patientData

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <Link 
          to="/doctor/patients" 
          className="inline-flex items-center text-primary-600 hover:text-primary-700 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Patients
        </Link>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-secondary-800 mb-2">
              {patient.first_name} {patient.last_name}
            </h1>
            <p className="text-secondary-600">Patient ID: {patient.id}</p>
          </div>
          <div className="flex items-center space-x-4">
            {active_alerts.length > 0 && (
              <div className="flex items-center text-red-600">
                <AlertTriangle className="h-5 w-5 mr-2" />
                <span className="font-medium">{active_alerts.length} Active Alert(s)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Patient Info Card */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold text-secondary-800 mb-4">Patient Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="flex items-center">
            <Mail className="h-5 w-5 text-secondary-400 mr-3" />
            <div>
              <p className="text-sm text-secondary-600">Email</p>
              <p className="font-medium text-secondary-800">{patient.email}</p>
            </div>
          </div>
          {patient.phone && (
            <div className="flex items-center">
              <Phone className="h-5 w-5 text-secondary-400 mr-3" />
              <div>
                <p className="text-sm text-secondary-600">Phone</p>
                <p className="font-medium text-secondary-800">{patient.phone}</p>
              </div>
            </div>
          )}
          {patient.date_of_birth && (
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-secondary-400 mr-3" />
              <div>
                <p className="text-sm text-secondary-600">Date of Birth</p>
                <p className="font-medium text-secondary-800">{formatDate(patient.date_of_birth)}</p>
              </div>
            </div>
          )}
          {patient.emergency_contact && (
            <div className="flex items-center">
              <Heart className="h-5 w-5 text-secondary-400 mr-3" />
              <div>
                <p className="text-sm text-secondary-600">Emergency Contact</p>
                <p className="font-medium text-secondary-800">{patient.emergency_contact}</p>
                {patient.emergency_phone && (
                  <p className="text-sm text-secondary-600">{patient.emergency_phone}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* AI Summary */}
      <div className="card mb-6">
        <h2 className="text-xl font-semibold text-secondary-800 mb-4">AI Summary</h2>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-secondary-700 leading-relaxed">{ai_summary}</p>
        </div>
      </div>

      {/* Mood Trend & Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Mood Trend */}
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-800 mb-4">Mood Trend</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-secondary-600">Current Mood Score</span>
              <div className="flex items-center">
                <span className={`text-2xl font-bold ${getMoodColor(mood_trend.current)}`}>
                  {(mood_trend.current * 100).toFixed(0)}
                </span>
                <span className="text-secondary-600 ml-2">/100</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-secondary-600">Trend</span>
              <div className="flex items-center">
                {getMoodIcon(mood_trend.trend)}
                <span className="ml-2 capitalize text-secondary-800">{mood_trend.trend}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-secondary-600">Data Points</span>
              <span className="text-secondary-800">{mood_trend.data_points}</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-800 mb-4">Quick Stats</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Activity className="h-5 w-5 text-blue-600 mr-3" />
                <span className="text-secondary-600">Total Interactions</span>
              </div>
              <span className="font-semibold text-secondary-800">{stats.total_interactions}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-green-600 mr-3" />
                <span className="text-secondary-600">Recent Notes</span>
              </div>
              <span className="font-semibold text-secondary-800">{stats.recent_notes}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
                <span className="text-secondary-600">Active Alerts</span>
              </div>
              <span className="font-semibold text-secondary-800">{stats.active_alerts}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-purple-600 mr-3" />
                <span className="text-secondary-600">Last Contact</span>
              </div>
              <span className="font-semibold text-secondary-800">
                {formatDate(last_contact)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Red Flags */}
      {red_flags.count > 0 && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold text-secondary-800 mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            Red Flags ({red_flags.count})
          </h3>
          <div className="space-y-2">
            {red_flags.recent.map((flag, index) => (
              <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="text-red-800 font-medium">Red Flag Detected</span>
                  <span className="text-sm text-red-600">{formatDate(flag.date)}</span>
                </div>
                <p className="text-sm text-red-700 mt-1">Type: {flag.type}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Alerts */}
      {active_alerts.length > 0 && (
        <div className="card mb-6">
          <h3 className="text-lg font-semibold text-secondary-800 mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
            Active Alerts
          </h3>
          <div className="space-y-3">
            {active_alerts.map((alert) => (
              <div key={alert.id} className={`border rounded-lg p-4 ${
                alert.severity >= 4 ? 'border-red-300 bg-red-50' : 
                alert.severity >= 2 ? 'border-yellow-300 bg-yellow-50' : 
                'border-blue-300 bg-blue-50'
              }`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-secondary-800">{alert.title}</h4>
                    <p className="text-sm text-secondary-600 mt-1">{alert.message}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      alert.severity >= 4 ? 'bg-red-100 text-red-800' :
                      alert.severity >= 2 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      Severity {alert.severity}
                    </span>
                    <p className="text-xs text-secondary-500 mt-1">{formatDate(alert.created_at)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes Preview */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-secondary-800">Recent Notes</h3>
          <button
            onClick={() => setShowAddNoteModal(true)}
            className="btn-primary text-sm flex items-center"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Note
          </button>
        </div>
        {notes_preview.length === 0 ? (
          <p className="text-secondary-600 text-center py-4">No notes available</p>
        ) : (
          <div className="space-y-4">
            {notes_preview.map((note) => (
              <div key={note.id} className="border border-secondary-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-secondary-800">{note.title}</h4>
                  <span className="text-xs text-secondary-500">{formatDate(note.created_at)}</span>
                </div>
                <p className="text-sm text-secondary-600 mb-2">{note.content}</p>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                  note.note_type === 'assessment' ? 'bg-blue-100 text-blue-800' :
                  note.note_type === 'treatment' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {note.note_type}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Note Modal */}
      <AddNoteModal
        isOpen={showAddNoteModal}
        onClose={() => setShowAddNoteModal(false)}
        patientId={id}
        onNoteAdded={handleNoteAdded}
      />
    </div>
  )
}

export default PatientDetail
