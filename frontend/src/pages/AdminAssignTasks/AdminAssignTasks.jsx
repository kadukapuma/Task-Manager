import { useEffect, useState } from 'react'
import api, { apiErrorMessage } from '../../api/client'
import StaffPicker from '../../components/StaffPicker/StaffPicker'
import MobileCardList from '../../components/MobileCardList/MobileCardList'
import Modal from '../../components/Modal/Modal'
import TaskDetailView from '../../components/TaskDetailView/TaskDetailView'
import { formatDate, priorityClass, statusClass } from '../../utils/format'
import './AdminAssignTasks.css'

const PRIORITY_ICON = {
  Fire: 'fa-fire',
  Urgent: 'fa-bolt',
  Normal: 'fa-thumbtack',
}

export default function AdminAssignTasks() {
  const [tasks, setTasks] = useState([])
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [assignError, setAssignError] = useState('')
  const [assigningId, setAssigningId] = useState(null)
  const [unassignedOnly, setUnassignedOnly] = useState(true)
  const [viewingTask, setViewingTask] = useState(null)

  function load() {
    setLoading(true)
    setError('')
    Promise.all([api.get('/tasks'), api.get('/users')])
      .then(([tasksRes, usersRes]) => {
        setTasks(tasksRes.data.data)
        setStaff(usersRes.data.filter((u) => u.role === 'staff'))
      })
      .catch((err) => setError(apiErrorMessage(err, 'Could not load tasks.')))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function assignTask(taskId, staffId) {
    setAssigningId(taskId)
    setAssignError('')
    try {
      const { data } = await api.patch(`/tasks/${taskId}`, { assigned_staff_id: staffId || null })
      setTasks((prev) => prev.map((t) => (t.id === taskId ? data.data : t)))
    } catch (err) {
      setAssignError(apiErrorMessage(err, 'Could not assign this task.'))
    } finally {
      setAssigningId(null)
    }
  }

  const visibleTasks = tasks
    .filter((t) => t.status !== 'Done')
    .filter((t) => !unassignedOnly || !t.assigned_staff_id)

  return (
    <div className="admin-assign-container">
      <div className="tasks-top-card">
        <div className="tasks-header-row">
          <div className="tasks-title-group">
            <h2>Assign Tasks</h2>
            <span className="task-count-badge">{visibleTasks.length} items</span>
          </div>
        </div>

        <label className="form-toggle-row">
          <input
            type="checkbox"
            checked={unassignedOnly}
            onChange={(e) => setUnassignedOnly(e.target.checked)}
          />
          <span className="form-toggle-label">Show unassigned tasks only</span>
        </label>
      </div>

      {error && (
        <div className="alert-error">
          <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" /> {error}
        </div>
      )}
      {assignError && (
        <div className="alert-error">
          <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" /> {assignError}
        </div>
      )}

      <div className="tasks-table-card">
        <div className="modern-table-container">
          {loading ? (
            <div className="task-empty-state">
              <div className="route-spinner" style={{ width: 28, height: 28 }} />
              <span className="task-empty-desc">Loading tasks…</span>
            </div>
          ) : visibleTasks.length === 0 ? (
            <div className="task-empty-state">
              <div className="task-empty-icon"><i className="fa-solid fa-inbox" aria-hidden="true" /></div>
              <div className="task-empty-title">Nothing to assign</div>
              <p className="task-empty-desc">
                {unassignedOnly ? 'Every open task already has a staff member.' : 'No open tasks found.'}
              </p>
            </div>
          ) : (
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Task Title</th>
                  <th>Customer</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Due Date</th>
                  <th>Assign to</th>
                </tr>
              </thead>
              <tbody>
                {visibleTasks.map((t) => (
                  <tr key={t.id} className="clickable-row" onClick={() => setViewingTask(t)}>
                    <td style={{ fontWeight: 600 }}>{t.title}</td>
                    <td>{t.customer?.name ?? <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td>
                      <span className={`badge ${priorityClass(t.priority)}`}>
                        <i className={`fa-solid ${PRIORITY_ICON[t.priority] || 'fa-thumbtack'}`} aria-hidden="true" /> {t.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${statusClass(t.status)}`}>{t.status}</span>
                    </td>
                    <td style={{ fontSize: '0.8125rem' }}>{formatDate(t.due_date)}</td>
                    <td style={{ minWidth: 180 }} onClick={(e) => e.stopPropagation()}>
                      <StaffPicker
                        staff={staff}
                        value={t.assigned_staff_id ?? ''}
                        onChange={(id) => assignTask(t.id, id)}
                        placeholder={assigningId === t.id ? 'Assigning…' : 'Choose staff…'}
                        disabled={assigningId === t.id}
                        allowUnassigned
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && visibleTasks.length > 0 && (
            <MobileCardList
              items={visibleTasks}
              detailTitle={(t) => t.title}
              detailSubtitle={(t) => t.customer?.name || 'No customer'}
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
              renderDetail={(t) => (
                <TaskDetailView task={t}>
                  <div className="detail-row">
                    <span className="detail-row-label">Assign to</span>
                    <StaffPicker
                      staff={staff}
                      value={t.assigned_staff_id ?? ''}
                      onChange={(id) => assignTask(t.id, id)}
                      placeholder={assigningId === t.id ? 'Assigning…' : 'Choose staff…'}
                      disabled={assigningId === t.id}
                      allowUnassigned
                    />
                  </div>
                </TaskDetailView>
              )}
            />
          )}
        </div>
      </div>

      <Modal
        isOpen={Boolean(viewingTask)}
        onClose={() => setViewingTask(null)}
        title={viewingTask?.title || ''}
        subtitle={viewingTask ? `Task #${viewingTask.id}` : ''}
        size="sm"
      >
        {viewingTask && (
          <TaskDetailView task={viewingTask}>
            <div className="detail-row">
              <span className="detail-row-label">Assign to</span>
              <StaffPicker
                staff={staff}
                value={viewingTask.assigned_staff_id ?? ''}
                onChange={(id) => {
                  assignTask(viewingTask.id, id)
                  setViewingTask(null)
                }}
                placeholder={assigningId === viewingTask.id ? 'Assigning…' : 'Choose staff…'}
                disabled={assigningId === viewingTask.id}
                allowUnassigned
              />
            </div>
          </TaskDetailView>
        )}
      </Modal>
    </div>
  )
}
