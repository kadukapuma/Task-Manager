import { useEffect, useMemo, useState } from 'react'
import api, { apiErrorMessage } from '../../api/client'
import MobileCardList from '../../components/MobileCardList/MobileCardList'
import Modal from '../../components/Modal/Modal'
import TaskDetailView from '../../components/TaskDetailView/TaskDetailView'
import StaffTimeAnalytics from '../../components/StaffTimeAnalytics/StaffTimeAnalytics'
import { formatDate, formatDuration, formatMinutes, priorityClass, statusClass, taskTypeClass } from '../../utils/format'
import './AdminStaffWork.css'

const QUICK_STATUS_FILTERS = [
  { label: 'Working', status: 'In Progress' },
  { label: 'Paused', status: 'Paused' },
  { label: 'Finished', status: 'Done' },
  { label: 'Undone', status: 'Undone' },
]

const PERIOD_FILTERS = [
  { label: 'Daily', value: 'day' },
  { label: 'Weekly', value: 'week' },
  { label: 'Monthly', value: 'month' },
]

function toDateStr(date) {
  return date.toLocaleDateString('en-CA') // YYYY-MM-DD, in local time
}

function todayStr() {
  return toDateStr(new Date())
}

function weekStartStr() {
  const now = new Date()
  const day = now.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  return toDateStr(new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday))
}

function monthStartStr() {
  const now = new Date()
  return toDateStr(new Date(now.getFullYear(), now.getMonth(), 1))
}

/** Range for a given quick-filter value, e.g. presetRange('month') -> { from, to }. */
function presetRange(value) {
  const today = todayStr()
  if (value === 'day') return { from: today, to: today }
  if (value === 'week') return { from: weekStartStr(), to: today }
  return { from: monthStartStr(), to: today }
}

/** Does this task's created_at fall within [from, to] (inclusive, local dates)? */
function isInRange(createdAt, from, to) {
  if (!createdAt) return false
  const created = new Date(createdAt)
  if (from && created < new Date(`${from}T00:00:00`)) return false
  if (to && created > new Date(`${to}T23:59:59.999`)) return false
  return true
}

const PRIORITY_ICON = {
  Fire: 'fa-fire',
  Urgent: 'fa-bolt',
  Normal: 'fa-thumbtack',
}

function initialsOf(name) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

