import { useEffect, useState } from 'react'
import api, { apiErrorMessage } from '../../api/client'
import TaskForm from '../../components/TaskForm/TaskForm'
import Modal from '../../components/Modal/Modal'
import MobileCardList from '../../components/MobileCardList/MobileCardList'
import { formatDate, formatDuration, formatMinutes, priorityClass, statusClass } from '../../utils/format'
import './AdminTasks.css'

const STATUSES = ['Pending', 'In Progress', 'Paused', 'Done']
const PRIORITIES = ['Normal', 'Urgent', 'Fire']
const PRIORITY_ICON = {
  Fire: 'fa-fire',
  Urgent: 'fa-bolt',
  Normal: 'fa-thumbtack',
}

export default function AdminTasks() {
  const [tasks, setTasks] = useState([])
  const [staff, setStaff] = useState([])
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [filters, setFilters] = useState({ status: '', priority: '', staff_id: '', customer_id: '' })

  // Modal states for popup creation and editing
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTask, setEditingTask] = useState(null)

  function load() {
    setLoading(true)
    setError('')
    const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v))
    api
      .get('/tasks', { params })
      .then(({ data }) => setTasks(data.data))
      .catch((err) => setError(apiErrorMessage(err, 'Could not load tasks.')))
      .finally(() => setLoading(false))
  }

  useEffect(load, [filters]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    api.get('/users').then(({ data }) => setStaff(data.filter((u) => u.role === 'staff'))).catch(() => { })
    api.get('/customers').then(({ data }) => setCustomers(data.data)).catch(() => { })
  }, [])

  function setFilter(field, value) {
    setFilters((f) => ({ ...f, [field]: value }))
  }

  function handleCreated(newTask) {
    setTasks((prev) => [newTask, ...prev])
    setShowCreateModal(false)
  }

  function handleUpdated(updatedTask) {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)))
    setEditingTask(null)
  }

  function resetFilters() {
    setFilters({ status: '', priority: '', staff_id: '', customer_id: '' })
  }

  const hasActiveFilters = Object.values(filters).some(Boolean)

  return (
    <div className="admin-tasks-container">
      {/* Top Controls Card */}
      <div className="tasks-top-card">
        <div className="tasks-header-row">
          <div className="tasks-title-group">
            <h2>All Work Tasks</h2>
            <span className="task-count-badge">{tasks.length} items</span>
          </div>
          <button
            type="button"
            className="btn-primary-add"
            onClick={() => setShowCreateModal(true)}
          >
            <i className="fa-solid fa-plus" aria-hidden="true" /> Create New Task
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="filters-grid">
          <div className="filter-item">
            <label htmlFor="f_status">Status</label>
            <select
              id="f_status"
              value={filters.status}
              onChange={(e) => setFilter('status', e.target.value)}
            >
              <option value="">All Statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label htmlFor="f_priority">Priority</label>
            <select
              id="f_priority"
              value={filters.priority}
              onChange={(e) => setFilter('priority', e.target.value)}
            >
              <option value="">All Priorities</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label htmlFor="f_staff">Assigned Staff</label>
            <select
              id="f_staff"
              value={filters.staff_id}
              onChange={(e) => setFilter('staff_id', e.target.value)}
            >
              <option value="">All Staff</option>
              {staff.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label htmlFor="f_customer">Customer</label>
            <select
              id="f_customer"
              value={filters.customer_id}
              onChange={(e) => setFilter('customer_id', e.target.value)}
            >
              <option value="">All Customers</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              className="btn-table-action"
              style={{ height: '36px', alignSelf: 'flex-end' }}
              onClick={resetFilters}
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="alert-error">
          <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" /> {error}
        </div>
      )}

      {/* Modern Tasks Table */}
      <div className="tasks-table-card">
        <div className="modern-table-container">
          {loading ? (
            <div className="task-empty-state">
              <div className="route-spinner" style={{ width: 28, height: 28 }} />
              <span className="task-empty-desc">Loading task directory…</span>
            </div>
          ) : tasks.length === 0 ? (
            <div className="task-empty-state">
              <div className="task-empty-icon"><i className="fa-solid fa-magnifying-glass" aria-hidden="true" /></div>
              <div className="task-empty-title">No tasks found</div>
              <p className="task-empty-desc">No tasks matched your current filter criteria.</p>
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
                  <th>Est. Time</th>
                  <th>Actual Time</th>
                  <th>Due Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 600 }}>{t.title}</span>
                        {t.is_repeating && (
                          <span style={{ fontSize: '0.6875rem', color: 'var(--primary)', marginTop: 2 }}>
                            <i className="fa-solid fa-rotate" aria-hidden="true" /> Recurring ({t.repeat_frequency})
                          </span>
                        )}
                      </div>
                    </td>
                    <td>{t.customer?.name ?? <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td>
                      {t.assigned_staff?.name ?? (
                        <span className="badge inactive">Unassigned</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${priorityClass(t.priority)}`}>
                        <i className={`fa-solid ${PRIORITY_ICON[t.priority] || 'fa-thumbtack'}`} aria-hidden="true" /> {t.priority}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${statusClass(t.status)}`}>{t.status}</span>
                    </td>
                    <td style={{ fontSize: '0.8125rem' }}>
                      {t.estimated_minutes ? (
                        <span className="badge" style={{ background: 'var(--info-subtle)', color: 'var(--info-text)' }}>
                          <i className="fa-regular fa-clock" aria-hidden="true" /> {formatMinutes(t.estimated_minutes)}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8125rem' }}>
                      {t.total_logged_secs ? (
                        <span className="badge" style={{ background: 'var(--primary-subtle)', color: 'var(--primary)' }}>
                          <i className="fa-solid fa-stopwatch" aria-hidden="true" /> {formatDuration(t.total_logged_secs)}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8125rem' }}>{formatDate(t.due_date)}</td>
                    <td>
                      <button
                        type="button"
                        className="btn-table-action"
                        onClick={() => setEditingTask(t)}
                      >
                        Edit
                      </button>
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
              detailSubtitle={(t) => `Task #${t.id}`}
              renderCard={(t) => (
                <>
                  <span className="mdc-title">{t.title}</span>
                  <span className="mdc-subtitle">
                    {t.customer?.name ?? 'No customer'} · {t.assigned_staff?.name ?? 'Unassigned'}
                  </span>
                  <div className="mdc-badges">
                    <span className={`badge ${priorityClass(t.priority)}`}>
                      <i className={`fa-solid ${PRIORITY_ICON[t.priority] || 'fa-thumbtack'}`} aria-hidden="true" /> {t.priority}
                    </span>
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
                    <span className="detail-row-value">
                      {t.assigned_staff?.name ?? <span className="badge inactive">Unassigned</span>}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-row-label">Priority</span>
                    <span className="detail-row-value">
                      <span className={`badge ${priorityClass(t.priority)}`}>
                        <i className={`fa-solid ${PRIORITY_ICON[t.priority] || 'fa-thumbtack'}`} aria-hidden="true" /> {t.priority}
                      </span>
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-row-label">Status</span>
                    <span className="detail-row-value">
                      <span className={`badge ${statusClass(t.status)}`}>{t.status}</span>
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-row-label">Estimated Time</span>
                    <span className="detail-row-value">
                      {t.estimated_minutes ? formatMinutes(t.estimated_minutes) : '—'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-row-label">Actual Time Logged</span>
                    <span className="detail-row-value">
                      {t.total_logged_secs ? formatDuration(t.total_logged_secs) : '—'}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-row-label">Due Date</span>
                    <span className="detail-row-value">{formatDate(t.due_date)}</span>
                  </div>
                  {t.is_repeating && (
                    <div className="detail-row">
                      <span className="detail-row-label">Recurrence</span>
                      <span className="detail-row-value">
                        <i className="fa-solid fa-rotate" aria-hidden="true" /> {t.repeat_frequency}
                      </span>
                    </div>
                  )}
                  <div className="detail-actions">
                    <button
                      type="button"
                      className="btn-table-action"
                      onClick={() => {
                        close()
                        setEditingTask(t)
                      }}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              )}
            />
          )}
        </div>
      </div>

      {/* Popup Window: Create Task Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Task"
        subtitle="Specify task details, assignment, and priority."
        size="lg"
      >
        <TaskForm
          onSaved={handleCreated}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Popup Window: Edit Task Modal */}
      <Modal
        isOpen={Boolean(editingTask)}
        onClose={() => setEditingTask(null)}
        title={`Edit Task #${editingTask?.id || ''}`}
        subtitle="Modify task status, reassign staff, or update priority."
        size="lg"
      >
        {editingTask && (
          <TaskForm
            task={editingTask}
            onSaved={handleUpdated}
            onCancel={() => setEditingTask(null)}
          />
        )}
      </Modal>
    </div>
  )
}

