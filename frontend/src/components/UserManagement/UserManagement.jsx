import { useEffect, useState } from 'react'
import api, { apiErrorMessage } from '../../api/client'
import { useAuth } from '../../context/AuthContext'
import Modal from '../Modal/Modal'
import MobileCardList from '../MobileCardList/MobileCardList'
import ConfirmModal from '../ConfirmModal/ConfirmModal'
import './UserManagement.css'

function initialsOf(name) {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const emptyForm = { name: '', username: '', password: '', role: 'staff' }

export default function UserManagement() {
  const { user: currentUser } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [listError, setListError] = useState('')

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formError, setFormError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [editTargetUser, setEditTargetUser] = useState(null)
  const [editForm, setEditForm] = useState({ name: '', username: '', role: 'staff' })
  const [editError, setEditError] = useState('')
  const [editSubmitting, setEditSubmitting] = useState(false)

  const [deleteTargetUser, setDeleteTargetUser] = useState(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

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

  function openEdit(u) {
    setEditTargetUser(u)
    setEditForm({ name: u.name, username: u.username, role: u.role })
    setEditError('')
  }

  async function handleEditUser(e) {
    e.preventDefault()
    setEditError('')

    if (!editForm.name.trim() || !editForm.username.trim()) {
      setEditError('Name and username are required.')
      return
    }

    setEditSubmitting(true)
    try {
      const { data } = await api.patch(`/users/${editTargetUser.id}`, editForm)
      setUsers((prev) => prev.map((u) => (u.id === data.id ? data : u)).sort((a, b) => a.name.localeCompare(b.name)))
      setEditTargetUser(null)
    } catch (err) {
      setEditError(apiErrorMessage(err, 'Could not update this user.'))
    } finally {
      setEditSubmitting(false)
    }
  }

  async function handleDeleteUser() {
    if (!deleteTargetUser) return
    setDeleteSubmitting(true)
    setListError('')
    try {
      await api.delete(`/users/${deleteTargetUser.id}`)
      setUsers((prev) => prev.filter((u) => u.id !== deleteTargetUser.id))
      setDeleteTargetUser(null)
    } catch (err) {
      setListError(apiErrorMessage(err, 'Could not delete this user.'))
      setDeleteTargetUser(null)
    } finally {
      setDeleteSubmitting(false)
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
          <i className="fa-solid fa-plus" aria-hidden="true" /> Add New User
        </button>
      </div>

      {listError && (
        <div className="alert-error">
          <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" /> {listError}
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
                const initials = initialsOf(u.name)
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
                        <button type="button" className="btn-table-action" onClick={() => openEdit(u)}>
                          Edit
                        </button>
                        {u.id !== currentUser?.id && (
                          <button
                            type="button"
                            className="btn-table-action danger"
                            onClick={() => setDeleteTargetUser(u)}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        {!loading && (
          <MobileCardList
            items={users}
            detailTitle={(u) => u.name}
            detailSubtitle={(u) => `@${u.username}`}
            renderCard={(u) => (
              <>
                <span className="mdc-title">{u.name}</span>
                <span className="mdc-subtitle">@{u.username}</span>
                <div className="mdc-badges">
                  <span className={`badge ${u.role === 'admin' ? 'role-admin' : 'role-staff'}`}>{u.role}</span>
                  <span className={`badge ${u.active ? 'active' : 'inactive'}`}>
                    {u.active ? 'Active' : 'Deactivated'}
                  </span>
                </div>
              </>
            )}
            renderDetail={(u, close) => (
              <div className="detail-list">
                <div className="detail-row">
                  <span className="detail-row-label">Role</span>
                  <span className="detail-row-value">
                    <span className={`badge ${u.role === 'admin' ? 'role-admin' : 'role-staff'}`}>{u.role}</span>
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-row-label">Account Status</span>
                  <span className="detail-row-value">
                    <span className={`badge ${u.active ? 'active' : 'inactive'}`}>
                      {u.active ? 'Active' : 'Deactivated'}
                    </span>
                  </span>
                </div>
                <div className="detail-row">
                  <span className="detail-row-label">Created</span>
                  <span className="detail-row-value">{new Date(u.created_at).toLocaleDateString()}</span>
                </div>
                <div className="detail-actions">
                  <button
                    type="button"
                    className="btn-table-action"
                    disabled={pendingToggleId === u.id}
                    onClick={async () => {
                      await handleToggleActive(u)
                      close()
                    }}
                  >
                    {u.active ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    type="button"
                    className="btn-table-action"
                    onClick={() => {
                      close()
                      setResetTargetUser(u)
                      setResetPassword('')
                      setResetError('')
                    }}
                  >
                    Reset Password
                  </button>
                  <button
                    type="button"
                    className="btn-table-action"
                    onClick={() => {
                      close()
                      openEdit(u)
                    }}
                  >
                    Edit
                  </button>
                  {u.id !== currentUser?.id && (
                    <button
                      type="button"
                      className="btn-table-action danger"
                      onClick={() => {
                        close()
                        setDeleteTargetUser(u)
                      }}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            )}
          />
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
              <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" /> {formError}
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
              <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" /> {resetError}
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

      {/* Popup Window: Edit User Modal */}
      <Modal
        isOpen={Boolean(editTargetUser)}
        onClose={() => setEditTargetUser(null)}
        title={`Edit ${editTargetUser?.name || ''}`}
        subtitle="Update this team member's name, username, or role."
        size="md"
      >
        <form className="task-form-modern" onSubmit={handleEditUser}>
          {editError && (
            <div className="alert-error">
              <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" /> {editError}
            </div>
          )}

          <div className="form-field">
            <label htmlFor="edit_name">Full Name *</label>
            <input
              id="edit_name"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              required
            />
          </div>

          <div className="form-grid-2col">
            <div className="form-field">
              <label htmlFor="edit_username">Username *</label>
              <input
                id="edit_username"
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                required
              />
            </div>

            <div className="form-field">
              <label htmlFor="edit_role">Assigned Role</label>
              <select
                id="edit_role"
                value={editForm.role}
                disabled={editTargetUser?.id === currentUser?.id}
                onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
              >
                <option value="staff">Staff Member</option>
                <option value="admin">Administrator</option>
              </select>
              {editTargetUser?.id === currentUser?.id && (
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                  You can't change your own role.
                </p>
              )}
            </div>
          </div>

          <div className="modal-form-actions">
            <button type="button" className="btn-modal-cancel" onClick={() => setEditTargetUser(null)}>
              Cancel
            </button>
            <button type="submit" className="btn-modal-submit" disabled={editSubmitting}>
              {editSubmitting ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        isOpen={Boolean(deleteTargetUser)}
        onClose={() => setDeleteTargetUser(null)}
        onConfirm={handleDeleteUser}
        title="Delete Team Member"
        message={`"${deleteTargetUser?.name}" will be permanently removed. This can't be undone. If they've logged work hours, deactivate their account instead to keep that history.`}
        confirmLabel="Delete User"
        danger
        busy={deleteSubmitting}
      />
    </div>
  )
}

