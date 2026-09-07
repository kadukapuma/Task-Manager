import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import SideNavBar from '../../components/SideNavBar/SideNavBar'
import HeaderBar from '../../components/HeaderBar/HeaderBar'
import './StaffLayout.css'

const links = [
  { to: '/staff', label: 'Staff Dashboard', end: true, icon: 'fa-gauge-high' },
  { to: '/staff/tasks', label: 'My Tasks & Queue', icon: 'fa-list-check' },
  { to: '/staff/change-password', label: 'Change Password', icon: 'fa-key' },
]

const titleMap = {
  '/staff': { title: 'Staff Dashboard', subtitle: 'Personal work metrics, logged hours, and task performance' },
  '/staff/tasks': { title: 'Staff Workspace', subtitle: 'Manage your active work and add new tasks for an admin to assign' },
  '/staff/change-password': { title: 'Security Settings', subtitle: 'Update your account password' },
}

export default function StaffLayout() {
  const location = useLocation()
  const [navOpen, setNavOpen] = useState(false)

  useEffect(() => setNavOpen(false), [location.pathname])

  const currentMeta = titleMap[location.pathname] || { title: 'Staff Workspace', subtitle: '' }

  return (
    <div className="staff-layout-wrapper">
      <SideNavBar links={links} title="Staff Navigation" isOpen={navOpen} onClose={() => setNavOpen(false)} />
      <div className="staff-main-content">
        <HeaderBar title={currentMeta.title} subtitle={currentMeta.subtitle} onMenuClick={() => setNavOpen(true)} />
        <main className="staff-page-body">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
