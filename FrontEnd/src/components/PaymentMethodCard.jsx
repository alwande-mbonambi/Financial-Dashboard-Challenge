import { useData } from '../context/DataContext.jsx'

const COLORS = { Cash: '#B9812B', Card: '#0E6E5D', EFT: '#45879E' }

export default function PaymentMethodCard({ window }) {
  const { getPaymentMethodSplit } = useData()
  const split = getPaymentMethodSplit(window)
  const total = split.reduce((s, m) => s + m.count, 0)

  return (
    <div className="panel panel-compact">
      <h3>Payment Method Split</h3>
      <p className="panel-sub">Total Transactions: {total}</p>
      {total === 0 ? (
        <div className="empty-state" style={{ padding: '20px 0' }}><h3>No data for this period</h3></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {split.map((m) => (
            <div key={m.name}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}>
                <span>{m.name}</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>{m.pct}% ({m.count})</span>
              </div>
              <div className="progress-track" style={{ height: 7 }}>
                <div className="progress-fill" style={{ width: `${m.pct}%`, background: COLORS[m.name] || 'var(--accent)' }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
