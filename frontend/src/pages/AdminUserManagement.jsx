import { useState, useEffect } from 'react'
import api from '../services/api'
import { Plus, Edit, Trash2, User, Stethoscope, Mail, Phone, Calendar } from 'lucide-react'

const AdminUserManagement = () => {
  const [activeTab, setActiveTab] = useState('doctors')
  const [doctors, setDoctors] = useState([])
  const [patients, setPatients] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({
    firebase_uid: '',
    email: '',
    first_name: '',
    last_name: '',
    phone: '',
    emergency_contact: '',
    emergency_phone: '',
    doctor_id: '',
    license_number: '',
    specialization: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [doctorsRes, patientsRes] = await Promise.all([
        api.get('/admin/doctors'),
        api.get('/admin/patients')
      ])
      setDoctors(doctorsRes.data)
      setPatients(patientsRes.data)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      if (activeTab === 'doctors') {
        await api.post('/admin/doctors', {
          firebase_uid: formData.firebase_uid,
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          license_number: formData.license_number,
          specialization: formData.specialization
        })
      } else {
        await api.post('/admin/patients', {
          firebase_uid: formData.firebase_uid,
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          emergency_contact: formData.emergency_contact,
          emergency_phone: formData.emergency_phone,
          doctor_id: formData.doctor_id ? parseInt(formData.doctor_id) : null
        })
      }
      await fetchData()
      setShowCreateModal(false)
      resetForm()
    } catch (error) {
      console.error('Error creating user:', error)
      alert('Error creating user: ' + (error.response?.data?.detail || error.message))
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    try {
      if (activeTab === 'doctors') {
        await api.put(`/admin/doctors/${editingUser.id}`, {
          firebase_uid: formData.firebase_uid,
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          license_number: formData.license_number,
          specialization: formData.specialization
        })
      } else {
        await api.put(`/admin/patients/${editingUser.id}`, {
          firebase_uid: formData.firebase_uid,
          email: formData.email,
          first_name: formData.first_name,
          last_name: formData.last_name,
          phone: formData.phone,
          emergency_contact: formData.emergency_contact,
          emergency_phone: formData.emergency_phone,
          doctor_id: formData.doctor_id ? parseInt(formData.doctor_id) : null
        })
      }
      await fetchData()
      setEditingUser(null)
      resetForm()
    } catch (error) {
      console.error('Error updating user:', error)
      alert('Error updating user: ' + (error.response?.data?.detail || error.message))
    }
  }

  const handleDelete = async (userId) => {
    if (!confirm('Are you sure you want to deactivate this user?')) return
    
    try {
      if (activeTab === 'doctors') {
        await api.delete(`/admin/doctors/${userId}`)
      } else {
        await api.delete(`/admin/patients/${userId}`)
      }
      await fetchData()
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Error deleting user: ' + (error.response?.data?.detail || error.message))
    }
  }

  const resetForm = () => {
    setFormData({
      firebase_uid: '',
      email: '',
      first_name: '',
      last_name: '',
      phone: '',
      emergency_contact: '',
      emergency_phone: '',
      doctor_id: '',
      license_number: '',
      specialization: ''
    })
  }

  const openEditModal = (user) => {
    setEditingUser(user)
    setFormData({
      firebase_uid: user.firebase_uid || '',
      email: user.email || '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      phone: user.phone || '',
      emergency_contact: user.emergency_contact || '',
      emergency_phone: user.emergency_phone || '',
      doctor_id: user.doctor_id || '',
      license_number: user.license_number || '',
      specialization: user.specialization || ''
    })
  }

  const closeModal = () => {
    setShowCreateModal(false)
    setEditingUser(null)
    resetForm()
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

  const currentData = activeTab === 'doctors' ? doctors : patients

  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-secondary-800 mb-2">User Management</h1>
        <p className="text-secondary-600">Create and manage doctor and patient profiles</p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setActiveTab('doctors')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'doctors' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Stethoscope className="w-4 h-4 inline mr-2" />
            Doctors ({doctors.length})
          </button>
          <button
            onClick={() => setActiveTab('patients')}
            className={`px-4 py-2 rounded-lg font-medium ${
              activeTab === 'patients' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <User className="w-4 h-4 inline mr-2" />
            Patients ({patients.length})
          </button>
        </div>
      </div>

      {/* Action Bar */}
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-secondary-800">
          {activeTab === 'doctors' ? 'Doctors' : 'Patients'}
        </h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add {activeTab === 'doctors' ? 'Doctor' : 'Patient'}
        </button>
      </div>

      {/* User List */}
      <div className="bg-white rounded-lg shadow">
        {currentData.length === 0 ? (
          <div className="p-6 text-center">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No {activeTab} found</h3>
            <p className="text-gray-500">Get started by creating a new {activeTab === 'doctors' ? 'doctor' : 'patient'} profile.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  {activeTab === 'doctors' ? (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">License</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specialization</th>
                    </>
                  ) : (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                    </>
                  )}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentData.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-semibold text-sm">
                            {user.first_name[0]}{user.last_name[0]}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="text-sm text-gray-500">ID: {user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <Mail className="w-4 h-4 mr-2 text-gray-400" />
                        {user.email}
                      </div>
                    </td>
                    {activeTab === 'doctors' ? (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.license_number}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.specialization || 'N/A'}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.phone ? (
                            <div className="flex items-center">
                              <Phone className="w-4 h-4 mr-2 text-gray-400" />
                              {user.phone}
                            </div>
                          ) : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {user.doctor_name || 'Unassigned'}
                        </td>
                      </>
                    )}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        user.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openEditModal(user)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingUser) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {editingUser ? 'Edit' : 'Create'} {activeTab === 'doctors' ? 'Doctor' : 'Patient'}
              </h3>
            </div>
            
            <form onSubmit={editingUser ? handleUpdate : handleCreate} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Firebase UID *</label>
                  <input
                    type="text"
                    value={formData.firebase_uid}
                    onChange={(e) => setFormData({...formData, firebase_uid: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({...formData, first_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    value={formData.last_name}
                    onChange={(e) => setFormData({...formData, last_name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {activeTab === 'doctors' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">License Number *</label>
                      <input
                        type="text"
                        value={formData.license_number}
                        onChange={(e) => setFormData({...formData, license_number: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                      <input
                        type="text"
                        value={formData.specialization}
                        onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Assigned Doctor</label>
                      <select
                        value={formData.doctor_id}
                        onChange={(e) => setFormData({...formData, doctor_id: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select Doctor</option>
                        {doctors.map(doctor => (
                          <option key={doctor.id} value={doctor.id}>
                            Dr. {doctor.first_name} {doctor.last_name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
                      <input
                        type="text"
                        value={formData.emergency_contact}
                        onChange={(e) => setFormData({...formData, emergency_contact: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Phone</label>
                      <input
                        type="tel"
                        value={formData.emergency_phone}
                        onChange={(e) => setFormData({...formData, emergency_phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </>
                )}
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={closeModal}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                >
                  {editingUser ? 'Update' : 'Create'} {activeTab === 'doctors' ? 'Doctor' : 'Patient'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminUserManagement
