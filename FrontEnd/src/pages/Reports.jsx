import Layout from '../components/Layout.jsx'
import { useData } from '../context/DataContext.jsx'
import { Download } from 'lucide-react'

function toCsv(transactions, categories) {
  const categoryName = (id) => categories.find((c) => Number(c.id) === Number(id))?.name || ''
  const header = ['Date', 'Type', 'Category', 'Amount', 'Reference', 'Payment Method', 'Notes']
  const rows = transactions.map((t) => [
    t.date,
    t.type,
    categoryName(t.categoryId),
    t.amount,
    t.reference || '',
    t.paymentMethod || t.payment_method || '',
    (t.notes || '').replace(/\n/g, ' '),
  ])
  return [header, ...rows]
    .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n')
}

export default function Reports() {
  const { transactions, categories } = useData()

  const handleExport = () => {
    const csv = toCsv(transactions, categories)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Layout title="Reports / Export">
      <div className="panel">
        <h3>Export transactions</h3>
        <p className="panel-sub" style={{ marginBottom: 16 }}>
          Download every income and expense record as a CSV file — {transactions.length} transaction
          {transactions.length === 1 ? '' : 's'} in total.
        </p>
        <button className="btn btn-primary" onClick={handleExport} disabled={transactions.length === 0}>
          <Download size={16} /> Export CSV
        </button>
      </div>
    </Layout>
  )
}