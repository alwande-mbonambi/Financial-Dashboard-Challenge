import { useState } from 'react'
import Modal from './Modal.jsx'
import ConfirmModal from './ConfirmModal.jsx'
import CategoryFormModal from './CategoryFormModal.jsx'
import { useData } from '../context/DataContext.jsx'
import { Plus, Search, Pencil, Trash2 } from 'lucide-react'

export default function CategoryManagerModal({ type = 'expense', onClose }) {
  const {
    categories,
    deleteCategory,
    reassignCategory,
    reassignCategoryToOther,
    notify,
  } = useData()

  const [search, setSearch] = useState('')
  const [categoryFormMode, setCategoryFormMode] = useState(null) // 'new' | category object | null
  const [deleteTarget, setDeleteTarget] = useState(null) // { category, error?, count? }
  const [reassignChoice, setReassignChoice] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const filteredCategories = categories
    .filter((c) => (type ? c.type === type : true))
    .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()))

  const requestDelete = async (cat) => {
    try {
      await deleteCategory(cat.id)
      notify(`"${cat.name}" deleted`)
    } catch (err) {
      if (err.code === 'CATEGORY_HAS_TRANSACTIONS') {
        setDeleteTarget({
          category: cat,
          error: err,
          count: err.transactionCount || err.transaction_count || 0,
        })
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
      if (reassignChoice === '__auto__') {
        await reassignCategoryToOther(deleteTarget.category.id)
      } else if (reassignChoice) {
        await reassignCategory(deleteTarget.category.id, Number(reassignChoice))
      } else {
        setSubmitting(false)
        return
      }

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

  return (
    <Modal title="Manage Categories" onClose={onClose} width="800px">
      <div className="form-row" style={{ alignItems: 'flex-end', marginBottom: 16 }}>
        <div className="search-input-wrap" style={{ flex: 1 }}>
          <Search />
          <input placeholder="Search categories…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className="btn btn-primary" onClick={() => setCategoryFormMode('new')}>
          <Plus size={16} /> Add category
        </button>
      </div>

      <table>
        <thead>
          <tr>
            <th>Category</th>
            <th>Type</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredCategories.map((c) => (
            <tr key={c.id}>
              <td>{c.name}</td>
              <td><span className={`tag ${c.type === 'expense' ? 'tag-expense' : 'tag-income'}`}>{c.type}</span></td>
              <td>
                <div className="row-actions" style={{ justifyContent: 'flex-end' }}>
                  <button className="btn-icon" onClick={() => setCategoryFormMode(c)} aria-label="Edit"><Pencil size={15} /></button>
                  <button className="btn-icon" onClick={() => requestDelete(c)} aria-label="Delete"><Trash2 size={15} /></button>
                </div>
              </td>
            </tr>
          ))}
          {filteredCategories.length === 0 && (
            <tr>
              <td colSpan={3} style={{ textAlign: 'center', color: 'var(--ink-muted)', padding: 24 }}>
                No categories match your search.
              </td>
            </tr>
          )}
        </tbody>
      </table>

      {categoryFormMode && (
        <CategoryFormModal
          type={type}
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
              {otherCategoriesForReassign.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
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