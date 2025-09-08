import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Search, 
  Filter, 
  Plus, 
  Eye,
  Phone,
  Mail,
  Calendar,
  AlertTriangle
} from 'lucide-react'
import { doctorsAPI } from '../services/api'

function PatientsList() {
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  useEffect(() => {
    fetchPatients()
  }, [])

  const fetchPatients = async () => {
    try {
      const response = await doctorsAPI.getPatients()
      setPatients(response.data)
    } catch (error) {
      console.error('Error fetching patients:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = 
      patient.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesFilter = 
      filterStatus === 'all' || 
      patient.status.toLowerCase() === filterStatus.toLowerCase()
    
    return matchesSearch && matchesFilter
  })

  const formatDate = (dateString) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-800 mb-2">Patients</h1>
        <p className="text-secondary-600">Manage your patient roster and view their progress</p>
      </div>

      {/* Search and Filters */}
      <div className="card mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-secondary-400" />
            <input
              type="text"
              placeholder="Search patients by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Filter className="h-5 w-5 text-secondary-400 mr-2" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="border border-secondary-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
            <button className="btn-primary flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Add Patient
            </button>
          </div>
        </div>
      </div>

      {/* Patients Table */}
      <div className="card">
        {filteredPatients.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-secondary-400" />
            </div>
            <h3 className="text-lg font-medium text-secondary-800 mb-2">No patients found</h3>
            <p className="text-secondary-600">
              {searchTerm || filterStatus !== 'all' 
                ? 'Try adjusting your search or filter criteria'
                : 'No patients have been assigned to you yet'
              }
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-secondary-200">
                  <th className="text-left py-3 px-4 font-medium text-secondary-600">Patient</th>
                  <th className="text-left py-3 px-4 font-medium text-secondary-600">Contact</th>
                  <th className="text-left py-3 px-4 font-medium text-secondary-600">Last Contact</th>
                  <th className="text-left py-3 px-4 font-medium text-secondary-600">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-secondary-600">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPatients.map((patient) => (
                  <tr key={patient.id} className="border-b border-secondary-100 hover:bg-secondary-50">
                    <td className="py-4 px-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-primary-600 font-semibold text-sm">
                            {patient.first_name[0]}{patient.last_name[0]}
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-secondary-800">
                            {patient.first_name} {patient.last_name}
                          </p>
                          <p className="text-sm text-secondary-600">ID: {patient.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center text-sm text-secondary-600">
                          <Mail className="h-4 w-4 mr-2" />
                          {patient.email}
                        </div>
                        {patient.phone && (
                          <div className="flex items-center text-sm text-secondary-600">
                            <Phone className="h-4 w-4 mr-2" />
                            {patient.phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center text-sm text-secondary-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        {formatDate(patient.last_contact)}
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        patient.status === 'Active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {patient.status}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <Link
                        to={`/doctor/patient/${patient.id}`}
                        className="btn-primary text-sm flex items-center"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Patient
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card text-center">
          <p className="text-2xl font-bold text-primary-600">{patients.length}</p>
          <p className="text-sm text-secondary-600">Total Patients</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-green-600">
            {patients.filter(p => p.status === 'Active').length}
          </p>
          <p className="text-sm text-secondary-600">Active Patients</p>
        </div>
        <div className="card text-center">
          <p className="text-2xl font-bold text-red-600">
            {patients.filter(p => p.status === 'Inactive').length}
          </p>
          <p className="text-sm text-secondary-600">Inactive Patients</p>
        </div>
      </div>
    </div>
  )
}

export default PatientsList
