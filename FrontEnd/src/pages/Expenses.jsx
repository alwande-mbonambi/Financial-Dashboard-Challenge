import { useState } from 'react'
import Layout from '../components/Layout.jsx'
import CategoryManagerModal from '../components/CategoryManagerModal.jsx'

export default function Expenses() {
  const [showCategoryModal, setShowCategoryModal] = useState(false)

  return (
    <Layout
      title="Expenses"
      actions={
        <button className="btn btn-secondary" onClick={() => setShowCategoryModal(true)}>
          Manage Categories
        </button>
      }
    >
      <p>Expenses page content coming soon.</p>

      {showCategoryModal && (
        <CategoryManagerModal
          type="expense"
          onClose={() => setShowCategoryModal(false)}
        />
      )}
    </Layout>
  )
}