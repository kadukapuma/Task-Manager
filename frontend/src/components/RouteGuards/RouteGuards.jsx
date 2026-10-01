import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { TaskFlowSplash } from '../Loader/Loader'

export function RequireAuth() {
  const { user, loading } = useAuth()

  if (loading) return <TaskFlowSplash />
  if (!user) return <Navigate to="/login" replace />

  return <Outlet />
}

export function RequireAdmin() {
  const { user, loading } = useAuth()

  if (loading) return <TaskFlowSplash />
  if (!user || user.role !== 'admin') return <Navigate to="/login" replace />

  return <Outlet />
}

