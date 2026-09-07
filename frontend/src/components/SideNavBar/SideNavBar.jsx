import { NavLink } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './SideNavBar.css'

export default function SideNavBar({ links = [], title = 'Management' }) {
  const { user, logout } = useAuth()

  const initials = user?.name
    ? user.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'U'

  return (
    <aside className="sidenav-container">
      <div className="sidenav-header">
        <div className="sidenav-logo-icon">✓</div>
        <div className="sidenav-brand-text">
          <span className="sidenav-brand-name">TaskFlow</span>
          <span className="sidenav-brand-sub">{user?.role === 'admin' ? 'Admin Portal' : 'Staff Portal'}</span>
        </div>
      </div>

      <nav className="sidenav-nav">
        <div className="sidenav-section-title">{title}</div>
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) => `sidenav-link ${isActive ? 'active' : ''}`}
          >
            {link.icon}
            <span>{link.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidenav-footer">
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
            onClick={logout}
            title="Log out"
            aria-label="Log out"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  )
}

