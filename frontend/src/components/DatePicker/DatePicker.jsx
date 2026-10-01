import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import './DatePicker.css'

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const GAP = 8
const EDGE = 8

// Values are 'YYYY-MM-DD' strings, same as a native <input type="date">.
// Parsed as local dates so the shown day never shifts with the timezone.
function parseISO(value) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? '')
  return m ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])) : null
}

function toISO(date) {
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${mm}-${dd}`
}

function sameDay(a, b) {
  return !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function addDays(date, n) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + n)
}

// Same day-of-month in another month, clamped (Jan 31 + 1 month -> Feb 28/29).
function addMonths(date, n) {
  const last = new Date(date.getFullYear(), date.getMonth() + n + 1, 0).getDate()
  return new Date(date.getFullYear(), date.getMonth() + n, Math.min(date.getDate(), last))
}

// Always 6 weeks so the popup keeps a stable height between months.
function monthGrid(viewDate) {
  const first = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1)
  const start = addDays(first, -first.getDay())
  return Array.from({ length: 42 }, (_, i) => addDays(start, i))
}

function formatDisplay(date) {
  return date ? date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) : ''
}

export default function DatePicker({ id, value, onChange, placeholder = 'Select date', className = '', showIcon = true, ...rest }) {
  const selected = parseISO(value)
  const [open, setOpen] = useState(false)
  const [focusDate, setFocusDate] = useState(() => selected ?? new Date())
  const [pos, setPos] = useState(null)
  const inputRef = useRef(null)
  const popRef = useRef(null)
  const gridRef = useRef(null)

  const today = new Date()
  const days = monthGrid(focusDate)
  const viewMonth = focusDate.getMonth()

  function openPicker() {
    setFocusDate(selected ?? new Date())
    setPos(null)
    setOpen(true)
  }

  function close(refocus) {
    setOpen(false)
    if (refocus) inputRef.current?.focus()
  }

  function pick(date) {
    onChange(date ? toISO(date) : '')
    close(true)
  }

  // Popup lives in a portal (so modals with overflow:hidden can't clip it),
  // so it is positioned against the input and flipped above when needed.
  useLayoutEffect(() => {
    if (!open) return
    function place() {
      const input = inputRef.current
      const pop = popRef.current
      if (!input || !pop) return
      const r = input.getBoundingClientRect()
      const w = pop.offsetWidth
      const h = pop.offsetHeight
      const vw = window.innerWidth
      const vh = window.innerHeight
      const below = vh - r.bottom - GAP
      const above = r.top - GAP
      const top = below >= h || below >= above ? r.bottom + GAP : r.top - GAP - h
      const left = Math.max(EDGE, Math.min(r.left, vw - w - EDGE))
      setPos({ top: Math.max(EDGE, top), left })
    }
    place()
    window.addEventListener('resize', place)
    window.addEventListener('scroll', place, true)
    return () => {
      window.removeEventListener('resize', place)
      window.removeEventListener('scroll', place, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    function onPointerDown(e) {
      if (popRef.current?.contains(e.target) || inputRef.current?.contains(e.target)) return
      close(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('touchstart', onPointerDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('touchstart', onPointerDown)
    }
  }, [open])

  // Keep keyboard focus on the active day while navigating.
  useEffect(() => {
    if (!open || !pos) return
    gridRef.current?.querySelector('[data-active="true"]')?.focus({ preventScroll: true })
  }, [open, pos, focusDate])

  function onInputKeyDown(e) {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault()
      openPicker()
    } else if ((e.key === 'Backspace' || e.key === 'Delete') && value) {
      e.preventDefault()
      onChange('')
    }
  }

  function onGridKeyDown(e) {
    const moves = {
      ArrowLeft: () => addDays(focusDate, -1),
      ArrowRight: () => addDays(focusDate, 1),
      ArrowUp: () => addDays(focusDate, -7),
      ArrowDown: () => addDays(focusDate, 7),
      PageUp: () => addMonths(focusDate, -1),
      PageDown: () => addMonths(focusDate, 1),
    }
    if (moves[e.key]) {
      e.preventDefault()
      setFocusDate(moves[e.key]())
    }
  }

  function onPopupKeyDown(e) {
    if (e.key === 'Escape') {
      e.preventDefault()
      e.stopPropagation()
      close(true)
    } else if (e.key === 'Tab') {
      close(false)
    }
  }

  const monthName = focusDate.toLocaleDateString(undefined, { month: 'long' })

  return (
    <>
      <input
        {...rest}
        ref={inputRef}
        id={id}
        type="text"
        readOnly
        inputMode="none"
        autoComplete="off"
        className={`datepicker-input${showIcon ? ' datepicker-input--icon' : ''} ${className}`.trim()}
        value={formatDisplay(selected)}
        placeholder={placeholder}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => (open ? close(false) : openPicker())}
        onKeyDown={onInputKeyDown}
      />

      {open &&
        createPortal(
          <div
            ref={popRef}
            className="datepicker-popup"
            role="dialog"
            aria-label="Choose date"
            style={pos ? { top: pos.top, left: pos.left } : { top: 0, left: 0, visibility: 'hidden' }}
            onKeyDown={onPopupKeyDown}
          >
            <div className="datepicker-header">
              <span className="datepicker-title" aria-live="polite">
                {monthName} <span className="datepicker-year">{focusDate.getFullYear()}</span>
              </span>
              <div className="datepicker-nav">
                <button type="button" aria-label="Previous month" onClick={() => setFocusDate(addMonths(focusDate, -1))}>
                  <i className="fa-solid fa-caret-up" aria-hidden="true" />
                </button>
                <button type="button" aria-label="Next month" onClick={() => setFocusDate(addMonths(focusDate, 1))}>
                  <i className="fa-solid fa-caret-down" aria-hidden="true" />
                </button>
              </div>
            </div>

            <div className="datepicker-weekdays" aria-hidden="true">
              {WEEKDAYS.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>

            <div className="datepicker-grid" role="grid" ref={gridRef} onKeyDown={onGridKeyDown}>
              {days.map((d) => {
                const isActive = sameDay(d, focusDate)
                const classes = ['datepicker-day']
                if (d.getMonth() !== viewMonth) classes.push('is-outside')
                if (sameDay(d, today)) classes.push('is-today')
                if (sameDay(d, selected)) classes.push('is-selected')
                return (
                  <button
                    key={d.getTime()}
                    type="button"
                    role="gridcell"
                    className={classes.join(' ')}
                    tabIndex={isActive ? 0 : -1}
                    data-active={isActive}
                    aria-selected={sameDay(d, selected)}
                    aria-label={d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    onClick={() => pick(d)}
                  >
                    {d.getDate()}
                  </button>
                )
              })}
            </div>

            <div className="datepicker-footer">
              <button type="button" className="datepicker-link" onClick={() => pick(null)}>
                Clear
              </button>
              <button type="button" className="datepicker-link datepicker-link--primary" onClick={() => pick(new Date())}>
                Today
              </button>
            </div>
          </div>,
          document.body,
        )}
    </>
  )
}
