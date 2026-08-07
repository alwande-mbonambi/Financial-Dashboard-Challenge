import { useState } from 'react'
import Modal from './Modal.jsx'
import { useData } from '../context/DataContext.jsx'

export default function CategoryFormModal({ type, initialData, onClose }) {
  const { addCategory, updateCategory, notify } = useData()
  const isEdit = Boolean(initialData?.id)

  const [name, setName] = useState(initialData?.name || '')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSave = async () => {
    if (!name.trim()) {
      setError('Category name is required.')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      if (isEdit) {
        await updateCategory(initialData.id, { name: name.trim(), type: initialData.type || type })
        notify(`"${name.trim()}" updated`)
      } else {
        await addCategory({ name: name.trim(), type })
        notify(`"${name.trim()}" category added`)
      }
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to save category')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      title={isEdit ? 'Edit category' : 'Add category'}
      onClose={onClose}
      width="420px"
      footer={(
        <>
          <button className="btn btn-secondary" onClick={onClose} disabled={submitting}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={submitting}>
            {submitting ? 'Saving...' : isEdit ? 'Save changes' : 'Add category'}
          </button>
        </>
      )}
    >
      <div className="field" style={{ marginBottom: 14 }}>
        <label>Category name {error && <span className="field-error-label">— {error}</span>}</label>
        <input
          autoFocus
          className={error ? 'input-error' : ''}
          value={name}
          onChange={(e) => { setName(e.target.value); setError('') }}
        />
      </div>
    </Modal>
  )
}