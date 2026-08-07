export default function EmptyState({ icon, heading, text, actionLabel, onAction }) {
  return (
    <div className="empty-state">
      {icon && <div className="empty-icon">{icon}</div>}
      <h3>{heading}</h3>
      {text && <p>{text}</p>}
      {actionLabel && (
        <button className="btn btn-primary" onClick={onAction}>{actionLabel}</button>
      )}
    </div>
  )
}