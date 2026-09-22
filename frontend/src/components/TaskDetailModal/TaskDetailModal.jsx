import Modal from '../Modal/Modal'
import TaskDetailView from '../TaskDetailView/TaskDetailView'

/**
 * Standard "view task" popup -- a themed, roomy Modal (large by default,
 * with fields laid out two-per-row) wrapping TaskDetailView. Use this
 * instead of reaching for <Modal><TaskDetailView /></Modal> directly, so
 * every task popup in the app looks and sizes the same way.
 */
export default function TaskDetailModal({ task, isOpen, onClose, onEdit, onDelete, size = 'lg', children }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={task?.title || ''}
      subtitle={task ? `Task #${task.id}` : ''}
      size={size}
    >
      {task && (
        <TaskDetailView task={task} onEdit={onEdit} onDelete={onDelete}>
          {children}
        </TaskDetailView>
      )}
    </Modal>
  )
}
