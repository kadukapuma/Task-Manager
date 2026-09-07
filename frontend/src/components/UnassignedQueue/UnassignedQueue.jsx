import { useEffect, useState } from 'react'
import api, { apiErrorMessage } from '../../api/client'
import TaskCard from '../TaskCard/TaskCard'
import './UnassignedQueue.css'

export default function UnassignedQueue({ refreshSignal, onChange }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  function load() {
    setLoading(true)
    setError('')
    api
      .get('/tasks/unassigned')
      .then(({ data }) => setTasks(data.data))
      .catch((err) => setError(apiErrorMessage(err, 'Could not load the unassigned queue.')))
      .finally(() => setLoading(false))
  }

  useEffect(load, [refreshSignal])

  async function pickUp(task) {
    setBusyId(task.id)
    setError('')
    try {
      await api.post(`/tasks/${task.id}/pick-up`)
      load()
      onChange?.()
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not pick up the task.'))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="unassigned-queue-card">
      <div className="unassigned-queue-header">
        <div className="unassigned-title-group">
          <h2 className="unassigned-title">Unassigned Task Queue</h2>
          <span className="unassigned-count-badge">{tasks.length} open</span>
        </div>
      </div>

      {error && (
        <div className="alert-error">
          <span>⚠️</span> {error}
        </div>
      )}

      {loading ? (
        <div className="task-empty-state">
          <div className="route-spinner" style={{ width: 28, height: 28 }} />
          <span className="task-empty-desc">Loading unassigned queue…</span>
        </div>
      ) : tasks.length === 0 ? (
        <div className="task-empty-state">
          <div className="task-empty-icon">✨</div>
          <div className="task-empty-title">Queue is empty!</div>
          <p className="task-empty-desc">There are no unassigned tasks waiting right now.</p>
        </div>
      ) : (
        <div className="task-stack">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              unassigned
              busy={busyId === task.id}
              onPickUp={pickUp}
            />
          ))}
        </div>
      )}
    </div>
  )
}

