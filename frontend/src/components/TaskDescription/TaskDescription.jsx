import { useId, useLayoutEffect, useRef, useState } from 'react'
import './TaskDescription.css'

export default function TaskDescription({ description }) {
  const [expanded, setExpanded] = useState(false)
  const [canExpand, setCanExpand] = useState(false)
  const descriptionRef = useRef(null)
  const descriptionId = useId()

  useLayoutEffect(() => {
    const element = descriptionRef.current
    if (!element) return

    function measure() {
      const lineHeight = Number.parseFloat(getComputedStyle(element).lineHeight)
      setCanExpand(element.scrollHeight > lineHeight + 1)
    }

    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [description])

  return (
    <div className="task-description">
      <p
        ref={descriptionRef}
        id={descriptionId}
        className={`task-description-text${expanded ? ' is-expanded' : ''}`}
      >
        {description}
      </p>
      {(canExpand || expanded) && (
        <button
          type="button"
          className="task-description-toggle"
          aria-expanded={expanded}
          aria-controls={descriptionId}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  )
}
