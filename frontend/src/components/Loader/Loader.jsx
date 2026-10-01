import { useId } from 'react'
import './Loader.css'

/** The TaskFlow cube, drawn layer by layer then filled. */
function LogoMark() {
  // Unique per instance so several loaders on one page don't share a gradient id.
  const gradId = `tf-grad-${useId().replace(/:/g, '')}`

  return (
    <svg viewBox="10 14 100 100" aria-hidden="true">
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7CFF8A" />
          <stop offset="1" stopColor="#16B83E" />
        </linearGradient>
      </defs>
      <path className="tf-l3" pathLength="1" fill={`url(#${gradId})`} d="M60 20 L92 39 L60 58 L28 39 Z" />
      <path className="tf-l2" pathLength="1" fill={`url(#${gradId})`} d="M16 47 L60 73 L104 47 L104 59 L60 85 L16 59 Z" />
      <path className="tf-l1" pathLength="1" fill={`url(#${gradId})`} d="M16 72 L60 98 L104 72 L104 86 L60 111 L16 86 Z" />
    </svg>
  )
}

/**
 * Logo-only loader for tables, lists and panels.
 * `size` is the logo width in px; `label` is optional text under it.
 */
export function LogoLoader({ size = 56, label }) {
  return (
    <div className="tf-logo-loader-wrap" role="status" aria-label={label || 'Loading'}>
      <div className="tf-logo-loader" style={{ '--tf-size': `${size}px` }}>
        <LogoMark />
      </div>
      {label && <span className="tf-loader-label">{label}</span>}
    </div>
  )
}

/** Full logo + "TaskFlow" wordmark, for app start-up. */
export function TaskFlowLoader() {
  return (
    <div className="tf-loader" role="status" aria-label="Loading TaskFlow">
      <LogoMark />
      <div className="tf-text">
        <span className="t">Task</span>
        <span className="f">Flow</span>
      </div>
    </div>
  )
}

/** Full-screen splash using the TaskFlow loader. */
export function TaskFlowSplash() {
  return (
    <div className="tf-overlay">
      <TaskFlowLoader />
    </div>
  )
}
