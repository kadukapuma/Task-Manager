import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import './RouteGuards.css'

function LoadingScreen() {
  return (
    <div className="route-loader-container">
      <div className="route-spinner" />
      <p className="route-loader-text">Loading TaskFlow…</p>
    </div>
  )
}

export function RequireAuth() {
  const { user, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/login" replace />

  return <Outlet />
}

export function RequireAdmin() {
  const { user, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (!user || user.role !== 'admin') return <Navigate to="/login" replace />

  return <Outlet />
}

