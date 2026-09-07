import { useEffect, useState } from 'react'
import api, { apiErrorMessage } from '../../api/client'
import { formatDate, formatDuration, formatMinutes, formatVariance, priorityClass, statusClass } from '../../utils/format'
import StaffPicker from '../StaffPicker/StaffPicker'
import MobileCardList from '../MobileCardList/MobileCardList'
import './AdminDashboard.css'

const PRIORITY_ICON = {
  Fire: 'fa-fire',
  Urgent: 'fa-bolt',
  Normal: 'fa-thumbtack',
}

export default function AdminDashboard() {
  const [summary, setSummary] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const [staff, setStaff] = useState([])
  const [staffLoading, setStaffLoading] = useState(true)
  const [assigningId, setAssigningId] = useState(null)
  const [assignError, setAssignError] = useState('')

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

  useEffect(() => {
    api
      .get('/users')
      .then(({ data }) => setStaff(data.filter((u) => u.role === 'staff')))
      .catch(() => {})
      .finally(() => setStaffLoading(false))
  }, [])

  async function assignTask(taskId, staffId) {
    if (!staffId) return
    setAssigningId(taskId)
    setAssignError('')
    try {
      await api.patch(`/tasks/${taskId}`, { assigned_staff_id: staffId })
      load()
    } catch (err) {
      setAssignError(apiErrorMessage(err, 'Could not assign this task.'))
    } finally {
      setAssigningId(null)
    }
  }

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
          <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" /> {error}
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
              <div className="kpi-icon-pill success"><i className="fa-solid fa-check" aria-hidden="true" /></div>
            </div>

            <div className="kpi-card">
              <div className="kpi-info">
                <span className="kpi-value">{summary.tasks_pending}</span>
                <span className="kpi-label">Tasks Pending</span>
              </div>
              <div className="kpi-icon-pill warning"><i className="fa-regular fa-hourglass-half" aria-hidden="true" /></div>
            </div>

            <div className="kpi-card">
              <div className="kpi-info">
                <span className="kpi-value">{summary.open_urgent_tasks?.length || 0}</span>
                <span className="kpi-label">Urgent / Fire Queue</span>
              </div>
              <div className="kpi-icon-pill" style={{ background: 'var(--fire-subtle)', color: 'var(--fire)' }}>
                <i className="fa-solid fa-fire" aria-hidden="true" />
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-info">
                <span className="kpi-value">{summary.repeating_tasks?.length || 0}</span>
                <span className="kpi-label">Active Repeating Tasks</span>
              </div>
              <div className="kpi-icon-pill primary"><i className="fa-solid fa-rotate" aria-hidden="true" /></div>
            </div>

            <div className="kpi-card">
              <div className="kpi-info">
                <span className="kpi-value">{summary.unassigned_tasks?.length || 0}</span>
                <span className="kpi-label">Unassigned Tasks</span>
              </div>
              <div className="kpi-icon-pill" style={{ background: 'var(--warning-subtle)', color: 'var(--warning-text)' }}>
                <i className="fa-solid fa-inbox" aria-hidden="true" />
              </div>
            </div>
          </div>

          {/* Open Fire / Urgent Tasks Priority Card */}
          {summary.open_urgent_tasks.length > 0 && (
            <div className="dashboard-card urgent-card">
              <div className="dashboard-card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <i className="fa-solid fa-fire" style={{ fontSize: '1.25rem', color: 'var(--fire)' }} aria-hidden="true" />
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
                            <i className={`fa-solid ${t.priority === 'Fire' ? 'fa-fire' : 'fa-bolt'}`} aria-hidden="true" /> {t.priority}
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

                <MobileCardList
                  items={summary.open_urgent_tasks}
                  detailTitle={(t) => t.title}
                  renderCard={(t) => (
                    <>
                      <span className="mdc-title">{t.title}</span>
                      <span className="mdc-subtitle">{t.assigned_staff?.name ?? 'Unassigned'}</span>
                      <div className="mdc-badges">
                        <span className={`badge ${priorityClass(t.priority)}`}>
                          <i className={`fa-solid ${t.priority === 'Fire' ? 'fa-fire' : 'fa-bolt'}`} aria-hidden="true" /> {t.priority}
                        </span>
                        <span className={`badge ${statusClass(t.status)}`}>{t.status}</span>
                      </div>
                    </>
                  )}
                  renderDetail={(t) => (
                    <div className="detail-list">
                      <div className="detail-row">
                        <span className="detail-row-label">Priority</span>
                        <span className="detail-row-value">
                          <span className={`badge ${priorityClass(t.priority)}`}>
                            <i className={`fa-solid ${t.priority === 'Fire' ? 'fa-fire' : 'fa-bolt'}`} aria-hidden="true" /> {t.priority}
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
                        <span className="detail-row-label">Assigned Staff</span>
                        <span className="detail-row-value">
                          {t.assigned_staff?.name ?? <span className="badge inactive">Unassigned</span>}
                        </span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-row-label">Due Date</span>
                        <span className="detail-row-value">{formatDate(t.due_date)}</span>
                      </div>
                    </div>
                  )}
                />
              </div>
            </div>
          )}

          {/* Unassigned Tasks Card */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <div>
                <h2 className="dashboard-card-title">Unassigned Tasks</h2>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                  Includes tasks staff created themselves -- only an admin can hand these off to a staff member.
                </p>
              </div>
              <span className="badge inactive">{summary.unassigned_tasks?.length || 0} waiting</span>
            </div>

            {assignError && (
              <div className="alert-error" style={{ marginBottom: 12 }}>
                <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" /> {assignError}
              </div>
            )}

            <div className="modern-table-container">
              {summary.unassigned_tasks.length === 0 ? (
                <div className="task-empty-state">
                  <span className="task-empty-desc">Nothing waiting for assignment.</span>
                </div>
              ) : (
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Customer</th>
                      <th>Priority</th>
                      <th>Due Date</th>
                      <th>Assign to</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.unassigned_tasks.map((t) => (
                      <tr key={t.id}>
                        <td style={{ fontWeight: 600 }}>{t.title}</td>
                        <td>{t.customer?.name ?? <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                        <td>
                          <span className={`badge ${priorityClass(t.priority)}`}>
                            <i className={`fa-solid ${PRIORITY_ICON[t.priority] || 'fa-thumbtack'}`} aria-hidden="true" /> {t.priority}
                          </span>
                        </td>
                        <td>{formatDate(t.due_date)}</td>
                        <td style={{ minWidth: 180 }}>
                          <StaffPicker
                            staff={staff}
                            loading={staffLoading}
                            value=""
                            onChange={(id) => assignTask(t.id, id)}
                            placeholder={assigningId === t.id ? 'Assigning…' : 'Choose staff…'}
                            disabled={assigningId === t.id}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {summary.unassigned_tasks.length > 0 && (
                <MobileCardList
                  items={summary.unassigned_tasks}
                  detailTitle={(t) => t.title}
                  renderCard={(t) => (
                    <>
                      <span className="mdc-title">{t.title}</span>
                      <span className="mdc-subtitle">{t.customer?.name ?? 'No customer'}</span>
                      <div className="mdc-badges">
                        <span className={`badge ${priorityClass(t.priority)}`}>
                          <i className={`fa-solid ${PRIORITY_ICON[t.priority] || 'fa-thumbtack'}`} aria-hidden="true" /> {t.priority}
                        </span>
                      </div>
                    </>
                  )}
                  renderDetail={(t) => (
                    <div className="detail-list">
                      <div className="detail-row">
                        <span className="detail-row-label">Customer</span>
                        <span className="detail-row-value">{t.customer?.name ?? '—'}</span>
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
                        <span className="detail-row-label">Due Date</span>
                        <span className="detail-row-value">{formatDate(t.due_date)}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-row-label">Assign to</span>
                        <StaffPicker
                          staff={staff}
                          loading={staffLoading}
                          value=""
                          onChange={(id) => assignTask(t.id, id)}
                          placeholder={assigningId === t.id ? 'Assigning…' : 'Choose staff…'}
                          disabled={assigningId === t.id}
                        />
                      </div>
                    </div>
                  )}
                />
              )}
            </div>
          </div>

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
                  <span className="task-empty-desc">No staff records found for this date range.</span>
                </div>
              ) : (
                <>
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Staff Member</th>
                      <th>Total Time Logged</th>
                      <th>Tasks Completed</th>
                      <th>Total Est. Time</th>
                      <th>Completed Actual Time</th>
                      <th>Variance / Performance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {summary.time_per_staff.map((row) => {
                      const v = formatVariance(row.total_estimated_minutes, row.completed_actual_secs)
                      return (
                        <tr key={row.staff_id}>
                          <td style={{ fontWeight: 600 }}>{row.staff_name}</td>
                          <td>
                            <span className="badge" style={{ background: 'var(--primary-subtle)', color: 'var(--primary)', fontSize: '0.8125rem' }}>
                              <i className="fa-regular fa-clock" aria-hidden="true" /> {formatDuration(row.total_secs)}
                            </span>
                          </td>
                          <td style={{ fontWeight: 600 }}>{row.completed_tasks_count}</td>
                          <td>{formatMinutes(row.total_estimated_minutes)}</td>
                          <td>{formatDuration(row.completed_actual_secs)}</td>
                          <td>
                            <span
                              className="badge"
                              style={{
                                background: v.status === 'good' ? 'var(--success-subtle)' : v.status === 'over' ? 'var(--warning-subtle)' : 'var(--bg-hover)',
                                color: v.status === 'good' ? 'var(--success-text)' : v.status === 'over' ? 'var(--warning-text)' : 'var(--text-secondary)',
                              }}
                            >
                              {v.text}
                            </span>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>

                <MobileCardList
                  items={summary.time_per_staff}
                  keyField="staff_id"
                  detailTitle={(row) => row.staff_name}
                  renderCard={(row) => {
                    const v = formatVariance(row.total_estimated_minutes, row.completed_actual_secs)
                    return (
                      <>
                        <span className="mdc-title">{row.staff_name}</span>
                        <span className="mdc-subtitle">
                          <i className="fa-regular fa-clock" aria-hidden="true" /> {formatDuration(row.total_secs)} logged · {row.completed_tasks_count} completed
                        </span>
                        <div className="mdc-badges">
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
                  renderDetail={(row) => {
                    const v = formatVariance(row.total_estimated_minutes, row.completed_actual_secs)
                    return (
                      <div className="detail-list">
                        <div className="detail-row">
                          <span className="detail-row-label">Total Time Logged</span>
                          <span className="detail-row-value">{formatDuration(row.total_secs)}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-row-label">Tasks Completed</span>
                          <span className="detail-row-value">{row.completed_tasks_count}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-row-label">Total Estimated Time</span>
                          <span className="detail-row-value">{formatMinutes(row.total_estimated_minutes)}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-row-label">Completed Actual Time</span>
                          <span className="detail-row-value">{formatDuration(row.completed_actual_secs)}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-row-label">Variance / Performance</span>
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
                      </div>
                    )
                  }}
                />
                </>
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
                            <i className="fa-solid fa-rotate" aria-hidden="true" /> {t.repeat_frequency}
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

              {summary.repeating_tasks.length > 0 && (
                <MobileCardList
                  items={summary.repeating_tasks}
                  detailTitle={(t) => t.title}
                  renderCard={(t) => (
                    <>
                      <span className="mdc-title">{t.title}</span>
                      <span className="mdc-subtitle">{t.assigned_staff?.name ?? 'Unassigned'}</span>
                      <div className="mdc-badges">
                        <span className="badge" style={{ background: 'var(--info-subtle)', color: 'var(--info-text)' }}>
                          <i className="fa-solid fa-rotate" aria-hidden="true" /> {t.repeat_frequency}
                        </span>
                        <span className={`badge ${statusClass(t.status)}`}>{t.status}</span>
                      </div>
                    </>
                  )}
                  renderDetail={(t) => (
                    <div className="detail-list">
                      <div className="detail-row">
                        <span className="detail-row-label">Frequency</span>
                        <span className="detail-row-value">
                          <span className="badge" style={{ background: 'var(--info-subtle)', color: 'var(--info-text)' }}>
                            <i className="fa-solid fa-rotate" aria-hidden="true" /> {t.repeat_frequency}
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
                        <span className="detail-row-label">Assigned Staff</span>
                        <span className="detail-row-value">
                          {t.assigned_staff?.name ?? <span className="badge inactive">Unassigned</span>}
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

