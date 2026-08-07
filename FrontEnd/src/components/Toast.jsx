import { useData } from '../context/DataContext.jsx'
import { CheckCircle2, XCircle, X as XIcon } from 'lucide-react'

export default function ToastContainer() {
  const { toasts, dismissToast } = useData()
  if (!toasts || toasts.length === 0) return null

  return (
    <div className="toast-stack">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.tone}`}>
          {t.tone === 'error' ? <XCircle size={17} /> : <CheckCircle2 size={17} />}
          <span>{t.message}</span>
          <button className="toast-close" onClick={() => dismissToast(t.id)} aria-label="Dismiss"><XIcon size={14} /></button>
        </div>
      ))}
    </div>
  )
}