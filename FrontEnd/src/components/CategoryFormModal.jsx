import { useState } from 'react'
import Modal from './Modal.jsx'
import { useData } from '../context/DataContext.jsx'

export default function CategoryFormModal({
  type,
  budgetYear = new Date().getFullYear(),
  initialData,
  onClose,
}) {
  const { addCategory, updateCategory, setCategoryBudget, getCategoryBudget, notify } = useData()
  const isEdit = Boolean(initialData?.id)
  const isExpense = (initialData?.type || type) === 'expense'

  const [name, setName] = useState(initialData?.name || '')
  const [budget, setBudget] = useState(
    isEdit && isExpense ? getCategoryBudget(initialData.id, budgetYear) || '' : ''
  )
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
        await updateCategory(initialData.id, { name: name.trim() })
        if (isExpense) {
          await setCategoryBudget(initialData.id, budgetYear, budget ? Number(budget) : 0)
        }
        notify(`"${name.trim()}" updated`)
      } else {
        const created = await addCategory({ name: name.trim(), type })
        if (isExpense && budget) {
          await setCategoryBudget(created.id, budgetYear, Number(budget))
        }
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
          <button className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={submitting}>
            {submitting ? 'Saving...' : isEdit ? 'Save changes' : 'Add category'}
          </button>
        </>
      )}
    >
      <div className="field" style={{ marginBottom: 14 }}>
        <label>
          Category name {error && <span className="field-error-label">— {error}</span>}
        </label>
        <input
          autoFocus
          className={error ? 'input-error' : ''}
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setError('')
          }}
        />
      </div>
      {isExpense && (
        <div className="field">
          <label>Budget for {budgetYear} (optional)</label>
          <input
            type="number"
            min="0"
            placeholder="e.g. 1800"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
          />
        </div>
      )}
    </Modal>
  )
}