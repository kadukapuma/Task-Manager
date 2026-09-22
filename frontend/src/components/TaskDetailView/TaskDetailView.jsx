import { formatDate, formatDuration, formatMinutes, priorityClass, statusClass, taskTypeClass } from '../../utils/format'
import { attachmentIcon, formatFileSize, openAttachment } from '../../utils/attachments'
import './TaskDetailView.css'

const PRIORITY_ICON = {
  Fire: 'fa-fire',
  Urgent: 'fa-bolt',
  Normal: 'fa-thumbtack',
}

function StatTile({ icon, label, value }) {
  return (
    <div className="task-stat-tile">
      <span className="task-stat-icon">
        <i className={`fa-solid ${icon}`} aria-hidden="true" />
      </span>
      <span className="task-stat-text">
        <span className="task-stat-label">{label}</span>
        <span className="task-stat-value">{value}</span>
      </span>
    </div>
  )
}

/**
 * Full read-only breakdown of a single task -- used both in the mobile
 * detail popup (via MobileCardList) and the desktop "view task" modal, so
 * clicking a task shows the same information (including description) on
 * both mobile and web.
 */
export default function TaskDetailView({ task, onEdit, onDelete, children }) {
  return (
    <div className="task-detail">
      <div className="task-detail-badges">
        {task.task_type && (
          <span className={`badge ${taskTypeClass(task.task_type)}`}>{task.task_type}</span>
        )}
        {task.priority === 'Fire' ? (
          <span className="fire-indicator">
            <span className="flame" aria-hidden="true"><span className="flame-spark" /><span className="flame-spark" /></span> {task.priority}
          </span>
        ) : (
          <span className={`badge ${priorityClass(task.priority)}`}>
            <i className={`fa-solid ${PRIORITY_ICON[task.priority] || 'fa-thumbtack'}`} aria-hidden="true" /> {task.priority}
          </span>
        )}
        <span className={`badge ${statusClass(task.status)}`}>{task.status}</span>
      </div>

      <div className="task-detail-description">
        <span className="task-detail-section-label">Description</span>
        <p>{task.description || <span style={{ color: 'var(--text-muted)' }}>No description provided.</span>}</p>
      </div>

      {task.status === 'Undone' && task.cannot_complete_reason && (
        <div className="task-detail-callout task-detail-callout-danger">
          <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
          <div>
            <span className="task-detail-callout-title">Marked Undone</span>
            <p>{task.cannot_complete_reason}</p>
          </div>
        </div>
      )}

      {task.status === 'Done' && task.completion_notes && (
        <div className="task-detail-callout task-detail-callout-success">
          <i className="fa-solid fa-circle-check" aria-hidden="true" />
          <div>
            <span className="task-detail-callout-title">Completion Notes</span>
            <p>{task.completion_notes}</p>
          </div>
        </div>
      )}

      <div className="task-detail-stats">
        <StatTile icon="fa-user-tie" label="Customer" value={task.customer?.name ?? '—'} />
        <StatTile
          icon="fa-user"
          label="Assigned Staff"
          value={task.assigned_staff?.name ?? <span className="badge inactive">Unassigned</span>}
        />
        <StatTile icon="fa-calendar" label="Due Date" value={formatDate(task.due_date)} />
        <StatTile
          icon="fa-hourglass-half"
          label="Estimated Time"
          value={task.estimated_minutes ? formatMinutes(task.estimated_minutes) : '—'}
        />
        <StatTile
          icon="fa-stopwatch"
          label="Actual Time Logged"
          value={task.total_logged_secs ? formatDuration(task.total_logged_secs) : '—'}
        />
        {task.is_repeating && (
          <StatTile icon="fa-rotate" label="Recurrence" value={task.repeat_frequency} />
        )}
      </div>

      {task.attachments && task.attachments.length > 0 && (
        <div>
          <span className="task-detail-section-label">Attachments</span>
          <div className="attachment-list">
            {task.attachments.map((a) => (
              <div key={a.id} className="attachment-item">
                <i className={`fa-solid ${attachmentIcon(a.mime_type)}`} aria-hidden="true" />
                <span className="attachment-name" onClick={() => openAttachment(task.id, a)}>
                  {a.original_name}
                </span>
                <span className="attachment-size">{formatFileSize(a.size)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {children}

      {(onEdit || onDelete) && (
        <div className="task-detail-footer">
          {onEdit && (
            <button type="button" className="btn-table-action" onClick={onEdit}>
              Edit
            </button>
          )}
          {onDelete && (
            <button type="button" className="btn-table-action danger" onClick={onDelete}>
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  )
}
