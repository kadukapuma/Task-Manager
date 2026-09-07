import { useEffect, useState } from 'react'
import api, { apiErrorMessage } from '../../api/client'
import { formatDate, formatDuration, priorityClass, statusClass } from '../../utils/format'
import './AdminDashboard.css'

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  function load() {
    setLoading(true)
    setError('')
    const params = {}
    if (from) params.from = from
    if (to) params.to = to

    api
      .get('/dashboard/summary', { params })
      .then(({ data }) => setSummary(data.data))
      .catch((err) => setError(apiErrorMessage(err, 'Could not load the dashboard.')))
      .finally(() => setLoading(false))
  }

  useEffect(load, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (loading && !summary) {
    return (
      <div className="task-empty-state">
        <div className="route-spinner" />
        <span className="task-empty-desc">Loading analytics dashboard…</span>
      </div>
    )
  }

  return (
    <div className="dashboard-container">
      {error && (
        <div className="alert-error">
          <span>⚠️</span> {error}
        </div>
      )}

      {summary && (
        <>
          {/* Top KPI Cards */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-info">
                <span className="kpi-value">{summary.tasks_completed_this_month}</span>
                <span className="kpi-label">Completed This Month</span>
              </div>
              <div className="kpi-icon-pill success">✓</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-info">
                <span className="kpi-value">{summary.tasks_pending}</span>
                <span className="kpi-label">Tasks Pending</span>
              </div>
              <div className="kpi-icon-pill warning">⏳</div>
            </div>

            <div className="kpi-card">
              <div className="kpi-info">
                <span className="kpi-value">{summary.open_urgent_tasks?.length || 0}</span>
                <span className="kpi-label">Urgent / Fire Queue</span>
              </div>
              <div className="kpi-icon-pill" style={{ background: 'var(--fire-subtle)', color: 'var(--fire)' }}>
                🔥
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-info">
                <span className="kpi-value">{summary.repeating_tasks?.length || 0}</span>
                <span className="kpi-label">Active Repeating Tasks</span>
              </div>
              <div className="kpi-icon-pill primary">🔄</div>
            </div>
          </div>

          {/* Open Fire / Urgent Tasks Priority Card */}
          {summary.open_urgent_tasks.length > 0 && (
            <div className="dashboard-card urgent-card">
              <div className="dashboard-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '1.25rem' }}>🔥</span>
                  <h2 className="dashboard-card-title" style={{ color: 'var(--fire)' }}>
                    High-Priority Triage (Fire & Urgent Tasks)
                  </h2>
                </div>
                <span className="badge priority-fire">Action Required</span>
              </div>

              <div className="modern-table-container">
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Priority</th>
                      <th>Status</th>
                      <th>Assigned Staff</th>
                      <th>Due Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.open_urgent_tasks.map((t) => (
                      <tr key={t.id}>
                        <td style={{ fontWeight: 600 }}>{t.title}</td>
                        <td>
                          <span className={`badge ${priorityClass(t.priority)}`}>
                            {t.priority === 'Fire' ? '🔥' : '⚡'} {t.priority}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${statusClass(t.status)}`}>{t.status}</span>
                        </td>
                        <td>{t.assigned_staff?.name ?? <span className="badge inactive">Unassigned</span>}</td>
                        <td>{formatDate(t.due_date)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Time Logged Per Staff Card */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h2 className="dashboard-card-title">Staff Time Logged Analytics</h2>
            </div>

            <div className="date-filters-bar">
              <div className="date-filter-field">
                <label htmlFor="from_date">From Date</label>
                <input
                  id="from_date"
                  type="date"
                  value={from}
                  onChange={(e) => setFrom(e.target.value)}
                />
              </div>
              <div className="date-filter-field">
                <label htmlFor="to_date">To Date</label>
                <input
                  id="to_date"
                  type="date"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                />
              </div>
              <button type="button" className="btn-filter-apply" onClick={load}>
                Apply Filter
              </button>
            </div>

            <div className="modern-table-container">
              {summary.time_per_staff.length === 0 ? (
                <div className="task-empty-state">
                  <span className="task-empty-desc">No time logs recorded in this selected date range.</span>
                </div>
              ) : (
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Staff Member</th>
                      <th>Total Time Logged</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.time_per_staff.map((row) => (
                      <tr key={row.staff_id}>
                        <td style={{ fontWeight: 600 }}>{row.staff_name}</td>
                        <td>
                          <span className="badge" style={{ background: 'var(--primary-subtle)', color: 'var(--primary)', fontSize: '0.8125rem' }}>
                            ⏱ {formatDuration(row.total_secs)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Repeating Tasks Card */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <div>
                <h2 className="dashboard-card-title">Recurring Tasks Tracker</h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  Reminder: Subsequent instances are generated manually upon completion.
                </p>
              </div>
            </div>

            <div className="modern-table-container">
              {summary.repeating_tasks.length === 0 ? (
                <div className="task-empty-state">
                  <span className="task-empty-desc">No repeating tasks currently configured.</span>
                </div>
              ) : (
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Task Title</th>
                      <th>Frequency</th>
                      <th>Status</th>
                      <th>Assigned Staff</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.repeating_tasks.map((t) => (
                      <tr key={t.id}>
                        <td style={{ fontWeight: 600 }}>{t.title}</td>
                        <td>
                          <span className="badge" style={{ background: 'var(--info-subtle)', color: 'var(--info-text)' }}>
                            🔄 {t.repeat_frequency}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${statusClass(t.status)}`}>{t.status}</span>
                        </td>
                        <td>{t.assigned_staff?.name ?? <span className="badge inactive">Unassigned</span>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

