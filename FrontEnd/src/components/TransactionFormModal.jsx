import { useState } from 'react'
import Modal from './Modal.jsx'
import { useData } from '../context/DataContext.jsx'

const PAYMENT_METHODS = ['Cash', 'Card', 'EFT']

function blankForm(presetCategoryId) {
  return {
    date: new Date().toISOString().slice(0, 10),
    amount: '',
    categoryId: presetCategoryId || '',
    reference: '',
    notes: '',
    paymentMethod: 'Cash',
  }
}

export default function TransactionFormModal({ type, initialData, presetCategoryId, onClose }) {
  const {
    categories, addCategory, addTransaction, updateTransaction, notify,
    getOverallBudget, setOverallBudget,
  } = useData()

  const isEdit = Boolean(initialData?.id)
  const isExpense = type === 'expense'
  const typeCategories = categories.filter((c) => c.type === type)

  const [form, setForm] = useState(() => initialData || blankForm(presetCategoryId))
  const [showNewCategory, setShowNewCategory] = useState(false)
  const [newCategory, setNewCategory] = useState({ name: '' })
  const [fieldErrors, setFieldErrors] = useState({})

  const txYear = form.date ? new Date(form.date).getFullYear() : new Date().getFullYear()
  const yearHasBudget = getOverallBudget ? getOverallBudget(txYear) > 0 : true
  const [newYearBudget, setNewYearBudget] = useState('')

  const handleCategoryChange = (e) => {
    if (e.target.value === '__new__') { setShowNewCategory(true); return }
    setForm({ ...form, categoryId: e.target.value })
  }

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) return
    try {
      const created = await addCategory({ name: newCategory.name.trim(), type })
      setForm((prev) => ({ ...prev, categoryId: created.id }))
      setNewCategory({ name: '' })
      setShowNewCategory(false)
      notify(`"${newCategory.name.trim()}" category added`)
    } catch (err) {
      notify(err.message || 'Failed to create category', 'danger')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const errors = {}
    if (!form.date) errors.date = 'Date is required.'
    if (!form.amount || Number(form.amount) <= 0) errors.amount = 'Enter an amount greater than 0.'
    if (!form.categoryId) errors.category = 'Choose a category.'
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return }

    const payload = { ...form, type, amount: Number(form.amount) }
    try {
      if (isEdit) {
        await updateTransaction(initialData.id, payload)
        notify(`${isExpense ? 'Expense' : 'Income'} updated`)
      } else {
        await addTransaction(payload)
        if (isExpense && newYearBudget && Number(newYearBudget) > 0 && setOverallBudget) {
          setOverallBudget(txYear, Number(newYearBudget))
        }
        notify(`${isExpense ? 'Expense' : 'Income'} added`)
      }
      onClose()
    } catch (err) {
      notify(err.message || 'Failed to save transaction', 'danger')
    }
  }

  return (
    <Modal
      title={isEdit ? `Edit ${isExpense ? 'expense' : 'income'}` : `Add ${isExpense ? 'expense' : 'income'}`}
      onClose={onClose}
      width="480px"
      footer={(
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit}>{isEdit ? 'Save changes' : 'Add ' + type}</button>
        </>
      )}
    >
      <form onSubmit={handleSubmit}>
        <div className="form-row">
          <div className="field">
            <label>Date {fieldErrors.date && <span className="field-error-label">— {fieldErrors.date}</span>}</label>
            <input
              type="date"
              className={fieldErrors.date ? 'input-error' : ''}
              value={form.date}
              onChange={(e) => { setForm({ ...form, date: e.target.value }); setFieldErrors({ ...fieldErrors, date: null }) }}
            />
          </div>
          <div className="field">
            <label>Amount {fieldErrors.amount && <span className="field-error-label">— {fieldErrors.amount}</span>}</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="0.00"
              className={fieldErrors.amount ? 'input-error' : ''}
              value={form.amount}
              onChange={(e) => { setForm({ ...form, amount: e.target.value }); setFieldErrors({ ...fieldErrors, amount: null }) }}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="field">
            <label>Category {fieldErrors.category && <span className="field-error-label">— {fieldErrors.category}</span>}</label>
            <select
              className={fieldErrors.category ? 'input-error' : ''}
              value={showNewCategory ? '__new__' : form.categoryId}
              onChange={handleCategoryChange}
            >
              <option value="">Select a category…</option>
              {typeCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              <option value="__new__">+ Add new category</option>
            </select>
          </div>
          <div className="field">
            <label>Payment method</label>
            <select value={form.paymentMethod} onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}>
              {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>

        {showNewCategory && (
          <div className="form-row" style={{ background: 'var(--surface-sunken)', padding: 12, borderRadius: 10 }}>
            <div className="field">
              <label>New category name</label>
              <input value={newCategory.name} onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })} />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button type="button" className="btn btn-primary btn-sm" onClick={handleAddCategory}>Save category</button>
            </div>
          </div>
        )}
        {showNewCategory && isExpense && (
          <p className="helper-text" style={{ marginTop: -8, marginBottom: 14 }}>
            You can set this category's budget afterwards from "Manage Categories and Transactions".
          </p>
        )}

        <div className="field" style={{ marginBottom: 14 }}>
          <label>Reference / Name</label>
          <input placeholder="e.g. Checkers, Invoice #12" value={form.reference || ''} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
        </div>

        <div className="field" style={{ marginBottom: isExpense && !yearHasBudget ? 14 : 4 }}>
          <label>Notes / Summary</label>
          <textarea rows={2} value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
        </div>

        {isExpense && !isEdit && !yearHasBudget && (
          <div className="field" style={{ marginBottom: 4, background: 'var(--surface-sunken)', padding: 12, borderRadius: 10 }}>
            <label>No yearly budget set for {txYear} yet — set one now (optional)</label>
            <input
              type="number"
              min="0"
              placeholder="e.g. 20000"
              value={newYearBudget}
              onChange={(e) => setNewYearBudget(e.target.value)}
            />
          </div>
        )}
      </form>
    </Modal>
  )
}