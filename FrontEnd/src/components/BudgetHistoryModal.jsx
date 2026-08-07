import { useState, useEffect } from 'react'
import Modal from './Modal.jsx'
import ConfirmModal from './ConfirmModal.jsx'
import { useData } from '../context/DataContext.jsx'
import { formatCurrency } from '../utils/formatCurrency.js'
import { Pencil, Trash2, Plus, Check, X as XIcon } from 'lucide-react'

export default function BudgetHistoryModal({ onClose }) {
  const {
    listOverallBudgetYears,
    getOverallBudget,
    setOverallBudget,
    deleteOverallBudget,
    fetchBudgetsByYear,
    budgetsByYear,
    categories,
    getCategoryBudget,
    setCategoryBudget,
    notify,
    earliestTransactionYear,
    latestTransactionYear,
  } = useData()

  const years = listOverallBudgetYears()
  const [editingYear, setEditingYear] = useState(null)
  const [draftYear, setDraftYear] = useState(new Date().getFullYear())
  const [draftAmount, setDraftAmount] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const [bulkYear, setBulkYear] = useState(null)
  const [bulkAmounts, setBulkAmounts] = useState({})
  const expenseCategories = categories.filter((c) => c.type === 'expense')

  useEffect(() => {
    const currentYear = new Date().getFullYear()
    const startYear = Math.min(earliestTransactionYear, currentYear)
    const endYear = Math.max(latestTransactionYear, currentYear)

    for (let y = startYear; y <= endYear; y++) {
      if (!budgetsByYear[y]) {
        fetchBudgetsByYear(y)
      }
    }
  }, [earliestTransactionYear, latestTransactionYear, budgetsByYear, fetchBudgetsByYear])

  const startEdit = (year) => {
    setEditingYear(year)
    setDraftYear(year)
    setDraftAmount(getOverallBudget(year))
  }

  const startNew = () => {
    const candidate =
      [...Array(latestTransactionYear - earliestTransactionYear + 2)]
        .map((_, i) => earliestTransactionYear + i)
        .find((y) => !years.includes(y)) || new Date().getFullYear()
    setEditingYear('new')
    setDraftYear(candidate)
    setDraftAmount('')
  }

  const cancelEdit = () => {
    setEditingYear(null)
    setDraftAmount('')
  }

  const save = async () => {
    const amount = Number(draftAmount)
    if (!draftYear || amount <= 0) return
    const year = Number(draftYear)
    const wasNew = editingYear === 'new'

    setSubmitting(true)
    try {
      await setOverallBudget(year, amount)
      notify(`Yearly budget for ${year} saved`)
      cancelEdit()
      if (wasNew && expenseCategories.length > 0) {
        const seeded = {}
        expenseCategories.forEach((c) => {
          seeded[c.id] = getCategoryBudget(c.id, year) || ''
        })
        setBulkAmounts(seeded)
        setBulkYear(year)
      }
    } catch (err) {
      notify(err.message || 'Failed to save budget', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const saveBulk = async () => {
    setSubmitting(true)
    try {
      await Promise.all(
        expenseCategories.map(async (c) => {
          const v = bulkAmounts[c.id]
          if (v !== '' && v !== undefined && Number(v) > 0) {
            await setCategoryBudget(c.id, bulkYear, Number(v))
          }
        })
      )
      notify(`Category budgets for ${bulkYear} saved`)
      setBulkYear(null)
    } catch (err) {
      notify(err.message || 'Failed to save category budgets', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const confirmDelete = async () => {
    try {
      await deleteOverallBudget(deleteTarget)
      notify(`Yearly budget for ${deleteTarget} deleted`)
    } catch (err) {
      notify(err.message || 'Failed to delete budget', 'error')
    } finally {
      setDeleteTarget(null)
    }
  }

  if (bulkYear !== null) {
    return (
      <Modal
        title={`Set category budgets for ${bulkYear}`}
        onClose={() => setBulkYear(null)}
        width="480px"
        footer={(
          <>
            <button
              className="btn btn-secondary"
              onClick={() => setBulkYear(null)}
              disabled={submitting}
            >
              Skip for now
            </button>
            <button className="btn btn-primary" onClick={saveBulk} disabled={submitting}>
              {submitting ? 'Saving...' : 'Save all'}
            </button>
          </>
        )}
      >
        <p className="panel-sub" style={{ marginTop: 0 }}>
          You just set the overall budget for {bulkYear}. Optionally give each expense category
          its own budget for {bulkYear} too — leave any blank to set them later from "Manage
          Categories and Transactions".
        </p>
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th className="num">Budget for {bulkYear}</th>
            </tr>
          </thead>
          <tbody>
            {expenseCategories.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td className="num">
                  <input
                    type="number"
                    min="0"
                    disabled={submitting}
                    style={{ width: 120, textAlign: 'right' }}
                    placeholder="0.00"
                    value={bulkAmounts[c.id] ?? ''}
                    onChange={(e) => setBulkAmounts({ ...bulkAmounts, [c.id]: e.target.value })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Modal>
    )
  }

  return (
    <Modal
      title="Yearly Budget History"
      onClose={onClose}
      width="520px"
      footer={<button className="btn btn-secondary" onClick={onClose}>Close</button>}
    >
      <p className="panel-sub" style={{ marginTop: 0 }}>
        Every yearly budget you've ever set, across every year with transactions.
      </p>

      {editingYear !== null && (
        <div
          className="form-row"
          style={{
            background: 'var(--surface-sunken)',
            padding: 12,
            borderRadius: 10,
            marginBottom: 14,
          }}
        >
          <div className="field">
            <label>Year</label>
            <input
              type="number"
              disabled={editingYear !== 'new' || submitting}
              value={draftYear}
              onChange={(e) => setDraftYear(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Amount</label>
            <input
              type="number"
              min="0"
              autoFocus
              disabled={submitting}
              value={draftAmount}
              onChange={(e) => setDraftAmount(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
            <button className="btn-icon" onClick={save} disabled={submitting} aria-label="Save">
              <Check size={16} />
            </button>
            <button
              className="btn-icon"
              onClick={cancelEdit}
              disabled={submitting}
              aria-label="Cancel"
            >
              <XIcon size={16} />
            </button>
          </div>
        </div>
      )}

      {years.length === 0 && editingYear === null && (
        <div className="empty-state">
          <h3>No yearly budgets set yet</h3>
        </div>
      )}

      {years.length > 0 && (
        <table>
          <thead>
            <tr>
              <th>Year</th>
              <th className="num">Budget</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {years.map((y) => (
              <tr key={y}>
                <td>{y}</td>
                <td className="num">{formatCurrency(getOverallBudget(y))}</td>
                <td>
                  <div className="row-actions">
                    <button
                      className="btn-icon"
                      onClick={() => startEdit(y)}
                      aria-label="Edit"
                    >
                      <Pencil size={15} />
                    </button>
                    <button
                      className="btn-icon"
                      onClick={() => setDeleteTarget(y)}
                      aria-label="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {editingYear === null && (
        <button
          className="btn btn-secondary"
          style={{ marginTop: 14 }}
          onClick={startNew}
        >
          <Plus size={16} /> Add a budget for another year
        </button>
      )}

      {deleteTarget !== null && (
        <ConfirmModal
          title="Delete this yearly budget?"
          message={`This removes the ${deleteTarget} yearly budget. Category budgets for ${deleteTarget} are unaffected.`}
          onConfirm={confirmDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
    </Modal>
  )
}