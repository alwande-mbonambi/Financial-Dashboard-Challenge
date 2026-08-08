import { useState, useMemo, useEffect } from 'react'
import Modal from './Modal.jsx'
import ConfirmModal from './ConfirmModal.jsx'
import CategoryFormModal from './CategoryFormModal.jsx'
import TransactionFormModal from './TransactionFormModal.jsx'
import { useData } from '../context/DataContext.jsx'
import { formatCurrency } from '../utils/formatCurrency.js'
import { Plus, Search, Pencil, Trash2, ArrowLeft } from 'lucide-react'

export default function CategoryManagerModal({ type = 'expense', onClose }) {
  const {
    categories, transactions, deleteCategory, reassignCategory, reassignCategoryToOther,
    notify, getCategoryBudget, getCategoryBudgetAllYears, fetchBudgetsByYear,
    addTransaction, updateTransaction, deleteTransaction,
  } = useData()
  const isExpense = type === 'expense'

  const [search, setSearch] = useState('')
  const [categoryFormMode, setCategoryFormMode] = useState(null) // 'new' | category object | null
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [reassignChoice, setReassignChoice] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // The checkbox: OFF (default) = all-time totals, matching how Income
  // already reads. ON = a specific year's budget/spend, with a year
  // picker next to it — this is the only state that needs to exist for
  // the whole "Budget year" feature described.
  const [yearFilterOn, setYearFilterOn] = useState(false)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  useEffect(() => {
    if (yearFilterOn) fetchBudgetsByYear(selectedYear)
  }, [yearFilterOn, selectedYear, fetchBudgetsByYear])

  // Drill-in state: which category's transactions we're viewing
  const [viewingCategory, setViewingCategory] = useState(null)
  const [drillSearch, setDrillSearch] = useState('')
  const [txFormMode, setTxFormMode] = useState(null) // 'new' | transaction | null
  const [txDeleteTarget, setTxDeleteTarget] = useState(null)

  const availableYears = useMemo(() => {
    const years = new Set(transactions.map((t) => new Date(t.date).getFullYear()))
    years.add(new Date().getFullYear())
    return Array.from(years).sort((a, b) => b - a)
  }, [transactions])

  const filteredCategories = categories
    .filter((c) => c.type === type)
    .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))

  const categoryTxCount = (categoryId) => {
    if (!yearFilterOn) return transactions.filter((t) => Number(t.categoryId) === Number(categoryId)).length
    return transactions.filter(
      (t) => Number(t.categoryId) === Number(categoryId) && new Date(t.date).getFullYear() === selectedYear,
    ).length
  }

  const categoryTotal = (categoryId) => {
    // "Spent" for expense, "Income" for income — same calculation, all-time or year-scoped
    const rows = transactions.filter((t) => {
      if (Number(t.categoryId) !== Number(categoryId)) return false
      if (yearFilterOn && new Date(t.date).getFullYear() !== selectedYear) return false
      return true
    })
    return rows.reduce((sum, t) => sum + Number(t.amount), 0)
  }

  const requestDelete = async (cat) => {
    try {
      await deleteCategory(cat.id)
      notify(`"${cat.name}" deleted`)
    } catch (err) {
      if (err.code === 'CATEGORY_HAS_TRANSACTIONS') {
        setDeleteTarget({ category: cat, count: err.transactionCount || err.transaction_count || 0 })
        setReassignChoice('')
      } else {
        notify(err.message || 'Failed to delete category', 'error')
      }
    }
  }

  const confirmReassignDelete = async () => {
    if (!deleteTarget) return
    setSubmitting(true)
    try {
      if (reassignChoice === '__auto__') await reassignCategoryToOther(deleteTarget.category.id)
      else if (reassignChoice) await reassignCategory(deleteTarget.category.id, Number(reassignChoice))
      else { setSubmitting(false); return }
      notify(`"${deleteTarget.category.name}" deleted and transactions reassigned`)
      setDeleteTarget(null)
      setReassignChoice('')
    } catch (err) {
      notify(err.message || 'Failed to reassign category', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  const otherCategoriesForReassign = deleteTarget
    ? categories.filter((c) => c.id !== deleteTarget.category.id && c.type === deleteTarget.category.type)
    : []

  // ---------- Drill-in view: transactions within one category ----------
  if (viewingCategory) {
    const rows = transactions
      .filter((t) => Number(t.categoryId) === Number(viewingCategory.id))
      .filter((t) => (yearFilterOn ? new Date(t.date).getFullYear() === selectedYear : true))
      .filter((t) => (t.reference || '').toLowerCase().includes(drillSearch.toLowerCase())
        || (t.notes || '').toLowerCase().includes(drillSearch.toLowerCase()))
      .sort((a, b) => new Date(b.date) - new Date(a.date))

    return (
      <Modal title={`${viewingCategory.name} — Transactions`} onClose={onClose} width="820px">
        <div className="category-drill-header">
          <button className="btn-icon" onClick={() => setViewingCategory(null)} aria-label="Back">
            <ArrowLeft size={16} />
          </button>
          <h3>{viewingCategory.name}{yearFilterOn ? ` — ${selectedYear}` : ' — All time'}</h3>
        </div>

        <div className="form-row" style={{ alignItems: 'flex-end', marginBottom: 16 }}>
          <div className="search-input-wrap" style={{ flex: 1 }}>
            <Search />
            <input placeholder="Search reference or notes…" value={drillSearch} onChange={(e) => setDrillSearch(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={() => setTxFormMode('new')}>
            <Plus size={16} /> Add transaction
          </button>
        </div>

        <table>
          <thead>
            <tr><th>Date</th><th>Reference</th><th>Notes</th><th>Method</th><th className="num">Amount</th><th style={{ textAlign: 'right' }}>Actions</th></tr>
          </thead>
          <tbody>
            {rows.map((t) => (
              <tr key={t.id}>
                <td>{t.date}</td>
                <td>{t.reference}</td>
                <td>{t.notes}</td>
                <td>{t.paymentMethod}</td>
                <td className={`num ${isExpense ? 'amount-expense' : 'amount-income'}`}>{formatCurrency(t.amount)}</td>
                <td>
                  <div className="row-actions">
                    <button className="btn-icon" onClick={() => setTxFormMode(t)} aria-label="Edit"><Pencil size={15} /></button>
                    <button className="btn-icon" onClick={() => setTxDeleteTarget(t)} aria-label="Delete"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--ink-muted)', padding: 24 }}>No transactions{yearFilterOn ? ` in ${selectedYear}` : ''}.</td></tr>
            )}
          </tbody>
        </table>

        {txFormMode && (
          <TransactionFormModal
            type={type}
            initialData={txFormMode === 'new' ? null : txFormMode}
            presetCategoryId={txFormMode === 'new' ? viewingCategory.id : undefined}
            onClose={() => setTxFormMode(null)}
          />
        )}

        {txDeleteTarget && (
          <ConfirmModal
            message={`Delete the ${formatCurrency(txDeleteTarget.amount)} transaction on ${txDeleteTarget.date}?`}
            onCancel={() => setTxDeleteTarget(null)}
            onConfirm={async () => {
              await deleteTransaction(txDeleteTarget.id)
              notify('Transaction deleted')
              setTxDeleteTarget(null)
            }}
          />
        )}
      </Modal>
    )
  }

  // ---------- Main category list ----------
  return (
    <Modal title="Manage Categories and Transactions" onClose={onClose} width="900px">
      <div className="form-row" style={{ alignItems: 'flex-end', marginBottom: 10 }}>
        <div className="search-input-wrap" style={{ flex: 1 }}>
          <Search />
          <input placeholder="Search categories…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={() => setCategoryFormMode('new')}>
          <Plus size={16} /> Add category
        </button>
      </div>

      <div className="pencil-edit-row" style={{ marginBottom: 16 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600, color: 'var(--ink-muted)' }}>
          <input type="checkbox" checked={yearFilterOn} onChange={(e) => setYearFilterOn(e.target.checked)} />
          Budget year
        </label>
        {yearFilterOn && (
          <select value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} style={{ width: 110 }}>
            {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        )}
      </div>

      <table>
        <thead>
          {isExpense ? (
            yearFilterOn ? (
              <tr><th>Category</th><th className="num">Budget ({selectedYear})</th><th className="num">Spent ({selectedYear})</th><th>Status</th><th className="num">Transactions</th><th style={{ textAlign: 'right' }}>Actions</th></tr>
            ) : (
              <tr><th>Category</th><th className="num">Expense (all-time)</th><th className="num">Transactions</th><th style={{ textAlign: 'right' }}>Actions</th></tr>
            )
          ) : (
            <tr><th>Category</th><th className="num">Income ({yearFilterOn ? selectedYear : 'all-time'})</th><th className="num">Transactions</th><th style={{ textAlign: 'right' }}>Actions</th></tr>
          )}
        </thead>
        <tbody>
          {filteredCategories.map((c) => {
            const spent = categoryTotal(c.id)
            const txCount = categoryTxCount(c.id)
            const budget = isExpense
              ? (yearFilterOn ? getCategoryBudget(c.id, selectedYear) : getCategoryBudgetAllYears(c.id))
              : null
            const over = isExpense && budget > 0 && spent > budget

            return (
              <tr key={c.id}>
                <td>{c.name}</td>
                {isExpense && yearFilterOn && (
                  <td className="num">{budget ? formatCurrency(budget) : <span className="tag">No budget set</span>}</td>
                )}
                <td className="num amount-expense" style={{ color: isExpense ? undefined : 'var(--income)' }}>
                  {formatCurrency(spent)}
                </td>
                {isExpense && yearFilterOn && (
                  <td><span className={`tag ${over ? 'tag-over' : budget ? 'tag-income' : ''}`}>{budget ? (over ? 'Over budget' : 'On track') : '—'}</span></td>
                )}
                <td className="num">
                  <button type="button" className="link-btn" onClick={() => setViewingCategory(c)}>
                    {txCount} — View
                  </button>
                </td>
                <td>
                  <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
                    <button className="btn-icon" onClick={() => setCategoryFormMode(c)} aria-label="Edit"><Pencil size={15} /></button>
                    <button className="btn-icon" onClick={() => requestDelete(c)} aria-label="Delete"><Trash2 size={15} /></button>
                  </div>
                </td>
              </tr>
            )
          })}
          {filteredCategories.length === 0 && (
            <tr><td colSpan={isExpense && yearFilterOn ? 6 : 4} style={{ textAlign: 'center', color: 'var(--ink-muted)', padding: 24 }}>No categories match your search.</td></tr>
          )}
        </tbody>
      </table>

      {categoryFormMode && (
        <CategoryFormModal
          type={type}
          budgetYear={selectedYear}
          initialData={categoryFormMode === 'new' ? null : categoryFormMode}
          onClose={() => setCategoryFormMode(null)}
        />
      )}

      {deleteTarget && (
        <Modal
          title="Deletion blocked"
          onClose={() => setDeleteTarget(null)}
          width="440px"
          footer={(
            <>
              <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)} disabled={submitting}>Cancel</button>
              <button className="btn btn-danger" disabled={!reassignChoice || submitting} onClick={confirmReassignDelete}>
                {submitting ? 'Reassigning...' : 'Reassign & delete'}
              </button>
            </>
          )}
        >
          <p style={{ marginTop: 0, fontSize: 14 }}>
            <strong>{deleteTarget.category.name}</strong> has {deleteTarget.count} transaction(s) attached.
            Re-assign them to another category, or auto-reassign to "Other".
          </p>
          <div className="field" style={{ marginBottom: 10 }}>
            <label>Re-assign to</label>
            <select value={reassignChoice} onChange={(e) => setReassignChoice(e.target.value)}>
              <option value="">Choose a category…</option>
              {otherCategoriesForReassign.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <button type="button" className="link-btn" onClick={() => setReassignChoice('__auto__')}>
            Auto-reassign to "Other" instead
          </button>
          {reassignChoice === '__auto__' && (
            <p className="helper-text" style={{ marginTop: 8 }}>Will create an "Other" category if one doesn't exist yet.</p>
          )}
        </Modal>
      )}
    </Modal>
  )
}