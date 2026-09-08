import { useEffect, useState } from 'react'
import api, { apiErrorMessage } from '../../api/client'
import TaskForm from '../../components/TaskForm/TaskForm'
import Modal from '../../components/Modal/Modal'
import MobileCardList from '../../components/MobileCardList/MobileCardList'
import TaskDetailView from '../../components/TaskDetailView/TaskDetailView'
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal'
import { formatDate, formatDuration, formatMinutes, priorityClass, statusClass } from '../../utils/format'
import './AdminTasks.css'

const STATUSES = ['Pending', 'In Progress', 'Paused', 'Done', 'Undone']
const QUICK_STATUS_FILTERS = [
  { label: 'Working', status: 'In Progress' },
  { label: 'Paused', status: 'Paused' },
  { label: 'Finished', status: 'Done' },
]
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

  const [filters, setFilters] = useState({ status: '', priority: '', staff_id: '', customer_id: '', from: '', to: '' })
  const [page, setPage] = useState(1)
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, per_page: 20, total: 0 })

  // Modal states for popup creation and editing
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [viewingTask, setViewingTask] = useState(null)
  const [deletingTask, setDeletingTask] = useState(null)
  const [deleteBusy, setDeleteBusy] = useState(false)

  function load() {
    setLoading(true)
    setError('')
    const params = { ...Object.fromEntries(Object.entries(filters).filter(([, v]) => v)), page }
    api
      .get('/tasks', { params })
      .then(({ data }) => {
        setTasks(data.data)
        setMeta(data.meta)
      })
      .catch((err) => setError(apiErrorMessage(err, 'Could not load tasks.')))
      .finally(() => setLoading(false))
  }

  useEffect(load, [filters, page]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    api.get('/users').then(({ data }) => setStaff(data.filter((u) => u.role === 'staff'))).catch(() => { })
    api.get('/customers').then(({ data }) => setCustomers(data.data)).catch(() => { })
  }, [])

  function setFilter(field, value) {
    setPage(1)
    setFilters((f) => ({ ...f, [field]: value }))
  }

  function handleCreated() {
    setShowCreateModal(false)
    setPage(1)
    load()
  }

  function handleUpdated(updatedTask) {
    setTasks((prev) => prev.map((t) => (t.id === updatedTask.id ? updatedTask : t)))
    setEditingTask(null)
  }

  function resetFilters() {
    setPage(1)
    setFilters({ status: '', priority: '', staff_id: '', customer_id: '', from: '', to: '' })
  }

  async function confirmDelete() {
    if (!deletingTask) return
    setDeleteBusy(true)
    setError('')
    try {
      await api.delete(`/tasks/${deletingTask.id}`)
      setDeletingTask(null)
      setViewingTask(null)
      load()
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not delete this task.'))
    } finally {
      setDeleteBusy(false)
    }
  }

  const hasActiveFilters = Object.values(filters).some(Boolean)

  return (
    <div className="admin-tasks-container">
      {/* Top Controls Card */}
      <div className="tasks-top-card">
        <div className="tasks-header-row">
          <div className="tasks-title-group">
            <h2>All Work Tasks</h2>
            <span className="task-count-badge">{meta.total} items</span>
          </div>
          <button
            type="button"
            className="btn-primary-add"
            onClick={() => setShowCreateModal(true)}
          >
            <i className="fa-solid fa-plus" aria-hidden="true" /> Create New Task
          </button>
        </div>

        {/* Quick Status Filter Presets */}
        <div className="filter-preset-buttons">
          <span className="filter-label">Quick Filters:</span>
          <button
            type="button"
            className={`btn-preset ${!filters.status ? 'active' : ''}`}
            onClick={() => setFilter('status', '')}
          >
            All
          </button>
          {QUICK_STATUS_FILTERS.map(({ label, status }) => (
            <button
              key={status}
              type="button"
              className={`btn-preset ${filters.status === status ? 'active' : ''}`}
              onClick={() => setFilter('status', status)}
            >
              {label}
            </button>
          ))}
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

          <div className="filter-item">
            <label htmlFor="f_from">Created From</label>
            <input
              id="f_from"
              type="date"
              value={filters.from}
              onChange={(e) => setFilter('from', e.target.value)}
            />
          </div>

          <div className="filter-item">
            <label htmlFor="f_to">Created To</label>
            <input
              id="f_to"
              type="date"
              value={filters.to}
              onChange={(e) => setFilter('to', e.target.value)}
            />
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
                  <tr key={t.id} className="clickable-row" onClick={() => setViewingTask(t)}>
                    <td>
                      <div className="table-cell-lead">
                        <span
                          className="table-cell-icon"
                          style={{ background: `var(--${t.priority === 'Fire' ? 'fire' : t.priority === 'Urgent' ? 'warning' : 'primary'}-subtle)`, color: `var(--${t.priority === 'Fire' ? 'fire' : t.priority === 'Urgent' ? 'warning' : 'primary'})` }}
                        >
                          <i className={`fa-solid ${PRIORITY_ICON[t.priority] || 'fa-thumbtack'}`} aria-hidden="true" />
                        </span>
                        <span className="table-cell-text">
                          <span className="table-cell-title">{t.title}</span>
                          <span className="table-cell-subtitle">
                            {t.is_repeating ? (
                              <><i className="fa-solid fa-rotate" aria-hidden="true" /> Recurring ({t.repeat_frequency})</>
                            ) : (
                              `Task #${t.id}`
                            )}
                          </span>
                        </span>
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
                      <span
                        className={`badge ${statusClass(t.status)}`}
                        title={t.status === 'Undone' ? t.cannot_complete_reason : undefined}
                      >
                        {t.status}
                        {t.status === 'Undone' && <i className="fa-solid fa-circle-info" style={{ marginLeft: 4 }} aria-hidden="true" />}
                      </span>
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
                        className="btn-table-icon view"
                        aria-label="View task"
                        title="View task"
                        onClick={(e) => {
                          e.stopPropagation()
                          setViewingTask(t)
                        }}
                      >
                        <i className="fa-solid fa-eye" aria-hidden="true" />
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
                <TaskDetailView
                  task={t}
                  onEdit={() => {
                    close()
                    setEditingTask(t)
                  }}
                  onDelete={() => {
                    close()
                    setDeletingTask(t)
                  }}
                />
              )}
            />
          )}
        </div>

        {!loading && meta.total > 0 && (
          <div className="pagination-bar">
            <span className="pagination-info">
              Page {meta.current_page} of {meta.last_page} · {meta.total} total tasks
            </span>
            <div className="pagination-controls">
              <button
                type="button"
                className="btn-table-action"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <i className="fa-solid fa-chevron-left" aria-hidden="true" /> Prev
              </button>
              <span>{meta.current_page} / {meta.last_page}</span>
              <button
                type="button"
                className="btn-table-action"
                disabled={page >= meta.last_page}
                onClick={() => setPage((p) => Math.min(meta.last_page, p + 1))}
              >
                Next <i className="fa-solid fa-chevron-right" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Popup Window: View Task Details (description, etc.) */}
      <Modal
        isOpen={Boolean(viewingTask)}
        onClose={() => setViewingTask(null)}
        title={viewingTask?.title || ''}
        subtitle={`Task #${viewingTask?.id || ''}`}
        size="sm"
      >
        {viewingTask && (
          <TaskDetailView
            task={viewingTask}
            onEdit={() => {
              setEditingTask(viewingTask)
              setViewingTask(null)
            }}
            onDelete={() => setDeletingTask(viewingTask)}
          />
        )}
      </Modal>

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

      <ConfirmModal
        isOpen={Boolean(deletingTask)}
        onClose={() => setDeletingTask(null)}
        onConfirm={confirmDelete}
        title="Delete Task"
        message={`"${deletingTask?.title}" will be moved to Deleted Tasks. An admin can restore it or delete it permanently from there.`}
        confirmLabel="Delete Task"
        danger
        busy={deleteBusy}
      />
    </div>
  )
}

