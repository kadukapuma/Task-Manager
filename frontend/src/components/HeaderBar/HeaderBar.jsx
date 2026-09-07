import { useTheme } from '../../context/ThemeContext'
import './HeaderBar.css'

export default function HeaderBar({ title, subtitle, rightElement, onMenuClick }) {
  const { theme, toggleTheme } = useTheme()
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  return (
    <header className="headerbar-container">
      <div className="headerbar-left">
        <button
          type="button"
          className="headerbar-menu-btn"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <i className="fa-solid fa-bars" aria-hidden="true" />
        </button>
        <div className="headerbar-titles">
          <h1 className="headerbar-title">{title}</h1>
          {subtitle && <span className="headerbar-subtitle">{subtitle}</span>}
        </div>
      </div>
      <div className="headerbar-right">
        <span className="headerbar-date-pill">
          <i className="fa-regular fa-calendar" aria-hidden="true" /> {today}
        </span>
        <button
          type="button"
          className="headerbar-theme-btn"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
          title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`} aria-hidden="true" />
        </button>
        {rightElement}
      </div>
    </header>
  )
}
