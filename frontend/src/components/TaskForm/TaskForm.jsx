import { useEffect, useState } from 'react'
import api, { apiErrorMessage } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import StaffPicker from '../StaffPicker/StaffPicker'
import { attachmentIcon, formatFileSize, openAttachment } from '../../utils/attachments'
import './TaskForm.css'

const TASK_TYPES = ['Repairing', 'Error', 'Installation', 'Maintenance']
const PRIORITIES = ['Normal', 'Urgent', 'Fire']
const STATUSES = ['Pending', 'In Progress', 'Paused', 'Done', 'Undone']
const FREQUENCIES = ['Daily', 'Weekly', 'Monthly']
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
const MAX_FILE_SIZE = 10 * 1024 * 1024
const MAX_FILES = 5

function initialState(task) {
  return {
    title: task?.title ?? '',
    task_type: task?.task_type ?? '',
    description: task?.description ?? '',
    customer_id: task?.customer_id ?? '',
    assigned_staff_id: task?.assigned_staff_id ?? '',
    priority: task?.priority ?? 'Normal',
    status: task?.status ?? 'Pending',
    cannot_complete_reason: task?.cannot_complete_reason ?? '',
    estimated_hours: task?.estimated_minutes ? Math.floor(task.estimated_minutes / 60).toString() : '',
    estimated_minutes_part: task?.estimated_minutes ? (task.estimated_minutes % 60).toString() : '',
    due_date: task?.due_date ? task.due_date.slice(0, 10) : '',
    is_repeating: task?.is_repeating ?? false,
    repeat_frequency: task?.repeat_frequency ?? '',
  }
}

