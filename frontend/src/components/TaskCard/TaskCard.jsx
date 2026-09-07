import { formatDate, formatDuration, formatMinutes, priorityClass, statusClass } from '../../utils/format'
import './TaskCard.css'

const PRIORITY_ICON = {
  Fire: 'fa-fire',
  Urgent: 'fa-bolt',
  Normal: 'fa-thumbtack',
}

export default function TaskCard({
  task,
  busy = false,
  readOnly = false,
  onStart,
  onPause,
  onComplete,
}) {
  const priorityIcon = PRIORITY_ICON[task.priority] || 'fa-thumbtack'

  return (
    <div className={`task-card-modern ${priorityClass(task.priority)}`}>
      <div className="task-card-info">
        <div className="task-card-title-row">
          <span className="task-card-title">{task.title}</span>
          <span className={`badge ${priorityClass(task.priority)}`}>
            <i className={`fa-solid ${priorityIcon}`} aria-hidden="true" /> {task.priority}
          </span>
          <span className={`badge ${statusClass(task.status)}`}>{task.status}</span>
          {task.is_repeating && (
            <span className="badge" style={{ background: 'var(--primary-subtle)', color: 'var(--primary)' }}>
              <i className="fa-solid fa-rotate" aria-hidden="true" /> {task.repeat_frequency || 'Repeating'}
            </span>
          )}
        </div>

        {task.description && <p className="task-card-desc">{task.description}</p>}

        <div className="task-card-meta">
          {task.customer && (
            <span className="task-meta-item">
              <i className="fa-solid fa-user" aria-hidden="true" /> {task.customer.name}
              {task.customer.company && ` (${task.customer.company})`}
            </span>
          )}
          {task.estimated_minutes > 0 && (
            <span className="task-meta-item">
              <i className="fa-regular fa-clock" aria-hidden="true" /> Est: {formatMinutes(task.estimated_minutes)}
            </span>
          )}
          {task.total_logged_secs > 0 && (
            <span className="task-meta-item">
              <i className="fa-solid fa-stopwatch" aria-hidden="true" /> Actual: {formatDuration(task.total_logged_secs)}
            </span>
          )}
          <span className="task-meta-item">
            <i className="fa-regular fa-calendar" aria-hidden="true" /> Due: {formatDate(task.due_date)}
          </span>
          {readOnly && (
            <span className="task-meta-item">
              <i className="fa-solid fa-user-check" aria-hidden="true" />{' '}
              {task.assigned_staff ? `Assigned to ${task.assigned_staff.name}` : 'Waiting for an admin to assign'}
            </span>
          )}
        </div>
      </div>

      <div className="task-card-actions">
        {!readOnly && (task.status === 'Pending' || task.status === 'Paused') && (
          <button
            type="button"
            className="btn-action btn-start"
            disabled={busy}
            onClick={() => onStart(task)}
          >
            <i className="fa-solid fa-play" aria-hidden="true" /> Start
          </button>
        )}

        {!readOnly && task.status === 'In Progress' && (
          <>
            <button
              type="button"
              className="btn-action btn-pause"
              disabled={busy}
              onClick={() => onPause(task)}
            >
              <i className="fa-solid fa-pause" aria-hidden="true" /> Pause
            </button>
            <button
              type="button"
              className="btn-action btn-complete"
              disabled={busy}
              onClick={() => onComplete(task)}
            >
              <i className="fa-solid fa-check" aria-hidden="true" /> Mark Done
            </button>
          </>
        )}
      </div>
    </div>
  )
}
