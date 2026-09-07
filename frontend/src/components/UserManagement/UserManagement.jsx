import { useEffect, useState } from 'react'
import api, { apiErrorMessage } from '../../api/client'
import Modal from '../Modal/Modal'
import './UserManagement.css'

const emptyForm = { name: '', username: '', password: '', role: 'staff' }

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState('')

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [resetTargetUser, setResetTargetUser] = useState(null)
  const [resetPassword, setResetPassword] = useState('')
  const [resetError, setResetError] = useState('')
  const [resetSubmitting, setResetSubmitting] = useState(false)

  const [pendingToggleId, setPendingToggleId] = useState(null)

  function loadUsers() {
    setLoading(true)
    setListError('')
    api
      .get('/users')
      .then(({ data }) => setUsers(data))
      .catch((err) => setListError(apiErrorMessage(err, 'Could not load users.')))
      .finally(() => setLoading(false))
  }

  useEffect(loadUsers, [])

  async function handleAddUser(e) {
    e.preventDefault()
    setFormError('')

    if (form.password.length < 8) {
      setFormError('Password must be at least 8 characters.')
      return
    }

    setSubmitting(true)
    try {
      const { data } = await api.post('/users', form)
      setUsers((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
      setForm(emptyForm)
      setShowAddModal(false)
    } catch (err) {
      setFormError(apiErrorMessage(err, 'Could not create user.'))
    } finally {
      setSubmitting(false)
    }
  }

  async function handleToggleActive(user) {
    setPendingToggleId(user.id)
    try {
      const { data } = await api.patch(`/users/${user.id}`, { active: !user.active })
      setUsers((prev) => prev.map((u) => (u.id === user.id ? data : u)))
    } catch (err) {
      setListError(apiErrorMessage(err, 'Could not update user status.'))
    } finally {
      setPendingToggleId(null)
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault()
    setResetError('')

    if (resetPassword.length < 8) {
      setResetError('Password must be at least 8 characters.')
      return
    }

    setResetSubmitting(true)
    try {
      await api.patch(`/users/${resetTargetUser.id}/reset-password`, { new_password: resetPassword })
      setResetTargetUser(null)
      setResetPassword('')
    } catch (err) {
      setResetError(apiErrorMessage(err, 'Could not reset password.'))
    } finally {
      setResetSubmitting(false)
    }
  }

  return (
    <div className="users-page-card">
      <div className="users-card-header">
        <div className="users-header-title-group">
          <h2 className="users-header-title">Team & Staff Directory</h2>
          <span className="task-count-badge">{users.length} members</span>
        </div>
        <button
          type="button"
          className="btn-primary-add"
          onClick={() => {
            setForm(emptyForm)
            setFormError('')
            setShowAddModal(true)
          }}
        >
          <span>+</span> Add New User
        </button>
      </div>

      {listError && (
        <div className="alert-error">
          <span>⚠️</span> {listError}
        </div>
      )}

      <div className="modern-table-container">
        {loading ? (
          <div className="task-empty-state">
            <div className="route-spinner" style={{ width: 28, height: 28 }} />
            <span className="task-empty-desc">Loading team directory…</span>
          </div>
        ) : (
          <table className="modern-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Account Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const initials = u.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)
                return (
                  <tr key={u.id}>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar-sm">{initials}</div>
                        <div className="user-info-text">
                          <span className="user-display-name">{u.name}</span>
                          <span className="user-username">@{u.username}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'role-admin' : 'role-staff'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>
                      <span className={`badge ${u.active ? 'active' : 'inactive'}`}>
                        {u.active ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="btn-table-action"
                          onClick={() => handleToggleActive(u)}
                          disabled={pendingToggleId === u.id}
                        >
                          {u.active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          type="button"
                          className="btn-table-action"
                          onClick={() => {
                            setResetTargetUser(u)
                            setResetPassword('')
                            setResetError('')
                          }}
                        >
                          Reset Password
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Popup Window: Add New User Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Team Member"
        subtitle="Create a new staff or admin login account."
        size="md"
      >
        <form className="task-form-modern" onSubmit={handleAddUser}>
          {formError && (
            <div className="alert-error">
              <span>⚠️</span> {formError}
            </div>
          )}

          <div className="form-field">
            <label htmlFor="new_name">Full Name *</label>
            <input
              id="new_name"
              placeholder="e.g. Sarah Connor"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="form-grid-2col">
            <div className="form-field">
              <label htmlFor="new_username">Username *</label>
              <input
                id="new_username"
                placeholder="e.g. sconnor"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="new_role">Assigned Role</label>
              <select
                id="new_role"
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
              >
                <option value="staff">Staff Member</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="new_password">Initial Password (min 8 characters) *</label>
            <input
              id="new_password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              minLength={8}
              required
            />
          </div>

          <div className="modal-form-actions">
            <button
              type="button"
              className="btn-modal-cancel"
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </button>
            <button type="submit" className="btn-modal-submit" disabled={submitting}>
              {submitting ? 'Creating User…' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Popup Window: Reset Password Modal */}
      <Modal
        isOpen={Boolean(resetTargetUser)}
        onClose={() => setResetTargetUser(null)}
        title={`Reset Password for ${resetTargetUser?.name || ''}`}
        subtitle={`Set a new login password for user @${resetTargetUser?.username || ''}.`}
        size="sm"
      >
        <form className="task-form-modern" onSubmit={handleResetPassword}>
          {resetError && (
            <div className="alert-error">
              <span>⚠️</span> {resetError}
            </div>
          )}

          <div className="form-field">
            <label htmlFor="reset_pwd">New Password (min 8 characters) *</label>
            <input
              id="reset_pwd"
              type="password"
              placeholder="••••••••"
              autoFocus
              value={resetPassword}
              onChange={(e) => setResetPassword(e.target.value)}
              minLength={8}
              required
            />
          </div>

          <div className="modal-form-actions">
            <button
              type="button"
              className="btn-modal-cancel"
              onClick={() => setResetTargetUser(null)}
            >
              Cancel
            </button>
            <button type="submit" className="btn-modal-submit" disabled={resetSubmitting}>
              {resetSubmitting ? 'Updating…' : 'Save Password'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

