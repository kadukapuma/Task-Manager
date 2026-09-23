import { useEffect, useMemo, useState } from 'react'
import api, { apiErrorMessage } from '../../api/client'
import MobileCardList from '../../components/MobileCardList/MobileCardList'
import TaskDetailModal from '../../components/TaskDetailModal/TaskDetailModal'
import TaskDetailView from '../../components/TaskDetailView/TaskDetailView'
import BarChart from '../../components/charts/BarChart'
import { formatDate, formatDuration, formatMinutes, formatVariance, priorityClass, taskTypeClass } from '../../utils/format'
import './AdminStaffWork.css'

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

const PERIOD_PRESETS = [
  { label: 'Today', value: 'today' },
  { label: 'This Week', value: 'week' },
  { label: 'This Month', value: 'month' },
]

/** Range for a given quick-filter preset. */
function presetRange(value) {
  const today = todayStr()
  if (value === 'today') return { from: today, to: today }
  if (value === 'week') return { from: weekStartStr(), to: today }
  return { from: monthStartStr(), to: today }
}

function initialsOf(name) {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

/** Attach a synthetic assigned_staff so the detail popup shows the right
 * person even though this endpoint doesn't eager-load that relation. */
function withAssignee(task, staffName) {
  return { ...task, assigned_staff: { name: staffName } }
}

/** Short "±45m" style delta for the staff card's narrow metric column --
 * formatVariance()'s full sentence ("45m under est.") doesn't fit there. */
function compactVariance(estMins, actualSecs) {
  if (!estMins) return { text: '—', status: 'neutral' }
  const actualMins = Math.round((actualSecs || 0) / 60)
  const diffMins = actualMins - estMins
  if (diffMins === 0) return { text: 'On est.', status: 'good' }
  const sign = diffMins < 0 ? '−' : '+'
  return { text: `${sign}${formatMinutes(Math.abs(diffMins))}`, status: diffMins < 0 ? 'good' : 'over' }
}

export default function AdminStaffWork() {
  const [timePerStaff, setTimePerStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [from, setFrom] = useState(() => presetRange('today').from)
  const [to, setTo] = useState(() => presetRange('today').to)
  const [selectedStaffId, setSelectedStaffId] = useState(null)
  const [viewingTask, setViewingTask] = useState(null)

  function load() {
    setLoading(true)
    setError('')
    const params = {}
    if (from) params.from = from
    if (to) params.to = to

    api
      .get('/dashboard/summary', { params })
      .then(({ data }) => setTimePerStaff(data.data.time_per_staff))
      .catch((err) => setError(apiErrorMessage(err, 'Could not load staff performance data.')))
      .finally(() => setLoading(false))
  }

  useEffect(load, [from, to]) // eslint-disable-line react-hooks/exhaustive-deps

  function applyPreset(value) {
    const range = presetRange(value)
    setFrom(range.from)
    setTo(range.to)
  }

  function selectStaff(id) {
    setSelectedStaffId((prev) => (String(prev) === String(id) ? null : id))
  }

  const teamTotals = useMemo(
    () =>
      timePerStaff.reduce(
        (acc, s) => ({
          completed: acc.completed + s.completed_tasks_count,
          secs: acc.secs + s.total_secs,
          estimatedMinutes: acc.estimatedMinutes + s.total_estimated_minutes,
          actualSecs: acc.actualSecs + s.completed_actual_secs,
        }),
        { completed: 0, secs: 0, estimatedMinutes: 0, actualSecs: 0 },
      ),
    [timePerStaff],
  )

  const teamEfficiency = formatVariance(teamTotals.estimatedMinutes, teamTotals.actualSecs)
  const selectedRow = timePerStaff.find((s) => String(s.staff_id) === String(selectedStaffId)) || null

  const tableTasks = useMemo(() => {
    if (selectedRow) {
      return selectedRow.completed_tasks.map((t) => withAssignee(t, selectedRow.staff_name))
    }
    return timePerStaff
      .flatMap((s) => s.completed_tasks.map((t) => withAssignee(t, s.staff_name)))
      .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
  }, [timePerStaff, selectedRow])

  const showStaffColumn = !selectedRow

  return (
    <div className="admin-staffwork-container">
      <div className="tasks-top-card">
        <div className="tasks-header-row">
          <div className="tasks-title-group">
            <h2>Staff Performance</h2>
            <span className="task-count-badge">{timePerStaff.length} team members</span>
          </div>
        </div>

        <div className="staffwork-toolbar">
          <div className="filter-preset-buttons">
            {PERIOD_PRESETS.map(({ label, value }) => {
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

          <div className="staffwork-daterange">
            <i className="fa-regular fa-calendar" aria-hidden="true" />
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" />
            <span className="staffwork-daterange-sep">–</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To date" />
          </div>
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
          <span className="task-empty-desc">Loading staff performance…</span>
        </div>
      ) : (
        <>
          {/* Team-wide KPI strip for the selected period */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-card-top">
                <span className="kpi-icon-mini success"><i className="fa-solid fa-check" aria-hidden="true" /></span>
                <span className="kpi-label">Tasks Completed</span>
              </div>
              <span className="kpi-value">{teamTotals.completed}</span>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-top">
                <span className="kpi-icon-mini primary"><i className="fa-regular fa-clock" aria-hidden="true" /></span>
                <span className="kpi-label">Hours Logged</span>
              </div>
              <span className="kpi-value">{formatDuration(teamTotals.secs)}</span>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-top">
                <span className="kpi-icon-mini info"><i className="fa-solid fa-chart-line" aria-hidden="true" /></span>
                <span className="kpi-label">Team Efficiency</span>
              </div>
              <span className="kpi-value kpi-value-sm">{teamEfficiency.text}</span>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-top">
                <span className="kpi-icon-mini warning"><i className="fa-solid fa-bolt" aria-hidden="true" /></span>
                <span className="kpi-label">Working Now</span>
              </div>
              <span className="kpi-value">{timePerStaff.filter((s) => s.in_progress_tasks_count > 0).length}</span>
            </div>
          </div>

          {/* Hours worked comparison across the team */}
          {timePerStaff.length > 0 && (
            <div className="dashboard-card">
              <div className="dashboard-card-header">
                <h2 className="dashboard-card-title">Hours Worked by Staff</h2>
              </div>
              <BarChart
                orientation="horizontal"
                data={timePerStaff.map((s) => ({ label: s.staff_name, value: s.total_secs }))}
                formatValue={(v) => formatDuration(v)}
                emptyMessage="No time logged in this window yet."
              />
            </div>
          )}

          {/* Per-staff performance cards -- click one to drill into their completed tasks */}
          <div className="staffwork-grid">
            {timePerStaff.map((s) => {
              const variance = compactVariance(s.total_estimated_minutes, s.completed_actual_secs)
              const active = String(selectedStaffId) === String(s.staff_id)
              const queued = s.pending_tasks_count + s.paused_tasks_count
              const state = s.in_progress_tasks_count > 0 ? 'working' : queued > 0 ? 'queued' : 'idle'

              return (
                <button
                  type="button"
                  key={s.staff_id}
                  className={`staffwork-card staffwork-card-${state} ${active ? 'active' : ''}`}
                  onClick={() => selectStaff(s.staff_id)}
                >
                  <div className="staffwork-card-top">
                    <span className="staffwork-avatar">
                      {initialsOf(s.staff_name)}
                      {state === 'working' && <span className="staffwork-avatar-ring" aria-hidden="true" />}
                    </span>
                    <div className="staffwork-name-group">
                      <span className="staffwork-name">{s.staff_name}</span>
                      {state === 'working' ? (
                        <span className="staffwork-status-badge working">
                          <span className="live-dot" aria-hidden="true" /> Working now
                        </span>
                      ) : state === 'queued' ? (
                        <span className="staffwork-status-badge queued">
                          <i className="fa-regular fa-hourglass-half" aria-hidden="true" /> {queued} queued
                        </span>
                      ) : (
                        <span className="staffwork-status-badge idle">
                          <i className="fa-regular fa-circle-check" aria-hidden="true" /> No open tasks
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="staffwork-metrics">
                    <div className="staffwork-metric">
                      <span className="staffwork-metric-icon success"><i className="fa-solid fa-check" aria-hidden="true" /></span>
                      <span className={`staffwork-metric-value ${s.completed_tasks_count === 0 ? 'is-zero' : ''}`}>
                        {s.completed_tasks_count}
                      </span>
                      <span className="staffwork-metric-label">Done</span>
                    </div>
                    <div className="staffwork-metric">
                      <span className="staffwork-metric-icon primary"><i className="fa-regular fa-clock" aria-hidden="true" /></span>
                      <span className={`staffwork-metric-value ${s.total_secs === 0 ? 'is-zero' : ''}`}>
                        {formatDuration(s.total_secs)}
                      </span>
                      <span className="staffwork-metric-label">Logged</span>
                    </div>
                    <div className="staffwork-metric">
                      <span className={`staffwork-metric-icon staffwork-eff-icon-${variance.status}`}>
                        <i className="fa-solid fa-gauge-high" aria-hidden="true" />
                      </span>
                      <span
                        className={`staffwork-metric-value staffwork-eff-${variance.status}`}
                        title={formatVariance(s.total_estimated_minutes, s.completed_actual_secs).text}
                      >
                        {variance.text}
                      </span>
                      <span className="staffwork-metric-label">Efficiency</span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Drill-down: completed tasks for the selected staff member (or everyone) */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <div>
                <h2 className="dashboard-card-title">
                  {selectedRow ? `${selectedRow.staff_name}'s Completed Tasks` : 'Completed Tasks & Time Performance'}
                </h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  {selectedRow
                    ? 'Click a different card to switch, or the same one to see the whole team again.'
                    : 'Estimated time vs. actual time logged for this period. Click a team member above to focus on just them.'}
                </p>
              </div>
              <span className="badge success">{tableTasks.length} Completed</span>
            </div>

            <div className="modern-table-container">
              {tableTasks.length === 0 ? (
                <div className="task-empty-state">
                  <span className="task-empty-desc">No completed tasks recorded in this date range.</span>
                </div>
              ) : (
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Task Title</th>
                      {showStaffColumn && <th>Staff</th>}
                      <th>Task Type</th>
                      <th>Customer</th>
                      <th>Priority</th>
                      <th>Est. Time</th>
                      <th>Actual Time</th>
                      <th>Performance</th>
                      <th>Completed On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableTasks.map((task) => {
                      const v = formatVariance(task.estimated_minutes, task.total_logged_secs)
                      return (
                        <tr key={task.id} className="clickable-row" onClick={() => setViewingTask(task)}>
                          <td style={{ fontWeight: 600 }}>{task.title}</td>
                          {showStaffColumn && <td>{task.assigned_staff?.name ?? '—'}</td>}
                          <td>
                            {task.task_type ? (
                              <span className={`badge ${taskTypeClass(task.task_type)}`}>{task.task_type}</span>
                            ) : '—'}
                          </td>
                          <td>{task.customer?.name ?? '—'}</td>
                          <td>
                            <span className={`badge ${priorityClass(task.priority)}`}>{task.priority}</span>
                          </td>
                          <td>
                            {task.estimated_minutes ? (
                              <span className="badge" style={{ background: 'var(--info-subtle)', color: 'var(--info-text)' }}>
                                <i className="fa-regular fa-clock" aria-hidden="true" /> {formatMinutes(task.estimated_minutes)}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td>
                            {task.total_logged_secs ? (
                              <span className="badge" style={{ background: 'var(--primary-subtle)', color: 'var(--primary)' }}>
                                <i className="fa-solid fa-stopwatch" aria-hidden="true" /> {formatDuration(task.total_logged_secs)}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td>
                            <span
                              className="badge"
                              style={{
                                background: v.status === 'good' ? 'var(--success-subtle)' : v.status === 'over' ? 'var(--warning-subtle)' : 'var(--bg-surface-hover)',
                                color: v.status === 'good' ? 'var(--success-text)' : v.status === 'over' ? 'var(--warning-text)' : 'var(--text-secondary)',
                              }}
                            >
                              {v.text}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.8125rem' }}>{formatDate(task.completed_at)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}

              {tableTasks.length > 0 && (
                <MobileCardList
                  items={tableTasks}
                  detailTitle={(t) => t.title}
                  detailSubtitle={(t) => t.assigned_staff?.name ?? ''}
                  detailSize="lg"
                  renderCard={(task) => {
                    const v = formatVariance(task.estimated_minutes, task.total_logged_secs)
                    return (
                      <>
                        <span className="mdc-title">{task.title}</span>
                        <span className="mdc-subtitle">
                          {showStaffColumn ? `${task.assigned_staff?.name ?? '—'} · ` : ''}
                          {formatDate(task.completed_at)}
                        </span>
                        <div className="mdc-badges">
                          {task.task_type && <span className={`badge ${taskTypeClass(task.task_type)}`}>{task.task_type}</span>}
                          <span className={`badge ${priorityClass(task.priority)}`}>{task.priority}</span>
                          <span
                            className="badge"
                            style={{
                              background: v.status === 'good' ? 'var(--success-subtle)' : v.status === 'over' ? 'var(--warning-subtle)' : 'var(--bg-surface-hover)',
                              color: v.status === 'good' ? 'var(--success-text)' : v.status === 'over' ? 'var(--warning-text)' : 'var(--text-secondary)',
                            }}
                          >
                            {v.text}
                          </span>
                        </div>
                      </>
                    )
                  }}
                  renderDetail={(task) => <TaskDetailView task={task} />}
                />
              )}
            </div>
          </div>
        </>
      )}

      <TaskDetailModal task={viewingTask} isOpen={Boolean(viewingTask)} onClose={() => setViewingTask(null)} />
    </div>
  )
}
