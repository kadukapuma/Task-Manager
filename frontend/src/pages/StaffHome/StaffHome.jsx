import { useState } from 'react'
import TaskList from '../../components/TaskList/TaskList'
import UnassignedQueue from '../../components/UnassignedQueue/UnassignedQueue'
import './StaffHome.css'

export default function StaffHome() {
  const [version, setVersion] = useState(0)
  const bump = () => setVersion((v) => v + 1)

  return (
    <div className="staff-home-container">
      <TaskList refreshSignal={version} onChange={bump} />
      <UnassignedQueue refreshSignal={version} onChange={bump} />
    </div>
  )
}

