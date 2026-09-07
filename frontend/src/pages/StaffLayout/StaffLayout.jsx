import { Outlet, useLocation } from 'react-router-dom'
import SideNavBar from '../../components/SideNavBar/SideNavBar'
import HeaderBar from '../../components/HeaderBar/HeaderBar'
import './StaffLayout.css'

export default function StaffLayout() {
  const location = useLocation()

  const links = [
    {
      to: '/staff',
      label: 'My Tasks & Queue',
      end: true,
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
          />
        </svg>
      ),
    },
    {
      to: '/staff/change-password',
      label: 'Change Password',
      icon: (
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
          />
        </svg>
      ),
    },
  ]

  const titleMap = {
    '/staff': { title: 'Staff Workspace', subtitle: 'Manage active work items and pick up unassigned tasks' },
    '/staff/change-password': { title: 'Security Settings', subtitle: 'Update your account password' },
  }

  const currentMeta = titleMap[location.pathname] || { title: 'Staff Workspace', subtitle: '' }

  return (
    <div className="staff-layout-wrapper">
      <SideNavBar links={links} title="Staff Navigation" />
      <div className="staff-main-content">
        <HeaderBar title={currentMeta.title} subtitle={currentMeta.subtitle} />
        <main className="staff-page-body">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

