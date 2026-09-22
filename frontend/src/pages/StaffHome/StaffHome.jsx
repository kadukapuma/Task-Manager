import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import api, { apiErrorMessage } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import TaskForm from '../../components/TaskForm/TaskForm'
import Modal from '../../components/Modal/Modal'
import MobileCardList from '../../components/MobileCardList/MobileCardList'
import TaskDetailModal from '../../components/TaskDetailModal/TaskDetailModal'
import TaskDetailView from '../../components/TaskDetailView/TaskDetailView'
import { formatDate, formatDuration, formatStopwatch, priorityClass, statusClass, taskTypeClass } from '../../utils/format'
import './StaffHome.css'

const STATUSES = ['Pending', 'In Progress', 'Paused', 'Done', 'Undone']
const PRIORITIES = ['Normal', 'Urgent', 'Fire']
const PAGE_SIZE = 10
// Default view: new (Pending), working (In Progress), and Paused tasks --
// Done and Undone stay out of the way until picked from the dropdown.
const DEFAULT_STATUS_FILTER = 'active'
const ACTIVE_STATUSES = ['Pending', 'In Progress', 'Paused']
const PRIORITY_ICON = {
  Fire: 'fa-fire',
  Urgent: 'fa-bolt',
  Normal: 'fa-thumbtack',
}

const TABS = [
  { key: 'mine', label: 'My Tasks', icon: 'fa-user' },
  { key: 'created', label: 'Created by Me', icon: 'fa-file-lines' },
  { key: 'all', label: 'All Tasks', icon: 'fa-list-check' },
]

function matchesDueFilter(task, filter) {
  if (!filter) return true
  if (filter === 'none') return !task.due_date

  if (!task.due_date) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(task.due_date)
  due.setHours(0, 0, 0, 0)

  if (filter === 'overdue') return due < today && task.status !== 'Done' && task.status !== 'Undone'
  if (filter === 'today') return due.getTime() === today.getTime()
  if (filter === 'week') {
    const weekEnd = new Date(today)
    weekEnd.setDate(weekEnd.getDate() + 7)
    return due >= today && due <= weekEnd
  }
  return true
}

