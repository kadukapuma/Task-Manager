import { useEffect, useMemo, useState } from 'react'
import Modal from '../Modal/Modal'
import './StaffPicker.css'

export default function StaffPicker({
  staff,
  value,
  onChange,
  label,
  placeholder = 'Choose staff…',
  allowUnassigned = false,
  disabled = false,
  loading = false,
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (isOpen) setSearch('')
  }, [isOpen])

  const selected = useMemo(
    () => staff.find((s) => String(s.id) === String(value)) ?? null,
    [staff, value],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return staff
    return staff.filter(
      (s) => s.name.toLowerCase().includes(q) || s.username.toLowerCase().includes(q),
    )
  }, [staff, search])

  function pick(id) {
    onChange(id)
    setIsOpen(false)
  }

  function initials(name) {
    return name
      .split(' ')
      .map((part) => part[0])
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  return (
    <div className="form-field">
      {label && <label>{label}</label>}
      <button
        type="button"
        className="staff-picker-trigger"
        disabled={disabled}
        onClick={() => setIsOpen(true)}
      >
        {selected ? (
          <span className="staff-picker-selected">
            <span className="staff-picker-avatar">{initials(selected.name)}</span>
            {selected.name}
          </span>
        ) : (
          <span className="staff-picker-placeholder">
            {allowUnassigned ? 'Unassigned (Queue)' : placeholder}
          </span>
        )}
        <span className="staff-picker-chevron">▾</span>
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Select Staff Member"
        subtitle="Search by name or username"
        size="sm"
      >
        <div className="staff-picker-search-wrap">
          <i className="fa-solid fa-magnifying-glass staff-picker-search-icon" aria-hidden="true" />
          <input
            autoFocus
            type="text"
            placeholder="Search staff…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="staff-picker-list">
          {allowUnassigned && (
            <button
              type="button"
              className={`staff-picker-option ${!value ? 'active' : ''}`}
              onClick={() => pick('')}
            >
              <span className="staff-picker-avatar unassigned">—</span>
              <span className="staff-picker-option-text">
                <span className="staff-picker-option-name">Unassigned</span>
                <span className="staff-picker-option-sub">Leave in the queue</span>
              </span>
            </button>
          )}

          {loading ? (
            <div className="staff-picker-empty">Loading staff…</div>
          ) : filtered.length === 0 ? (
            <div className="staff-picker-empty">
              {staff.length === 0 ? 'No staff members yet.' : `No staff match "${search}"`}
            </div>
          ) : (
            filtered.map((s) => (
              <button
                type="button"
                key={s.id}
                className={`staff-picker-option ${String(value) === String(s.id) ? 'active' : ''}`}
                onClick={() => pick(s.id)}
              >
                <span className="staff-picker-avatar">{initials(s.name)}</span>
                <span className="staff-picker-option-text">
                  <span className="staff-picker-option-name">{s.name}</span>
                  <span className="staff-picker-option-sub">@{s.username}</span>
                </span>
              </button>
            ))
          )}
        </div>
      </Modal>
    </div>
  )
}
