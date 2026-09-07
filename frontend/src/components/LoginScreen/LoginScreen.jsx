import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import './LoginScreen.css'

export default function LoginScreen() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const { login } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    const result = await login(username, password)
    setSubmitting(false)

    if (result.ok) {
      navigate(result.user.role === 'admin' ? '/admin' : '/staff', { replace: true })
    } else {
      setError(result.message)
    }
  }

  function fillDemo(user, pass) {
    setUsername(user)
    setPassword(pass)
  }

  return (
    <div className="login-page-wrapper">
      <button
        type="button"
        className="login-theme-btn"
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        title={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      >
        <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`} aria-hidden="true" />
      </button>

      <div className="login-card">
        <div className="login-brand">
          <div className="login-logo">
            <i className="fa-solid fa-diagram-project" aria-hidden="true" />
          </div>
          <h1 className="login-title">Welcome to TaskFlow</h1>
          <p className="login-subtitle">Task & Employee Management System</p>
        </div>

        <form className="task-form-modern" onSubmit={handleSubmit}>
          {error && (
            <div className="alert-error">
              <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" /> {error}
            </div>
          )}

          <div className="form-field">
            <label htmlFor="login_username">Username</label>
            <input
              id="login_username"
              placeholder="e.g. admin"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="login_pwd">Password</label>
            <input
              id="login_pwd"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn-modal-submit"
            disabled={submitting}
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.75rem' }}
          >
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div className="login-demo-box">
          <div className="login-demo-title">Default Admin Credentials:</div>
          <div>Username: <code>admin</code></div>
          <div>Password: <code>password</code></div>
          <button
            type="button"
            className="btn-action"
            style={{ marginTop: '8px', fontSize: '0.75rem', width: '100%', justifyContent: 'center', background: 'var(--bg-surface)' }}
            onClick={() => fillDemo('admin', 'password')}
          >
            Auto-fill Admin Credentials
          </button>
        </div>
      </div>
    </div>
  )
}

