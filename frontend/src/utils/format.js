export function formatDuration(totalSecs) {
  if (!totalSecs || totalSecs <= 0) return '0m'

  const hours = Math.floor(totalSecs / 3600)
  const minutes = Math.floor((totalSecs % 3600) / 60)

  if (hours === 0) return `${minutes}m`
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}m`
}

/** Live-timer display: "12:34" under an hour, "1:02:34" once it passes one. */
export function formatStopwatch(totalSecs) {
  const secs = Math.max(0, Math.floor(totalSecs))
  const hours = Math.floor(secs / 3600)
  const minutes = Math.floor((secs % 3600) / 60)
  const seconds = secs % 60
  const pad = (n) => String(n).padStart(2, '0')
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${pad(minutes)}:${pad(seconds)}`
}

export function formatMinutes(mins) {
  if (!mins || mins <= 0) return 'None'
  const hours = Math.floor(mins / 60)
  const remainingMins = mins % 60
  if (hours === 0) return `${remainingMins}m`
  if (remainingMins === 0) return `${hours}h`
  return `${hours}h ${remainingMins}m`
}

export function formatVariance(estMins, actualSecs) {
  if (!estMins) return { text: 'No Estimate', status: 'neutral' }
  const actualMins = Math.round((actualSecs || 0) / 60)
  const diffMins = actualMins - estMins

  if (diffMins === 0) return { text: 'Exact Estimate', status: 'good' }
  if (diffMins < 0) return { text: `${formatMinutes(Math.abs(diffMins))} under est.`, status: 'good' }
  return { text: `${formatMinutes(diffMins)} over est.`, status: 'over' }
}

export function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export function priorityClass(priority) {
  return `priority-${(priority ?? 'normal').toLowerCase()}`
}

export function statusClass(status) {
  return `status-${(status ?? 'pending').toLowerCase().replace(/\s+/g, '-')}`
}

const STATUS_COLORS = {
  Pending: 'var(--text-muted)',
  'In Progress': 'var(--info)',
  Paused: 'var(--warning)',
  Done: 'var(--success)',
  Undone: 'var(--danger)',
}

export function statusColor(status) {
  return STATUS_COLORS[status] ?? 'var(--text-muted)'
}