/** Ticking elapsed time for the row's live stopwatch, in sync with the active time log. */
function LiveTime({ task }) {
  const [now, setNow] = useState(() => Date.now())

  useLayoutEffect(() => {
    setNow(Date.now())
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [task.id])

  const elapsed = Number(task.total_logged_secs || 0) + Math.floor((now - new Date(task.active_time_log.start_time).getTime()) / 1000)

  return (
    <span className="task-meta-item task-meta-live">
      <span className="live-dot" aria-hidden="true" />
      {formatStopwatch(elapsed)}
    </span>
  )
}

export default function StaffHome() {
  const { user } = useAuth()

  const [mineTasks, setMineTasks] = useState([])
  const [createdTasks, setCreatedTasks] = useState([])
  const [allTasks, setAllTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [version, setVersion] = useState(0)

  const [tab, setTab] = useState('mine')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState(DEFAULT_STATUS_FILTER)
  const [priorityFilter, setPriorityFilter] = useState('')
  const [dueFilter, setDueFilter] = useState('')
  const [page, setPage] = useState(1)

  const [busyId, setBusyId] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [viewingTask, setViewingTask] = useState(null)

  const [cannotCompleteTask, setCannotCompleteTask] = useState(null)
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState('')

  const [completingTask, setCompletingTask] = useState(null)
  const [completionNotes, setCompletionNotes] = useState('')
  const [completionError, setCompletionError] = useState('')

  const bump = () => setVersion((v) => v + 1)

  function load() {
    setLoading(true)
    setError('')
    Promise.all([
      api.get('/tasks/mine'),
      api.get('/tasks/reported'),
      api.get('/tasks', { params: { per_page: 1000 } }),
    ])
      .then(([mineRes, createdRes, allRes]) => {
        setMineTasks(mineRes.data.data)
        setCreatedTasks(createdRes.data.data)
        setAllTasks(allRes.data.data)
      })
      .catch((err) => setError(apiErrorMessage(err, 'Could not load tasks.')))
      .finally(() => setLoading(false))
  }

  useEffect(load, [version])

  useEffect(() => setPage(1), [tab, search, statusFilter, priorityFilter, dueFilter])

  const tabData = { mine: mineTasks, created: createdTasks, all: allTasks }
  const activeTasks = tabData[tab]

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return activeTasks.filter((t) => {
      if (statusFilter === 'active') {
        if (!ACTIVE_STATUSES.includes(t.status)) return false
      } else if (statusFilter && t.status !== statusFilter) {
        return false
      }
      if (priorityFilter && t.priority !== priorityFilter) return false
      if (!matchesDueFilter(t, dueFilter)) return false
      if (q) {
        const taskNumber = q.replace(/^#/, '')
        const matchesId = /^\d+$/.test(taskNumber) && Number(taskNumber) === t.id
        const haystack = `${t.title} ${t.description ?? ''}`.toLowerCase()
        if (!matchesId && !haystack.includes(q)) return false
      }
      return true
    })
  }, [activeTasks, search, statusFilter, priorityFilter, dueFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)

  const hasActiveFilters = Boolean(search || statusFilter !== DEFAULT_STATUS_FILTER || priorityFilter || dueFilter)

  function resetFilters() {
    setSearch('')
    setStatusFilter(DEFAULT_STATUS_FILTER)
    setPriorityFilter('')
    setDueFilter('')
  }

  async function runAction(task, action) {
    setBusyId(task.id)
    setError('')
    try {
      await api.post(`/tasks/${task.id}/${action}`)
      bump()
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not update the task.'))
    } finally {
      setBusyId(null)
    }
  }

  function openCannotComplete(task) {
    setReason('')
    setReasonError('')
    setCannotCompleteTask(task)
  }

  async function submitCannotComplete(e) {
    e.preventDefault()
    if (!reason.trim()) {
      setReasonError('A reason is required.')
      return
    }

    setBusyId(cannotCompleteTask.id)
    setReasonError('')
    try {
      await api.post(`/tasks/${cannotCompleteTask.id}/cannot-complete`, { reason })
      setCannotCompleteTask(null)
      bump()
    } catch (err) {
      setReasonError(apiErrorMessage(err, 'Could not update the task.'))
    } finally {
      setBusyId(null)
    }
  }

  function openComplete(task) {
    setCompletionNotes('')
    setCompletionError('')
    setCompletingTask(task)
  }

  async function submitComplete(e) {
    e.preventDefault()

    setBusyId(completingTask.id)
    setCompletionError('')
    try {
      await api.post(`/tasks/${completingTask.id}/complete`, { notes: completionNotes || null })
      setCompletingTask(null)
      bump()
    } catch (err) {
      setCompletionError(apiErrorMessage(err, 'Could not update the task.'))
    } finally {
      setBusyId(null)
    }
  }

  function handleCreated() {
    setShowCreateModal(false)
    bump()
  }

  function renderRowActions(t) {
    const busy = busyId === t.id
    return (
      <div className="table-actions">
        <button
          type="button"
          className="btn-table-icon view"
          aria-label="View"
          title="View"
          onClick={(e) => {
            e.stopPropagation()
            setViewingTask(t)
          }}
        >
          <i className="fa-regular fa-eye" aria-hidden="true" />
        </button>

        {tab === 'mine' && (t.status === 'Pending' || t.status === 'Paused') && (
          <button
            type="button"
            className="btn-table-icon start"
            aria-label="Start"
            title="Start"
            disabled={busy}
            onClick={(e) => {
              e.stopPropagation()
              runAction(t, 'start')
            }}
          >
            <i className="fa-solid fa-play" aria-hidden="true" />
          </button>
        )}

        {tab === 'mine' && t.status === 'In Progress' && (
          <>
            <button
              type="button"
              className="btn-table-icon pause"
              aria-label="Pause"
              title="Pause"
              disabled={busy}
              onClick={(e) => {
                e.stopPropagation()
                runAction(t, 'pause')
              }}
            >
              <i className="fa-solid fa-pause" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="btn-table-icon complete"
              aria-label="Mark Done"
              title="Mark Done"
              disabled={busy}
              onClick={(e) => {
                e.stopPropagation()
                openComplete(t)
              }}
            >
              <i className="fa-solid fa-check" aria-hidden="true" />
            </button>
          </>
        )}

        {tab === 'mine' && ['Pending', 'In Progress', 'Paused'].includes(t.status) && (
          <button
            type="button"
            className="btn-table-icon undone"
            aria-label="Mark Undone"
            title="Mark Undone"
            disabled={busy}
            onClick={(e) => {
              e.stopPropagation()
              openCannotComplete(t)
            }}
          >
            <i className="fa-solid fa-ban" aria-hidden="true" />
          </button>
        )}
      </div>
    )
  }

  return (
    <div className="staff-home-container">
      <div className="tasks-top-card">
        <div className="tasks-header-row">
          <div className="staff-tabs">
            {TABS.map((t) => (
              <button
                key={t.key}
                type="button"
                className={`staff-tab-btn ${tab === t.key ? 'active' : ''}`}
                onClick={() => setTab(t.key)}
              >
                <i className={`fa-solid ${t.icon}`} aria-hidden="true" />
                {t.label}
                <span className="task-count-badge">{tabData[t.key].length}</span>
              </button>
            ))}
          </div>
          <button type="button" className="btn-primary-add" onClick={() => setShowCreateModal(true)}>
            <i className="fa-solid fa-plus" aria-hidden="true" /> New Task
          </button>
        </div>

        <div className="staff-toolbar">
          <div className="search-input-wrap">
            <i className="fa-solid fa-magnifying-glass search-input-icon" aria-hidden="true" />
            <input
              type="text"
              placeholder="Search tasks or #task number…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="active">Active (New, Working &amp; Paused)</option>
            <option value="">All Statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="">All Priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <select value={dueFilter} onChange={(e) => setDueFilter(e.target.value)}>
            <option value="">Due Date</option>
            <option value="overdue">Overdue</option>
            <option value="today">Due Today</option>
            <option value="week">Due This Week</option>
            <option value="none">No Due Date</option>
          </select>

          {hasActiveFilters && (
            <button type="button" className="btn-table-action" onClick={resetFilters}>
              Reset
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="alert-error">
          <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" /> {error}
        </div>
      )}

      <div className="tasks-table-card staff-tasks-table">
        <div className="modern-table-container">
          {loading ? (
            <div className="task-empty-state">
              <div className="route-spinner" style={{ width: 28, height: 28 }} />
              <span className="task-empty-desc">Loading tasks…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="task-empty-state">
              <div className="task-empty-icon"><i className="fa-solid fa-magnifying-glass" aria-hidden="true" /></div>
              <div className="task-empty-title">No tasks found</div>
              <p className="task-empty-desc">
                {hasActiveFilters ? 'No tasks matched your search or filters.' : "You don't have any tasks here yet."}
              </p>
            </div>
          ) : (
            <table className="modern-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Task</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Assigned By</th>
                  <th>Time</th>
                  <th>Due Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pageItems.map((t) => (
                  <tr
                    key={t.id}
                    className={`clickable-row ${t.priority === 'Fire' ? 'row-fire' : ''} ${t.status === 'In Progress' ? 'row-active' : ''}`}
                    onClick={() => setViewingTask(t)}
                  >
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>#{t.id}</td>
                    <td>
                      <div className="table-cell-text">
                        <span className="table-cell-title">{t.title}</span>
                        <span className="table-cell-subtitle">
                          {t.description || (t.task_type ? <span className={`badge ${taskTypeClass(t.task_type)}`}>{t.task_type}</span> : `Task #${t.id}`)}
                        </span>
                      </div>
                    </td>
                    <td>
                      {t.priority === 'Fire' ? (
                        <span className="fire-indicator">
                          <span className="flame" aria-hidden="true"><span className="flame-spark" /><span className="flame-spark" /></span> {t.priority}
                        </span>
                      ) : (
                        <span className={`badge ${priorityClass(t.priority)}`}>
                          <i className={`fa-solid ${PRIORITY_ICON[t.priority] || 'fa-thumbtack'}`} aria-hidden="true" /> {t.priority}
                        </span>
                      )}
                    </td>
                    <td>
                      <span
                        className={`badge ${statusClass(t.status)}`}
                        title={t.status === 'Undone' ? t.cannot_complete_reason : t.status === 'Done' ? t.completion_notes : undefined}
                      >
                        {t.status}
                      </span>
                    </td>
                    <td>
                      {t.reported_by ? (
                        <span className="table-assigned-by">
                          <i className="fa-solid fa-user" aria-hidden="true" />
                          {t.reported_by.id === user?.id ? 'Me' : t.reported_by.name}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8125rem' }}>
                      {t.status === 'In Progress' && t.active_time_log ? (
                        <LiveTime task={t} />
                      ) : t.total_logged_secs ? (
                        formatDuration(t.total_logged_secs)
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.8125rem' }}>{formatDate(t.due_date)}</td>
                    <td onClick={(e) => e.stopPropagation()}>{renderRowActions(t)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && filtered.length > 0 && (
            <MobileCardList
              items={pageItems}
              detailTitle={(t) => t.title}
              detailSubtitle={(t) => `Task #${t.id}`}
              detailSize="lg"
              renderCard={(t) => (
                <>
                  <span className="mdc-title">{t.title}</span>
                  <span className="mdc-subtitle">
                    {t.reported_by ? `By ${t.reported_by.id === user?.id ? 'Me' : t.reported_by.name}` : 'Unknown'} · {formatDate(t.due_date)}
                  </span>
                  <div className="mdc-badges">
                    {t.priority === 'Fire' ? (
                      <span className="fire-indicator">
                        <span className="flame" aria-hidden="true"><span className="flame-spark" /><span className="flame-spark" /></span> {t.priority}
                      </span>
                    ) : (
                      <span className={`badge ${priorityClass(t.priority)}`}>{t.priority}</span>
                    )}
                    <span className={`badge ${statusClass(t.status)}`}>{t.status}</span>
                  </div>
                </>
              )}
              renderDetail={(t) => (
                <TaskDetailView task={t}>
                  {tab === 'mine' && ['Pending', 'In Progress', 'Paused'].includes(t.status) && (
                    <div className="detail-actions">
                      {(t.status === 'Pending' || t.status === 'Paused') && (
                        <button type="button" className="btn-table-action" onClick={() => runAction(t, 'start')}>
                          <i className="fa-solid fa-play" aria-hidden="true" /> Start
                        </button>
                      )}
                      {t.status === 'In Progress' && (
                        <>
                          <button type="button" className="btn-table-action" onClick={() => runAction(t, 'pause')}>
                            <i className="fa-solid fa-pause" aria-hidden="true" /> Pause
                          </button>
                          <button type="button" className="btn-table-action" onClick={() => openComplete(t)}>
                            <i className="fa-solid fa-check" aria-hidden="true" /> Mark Done
                          </button>
                        </>
                      )}
                      <button type="button" className="btn-table-action danger" onClick={() => openCannotComplete(t)}>
                        <i className="fa-solid fa-ban" aria-hidden="true" /> Mark Undone
                      </button>
                    </div>
                  )}
                </TaskDetailView>
              )}
            />
          )}
        </div>

        {!loading && filtered.length > 0 && (
          <div className="pagination-bar">
            <span className="pagination-info">
              Showing {(currentPage - 1) * PAGE_SIZE + 1} - {Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length} tasks
            </span>
            <div className="pagination-controls">
              <button
                type="button"
                className="btn-table-action"
                disabled={currentPage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <i className="fa-solid fa-chevron-left" aria-hidden="true" />
              </button>
              <span>{currentPage} / {totalPages}</span>
              <button
                type="button"
                className="btn-table-action"
                disabled={currentPage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <i className="fa-solid fa-chevron-right" aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
      </div>

      <TaskDetailModal
        task={viewingTask}
        isOpen={Boolean(viewingTask)}
        onClose={() => setViewingTask(null)}
      />

      <Modal
        isOpen={Boolean(cannotCompleteTask)}
        onClose={() => setCannotCompleteTask(null)}
        title="Mark Task Undone"
        subtitle={cannotCompleteTask ? `"${cannotCompleteTask.title}" -- please explain why.` : ''}
        size="sm"
      >
        <form className="task-form-modern" onSubmit={submitCannotComplete}>
          {reasonError && (
            <div className="alert-error">
              <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" /> {reasonError}
            </div>
          )}

          <div className="form-field">
            <label htmlFor="cannot_complete_reason">Reason *</label>
            <textarea
              id="cannot_complete_reason"
              rows={4}
              autoFocus
              placeholder="Explain why this task couldn't be completed…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>

          <div className="modal-form-actions">
            <button type="button" className="btn-modal-cancel" onClick={() => setCannotCompleteTask(null)}>
              Cancel
            </button>
            <button type="submit" className="btn-modal-submit btn-modal-danger" disabled={busyId === cannotCompleteTask?.id}>
              {busyId === cannotCompleteTask?.id ? 'Saving…' : 'Submit'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(completingTask)}
        onClose={() => setCompletingTask(null)}
        title="Mark Task Done"
        subtitle={completingTask ? `"${completingTask.title}" -- add a note if you'd like (optional).` : ''}
        size="sm"
      >
        <form className="task-form-modern" onSubmit={submitComplete}>
          {completionError && (
            <div className="alert-error">
              <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" /> {completionError}
            </div>
          )}

          <div className="form-field">
            <label htmlFor="completion_notes">Completion Notes</label>
            <textarea
              id="completion_notes"
              rows={4}
              autoFocus
              placeholder="Anything worth noting about how this was completed… (optional)"
              value={completionNotes}
              onChange={(e) => setCompletionNotes(e.target.value)}
            />
          </div>

          <div className="modal-form-actions">
            <button type="button" className="btn-modal-cancel" onClick={() => setCompletingTask(null)}>
              Cancel
            </button>
            <button type="submit" className="btn-modal-submit" disabled={busyId === completingTask?.id}>
              {busyId === completingTask?.id ? 'Saving…' : 'Mark Done'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Task"
        subtitle="Assign it to yourself to start working right away, or leave it unassigned for an admin to pick up."
        size="2xl"
      >
        <TaskForm onSaved={handleCreated} onCancel={() => setShowCreateModal(false)} />
      </Modal>
    </div>
  )
}
