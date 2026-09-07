import './HeaderBar.css'

export default function HeaderBar({ title, subtitle, rightElement }) {
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  return (
    <header className="headerbar-container">
      <div className="headerbar-left">
        <h1 className="headerbar-title">{title}</h1>
        {subtitle && <span className="headerbar-subtitle">{subtitle}</span>}
      </div>
      <div className="headerbar-right">
        <span className="headerbar-date-pill">
          <span>📅</span> {today}
        </span>
        {rightElement}
      </div>
    </header>
  )
}