export default function TaskForm({ task = null, onSaved, onCancel }) {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const isEdit = Boolean(task)
  const [form, setForm] = useState(initialState(task))
  const [customers, setCustomers] = useState([])
  const [staff, setStaff] = useState([])
  const [staffLoading, setStaffLoading] = useState(true)
  const [creatingCustomer, setCreatingCustomer] = useState(false)
  const [newCustomer, setNewCustomer] = useState({ name: '', company: '', phone: '', email: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [touched, setTouched] = useState({})

  const [pendingFiles, setPendingFiles] = useState([])
  const [existingAttachments, setExistingAttachments] = useState(task?.attachments ?? [])
  const [fileError, setFileError] = useState('')
  const [deletingAttachmentId, setDeletingAttachmentId] = useState(null)

  useEffect(() => {
    api.get('/customers').then(({ data }) => setCustomers(data.data)).catch(() => {})
    // /users is admin-only -- staff creating their own task never assign anyone.
    if (isAdmin) {
      api
        .get('/users')
        .then(({ data }) => setStaff(data.filter((u) => u.role === 'staff')))
        .catch(() => {})
        .finally(() => setStaffLoading(false))
    } else {
      setStaffLoading(false)
    }
  }, [isAdmin])

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function touch(field) {
    setTouched((t) => ({ ...t, [field]: true }))
  }

  function fieldClass(field, isValid) {
    if (!touched[field]) return ''
    return isValid ? 'field-valid' : 'field-invalid'
  }

  function handleFilesSelected(e) {
    const files = Array.from(e.target.files || [])
    e.target.value = ''
    setFileError('')

    const total = pendingFiles.length + existingAttachments.length + files.length
    if (total > MAX_FILES) {
      setFileError(`You can attach up to ${MAX_FILES} files per task.`)
      return
    }

    for (const file of files) {
      if (!ALLOWED_FILE_TYPES.includes(file.type)) {
        setFileError(`"${file.name}" isn't an image or PDF.`)
        return
      }
      if (file.size > MAX_FILE_SIZE) {
        setFileError(`"${file.name}" is larger than 10MB.`)
        return
      }
    }

    setPendingFiles((prev) => [...prev, ...files])
  }

  function removePendingFile(index) {
    setPendingFiles((prev) => prev.filter((_, i) => i !== index))
  }

  async function deleteExistingAttachment(attachment) {
    setDeletingAttachmentId(attachment.id)
    setFileError('')
    try {
      await api.delete(`/tasks/${task.id}/attachments/${attachment.id}`)
      setExistingAttachments((prev) => prev.filter((a) => a.id !== attachment.id))
    } catch (err) {
      setFileError(apiErrorMessage(err, 'Could not remove that attachment.'))
    } finally {
      setDeletingAttachmentId(null)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setTouched((t) => ({ ...t, title: true, task_type: true, repeat_frequency: true, cannot_complete_reason: true, new_customer_name: true }))

    if (!form.title.trim()) {
      setError('Title is required.')
      return
    }
    if (!form.task_type) {
      setError('Task type is required.')
      return
    }
    if (creatingCustomer && !newCustomer.name.trim()) {
      setError('Customer name is required.')
      return
    }
    if (form.is_repeating && !form.repeat_frequency) {
      setError('Choose a repeat frequency for repeating task.')
      return
    }
    if (isEdit && form.status === 'Undone' && !form.cannot_complete_reason.trim()) {
      setError('A reason is required when marking a task as undone.')
      return
    }

    const estHours = form.estimated_hours ? parseInt(form.estimated_hours, 10) || 0 : 0
    const estMinutes = form.estimated_minutes_part ? parseInt(form.estimated_minutes_part, 10) || 0 : 0
    const totalEstimatedMinutes = estHours * 60 + estMinutes

    const payload = {
      title: form.title,
      task_type: form.task_type,
      description: form.description || null,
      assigned_staff_id: form.assigned_staff_id || null,
      priority: form.priority,
      estimated_minutes: totalEstimatedMinutes > 0 ? totalEstimatedMinutes : null,
      due_date: form.due_date || null,
      is_repeating: form.is_repeating,
      repeat_frequency: form.is_repeating ? form.repeat_frequency : null,
    }

    if (isEdit) {
      payload.status = form.status
      payload.cannot_complete_reason = form.status === 'Undone' ? form.cannot_complete_reason : null
    }

    if (creatingCustomer) {
      payload.new_customer = newCustomer
    } else {
      payload.customer_id = form.customer_id || null
    }

    setSubmitting(true)
    try {
      const { data } = isEdit
        ? await api.patch(`/tasks/${task.id}`, payload)
        : await api.post('/tasks', payload)

      let savedTask = data.data

      if (pendingFiles.length > 0) {
        const formData = new FormData()
        pendingFiles.forEach((file) => formData.append('files[]', file))
        const { data: uploadData } = await api.post(`/tasks/${savedTask.id}/attachments`, formData)
        savedTask = { ...savedTask, attachments: [...existingAttachments, ...uploadData.data] }
      } else {
        savedTask = { ...savedTask, attachments: existingAttachments }
      }

      onSaved(savedTask)
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not save task.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="task-form-modern" onSubmit={handleSubmit}>
      {error && (
        <div className="alert-error">
          <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" /> {error}
        </div>
      )}

      <div className="form-field">
        <label htmlFor="task_title">Task Title *</label>
        <input
          id="task_title"
          className={fieldClass('title', form.title.trim() !== '')}
          placeholder="e.g. Server maintenance, Client follow-up"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          onBlur={() => touch('title')}
          required
        />
      </div>

      <div className="form-field">
        <label htmlFor="task_type">Task Type *</label>
        <select
          id="task_type"
          className={fieldClass('task_type', Boolean(form.task_type))}
          value={form.task_type}
          onChange={(e) => set('task_type', e.target.value)}
          onBlur={() => touch('task_type')}
          required
        >
          <option value="" disabled>Select task type…</option>
          {TASK_TYPES.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="form-field">
        <label htmlFor="task_desc">Description</label>
        <textarea
          id="task_desc"
          rows={3}
          placeholder="Detailed task instructions or notes (optional)"
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
        />
      </div>

      <div className="form-field">
        <label htmlFor="task_files">Attachments (images or PDF, up to 10MB each)</label>
        <input
          id="task_files"
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
          multiple
          onChange={handleFilesSelected}
        />
        {fileError && (
          <p style={{ fontSize: '0.75rem', color: 'var(--danger-text)', margin: 0 }}>{fileError}</p>
        )}

        {(existingAttachments.length > 0 || pendingFiles.length > 0) && (
          <div className="attachment-list">
            {existingAttachments.map((a) => (
              <div key={a.id} className="attachment-item">
                <i className={`fa-solid ${attachmentIcon(a.mime_type)}`} aria-hidden="true" />
                <span className="attachment-name" onClick={() => openAttachment(task.id, a)}>
                  {a.original_name}
                </span>
                <span className="attachment-size">{formatFileSize(a.size)}</span>
                <button
                  type="button"
                  className="attachment-remove"
                  disabled={deletingAttachmentId === a.id}
                  onClick={() => deleteExistingAttachment(a)}
                  aria-label={`Remove ${a.original_name}`}
                >
                  <i className="fa-solid fa-xmark" aria-hidden="true" />
                </button>
              </div>
            ))}
            {pendingFiles.map((file, i) => (
              <div key={`${file.name}-${i}`} className="attachment-item attachment-pending">
                <i className={`fa-solid ${attachmentIcon(file.type)}`} aria-hidden="true" />
                <span className="attachment-name">{file.name}</span>
                <span className="attachment-size">{formatFileSize(file.size)}</span>
                <button
                  type="button"
                  className="attachment-remove"
                  onClick={() => removePendingFile(i)}
                  aria-label={`Remove ${file.name}`}
                >
                  <i className="fa-solid fa-xmark" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="form-field">
        <label>Customer</label>
        {!creatingCustomer ? (
          <div className="form-customer-group">
            <select
              value={form.customer_id}
              onChange={(e) => set('customer_id', e.target.value)}
            >
              <option value="">No Customer / Internal Task</option>
              {customers
                .filter((c) => c.active !== false || c.id === form.customer_id)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.company ? `(${c.company})` : ''}
                    {c.active === false ? ' (Inactive)' : ''}
                  </option>
                ))}
            </select>
            <button
              type="button"
              className="btn-action"
              style={{ background: 'var(--primary-subtle)', color: 'var(--primary)' }}
              onClick={() => setCreatingCustomer(true)}
            >
              + New Customer
            </button>
          </div>
        ) : (
          <div className="inline-customer-card">
            <div className="inline-customer-header">
              <span>Create New Customer Inline</span>
              <button
                type="button"
                className="btn-action"
                style={{ padding: '2px 8px', fontSize: '0.75rem', background: 'var(--bg-surface)' }}
                onClick={() => setCreatingCustomer(false)}
              >
                Use Existing
              </button>
            </div>
            <div className="form-grid-2col">
              <input
                className={fieldClass('new_customer_name', newCustomer.name.trim() !== '')}
                placeholder="Customer Name *"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer((c) => ({ ...c, name: e.target.value }))}
                onBlur={() => touch('new_customer_name')}
                required
              />
              <input
                placeholder="Company (optional)"
                value={newCustomer.company}
                onChange={(e) => setNewCustomer((c) => ({ ...c, company: e.target.value }))}
              />
            </div>
            <div className="form-grid-2col">
              <input
                placeholder="Phone (optional)"
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer((c) => ({ ...c, phone: e.target.value }))}
              />
              <input
                placeholder="Email (optional)"
                type="email"
                value={newCustomer.email}
                onChange={(e) => setNewCustomer((c) => ({ ...c, email: e.target.value }))}
              />
            </div>
          </div>
        )}
      </div>

      <div className="form-grid-2col">
        {isAdmin && (
          <StaffPicker
            staff={staff}
            loading={staffLoading}
            value={form.assigned_staff_id}
            onChange={(id) => set('assigned_staff_id', id)}
            label="Assigned Staff"
            allowUnassigned
          />
        )}

        <div className="form-field">
          <label htmlFor="task_priority">Priority</label>
          <select
            id="task_priority"
            value={form.priority}
            onChange={(e) => set('priority', e.target.value)}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p === 'Fire' ? 'Fire (Urgent & Critical)' : p}
              </option>
            ))}
          </select>
        </div>
      </div>

      {!isAdmin && !isEdit && (
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0 }}>
          This task goes into the unassigned queue. An admin will assign it, set the schedule,
          time estimate, and recurrence when they pick it up.
        </p>
      )}

      {isAdmin && (
        <>
          <div className="form-grid-2col">
            {isEdit && (
              <div className="form-field">
                <label htmlFor="task_status">Status</label>
                <select
                  id="task_status"
                  value={form.status}
                  onChange={(e) => set('status', e.target.value)}
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="form-field">
              <label htmlFor="task_est_hours">Estimated Time</label>
              <div className="form-time-input-group">
                <div className="form-time-input">
                  <input
                    id="task_est_hours"
                    type="number"
                    step="1"
                    min="0"
                    placeholder="0"
                    value={form.estimated_hours}
                    onChange={(e) => set('estimated_hours', e.target.value)}
                  />
                  <span>hrs</span>
                </div>
                <div className="form-time-input">
                  <input
                    id="task_est_minutes"
                    type="number"
                    step="1"
                    min="0"
                    max="59"
                    placeholder="0"
                    value={form.estimated_minutes_part}
                    onChange={(e) => set('estimated_minutes_part', e.target.value)}
                  />
                  <span>min</span>
                </div>
              </div>
            </div>

            <div className="form-field">
              <label htmlFor="task_due_date">Due Date</label>
              <input
                id="task_due_date"
                type="date"
                value={form.due_date}
                onChange={(e) => set('due_date', e.target.value)}
              />
            </div>
          </div>

          {isEdit && form.status === 'Undone' && (
            <div className="form-field">
              <label htmlFor="task_cannot_complete_reason">Reason This Task Is Undone *</label>
              <textarea
                id="task_cannot_complete_reason"
                className={fieldClass('cannot_complete_reason', form.cannot_complete_reason.trim() !== '')}
                rows={3}
                placeholder="Explain why this task couldn't be completed…"
                value={form.cannot_complete_reason}
                onChange={(e) => set('cannot_complete_reason', e.target.value)}
                onBlur={() => touch('cannot_complete_reason')}
                required
              />
            </div>
          )}

          <label className="form-toggle-row">
            <input
              type="checkbox"
              checked={form.is_repeating}
              onChange={(e) => set('is_repeating', e.target.checked)}
            />
            <span className="form-toggle-label">Recurring Task</span>
          </label>

          {form.is_repeating && (
            <div className="form-field">
              <label htmlFor="task_freq">Repeat Frequency</label>
              <select
                id="task_freq"
                className={fieldClass('repeat_frequency', Boolean(form.repeat_frequency))}
                value={form.repeat_frequency}
                onChange={(e) => set('repeat_frequency', e.target.value)}
                onBlur={() => touch('repeat_frequency')}
              >
                <option value="">Select frequency…</option>
                {FREQUENCIES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>
          )}
        </>
      )}

      <div className="modal-form-actions">
        {onCancel && (
          <button type="button" className="btn-modal-cancel" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn-modal-submit" disabled={submitting}>
          {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Task'}
        </button>
      </div>
    </form>
  )
}

