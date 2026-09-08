import { useEffect, useState } from 'react'
import api, { apiErrorMessage } from '../../api/client'
import BarChart from '../charts/BarChart'
import MobileCardList from '../MobileCardList/MobileCardList'
import { formatDuration, formatMinutes } from '../../utils/format'

/**
 * Per-staff time-logged breakdown with a date-range filter -- shared by the
 * Admin Dashboard and the Staff Work tab so both stay in sync automatically.
 * Self-contained: fetches its own data, independent of the page it's on.
 */
export default function StaffTimeAnalytics() {
  const [timePerStaff, setTimePerStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  function load(f = from, t = to) {
    setLoading(true)
    setError('')
    const params = {}
    if (f) params.from = f
    if (t) params.to = t

    api
      .get('/dashboard/summary', { params })
      .then(({ data }) => setTimePerStaff(data.data.time_per_staff))
      .catch((err) => setError(apiErrorMessage(err, 'Could not load staff time analytics.')))
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
    load(f, t)
  }

  return (
    <div className="dashboard-card">
      <div className="dashboard-card-header">
        <h2 className="dashboard-card-title">Staff Time Logged Analytics</h2>
      </div>

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

      <div className="date-filters-bar">
        <div className="date-filter-field">
          <label htmlFor="staff_time_from">From Date</label>
          <input id="staff_time_from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
        </div>
        <div className="date-filter-field">
          <label htmlFor="staff_time_to">To Date</label>
          <input id="staff_time_to" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <button type="button" className="btn-filter-apply" onClick={() => load()}>
          Apply Filter
        </button>
      </div>

      {error && (
        <div className="alert-error" style={{ marginTop: 12 }}>
          <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" /> {error}
        </div>
      )}

      {loading && timePerStaff.length === 0 ? (
        <div className="task-empty-state">
          <div className="route-spinner" style={{ width: 28, height: 28 }} />
          <span className="task-empty-desc">Loading staff time analytics…</span>
        </div>
      ) : (
        <>
          {timePerStaff.length > 0 && (
            <div style={{ margin: '1.25rem 0' }}>
              <BarChart
                orientation="vertical"
                height={160}
                data={timePerStaff.map((row) => ({ label: row.staff_name, value: row.total_secs }))}
                formatValue={(v) => formatDuration(v)}
              />
            </div>
          )}

          <div className="modern-table-container">
            {timePerStaff.length === 0 ? (
              <div className="task-empty-state">
                <span className="task-empty-desc">No staff records found for this date range.</span>
              </div>
            ) : (
              <>
                <table className="modern-table">
                  <thead>
                    <tr>
                      <th>Staff Member</th>
                      <th>Days Worked</th>
                      <th>Total Time Logged</th>
                      <th>Finished</th>
                      <th>Pending</th>
                      <th>Paused</th>
                      <th>Undone</th>
                      <th>Total Est. Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {timePerStaff.map((row) => (
                      <tr key={row.staff_id}>
                        <td style={{ fontWeight: 600 }}>{row.staff_name}</td>
                        <td>{row.days_worked}</td>
                        <td>
                          <span
                            className="badge"
                            style={{ background: 'var(--primary-subtle)', color: 'var(--primary)', fontSize: '0.8125rem' }}
                          >
                            <i className="fa-regular fa-clock" aria-hidden="true" /> {formatDuration(row.total_secs)}
                          </span>
                        </td>
                        <td style={{ fontWeight: 600 }}>{row.completed_tasks_count}</td>
                        <td>{row.pending_tasks_count}</td>
                        <td>{row.paused_tasks_count}</td>
                        <td>{row.undone_tasks_count}</td>
                        <td>{formatMinutes(row.total_estimated_minutes)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <MobileCardList
                  items={timePerStaff}
                  keyField="staff_id"
                  detailTitle={(row) => row.staff_name}
                  renderCard={(row) => (
                    <>
                      <span className="mdc-title">{row.staff_name}</span>
                      <span className="mdc-subtitle">
                        <i className="fa-regular fa-clock" aria-hidden="true" /> {formatDuration(row.total_secs)} logged · {row.days_worked} days · {row.completed_tasks_count} completed
                      </span>
                    </>
                  )}
                  renderDetail={(row) => (
                    <div className="detail-list">
                      <div className="detail-row">
                        <span className="detail-row-label">Days Worked</span>
                        <span className="detail-row-value">{row.days_worked}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-row-label">Total Time Logged</span>
                        <span className="detail-row-value">{formatDuration(row.total_secs)}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-row-label">Finished Tasks</span>
                        <span className="detail-row-value">{row.completed_tasks_count}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-row-label">Pending Tasks</span>
                        <span className="detail-row-value">{row.pending_tasks_count}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-row-label">Paused Tasks</span>
                        <span className="detail-row-value">{row.paused_tasks_count}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-row-label">Undone Tasks</span>
                        <span className="detail-row-value">{row.undone_tasks_count}</span>
                      </div>
                      <div className="detail-row">
                        <span className="detail-row-label">Total Estimated Time</span>
                        <span className="detail-row-value">{formatMinutes(row.total_estimated_minutes)}</span>
                      </div>
                    </div>
                  )}
                />
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}
