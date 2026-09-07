import { useEffect, useState } from 'react'
import api, { apiErrorMessage } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import StaffPicker from '../StaffPicker/StaffPicker'
import './TaskForm.css'

const PRIORITIES = ['Normal', 'Urgent', 'Fire']
const STATUSES = ['Pending', 'In Progress', 'Paused', 'Done']
const FREQUENCIES = ['Daily', 'Weekly', 'Monthly']

function initialState(task) {
  return {
    title: task?.title ?? '',
    description: task?.description ?? '',
    customer_id: task?.customer_id ?? '',
    assigned_staff_id: task?.assigned_staff_id ?? '',
    priority: task?.priority ?? 'Normal',
    status: task?.status ?? 'Pending',
    estimated_hours: task?.estimated_minutes ? (task.estimated_minutes / 60).toString() : '',
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

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!form.title.trim()) {
      setError('Title is required.')
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

    const payload = {
      title: form.title,
      description: form.description || null,
      assigned_staff_id: form.assigned_staff_id || null,
      priority: form.priority,
      estimated_minutes: form.estimated_hours ? Math.round(parseFloat(form.estimated_hours) * 60) : null,
      due_date: form.due_date || null,
      is_repeating: form.is_repeating,
      repeat_frequency: form.is_repeating ? form.repeat_frequency : null,
    }

    if (isEdit) {
      payload.status = form.status
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
      onSaved(data.data)
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
          placeholder="e.g. Server maintenance, Client follow-up"
          value={form.title}
          onChange={(e) => set('title', e.target.value)}
          required
        />
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
        <label>Customer</label>
        {!creatingCustomer ? (
          <div className="form-customer-group">
            <select
              value={form.customer_id}
              onChange={(e) => set('customer_id', e.target.value)}
            >
              <option value="">No Customer / Internal Task</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.company ? `(${c.company})` : ''}
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
                placeholder="Customer Name *"
                value={newCustomer.name}
                onChange={(e) => setNewCustomer((c) => ({ ...c, name: e.target.value }))}
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
              <label htmlFor="task_est_hours">Estimated Time (Hours)</label>
              <input
                id="task_est_hours"
                type="number"
                step="0.25"
                min="0"
                placeholder="e.g. 1 or 1.5"
                value={form.estimated_hours}
                onChange={(e) => set('estimated_hours', e.target.value)}
              />
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
                value={form.repeat_frequency}
                onChange={(e) => set('repeat_frequency', e.target.value)}
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

