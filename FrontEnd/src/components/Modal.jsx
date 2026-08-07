import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

// Tracks every currently-open modal so that when several are stacked
// (e.g. a transaction form opened from inside Manage Categories), only
// the topmost one responds to Escape and releases body scroll-lock —
// without this, closing the top modal used to close everything beneath
// it too.
let modalStack = []
function syncBodyScroll() {
  document.body.style.overflow = modalStack.length > 0 ? 'hidden' : ''
}

export default function Modal({ title, onClose, children, footer, width }) {
  const idRef = useRef(null)
  if (idRef.current === null) idRef.current = `modal_${Math.random().toString(36).slice(2)}`

  useEffect(() => {
    const id = idRef.current
    modalStack.push(id)
    syncBodyScroll()
    return () => {
      modalStack = modalStack.filter((m) => m !== id)
      syncBodyScroll()
    }
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      const isTopmost = modalStack[modalStack.length - 1] === idRef.current
      if (e.key === 'Escape' && isTopmost) onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal" style={width ? { '--modal-width': width } : undefined}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button className="btn-icon" onClick={onClose} aria-label="Close"><X /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  )
}
