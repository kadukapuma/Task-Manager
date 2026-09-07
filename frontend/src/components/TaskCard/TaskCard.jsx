import { formatDate, priorityClass, statusClass } from '../../utils/format'
import './TaskCard.css'

export default function TaskCard({
  task,
  unassigned = false,
  busy = false,
  onStart,
  onPause,
  onComplete,
  onPickUp,
}) {
  const priorityEmoji = {
    Fire: '🔥',
    Urgent: '⚡',
    Normal: '📌',
  }[task.priority] || '📌'

  return (
    <div className={`task-card-modern ${priorityClass(task.priority)}`}>
      <div className="task-card-info">
        <div className="task-card-title-row">
          <span className="task-card-title">{task.title}</span>
          <span className={`badge ${priorityClass(task.priority)}`}>
            <span>{priorityEmoji}</span> {task.priority}
          </span>
          <span className={`badge ${statusClass(task.status)}`}>{task.status}</span>
          {task.is_repeating && (
            <span className="badge" style={{ background: 'var(--primary-subtle)', color: 'var(--primary)' }}>
              🔄 {task.repeat_frequency || 'Repeating'}
            </span>
          )}
        </div>

        {task.description && <p className="task-card-desc">{task.description}</p>}

        <div className="task-card-meta">
          {task.customer && (
            <span className="task-meta-item">
              <span>👤</span> {task.customer.name}
              {task.customer.company && ` (${task.customer.company})`}
            </span>
          )}
          <span className="task-meta-item">
            <span>📅</span> Due: {formatDate(task.due_date)}
          </span>
        </div>
      </div>

      <div className="task-card-actions">
        {unassigned && (
          <button
            type="button"
            className="btn-action btn-pickup"
            disabled={busy}
            onClick={() => onPickUp(task)}
          >
            <span>📥</span> Pick up
          </button>
        )}

        {!unassigned && (task.status === 'Pending' || task.status === 'Paused') && (
          <button
            type="button"
            className="btn-action btn-start"
            disabled={busy}
            onClick={() => onStart(task)}
          >
            <span>▶</span> Start
          </button>
        )}

        {!unassigned && task.status === 'In Progress' && (
          <>
            <button
              type="button"
              className="btn-action btn-pause"
              disabled={busy}
              onClick={() => onPause(task)}
            >
              <span>⏸</span> Pause
            </button>
            <button
              type="button"
              className="btn-action btn-complete"
              disabled={busy}
              onClick={() => onComplete(task)}
            >
              <span>✔</span> Mark Done
            </button>
          </>
        )}
      </div>
    </div>
  )
}

