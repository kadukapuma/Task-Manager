import { useLayoutEffect, useState } from 'react'
import { formatDate, formatDuration, formatMinutes, formatStopwatch, priorityClass, statusClass, taskTypeClass } from '../../utils/format'
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
  onCannotComplete,
  onView,
}) {
  const priorityIcon = PRIORITY_ICON[task.priority] || 'fa-thumbtack'

  const isLive = task.status === 'In Progress' && Boolean(task.active_time_log)
  const [liveNow, setLiveNow] = useState(() => Date.now())

  // Reset the clock the instant this card goes live -- otherwise `liveNow`
  // is left over from whenever the card first mounted (e.g. minutes ago,
  // while it was still Pending), and the first tick renders a wildly wrong
  // elapsed time before snapping to the correct one a second later.
  useLayoutEffect(() => {
    if (!isLive) return
    setLiveNow(Date.now())
    const id = setInterval(() => setLiveNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [isLive])

  const liveElapsedSecs = isLive
    ? Number(task.total_logged_secs || 0) + Math.floor((liveNow - new Date(task.active_time_log.start_time).getTime()) / 1000)
    : null

  return (
    <div className={`task-card-modern ${priorityClass(task.priority)}`}>
      <div className="task-card-info">
        <div className="task-card-title-row">
          <span className="task-card-id">#{task.id}</span>
          <span className="task-card-title">{task.title}</span>
        </div>

        <div className="task-card-badges">
          {task.task_type && (
            <span className={`badge ${taskTypeClass(task.task_type)}`}>{task.task_type}</span>
          )}
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

        {task.status === 'Undone' && task.cannot_complete_reason && (
          <p className="task-card-reason">
            <i className="fa-solid fa-circle-exclamation" aria-hidden="true" /> {task.cannot_complete_reason}
          </p>
        )}

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
          {isLive ? (
            <span className="task-meta-item task-meta-live">
              <span className="live-dot" aria-hidden="true" />
              <i className="fa-solid fa-stopwatch" aria-hidden="true" /> {formatStopwatch(liveElapsedSecs)}
            </span>
          ) : (
            task.total_logged_secs > 0 && (
              <span className="task-meta-item">
                <i className="fa-solid fa-stopwatch" aria-hidden="true" /> Actual: {formatDuration(task.total_logged_secs)}
              </span>
            )
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
        {onView && (
          <button
            type="button"
            className="btn-action btn-view"
            aria-label="View Details"
            title="View Details"
            onClick={() => onView(task)}
          >
            <i className="fa-regular fa-eye" aria-hidden="true" />
            <span className="btn-action-label">View Details</span>
          </button>
        )}

        {!readOnly && (task.status === 'Pending' || task.status === 'Paused') && (
          <button
            type="button"
            className="btn-action btn-start"
            aria-label="Start"
            title="Start"
            disabled={busy}
            onClick={() => onStart(task)}
          >
            <i className="fa-solid fa-play" aria-hidden="true" />
            <span className="btn-action-label">Start</span>
          </button>
        )}

        {!readOnly && task.status === 'In Progress' && (
          <>
            <button
              type="button"
              className="btn-action btn-pause"
              aria-label="Pause"
              title="Pause"
              disabled={busy}
              onClick={() => onPause(task)}
            >
              <i className="fa-solid fa-pause" aria-hidden="true" />
              <span className="btn-action-label">Pause</span>
            </button>
            <button
              type="button"
              className="btn-action btn-complete"
              aria-label="Mark Done"
              title="Mark Done"
              disabled={busy}
              onClick={() => onComplete(task)}
            >
              <i className="fa-solid fa-check" aria-hidden="true" />
              <span className="btn-action-label">Mark Done</span>
            </button>
          </>
        )}

        {!readOnly && ['Pending', 'In Progress', 'Paused'].includes(task.status) && (
          <button
            type="button"
            className="btn-action btn-cannot-complete"
            aria-label="Mark Undone"
            title="Mark Undone"
            disabled={busy}
            onClick={() => onCannotComplete(task)}
          >
            <i className="fa-solid fa-ban" aria-hidden="true" />
            <span className="btn-action-label">Mark Undone</span>
          </button>
        )}
      </div>
    </div>
  )
}
