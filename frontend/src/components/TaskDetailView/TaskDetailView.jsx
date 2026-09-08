import { formatDate, formatDuration, formatMinutes, priorityClass, statusClass } from '../../utils/format'
import { attachmentIcon, formatFileSize, openAttachment } from '../../utils/attachments'

/**
 * Full read-only breakdown of a single task -- used both in the mobile
 * detail popup (via MobileCardList) and the desktop "view task" modal, so
 * clicking a task shows the same information (including description) on
 * both mobile and web.
 */
export default function TaskDetailView({ task, onEdit, onDelete, children }) {
  return (
    <div className="detail-list">
      <div className="detail-row">
        <span className="detail-row-label">Description</span>
        <span className="detail-row-value detail-row-multiline">
          {task.description || <span style={{ color: 'var(--text-muted)' }}>No description provided.</span>}
        </span>
      </div>

      <div className="detail-row">
        <span className="detail-row-label">Customer</span>
        <span className="detail-row-value">{task.customer?.name ?? '—'}</span>
      </div>

      <div className="detail-row">
        <span className="detail-row-label">Assigned Staff</span>
        <span className="detail-row-value">
          {task.assigned_staff?.name ?? <span className="badge inactive">Unassigned</span>}
        </span>
      </div>

      <div className="detail-row">
        <span className="detail-row-label">Priority</span>
        <span className="detail-row-value">
          <span className={`badge ${priorityClass(task.priority)}`}>{task.priority}</span>
        </span>
      </div>

      <div className="detail-row">
        <span className="detail-row-label">Status</span>
        <span className="detail-row-value">
          <span className={`badge ${statusClass(task.status)}`}>{task.status}</span>
        </span>
      </div>

      {task.status === 'Undone' && task.cannot_complete_reason && (
        <div className="detail-row">
          <span className="detail-row-label">Reason</span>
          <span className="detail-row-value detail-row-multiline">{task.cannot_complete_reason}</span>
        </div>
      )}

      <div className="detail-row">
        <span className="detail-row-label">Estimated Time</span>
        <span className="detail-row-value">
          {task.estimated_minutes ? formatMinutes(task.estimated_minutes) : '—'}
        </span>
      </div>

      <div className="detail-row">
        <span className="detail-row-label">Actual Time Logged</span>
        <span className="detail-row-value">
          {task.total_logged_secs ? formatDuration(task.total_logged_secs) : '—'}
        </span>
      </div>

      <div className="detail-row">
        <span className="detail-row-label">Due Date</span>
        <span className="detail-row-value">{formatDate(task.due_date)}</span>
      </div>

      {task.is_repeating && (
        <div className="detail-row">
          <span className="detail-row-label">Recurrence</span>
          <span className="detail-row-value">
            <i className="fa-solid fa-rotate" aria-hidden="true" /> {task.repeat_frequency}
          </span>
        </div>
      )}

      {task.attachments && task.attachments.length > 0 && (
        <div className="detail-row">
          <span className="detail-row-label">Attachments</span>
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
        <div className="detail-actions">
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
