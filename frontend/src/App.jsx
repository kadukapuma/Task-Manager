import { Navigate, Route, BrowserRouter, Routes } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { RequireAdmin, RequireAuth } from './components/RouteGuards/RouteGuards'
import LoginScreen from './components/LoginScreen/LoginScreen'
import ChangePassword from './components/ChangePassword/ChangePassword'
import UserManagement from './components/UserManagement/UserManagement'
import AdminDashboard from './components/AdminDashboard/AdminDashboard'
import StaffDashboard from './components/StaffDashboard/StaffDashboard'
import StaffLayout from './pages/StaffLayout/StaffLayout'
import StaffHome from './pages/StaffHome/StaffHome'
import AdminLayout from './pages/AdminLayout/AdminLayout'
import AdminTasks from './pages/AdminTasks/AdminTasks'
import AdminStaffWork from './pages/AdminStaffWork/AdminStaffWork'
import AdminAssignTasks from './pages/AdminAssignTasks/AdminAssignTasks'
import AdminDeletedTasks from './pages/AdminDeletedTasks/AdminDeletedTasks'
import AdminCustomers from './pages/AdminCustomers/AdminCustomers'

function HomeRedirect() {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return <Navigate to={user.role === 'admin' ? '/admin' : '/staff'} replace />
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<HomeRedirect />} />
            <Route path="/login" element={<LoginScreen />} />

            <Route element={<RequireAuth />}>
              <Route path="/staff" element={<StaffLayout />}>
                <Route index element={<StaffDashboard />} />
                <Route path="tasks" element={<StaffHome />} />
                <Route path="change-password" element={<ChangePassword />} />
              </Route>
            </Route>

            <Route element={<RequireAdmin />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="tasks" element={<AdminTasks />} />
                <Route path="staff-work" element={<AdminStaffWork />} />
                <Route path="assign" element={<AdminAssignTasks />} />
                <Route path="deleted-tasks" element={<AdminDeletedTasks />} />
                <Route path="customers" element={<AdminCustomers />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="change-password" element={<ChangePassword />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}
