export function formatDuration(totalSecs) {
  if (!totalSecs || totalSecs <= 0) return '0m'

  const hours = Math.floor(totalSecs / 3600)
  const minutes = Math.floor((totalSecs % 3600) / 60)

  if (hours === 0) return `${minutes}m`
  if (minutes === 0) return `${hours}h`
  return `${hours}h ${minutes}m`
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
