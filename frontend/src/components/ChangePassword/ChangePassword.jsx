import { useState } from 'react'
import api, { apiErrorMessage } from '../../api/client'
import './ChangePassword.css'

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.')
      return
    }

    setSubmitting(true)
    try {
      await api.post('/auth/change-password', {
        current_password: currentPassword,
        new_password: newPassword,
      })
      setSuccess('Your password has been updated successfully.')
      setCurrentPassword('')
      setNewPassword('')
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not change your password.'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="password-card">
      <div className="password-card-header">
        <h2 className="password-card-title">Change Your Password</h2>
        <p className="password-card-subtitle">
          Ensure your account stays secure by choosing a strong password.
        </p>
      </div>

      <form className="task-form-modern" onSubmit={handleSubmit}>
        {error && (
          <div className="alert-error">
            <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" /> {error}
          </div>
        )}
        {success && (
          <div className="badge active" style={{ padding: '8px 12px', borderRadius: 'var(--radius-sm)' }}>
            <i className="fa-solid fa-check" aria-hidden="true" /> {success}
          </div>
        )}

        <div className="form-field">
          <label htmlFor="curr_pwd">Current Password</label>
          <input
            id="curr_pwd"
            type="password"
            placeholder="••••••••"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
        </div>

        <div className="form-field">
          <label htmlFor="new_pwd">New Password (min 8 characters)</label>
          <input
            id="new_pwd"
            type="password"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={8}
            required
          />
        </div>

        <button type="submit" className="btn-modal-submit" disabled={submitting} style={{ alignSelf: 'flex-start' }}>
          {submitting ? 'Updating Password…' : 'Update Password'}
        </button>
      </form>
    </div>
  )
}

