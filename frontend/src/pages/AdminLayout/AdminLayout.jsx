import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import SideNavBar from '../../components/SideNavBar/SideNavBar'
import HeaderBar from '../../components/HeaderBar/HeaderBar'
import './AdminLayout.css'

const links = [
  { to: '/admin', label: 'Dashboard', end: true, icon: 'fa-gauge-high' },
  { to: '/admin/tasks', label: 'Tasks Management', icon: 'fa-list-check' },
  { to: '/admin/staff-work', label: 'Staff Work', icon: 'fa-people-arrows' },
  { to: '/admin/assign', label: 'Assign Tasks', icon: 'fa-user-check' },
  { to: '/admin/deleted-tasks', label: 'Deleted Tasks', icon: 'fa-trash-can' },
  { to: '/admin/customers', label: 'Customers', icon: 'fa-address-book' },
  { to: '/admin/users', label: 'Team & Staff', icon: 'fa-users' },
  { to: '/admin/change-password', label: 'Security Settings', icon: 'fa-key' },
]

const titleMap = {
  '/admin': { title: 'Executive Overview', subtitle: 'Live activity and operational metrics' },
  '/admin/tasks': { title: 'Tasks Management', subtitle: 'View, filter, create, and assign tasks' },
  '/admin/staff-work': { title: 'Staff Work', subtitle: "See what each staff member is working on right now" },
  '/admin/assign': { title: 'Assign Tasks', subtitle: 'Hand off open tasks to a staff member' },
  '/admin/deleted-tasks': { title: 'Deleted Tasks', subtitle: 'Review deleted tasks -- restore them or delete permanently' },
  '/admin/customers': { title: 'Customer Directory', subtitle: 'Client relationships and contact records' },
  '/admin/users': { title: 'Team Directory', subtitle: 'Manage staff accounts, roles, and credentials' },
  '/admin/change-password': { title: 'Account Security', subtitle: 'Update your personal administrative password' },
}

export default function AdminLayout() {
  const location = useLocation()
  const [navOpen, setNavOpen] = useState(false)

  useEffect(() => setNavOpen(false), [location.pathname])

  const currentMeta = titleMap[location.pathname] || { title: 'Admin Portal', subtitle: '' }

  return (
    <div className="app-layout-wrapper">
      <SideNavBar links={links} title="Admin Navigation" isOpen={navOpen} onClose={() => setNavOpen(false)} />
      <div className="app-main-content">
        <HeaderBar title={currentMeta.title} subtitle={currentMeta.subtitle} onMenuClick={() => setNavOpen(true)} />
        <main className="app-page-body">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
