import { useEffect, useState } from 'react'
import api, { apiErrorMessage } from '../../api/client'
import TaskCard from '../TaskCard/TaskCard'
import Modal from '../Modal/Modal'
import TaskDetailView from '../TaskDetailView/TaskDetailView'
import './TaskList.css'

export default function TaskList({ refreshSignal, onChange }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState(null)

  const [cannotCompleteTask, setCannotCompleteTask] = useState(null)
  const [reason, setReason] = useState('')
  const [reasonError, setReasonError] = useState('')
  const [viewingTask, setViewingTask] = useState(null)

  function load() {
    setLoading(true)
    setError('')
    api
      .get('/tasks/mine')
      // Done/Undone tasks are closed out -- keep this list to active work only.
      .then(({ data }) => setTasks(data.data.filter((t) => t.status !== 'Done' && t.status !== 'Undone')))
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

  function openCannotComplete(task) {
    setReason('')
    setReasonError('')
    setCannotCompleteTask(task)
  }

  async function submitCannotComplete(e) {
    e.preventDefault()
    if (!reason.trim()) {
      setReasonError('A reason is required.')
      return
    }

    setBusyId(cannotCompleteTask.id)
    setReasonError('')
    try {
      await api.post(`/tasks/${cannotCompleteTask.id}/cannot-complete`, { reason })
      setCannotCompleteTask(null)
      load()
      onChange?.()
    } catch (err) {
      setReasonError(apiErrorMessage(err, 'Could not update the task.'))
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
              onCannotComplete={openCannotComplete}
              onView={setViewingTask}
            />
          ))}
        </div>
      )}

      <Modal
        isOpen={Boolean(cannotCompleteTask)}
        onClose={() => setCannotCompleteTask(null)}
        title="Mark Task Undone"
        subtitle={cannotCompleteTask ? `"${cannotCompleteTask.title}" -- please explain why.` : ''}
        size="sm"
      >
        <form className="task-form-modern" onSubmit={submitCannotComplete}>
          {reasonError && (
            <div className="alert-error">
              <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" /> {reasonError}
            </div>
          )}

          <div className="form-field">
            <label htmlFor="cannot_complete_reason">Reason *</label>
            <textarea
              id="cannot_complete_reason"
              rows={4}
              autoFocus
              placeholder="Explain why this task couldn't be completed…"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              required
            />
          </div>

          <div className="modal-form-actions">
            <button type="button" className="btn-modal-cancel" onClick={() => setCannotCompleteTask(null)}>
              Cancel
            </button>
            <button type="submit" className="btn-modal-submit btn-modal-danger" disabled={busyId === cannotCompleteTask?.id}>
              {busyId === cannotCompleteTask?.id ? 'Saving…' : 'Submit'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={Boolean(viewingTask)}
        onClose={() => setViewingTask(null)}
        title={viewingTask?.title || ''}
        subtitle={viewingTask ? `Task #${viewingTask.id}` : ''}
        size="sm"
      >
        {viewingTask && <TaskDetailView task={viewingTask} />}
      </Modal>
    </div>
  )
}

