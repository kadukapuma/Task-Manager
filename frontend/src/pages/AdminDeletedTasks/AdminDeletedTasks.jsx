import { useEffect, useState } from 'react'
import api, { apiErrorMessage } from '../../api/client'
import MobileCardList from '../../components/MobileCardList/MobileCardList'
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal'
import { formatDate, priorityClass, statusClass } from '../../utils/format'
import './AdminDeletedTasks.css'

const PRIORITY_ICON = {
  Fire: 'fa-fire',
  Urgent: 'fa-bolt',
  Normal: 'fa-thumbtack',
}

export default function AdminDeletedTasks() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)
  const [forceDeleteTask, setForceDeleteTask] = useState(null)

  function load() {
    setLoading(true)
    setError('')
    api
      .get('/tasks/deleted')
      .then(({ data }) => setTasks(data.data))
      .catch((err) => setError(apiErrorMessage(err, 'Could not load deleted tasks.')))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function restoreTask(task) {
    setBusyId(task.id)
    setError('')
    try {
      await api.post(`/tasks/${task.id}/restore`)
      setTasks((prev) => prev.filter((t) => t.id !== task.id))
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not restore this task.'))
    } finally {
      setBusyId(null)
    }
  }

  async function confirmForceDelete() {
    if (!forceDeleteTask) return
    setBusyId(forceDeleteTask.id)
    setError('')
    try {
      await api.delete(`/tasks/${forceDeleteTask.id}/force`)
      setTasks((prev) => prev.filter((t) => t.id !== forceDeleteTask.id))
      setForceDeleteTask(null)
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not permanently delete this task.'))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="admin-deleted-tasks-container">
      <div className="tasks-top-card">
        <div className="tasks-header-row">
          <div className="tasks-title-group">
            <h2>Deleted Tasks</h2>
            <span className="task-count-badge">{tasks.length} items</span>
          </div>
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
          Tasks deleted from Tasks Management land here for review. Restore them or delete them permanently --
          permanent deletion cannot be undone.
        </p>
      </div>

      {error && (
        <div className="alert-error">
          <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" /> {error}
        </div>
      )}

      <div className="tasks-table-card">
        <div className="modern-table-container">
          {loading ? (
            <div className="task-empty-state">
              <div className="route-spinner" style={{ width: 28, height: 28 }} />
              <span className="task-empty-desc">Loading deleted tasks…</span>
            </div>
          ) : tasks.length === 0 ? (
            <div className="task-empty-state">
              <div className="task-empty-icon"><i className="fa-solid fa-trash-can" aria-hidden="true" /></div>
              <div className="task-empty-title">Nothing deleted</div>
              <p className="task-empty-desc">Tasks you delete from Tasks Management will show up here.</p>
            </div>
          ) : (
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Task Title</th>
                  <th>Customer</th>
                  <th>Assigned Staff</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Deleted On</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 600 }}>{t.title}</td>
                    <td>{t.customer?.name ?? <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td>{t.assigned_staff?.name ?? <span className="badge inactive">Unassigned</span>}</td>
                    <td>
                      <span className={`badge ${priorityClass(t.priority)}`}>
                        <i className={`fa-solid ${PRIORITY_ICON[t.priority] || 'fa-thumbtack'}`} aria-hidden="true" /> {t.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${statusClass(t.status)}`}>{t.status}</span>
                    </td>
                    <td style={{ fontSize: '0.8125rem' }}>{formatDate(t.deleted_at)}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button
                          type="button"
                          className="btn-table-action"
                          disabled={busyId === t.id}
                          onClick={() => restoreTask(t)}
                        >
                          <i className="fa-solid fa-rotate-left" aria-hidden="true" /> Restore
                        </button>
                        <button
                          type="button"
                          className="btn-table-action danger"
                          disabled={busyId === t.id}
                          onClick={() => setForceDeleteTask(t)}
                        >
                          <i className="fa-solid fa-trash" aria-hidden="true" /> Delete Permanently
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && tasks.length > 0 && (
            <MobileCardList
              items={tasks}
              detailTitle={(t) => t.title}
              detailSubtitle={(t) => `Deleted ${formatDate(t.deleted_at)}`}
              renderCard={(t) => (
                <>
                  <span className="mdc-title">{t.title}</span>
                  <span className="mdc-subtitle">
                    {t.customer?.name ?? 'No customer'} · {t.assigned_staff?.name ?? 'Unassigned'}
                  </span>
                  <div className="mdc-badges">
                    <span className={`badge ${priorityClass(t.priority)}`}>{t.priority}</span>
                    <span className={`badge ${statusClass(t.status)}`}>{t.status}</span>
                  </div>
                </>
              )}
              renderDetail={(t, close) => (
                <div className="detail-list">
                  <div className="detail-row">
                    <span className="detail-row-label">Customer</span>
                    <span className="detail-row-value">{t.customer?.name ?? '—'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-row-label">Assigned Staff</span>
                    <span className="detail-row-value">{t.assigned_staff?.name ?? '—'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-row-label">Status</span>
                    <span className="detail-row-value">
                      <span className={`badge ${statusClass(t.status)}`}>{t.status}</span>
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-row-label">Deleted On</span>
                    <span className="detail-row-value">{formatDate(t.deleted_at)}</span>
                  </div>
                  <div className="detail-actions">
                    <button
                      type="button"
                      className="btn-table-action"
                      disabled={busyId === t.id}
                      onClick={() => {
                        close()
                        restoreTask(t)
                      }}
                    >
                      Restore
                    </button>
                    <button
                      type="button"
                      className="btn-table-action danger"
                      disabled={busyId === t.id}
                      onClick={() => {
                        close()
                        setForceDeleteTask(t)
                      }}
                    >
                      Delete Permanently
                    </button>
                  </div>
                </div>
              )}
            />
          )}
        </div>
      </div>

      <ConfirmModal
        isOpen={Boolean(forceDeleteTask)}
        onClose={() => setForceDeleteTask(null)}
        onConfirm={confirmForceDelete}
        title="Permanently Delete Task"
        message={`This will permanently delete "${forceDeleteTask?.title}" and all of its logged time. This cannot be undone.`}
        confirmLabel="Delete Permanently"
        danger
        busy={busyId === forceDeleteTask?.id}
      />
    </div>
  )
}
