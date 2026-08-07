import Modal from './Modal.jsx'
import { AlertTriangle } from 'lucide-react'

export default function ConfirmModal({ title = 'Are you sure?', message, confirmLabel = 'Delete', danger = true, onConfirm, onCancel }) {
  return (
    <Modal title={title} onClose={onCancel} width="380px" footer={(
      <>
        <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button className={danger ? 'btn btn-danger' : 'btn btn-primary'} onClick={onConfirm}>{confirmLabel}</button>
      </>
    )}>
      <div style={{ display: 'flex', gap: 12 }}>
        {danger && <AlertTriangle color="var(--expense)" size={22} style={{ flexShrink: 0 }} />}
        <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-muted)' }}>{message}</p>
      </div>
    </Modal>
  )
}