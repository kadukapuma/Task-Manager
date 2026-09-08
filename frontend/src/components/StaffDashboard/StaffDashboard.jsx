import { useEffect, useState } from 'react'
import api, { apiErrorMessage } from '../../api/client'
import { formatDate, formatDuration, formatMinutes, formatVariance, priorityClass, statusColor } from '../../utils/format'
import MobileCardList from '../MobileCardList/MobileCardList'
import BarChart from '../charts/BarChart'
import './StaffDashboard.css'

function shortDayLabel(dateStr) {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}

export default function StaffDashboard() {
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  function load() {
    setLoading(true)
    setError('')
    const params = {}
    if (from) params.from = from
    if (to) params.to = to

    api
      .get('/staff/dashboard-summary', { params })
      .then(({ data }) => setSummary(data.data))
      .catch((err) => setError(apiErrorMessage(err, 'Could not load your staff dashboard.')))
      .finally(() => setLoading(false))
  }

  useEffect(load, []) // eslint-disable-line react-hooks/exhaustive-deps

  function setPreset(type) {
    const now = new Date()
    let f = ''
    let t = ''

    if (type === 'today') {
      f = now.toISOString().slice(0, 10)
      t = f
    } else if (type === 'week') {
      const first = now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1)
      const monday = new Date(now.setDate(first))
      f = monday.toISOString().slice(0, 10)
      t = new Date().toISOString().slice(0, 10)
    } else if (type === 'month') {
      f = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
      t = new Date().toISOString().slice(0, 10)
    }

    setFrom(f)
    setTo(t)
    setLoading(true)
    setError('')
    const params = {}
    if (f) params.from = f
    if (t) params.to = t

    api
      .get('/staff/dashboard-summary', { params })
      .then(({ data }) => setSummary(data.data))
      .catch((err) => setError(apiErrorMessage(err, 'Could not load your staff dashboard.')))
      .finally(() => setLoading(false))
  }

  if (loading && !summary) {
    return (
      <div className="task-empty-state">
        <div className="route-spinner" />
        <span className="task-empty-desc">Loading your dashboard analytics…</span>
      </div>
    )
  }

  return (
    <div className="staff-dashboard-container">
      {error && (
        <div className="alert-error">
          <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" /> {error}
        </div>
      )}

      {summary && (
        <>
          {/* Preset & Custom Date Filter Bar */}
          <div className="staff-dashboard-filter-card">
            <div className="filter-preset-buttons">
              <span className="filter-label">Quick Filters:</span>
              <button type="button" className={`btn-preset ${!from && !to ? 'active' : ''}`} onClick={() => setPreset('all')}>
                All Time
              </button>
              <button type="button" className="btn-preset" onClick={() => setPreset('today')}>
                Today
              </button>
              <button type="button" className="btn-preset" onClick={() => setPreset('week')}>
                This Week
              </button>
              <button type="button" className="btn-preset" onClick={() => setPreset('month')}>
                This Month
              </button>
            </div>

            <div className="date-filters-group">
              <div className="date-field">
                <label htmlFor="staff_from">From</label>
                <input
                  id="staff_from"
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </div>
              <div className="date-field">
                <label htmlFor="staff_to">To</label>
                <input
                  id="staff_to"
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </div>
              <button type="button" className="btn-filter-apply" onClick={load}>
                Apply
              </button>
            </div>
          </div>

          {/* Top KPI Summary Grid */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-card-top">
                <span className="kpi-icon-mini primary"><i className="fa-regular fa-clock" aria-hidden="true" /></span>
                <span className="kpi-label">Logged Hours</span>
              </div>
              <span className="kpi-value">{formatDuration(summary.total_logged_secs)}</span>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-top">
                <span className="kpi-icon-mini info"><i className="fa-regular fa-calendar-check" aria-hidden="true" /></span>
                <span className="kpi-label">Days Worked</span>
              </div>
              <span className="kpi-value">{summary.days_worked}</span>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-top">
                <span className="kpi-icon-mini success"><i className="fa-solid fa-check" aria-hidden="true" /></span>
                <span className="kpi-label">Finished</span>
              </div>
              <span className="kpi-value">{summary.tasks_completed_count}</span>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-top">
                <span className="kpi-icon-mini warning"><i className="fa-solid fa-bolt" aria-hidden="true" /></span>
                <span className="kpi-label">Working</span>
              </div>
              <span className="kpi-value">{summary.tasks_in_progress_count}</span>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-top">
                <span className="kpi-icon-mini neutral"><i className="fa-regular fa-hourglass-half" aria-hidden="true" /></span>
                <span className="kpi-label">Pending</span>
              </div>
              <span className="kpi-value">{summary.tasks_pending_count}</span>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-top">
                <span className="kpi-icon-mini warning"><i className="fa-solid fa-pause" aria-hidden="true" /></span>
                <span className="kpi-label">Paused</span>
              </div>
              <span className="kpi-value">{summary.tasks_paused_count}</span>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-top">
                <span className="kpi-icon-mini danger"><i className="fa-solid fa-ban" aria-hidden="true" /></span>
                <span className="kpi-label">Undone</span>
              </div>
              <span className="kpi-value">{summary.tasks_undone_count}</span>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-top">
                <span className="kpi-icon-mini info"><i className="fa-solid fa-chart-line" aria-hidden="true" /></span>
                <span className="kpi-label">Efficiency</span>
              </div>
              <span className="kpi-value kpi-value-sm">
                {formatVariance(summary.total_estimated_minutes, summary.completed_actual_secs).text}
              </span>
            </div>
          </div>

          {/* Charts: daily hours trend + task status breakdown */}
          <div className="charts-grid">
            <div className="dashboard-card">
              <div className="dashboard-card-header">
                <h2 className="dashboard-card-title">Hours Worked Per Day</h2>
              </div>
              <BarChart
                orientation="vertical"
                height={160}
                data={summary.daily_breakdown.map((d) => ({ label: shortDayLabel(d.work_date), value: d.secs }))}
                formatValue={(v) => formatDuration(v)}
                emptyMessage="No time logged in this window yet."
              />
            </div>

            <div className="dashboard-card">
              <div className="dashboard-card-header">
                <h2 className="dashboard-card-title">My Task Status</h2>
              </div>
              <BarChart
                orientation="horizontal"
                data={summary.status_breakdown.map((s) => ({
                  label: s.status,
                  value: s.count,
                  color: statusColor(s.status),
                }))}
              />
            </div>
          </div>

          {/* Completed Tasks Performance Table */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <div>
                <h2 className="dashboard-card-title">Completed Tasks & Time Performance</h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  Shows tasks completed by you along with estimated time vs. actual time logged.
                </p>
              </div>
              <span className="badge success">{summary.tasks_completed_count} Completed</span>
            </div>

            <div className="modern-table-container">
              {summary.completed_tasks.length === 0 ? (
                <div className="task-empty-state">
                  <span className="task-empty-desc">No completed tasks recorded in this date range.</span>
                </div>
              ) : (
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Task Title</th>
                      <th>Customer</th>
                      <th>Priority</th>
                      <th>Est. Time</th>
                      <th>Actual Time</th>
                      <th>Performance</th>
                      <th>Completed On</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.completed_tasks.map((task) => {
                      const v = formatVariance(task.estimated_minutes, task.total_logged_secs)
                      return (
                        <tr key={task.id}>
                          <td style={{ fontWeight: 600 }}>{task.title}</td>
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

              {summary.completed_tasks.length > 0 && (
                <MobileCardList
                  items={summary.completed_tasks}
                  detailTitle={(task) => task.title}
                  renderCard={(task) => {
                    const v = formatVariance(task.estimated_minutes, task.total_logged_secs)
                    return (
                      <>
                        <span className="mdc-title">{task.title}</span>
                        <span className="mdc-subtitle">{task.customer?.name ?? 'No customer'} · {formatDate(task.completed_at)}</span>
                        <div className="mdc-badges">
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
                  renderDetail={(task) => {
                    const v = formatVariance(task.estimated_minutes, task.total_logged_secs)
                    return (
                      <div className="detail-list">
                        <div className="detail-row">
                          <span className="detail-row-label">Customer</span>
                          <span className="detail-row-value">{task.customer?.name ?? '—'}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-row-label">Priority</span>
                          <span className="detail-row-value">
                            <span className={`badge ${priorityClass(task.priority)}`}>{task.priority}</span>
                          </span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-row-label">Estimated Time</span>
                          <span className="detail-row-value">
                            {task.estimated_minutes ? formatMinutes(task.estimated_minutes) : '—'}
                          </span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-row-label">Actual Time</span>
                          <span className="detail-row-value">
                            {task.total_logged_secs ? formatDuration(task.total_logged_secs) : '—'}
                          </span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-row-label">Performance</span>
                          <span className="detail-row-value">
                            <span
                              className="badge"
                              style={{
                                background: v.status === 'good' ? 'var(--success-subtle)' : v.status === 'over' ? 'var(--warning-subtle)' : 'var(--bg-surface-hover)',
                                color: v.status === 'good' ? 'var(--success-text)' : v.status === 'over' ? 'var(--warning-text)' : 'var(--text-secondary)',
                              }}
                            >
                              {v.text}
                            </span>
                          </span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-row-label">Completed On</span>
                          <span className="detail-row-value">{formatDate(task.completed_at)}</span>
                        </div>
                      </div>
                    )
                  }}
                />
              )}
            </div>
          </div>

          {/* Recent Working Hours Time Logs */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h2 className="dashboard-card-title">Recent Working Hours Activity Log</h2>
            </div>

            <div className="modern-table-container">
              {summary.recent_logs.length === 0 ? (
                <div className="task-empty-state">
                  <span className="task-empty-desc">No time logs recorded in this period.</span>
                </div>
              ) : (
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Task Title</th>
                      <th>Started At</th>
                      <th>Finished At</th>
                      <th>Duration</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.recent_logs.map((log) => (
                      <tr key={log.id}>
                        <td style={{ fontWeight: 600 }}>{log.task?.title ?? `Task #${log.task_id}`}</td>
                        <td style={{ fontSize: '0.8125rem' }}>
                          {log.start_time ? new Date(log.start_time).toLocaleString() : '—'}
                        </td>
                        <td style={{ fontSize: '0.8125rem' }}>
                          {log.finish_time ? new Date(log.finish_time).toLocaleString() : <span className="badge warning">Running…</span>}
                        </td>
                        <td>
                          <span className="badge" style={{ background: 'var(--primary-subtle)', color: 'var(--primary)' }}>
                            <i className="fa-regular fa-clock" aria-hidden="true" /> {formatDuration(log.duration_secs)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {summary.recent_logs.length > 0 && (
                <MobileCardList
                  items={summary.recent_logs}
                  detailTitle={(log) => log.task?.title ?? `Task #${log.task_id}`}
                  renderCard={(log) => (
                    <>
                      <span className="mdc-title">{log.task?.title ?? `Task #${log.task_id}`}</span>
                      <span className="mdc-subtitle">
                        {log.start_time ? new Date(log.start_time).toLocaleString() : '—'}
                      </span>
                      <div className="mdc-badges">
                        {log.finish_time ? (
                          <span className="badge" style={{ background: 'var(--primary-subtle)', color: 'var(--primary)' }}>
                            <i className="fa-regular fa-clock" aria-hidden="true" /> {formatDuration(log.duration_secs)}
                          </span>
                        ) : (
                          <span className="badge warning">Running…</span>
                        )}
                      </div>
                    </>
                  )}
                  renderDetail={(log) => (
                    <div className="detail-list">
                      <div className="detail-row">
                        <span className="detail-row-label">Started At</span>
                        <span className="detail-row-value">
                          {log.start_time ? new Date(log.start_time).toLocaleString() : '—'}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-row-label">Finished At</span>
                        <span className="detail-row-value">
                          {log.finish_time ? new Date(log.finish_time).toLocaleString() : <span className="badge warning">Running…</span>}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-row-label">Duration</span>
                        <span className="detail-row-value">
                          <span className="badge" style={{ background: 'var(--primary-subtle)', color: 'var(--primary)' }}>
                            <i className="fa-regular fa-clock" aria-hidden="true" /> {formatDuration(log.duration_secs)}
                          </span>
                        </span>
                      </div>
                    </div>
                  )}
                />
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

