import { useEffect, useState } from 'react'
import api, { apiErrorMessage } from '../../api/client'
import TaskCard from '../TaskCard/TaskCard'
import './TaskList.css'

export default function TaskList({ refreshSignal, onChange }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  function load() {
    setLoading(true)
    setError('')
    api
      .get('/tasks/mine')
      .then(({ data }) => setTasks(data.data))
      .catch((err) => setError(apiErrorMessage(err, 'Could not load your tasks.')))
      .finally(() => setLoading(false))
  }

  useEffect(load, [refreshSignal])

  async function runAction(task, action) {
    setBusyId(task.id)
    setError('')
    try {
      await api.post(`/tasks/${task.id}/${action}`)
      load()
      onChange?.()
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not update the task.'))
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="task-list-card">
      <div className="task-list-header">
        <div className="task-list-title-group">
          <h2 className="task-list-title">My Assigned Tasks</h2>
          <span className="task-count-badge">{tasks.length}</span>
        </div>
      </div>

      {error && (
        <div className="alert-error">
          <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" /> {error}
        </div>
      )}

      {loading ? (
        <div className="task-empty-state">
          <div className="route-spinner" style={{ width: 28, height: 28 }} />
          <span className="task-empty-desc">Loading your tasks…</span>
        </div>
      ) : tasks.length === 0 ? (
        <div className="task-empty-state">
          <div className="task-empty-icon"><i className="fa-solid fa-mug-hot" aria-hidden="true" /></div>
          <div className="task-empty-title">All caught up!</div>
          <p className="task-empty-desc">
            You don't have any pending tasks assigned to you.
          </p>
        </div>
      ) : (
        <div className="task-stack">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              busy={busyId === task.id}
              onStart={(t) => runAction(t, 'start')}
              onPause={(t) => runAction(t, 'pause')}
              onComplete={(t) => runAction(t, 'complete')}
            />
          ))}
        </div>
      )}
    </div>
  )
}

