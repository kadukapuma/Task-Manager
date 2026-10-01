import './AutoPauseToggle.css'

// Matches the backend's OFFICE_CLOSE_TIME (17:00).
const CLOSE_LABEL = '5 PM'

/**
 * Switch for a running task: when on, the server pauses the task at office
 * closing time so a forgotten timer doesn't run overnight.
 */
export default function AutoPauseToggle({ task, disabled = false, compact = false, onToggle }) {
  const enabled = Boolean(task.active_time_log?.auto_pause_at)
  const label = `Auto-pause at ${CLOSE_LABEL}`

  return (
    <label
      className={`auto-pause-toggle ${compact ? 'compact' : ''} ${enabled ? 'on' : ''}`}
      title={enabled ? `${label} (on)` : `${label} (off)`}
      onClick={(e) => e.stopPropagation()}
    >
      <input
        type="checkbox"
        role="switch"
        checked={enabled}
        disabled={disabled}
        aria-label={label}
        onChange={(e) => onToggle(task, e.target.checked)}
      />
      <span className="auto-pause-track" aria-hidden="true">
        <span className="auto-pause-thumb" />
      </span>
      {compact ? (
        <i className="fa-regular fa-clock auto-pause-icon" aria-hidden="true" />
      ) : (
        <span className="auto-pause-label">{label}</span>
      )}
    </label>
  )
}
