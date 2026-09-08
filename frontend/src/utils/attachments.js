import api from '../api/client'

/** Fetch an attachment (behind the same bearer auth as the API) and open it in a new tab. */
export async function openAttachment(taskId, attachment) {
  const { data } = await api.get(`/tasks/${taskId}/attachments/${attachment.id}`, { responseType: 'blob' })
  const url = URL.createObjectURL(data)
  window.open(url, '_blank', 'noopener')
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}

export function attachmentIcon(mimeType) {
  return mimeType === 'application/pdf' ? 'fa-file-pdf' : 'fa-file-image'
}

export function formatFileSize(bytes) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB']
  let value = bytes
  let i = 0
  while (value >= 1024 && i < units.length - 1) {
    value /= 1024
    i++
  }
  return `${value.toFixed(value < 10 && i > 0 ? 1 : 0)} ${units[i]}`
}
