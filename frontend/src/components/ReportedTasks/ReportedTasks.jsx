import { useEffect, useState } from 'react'
import api, { apiErrorMessage } from '../../api/client'
import TaskCard from '../TaskCard/TaskCard'

export default function ReportedTasks({ refreshSignal }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  function load() {
    setLoading(true)
    setError('')
    api
      .get('/tasks/reported')
      .then(({ data }) => setTasks(data.data))
      .catch((err) => setError(apiErrorMessage(err, 'Could not load your reported tasks.')))
      .finally(() => setLoading(false))
  }

  useEffect(load, [refreshSignal])

  return (
    <div className="task-list-card">
      <div className="task-list-header">
        <div className="task-list-title-group">
          <h2 className="task-list-title">Tasks You've Added</h2>
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
          <span className="task-empty-desc">Loading tasks you've added…</span>
        </div>
      ) : tasks.length === 0 ? (
        <div className="task-empty-state">
          <div className="task-empty-icon"><i className="fa-regular fa-note-sticky" aria-hidden="true" /></div>
          <div className="task-empty-title">Nothing reported yet</div>
          <p className="task-empty-desc">Tasks you add with "New Task" will show up here until an admin assigns them.</p>
        </div>
      ) : (
        <div className="task-stack">
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} readOnly />
          ))}
        </div>
      )}
    </div>
  )
}
