import { useState, useEffect } from 'react'
import { X, Save, FileText } from 'lucide-react'
import { doctorsAPI } from '../services/api'

function AddNoteModal({ isOpen, onClose, patientId, onNoteAdded }) {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    note_type: 'general'
  })
  const [saving, setSaving] = useState(false)
  const [draftSaved, setDraftSaved] = useState(false)
  const [errors, setErrors] = useState({})

  // Auto-save draft every 30 seconds
  useEffect(() => {
    if (!isOpen) return

    const interval = setInterval(() => {
      if (formData.content.length >= 10) {
        localStorage.setItem(`note_draft_${patientId}`, JSON.stringify(formData))
        setDraftSaved(true)
        setTimeout(() => setDraftSaved(false), 2000)
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [formData, patientId, isOpen])

  // Load draft on open
  useEffect(() => {
    if (isOpen) {
      const draft = localStorage.getItem(`note_draft_${patientId}`)
      if (draft) {
        setFormData(JSON.parse(draft))
      }
    }
  }, [isOpen, patientId])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setErrors(prev => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    const newErrors = {}
    if (!formData.title.trim()) newErrors.title = 'Title is required'
    if (formData.content.length < 10) newErrors.content = 'Content must be at least 10 characters'
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setSaving(true)
    try {
      await doctorsAPI.createNote(patientId, formData)
      
      // Clear draft
      localStorage.removeItem(`note_draft_${patientId}`)
      
      // Reset form
      setFormData({ title: '', content: '', note_type: 'general' })
      setErrors({})
      
      onNoteAdded?.()
      onClose()
    } catch (error) {
      console.error('Error creating note:', error)
      alert('Failed to create note. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    // Save draft before closing
    if (formData.content.length >= 10) {
      localStorage.setItem(`note_draft_${patientId}`, JSON.stringify(formData))
    }
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-secondary-200">
          <div className="flex items-center">
            <FileText className="h-6 w-6 text-primary-600 mr-3" />
            <h2 className="text-xl font-semibold text-secondary-800">Add Note</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-secondary-400 hover:text-secondary-600"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-secondary-700 mb-2">
                Note Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.title ? 'border-red-300' : 'border-secondary-300'
                }`}
                placeholder="Enter note title"
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Note Type */}
            <div>
              <label htmlFor="note_type" className="block text-sm font-medium text-secondary-700 mb-2">
                Note Type
              </label>
              <select
                id="note_type"
                name="note_type"
                value={formData.note_type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-secondary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="general">General</option>
                <option value="assessment">Assessment</option>
                <option value="treatment">Treatment Plan</option>
              </select>
            </div>

            {/* Content */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-secondary-700 mb-2">
                Note Content * (Minimum 10 characters)
              </label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleChange}
                rows={8}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.content ? 'border-red-300' : 'border-secondary-300'
                }`}
                placeholder="Enter detailed note content..."
              />
              <div className="flex justify-between items-center mt-1">
                {errors.content ? (
                  <p className="text-sm text-red-600">{errors.content}</p>
                ) : (
                  <p className="text-sm text-secondary-500">
                    {formData.content.length}/10 characters minimum
                  </p>
                )}
                {draftSaved && (
                  <p className="text-sm text-green-600 flex items-center">
                    <Save className="h-4 w-4 mr-1" />
                    Draft saved
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-secondary-200 mt-6">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || formData.content.length < 10}
              className="btn-primary flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Note
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AddNoteModal
