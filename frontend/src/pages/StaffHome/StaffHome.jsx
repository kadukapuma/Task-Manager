import { useState } from 'react'
import TaskForm from '../../components/TaskForm/TaskForm'
import TaskList from '../../components/TaskList/TaskList'
import ReportedTasks from '../../components/ReportedTasks/ReportedTasks'
import Modal from '../../components/Modal/Modal'
import './StaffHome.css'

export default function StaffHome() {
  const [version, setVersion] = useState(0)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const bump = () => setVersion((v) => v + 1)

  function handleCreated() {
    setShowCreateModal(false)
    bump()
  }

  return (
    <div className="staff-home-container">
      <div className="staff-home-header">
        <button type="button" className="btn-primary-add" onClick={() => setShowCreateModal(true)}>
          <i className="fa-solid fa-plus" aria-hidden="true" /> New Task
        </button>
      </div>

      <TaskList refreshSignal={version} onChange={bump} />
      <ReportedTasks refreshSignal={version} />

      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Task"
        subtitle="Your task goes into the unassigned queue -- only an admin can assign it to someone."
        size="xl"
      >
        <TaskForm onSaved={handleCreated} onCancel={() => setShowCreateModal(false)} />
      </Modal>
    </div>
  )
}
