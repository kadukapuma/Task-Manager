import { useState } from 'react'
import './CustomerForm.css'

const emptyCustomer = { name: '', company: '', phone: '', email: '' }

export default function CustomerForm({
  initial = emptyCustomer,
  submitLabel = 'Save Customer',
  onSubmit,
  onCancel,
}) {
  const [form, setForm] = useState({ ...emptyCustomer, ...initial })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [touched, setTouched] = useState({})

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

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setTouched((t) => ({ ...t, name: true }))

    if (!form.name.trim()) {
      setError('Customer name is required.')
      return
    }

    setSubmitting(true)
    try {
      await onSubmit(form)
    } catch (err) {
      setError(err.message || 'Could not save customer.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form className="customer-form-modern" onSubmit={handleSubmit}>
      {error && (
        <div className="alert-error">
          <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" /> {error}
        </div>
      )}

      <div className="form-field">
        <label htmlFor="c_name">Full Name *</label>
        <input
          id="c_name"
          className={fieldClass('name', form.name.trim() !== '')}
          placeholder="e.g. Acme Corp or John Doe"
          value={form.name}
          onChange={(e) => set('name', e.target.value)}
          onBlur={() => touch('name')}
          required
        />
      </div>

      <div className="form-field">
        <label htmlFor="c_company">Company Name</label>
        <input
          id="c_company"
          placeholder="e.g. Global Tech Inc."
          value={form.company ?? ''}
          onChange={(e) => set('company', e.target.value)}
        />
      </div>

      <div className="form-grid-2col">
        <div className="form-field">
          <label htmlFor="c_phone">Phone</label>
          <input
            id="c_phone"
            placeholder="+1 (555) 000-0000"
            value={form.phone ?? ''}
            onChange={(e) => set('phone', e.target.value)}
          />
        </div>

        <div className="form-field">
          <label htmlFor="c_email">Email</label>
          <input
            id="c_email"
            type="email"
            placeholder="client@example.com"
            value={form.email ?? ''}
            onChange={(e) => set('email', e.target.value)}
          />
        </div>
      </div>

      <div className="modal-form-actions">
        {onCancel && (
          <button type="button" className="btn-modal-cancel" onClick={onCancel}>
            Cancel
          </button>
        )}
        <button type="submit" className="btn-modal-submit" disabled={submitting}>
          {submitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  )
}

