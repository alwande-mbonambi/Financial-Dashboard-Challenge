import { useState, useMemo } from 'react'
import { useData } from '../context/DataContext.jsx'
import { formatCurrency } from '../utils/formatCurrency.js'
import BudgetHistoryModal from './BudgetHistoryModal.jsx'
import { Pencil, Check, X as XIcon, History } from 'lucide-react'

export default function YearlyBudgetWidget() {
  const {
    getOverallBudget,
    setOverallBudget,
    notify,
    categories,
    getCategoryBudget,
    transactions,
  } = useData()

  const latestYear = new Date().getFullYear()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const [saving, setSaving] = useState(false)

  const yearlyBudget = getOverallBudget(latestYear)

  const categoryBudgetsTotal = useMemo(
    () =>
      categories
        .filter((c) => c.type === 'expense')
        .reduce((s, c) => s + getCategoryBudget(c.id, latestYear), 0),
    [categories, getCategoryBudget, latestYear]
  )

  const overallSpent = useMemo(
    () =>
      transactions
        .filter((t) => t.type === 'expense' && new Date(t.date).getFullYear() === latestYear)
        .reduce((s, t) => s + Number(t.amount), 0),
    [transactions, latestYear]
  )

  const startEdit = () => {
    setDraft(yearlyBudget || '')
    setEditing(true)
  }

  const save = async () => {
    const v = Number(draft)
    if (v > 0) {
      setSaving(true)
      try {
        await setOverallBudget(latestYear, v)
        notify(`Yearly budget for ${latestYear} saved`)
      } catch (err) {
        notify(err.message || 'Failed to save budget', 'error')
      } finally {
        setSaving(false)
      }
    }
    setEditing(false)
  }

  const pct = yearlyBudget ? Math.min(100, Math.round((overallSpent / yearlyBudget) * 100)) : 0
  const realPct = yearlyBudget ? Math.round((overallSpent / yearlyBudget) * 100) : 0
  const over = yearlyBudget > 0 && overallSpent > yearlyBudget
  const overBy = categoryBudgetsTotal - yearlyBudget

  return (
    <div className="panel panel-compact">
      <div className="panel-header">
        <h3>Yearly Budget — {latestYear}</h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {!editing ? (
            <div className="pencil-edit-row">
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 500 }}>
                {formatCurrency(yearlyBudget)}
              </span>
              <button
                className="btn-icon"
                onClick={startEdit}
                aria-label="Edit yearly budget"
              >
                <Pencil size={15} />
              </button>
            </div>
          ) : (
            <div className="pencil-edit-row">
              <input
                type="number"
                min="0"
                style={{ width: 120 }}
                autoFocus
                disabled={saving}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
              />
              <button className="btn-icon" onClick={save} disabled={saving} aria-label="Save">
                <Check size={16} />
              </button>
              <button
                className="btn-icon"
                onClick={() => setEditing(false)}
                disabled={saving}
                aria-label="Cancel"
              >
                <XIcon size={16} />
              </button>
            </div>
          )}
          <button className="btn btn-secondary btn-sm" onClick={() => setShowHistory(true)}>
            <History size={14} /> Budget history
          </button>
        </div>
      </div>

      <div className="progress-track">
        <div
          className="progress-fill"
          style={{
            width: `${pct}%`,
            background: over ? 'var(--expense)' : 'var(--accent)',
          }}
        />
      </div>
      <p className="panel-sub" style={{ marginTop: 6, marginBottom: 0 }}>
        {formatCurrency(overallSpent)} of {formatCurrency(yearlyBudget)} used
        {' — '}
        <span style={{ color: over ? 'var(--expense)' : 'var(--income)', fontWeight: 600 }}>
          {yearlyBudget > 0 ? `${realPct}% ${over ? 'over' : 'used'}` : 'no budget set'}
        </span>
      </p>

      {overBy > 0 && (
        <div className="warning-banner" style={{ marginTop: 10, marginBottom: 0 }}>
          Category budgets for {latestYear} total {formatCurrency(categoryBudgetsTotal)},{' '}
          {formatCurrency(overBy)} over the yearly budget.
        </div>
      )}

      {showHistory && <BudgetHistoryModal onClose={() => setShowHistory(false)} />}
    </div>
  )
}