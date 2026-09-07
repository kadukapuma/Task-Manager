import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import Modal from '../Modal/Modal'
import './SideNavBar.css'

export default function SideNavBar({ links = [], title = 'Management', isOpen = false, onClose }) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false)

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U'

  return (
    <>
      <div className={`sidenav-backdrop ${isOpen ? 'show' : ''}`} onClick={onClose} />

      <aside className={`sidenav-container ${isOpen ? 'open' : ''}`}>
        <div className="sidenav-header">
          <div className="sidenav-logo-icon">
            <i className="fa-solid fa-diagram-project" aria-hidden="true" />
          </div>
          <div className="sidenav-brand-text">
            <span className="sidenav-brand-name">TaskFlow</span>
            <span className="sidenav-brand-sub">{user?.role === 'admin' ? 'Admin Portal' : 'Staff Portal'}</span>
          </div>
          <button type="button" className="sidenav-close-btn" onClick={onClose} aria-label="Close menu">
            <i className="fa-solid fa-xmark" aria-hidden="true" />
          </button>
        </div>

        <nav className="sidenav-nav">
          <div className="sidenav-section-title">{title}</div>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              onClick={onClose}
              className={({ isActive }) => `sidenav-link ${isActive ? 'active' : ''}`}
            >
              <i className={`fa-solid ${link.icon}`} aria-hidden="true" />
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidenav-footer">
          <button type="button" className="sidenav-theme-btn" onClick={toggleTheme}>
            <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`} aria-hidden="true" />
            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          <div className="sidenav-user-card">
            <div className="sidenav-user-info">
              <div className="sidenav-avatar">{initials}</div>
              <div className="sidenav-user-details">
                <span className="sidenav-user-name" title={user?.name}>
                  {user?.name}
                </span>
                <span className="sidenav-user-role">
                  <span className={`badge ${user?.role === 'admin' ? 'role-admin' : 'role-staff'}`}>
                    {user?.role}
                  </span>
                </span>
              </div>
            </div>
            <button
              type="button"
              className="sidenav-logout-btn"
              onClick={() => setShowLogoutConfirm(true)}
              title="Log out"
              aria-label="Log out"
            >
              <i className="fa-solid fa-right-from-bracket" aria-hidden="true" />
            </button>
          </div>
        </div>
      </aside>

      <Modal
        isOpen={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        title="Log out?"
        subtitle="You'll need to sign in again to continue."
        size="sm"
      >
        <div className="modal-form-actions">
          <button type="button" className="btn-modal-cancel" onClick={() => setShowLogoutConfirm(false)}>
            Cancel
          </button>
          <button type="button" className="btn-modal-submit btn-modal-danger" onClick={logout}>
            <i className="fa-solid fa-right-from-bracket" aria-hidden="true" /> Log Out
          </button>
        </div>
      </Modal>
    </>
  )
}