export default function AdminStaffWork() {
  const [tasks, setTasks] = useState([])
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [selectedStaffId, setSelectedStaffId] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [from, setFrom] = useState(() => monthStartStr())
  const [to, setTo] = useState(() => todayStr())
  const [viewingTask, setViewingTask] = useState(null)

  function applyPreset(value) {
    const range = presetRange(value)
    setFrom(range.from)
    setTo(range.to)
  }

  function load() {
    setLoading(true)
    setError('')
    Promise.all([api.get('/tasks', { params: { per_page: 1000 } }), api.get('/users')])
      .then(([tasksRes, usersRes]) => {
        setTasks(tasksRes.data.data)
        setStaff(usersRes.data.filter((u) => u.role === 'staff'))
      })
      .catch((err) => setError(apiErrorMessage(err, 'Could not load staff work data.')))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  const periodTasks = useMemo(
    () => tasks.filter((t) => isInRange(t.created_at, from, to)),
    [tasks, from, to],
  )

  const staffCounts = useMemo(() => {
    const counts = {}
    for (const s of staff) {
      counts[s.id] = { working: 0, paused: 0, finished: 0, cannotComplete: 0, pending: 0 }
    }
    for (const t of periodTasks) {
      if (!t.assigned_staff_id || !counts[t.assigned_staff_id]) continue
      if (t.status === 'In Progress') counts[t.assigned_staff_id].working++
      else if (t.status === 'Paused') counts[t.assigned_staff_id].paused++
      else if (t.status === 'Done') counts[t.assigned_staff_id].finished++
      else if (t.status === 'Undone') counts[t.assigned_staff_id].cannotComplete++
      else if (t.status === 'Pending') counts[t.assigned_staff_id].pending++
    }
    return counts
  }, [staff, periodTasks])

  const filteredTasks = useMemo(() => {
    return periodTasks
      .filter((t) => t.assigned_staff_id)
      .filter((t) => !selectedStaffId || String(t.assigned_staff_id) === String(selectedStaffId))
      .filter((t) => !statusFilter || t.status === statusFilter)
  }, [periodTasks, selectedStaffId, statusFilter])

  function selectStaff(id) {
    setSelectedStaffId((prev) => (String(prev) === String(id) ? '' : id))
  }

  return (
    <div className="admin-staffwork-container">
      <div className="tasks-top-card">
        <div className="tasks-header-row">
          <div className="tasks-title-group">
            <h2>Staff Work Overview</h2>
            <span className="task-count-badge">{staff.length} staff</span>
          </div>
        </div>

        <div className="filter-preset-buttons">
          <span className="filter-label">Time Period:</span>
          {PERIOD_FILTERS.map(({ label, value }) => {
            const range = presetRange(value)
            const active = from === range.from && to === range.to
            return (
              <button
                key={value}
                type="button"
                className={`btn-preset ${active ? 'active' : ''}`}
                onClick={() => applyPreset(value)}
              >
                {label}
              </button>
            )
          })}
        </div>

        <div className="date-filters-bar">
          <div className="date-filter-field">
            <label htmlFor="staffwork_from">From Date</label>
            <input id="staffwork_from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div className="date-filter-field">
            <label htmlFor="staffwork_to">To Date</label>
            <input id="staffwork_to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>

        <div className="filter-preset-buttons">
          <span className="filter-label">Quick Filters:</span>
          <button
            type="button"
            className={`btn-preset ${!statusFilter ? 'active' : ''}`}
            onClick={() => setStatusFilter('')}
          >
            All
          </button>
          {QUICK_STATUS_FILTERS.map(({ label, status }) => (
            <button
              key={status}
              type="button"
              className={`btn-preset ${statusFilter === status ? 'active' : ''}`}
              onClick={() => setStatusFilter(status)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="alert-error">
          <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" /> {error}
        </div>
      )}

      {loading ? (
        <div className="task-empty-state">
          <div className="route-spinner" style={{ width: 28, height: 28 }} />
          <span className="task-empty-desc">Loading staff work…</span>
        </div>
      ) : (
        <>
          {/* Per-staff summary cards -- click one to filter the table below */}
          <div className="staff-work-grid">
            {staff.map((s) => {
              const c = staffCounts[s.id] || { working: 0, paused: 0, finished: 0, cannotComplete: 0 }
              const active = String(selectedStaffId) === String(s.id)
              return (
                <button
                  type="button"
                  key={s.id}
                  className={`staff-work-card ${active ? 'active' : ''}`}
                  onClick={() => selectStaff(s.id)}
                >
                  <span className="staff-work-avatar">{initialsOf(s.name)}</span>
                  <span className="staff-work-name-group">
                    <span className="staff-work-name">{s.name}</span>
                    <span className="staff-work-stats">
                      <span className="staff-work-stat working">{c.working} working</span>
                      <span className="staff-work-stat paused">{c.paused} paused</span>
                      <span className="staff-work-stat finished">{c.finished} finished</span>
                      {c.cannotComplete > 0 && (
                        <span className="staff-work-stat cannot-complete">{c.cannotComplete} undone</span>
                      )}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>



          {/* Filtered task table */}
          <div className="tasks-table-card">
            <div className="modern-table-container">
              {filteredTasks.length === 0 ? (
                <div className="task-empty-state">
                  <div className="task-empty-icon"><i className="fa-solid fa-magnifying-glass" aria-hidden="true" /></div>
                  <div className="task-empty-title">No tasks found</div>
                  <p className="task-empty-desc">No assigned tasks matched your current filters.</p>
                </div>
              ) : (
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Task Title</th>
                      <th>Task Type</th>
                      <th>Staff</th>
                      <th>Customer</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Time Logged</th>
                      <th>Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredTasks.map((t) => (
                      <tr key={t.id} className="clickable-row" onClick={() => setViewingTask(t)}>
                        <td style={{ fontWeight: 600 }}>{t.title}</td>
                        <td>
                          {t.task_type ? (
                            <span className={`badge ${taskTypeClass(t.task_type)}`}>{t.task_type}</span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>
                        <td>{t.assigned_staff?.name ?? '—'}</td>
                        <td>{t.customer?.name ?? <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
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
                          </span>
                        </td>
                        <td style={{ fontSize: '0.8125rem' }}>
                          {t.total_logged_secs ? formatDuration(t.total_logged_secs) : '—'}
                          {t.estimated_minutes ? ` / ${formatMinutes(t.estimated_minutes)} est.` : ''}
                        </td>
                        <td style={{ fontSize: '0.8125rem' }}>{formatDate(t.due_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {filteredTasks.length > 0 && (
                <MobileCardList
                  items={filteredTasks}
                  detailTitle={(t) => t.title}
                  detailSubtitle={(t) => t.assigned_staff?.name ?? ''}
                  renderCard={(t) => (
                    <>
                      <span className="mdc-title">{t.title}</span>
                      <span className="mdc-subtitle">{t.assigned_staff?.name ?? 'Unassigned'} · {t.customer?.name ?? 'No customer'}</span>
                      <div className="mdc-badges">
                        {t.task_type && (
                          <span className={`badge ${taskTypeClass(t.task_type)}`}>{t.task_type}</span>
                        )}
                        <span className={`badge ${priorityClass(t.priority)}`}>{t.priority}</span>
                        <span className={`badge ${statusClass(t.status)}`}>{t.status}</span>
                      </div>
                    </>
                  )}
                  renderDetail={(t) => <TaskDetailView task={t} />}
                />
              )}
            </div>
          </div>
            {/* Per-staff time logged analytics -- filterable by date range */}
            <StaffTimeAnalytics />
        </>
      )}

      <Modal
        isOpen={Boolean(viewingTask)}
        onClose={() => setViewingTask(null)}
        title={viewingTask?.title || ''}
        subtitle={viewingTask ? `Task #${viewingTask.id}` : ''}
        size="sm"
      >
        {viewingTask && <TaskDetailView task={viewingTask} />}
      </Modal>
    </div>
  )
}
