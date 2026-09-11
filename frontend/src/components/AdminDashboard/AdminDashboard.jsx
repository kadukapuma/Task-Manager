import { useEffect, useState } from 'react'
import api, { apiErrorMessage } from '../../api/client'
import { formatDate, priorityClass, statusClass, statusColor, taskTypeClass } from '../../utils/format'
import StaffPicker from '../StaffPicker/StaffPicker'
import MobileCardList from '../MobileCardList/MobileCardList'
import BarChart from '../charts/BarChart'
import StaffTimeAnalytics from '../StaffTimeAnalytics/StaffTimeAnalytics'
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

  const [staff, setStaff] = useState([])
  const [staffLoading, setStaffLoading] = useState(true)
  const [assigningId, setAssigningId] = useState(null)
  const [assignError, setAssignError] = useState('')

  function load() {
    setLoading(true)
    setError('')

    api
      .get('/dashboard/summary')
      .then(({ data }) => setSummary(data.data))
      .catch((err) => setError(apiErrorMessage(err, 'Could not load the dashboard.')))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

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
              <div className="kpi-card-top">
                <span className="kpi-icon-mini success"><i className="fa-solid fa-check" aria-hidden="true" /></span>
                <span className="kpi-label" title="Completed this month">Completed</span>
              </div>
              <span className="kpi-value">{summary.tasks_completed_this_month}</span>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-top">
                <span className="kpi-icon-mini warning"><i className="fa-regular fa-hourglass-half" aria-hidden="true" /></span>
                <span className="kpi-label">Tasks Pending</span>
              </div>
              <span className="kpi-value">{summary.tasks_pending}</span>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-top">
                <span className="kpi-icon-mini fire"><i className="fa-solid fa-fire" aria-hidden="true" /></span>
                <span className="kpi-label">Urgent / Fire</span>
              </div>
              <span className="kpi-value">{summary.open_urgent_tasks?.length || 0}</span>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-top">
                <span className="kpi-icon-mini primary"><i className="fa-solid fa-rotate" aria-hidden="true" /></span>
                <span className="kpi-label">Repeating</span>
              </div>
              <span className="kpi-value">{summary.repeating_tasks?.length || 0}</span>
            </div>

            <div className="kpi-card">
              <div className="kpi-card-top">
                <span className="kpi-icon-mini neutral"><i className="fa-solid fa-inbox" aria-hidden="true" /></span>
                <span className="kpi-label">Unassigned</span>
              </div>
              <span className="kpi-value">{summary.unassigned_tasks?.length || 0}</span>
            </div>
          </div>

          {/* Task Status Overview Chart */}
          <div className="dashboard-card">
            <div className="dashboard-card-header">
              <h2 className="dashboard-card-title">Task Status Overview</h2>
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
                      <th>Task Type</th>
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
                          {t.task_type ? (
                            <span className={`badge ${taskTypeClass(t.task_type)}`}>{t.task_type}</span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>
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
                        {t.task_type && (
                          <span className={`badge ${taskTypeClass(t.task_type)}`}>{t.task_type}</span>
                        )}
                        <span className={`badge ${priorityClass(t.priority)}`}>
                          <i className={`fa-solid ${t.priority === 'Fire' ? 'fa-fire' : 'fa-bolt'}`} aria-hidden="true" /> {t.priority}
                        </span>
                        <span className={`badge ${statusClass(t.status)}`}>{t.status}</span>
                      </div>
                    </>
                  )}
                  renderDetail={(t) => (
                    <div className="detail-list">
                      {t.task_type && (
                        <div className="detail-row">
                          <span className="detail-row-label">Task Type</span>
                          <span className="detail-row-value">
                            <span className={`badge ${taskTypeClass(t.task_type)}`}>{t.task_type}</span>
                          </span>
                        </div>
                      )}
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
                      <th>Task Type</th>
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
                        <td>
                          {t.task_type ? (
                            <span className={`badge ${taskTypeClass(t.task_type)}`}>{t.task_type}</span>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>
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
                        {t.task_type && (
                          <span className={`badge ${taskTypeClass(t.task_type)}`}>{t.task_type}</span>
                        )}
                        <span className={`badge ${priorityClass(t.priority)}`}>
                          <i className={`fa-solid ${PRIORITY_ICON[t.priority] || 'fa-thumbtack'}`} aria-hidden="true" /> {t.priority}
                        </span>
                      </div>
                    </>
                  )}
                  renderDetail={(t) => (
                    <div className="detail-list">
                      {t.task_type && (
                        <div className="detail-row">
                          <span className="detail-row-label">Task Type</span>
                          <span className="detail-row-value">
                            <span className={`badge ${taskTypeClass(t.task_type)}`}>{t.task_type}</span>
                          </span>
                        </div>
                      )}
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

          <StaffTimeAnalytics />

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

