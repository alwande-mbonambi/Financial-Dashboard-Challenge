import { useState, useMemo } from 'react'
import Layout from './Layout.jsx'
import Pagination from './Pagination.jsx'
import EmptyState from './EmptyState.jsx'
import ConfirmModal from './ConfirmModal.jsx'
import TransactionFormModal from './TransactionFormModal.jsx'
import CategoryManagerModal from './CategoryManagerModal.jsx'
import YearlyBudgetWidget from './YearlyBudgetWidget.jsx'
import { useData } from '../context/DataContext.jsx'
import { formatCurrency } from '../utils/formatCurrency.js'
import { Plus, Search, SlidersHorizontal, Pencil, Trash2, Wallet, FolderCog } from 'lucide-react'

const PAGE_SIZE = 5

export default function TransactionListPage({ type }) {
  const { transactions, categories, deleteTransaction, notify } = useData()
  const isExpense = type === 'expense'

  const [search, setSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [amountMin, setAmountMin] = useState('')
  const [amountMax, setAmountMax] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [sortBy, setSortBy] = useState('date_desc')
  const [page, setPage] = useState(1)

  const [showAddModal, setShowAddModal] = useState(false)
  const [editingTx, setEditingTx] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [showManageCategories, setShowManageCategories] = useState(false)

  const categoryName = (id) => categories.find((c) => Number(c.id) === Number(id))?.name || '—'

  const filtered = useMemo(() => {
    let rows = transactions.filter((t) => t.type === type)
    if (search) {
      const s = search.toLowerCase()
      rows = rows.filter((t) => [t.reference, categoryName(t.categoryId), t.paymentMethod, t.notes].some((f) => f?.toLowerCase().includes(s)))
    }
    if (dateFrom) rows = rows.filter((t) => t.date >= dateFrom)
    if (dateTo) rows = rows.filter((t) => t.date <= dateTo)
    if (amountMin) rows = rows.filter((t) => Number(t.amount) >= Number(amountMin))
    if (amountMax) rows = rows.filter((t) => Number(t.amount) <= Number(amountMax))

    rows = [...rows].sort((a, b) => {
      if (sortBy === 'date_desc') return new Date(b.date) - new Date(a.date)
      if (sortBy === 'date_asc') return new Date(a.date) - new Date(b.date)
      if (sortBy === 'amount_desc') return Number(b.amount) - Number(a.amount)
      if (sortBy === 'amount_asc') return Number(a.amount) - Number(b.amount)
      return 0
    })
    return rows
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactions, type, search, dateFrom, dateTo, amountMin, amountMax, sortBy, categories])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageRows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const hasAnyOfType = transactions.some((t) => t.type === type)

  const clearFilters = () => { setSearch(''); setDateFrom(''); setDateTo(''); setAmountMin(''); setAmountMax('') }

  const changePage = (p) => { if (p >= 1 && p <= totalPages) setPage(p) }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    try {
      await deleteTransaction(deleteTarget.id)
      notify('Transaction deleted')
    } catch (err) {
      notify(err.message || 'Failed to delete transaction', 'danger')
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <Layout
      title={isExpense ? 'Expenses' : 'Income'}
      actions={(
        <>
          <button className="btn btn-secondary" onClick={() => setShowManageCategories(true)}>
            <FolderCog size={16} /> Manage Categories and Transactions
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Add {isExpense ? 'expense' : 'income'}
          </button>
        </>
      )}
    >
      {isExpense && <YearlyBudgetWidget />}

      <div className="panel">
        <div className="form-row" style={{ marginBottom: showFilters ? 12 : 0 }}>
          <div className="search-input-wrap">
            <Search />
            <input placeholder="Search reference, category, method…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} />
          </div>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} style={{ maxWidth: 190 }}>
            <option value="date_desc">Newest first</option>
            <option value="date_asc">Oldest first</option>
            <option value="amount_desc">Amount: high to low</option>
            <option value="amount_asc">Amount: low to high</option>
          </select>
          <button className="btn btn-secondary" onClick={() => setShowFilters((v) => !v)}>
            <SlidersHorizontal size={15} /> Filters
          </button>
        </div>

        {showFilters && (
          <div className="form-row">
            <div className="field"><label>From date</label><input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1) }} /></div>
            <div className="field"><label>To date</label><input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1) }} /></div>
            <div className="field"><label>Min amount</label><input type="number" value={amountMin} onChange={(e) => { setAmountMin(e.target.value); setPage(1) }} /></div>
            <div className="field"><label>Max amount</label><input type="number" value={amountMax} onChange={(e) => { setAmountMax(e.target.value); setPage(1) }} /></div>
          </div>
        )}

        {filtered.length === 0 ? (
          !hasAnyOfType ? (
            <EmptyState
              icon={<Wallet />}
              heading={isExpense ? 'No expenses recorded yet' : 'No income recorded yet'}
              text="Add your first record to start tracking your finances."
              actionLabel={isExpense ? 'Add expense' : 'Add income'}
              onAction={() => setShowAddModal(true)}
            />
          ) : (
            <EmptyState
              heading="No transactions match your filters"
              actionLabel="Clear filters"
              onAction={clearFilters}
            />
          )
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>Date</th><th className="num">Amount</th><th>Category</th><th>Reference</th><th>Method</th><th>Notes</th><th></th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((t) => (
                  <tr key={t.id}>
                    <td>{t.date}</td>
                    <td className={`num ${isExpense ? 'amount-expense' : 'amount-income'}`}>{formatCurrency(t.amount)}</td>
                    <td>{categoryName(t.categoryId)}</td>
                    <td>{t.reference || '—'}</td>
                    <td>{t.paymentMethod}</td>
                    <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.notes || '—'}</td>
                    <td>
                      <div className="row-actions">
                        <button className="btn-icon" onClick={() => setEditingTx(t)} aria-label="Edit"><Pencil size={15} /></button>
                        <button className="btn-icon" onClick={() => setDeleteTarget(t)} aria-label="Delete"><Trash2 size={15} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination page={page} totalPages={totalPages} onChange={changePage} />
          </>
        )}
      </div>

      {showAddModal && <TransactionFormModal type={type} onClose={() => setShowAddModal(false)} />}
      {editingTx && <TransactionFormModal type={type} initialData={editingTx} onClose={() => setEditingTx(null)} />}
      {deleteTarget && (
        <ConfirmModal
          title="Delete transaction?"
          message={`This will permanently delete the ${formatCurrency(deleteTarget.amount)} transaction on ${deleteTarget.date}.`}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
        />
      )}
      {showManageCategories && <CategoryManagerModal type={type} onClose={() => setShowManageCategories(false)} />}
    </Layout>
  )
}