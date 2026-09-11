import { useEffect, useState } from 'react'
import api, { apiErrorMessage } from '../../api/client'
import CustomerForm from '../../components/CustomerForm/CustomerForm'
import Modal from '../../components/Modal/Modal'
import MobileCardList from '../../components/MobileCardList/MobileCardList'
import './AdminCustomers.css'

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  // Modal states for popup creation and editing
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [pendingToggleId, setPendingToggleId] = useState(null)

  function load() {
    setLoading(true)
    setError('')
    api
      .get('/customers')
      .then(({ data }) => setCustomers(data.data))
      .catch((err) => setError(apiErrorMessage(err, 'Could not load customers.')))
      .finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleCreate(form) {
    const { data } = await api.post('/customers', form)
    setCustomers((prev) => [...prev, data.data].sort((a, b) => a.name.localeCompare(b.name)))
    setShowCreateModal(false)
  }

  async function handleUpdate(id, form) {
    const { data } = await api.patch(`/customers/${id}`, form)
    setCustomers((prev) => prev.map((c) => (c.id === id ? data.data : c)))
    setEditingCustomer(null)
  }

  async function handleToggleActive(customer) {
    setPendingToggleId(customer.id)
    try {
      const { data } = await api.patch(`/customers/${customer.id}`, { active: !customer.active })
      setCustomers((prev) => prev.map((c) => (c.id === customer.id ? data.data : c)))
    } catch (err) {
      setError(apiErrorMessage(err, 'Could not update customer status.'))
    } finally {
      setPendingToggleId(null)
    }
  }

  const filteredCustomers = customers.filter((c) => {
    if (statusFilter === 'active' && c.active === false) return false
    if (statusFilter === 'inactive' && c.active !== false) return false

    if (!search.trim()) return true
    const term = search.toLowerCase()
    return (
      c.name.toLowerCase().includes(term) ||
      (c.company && c.company.toLowerCase().includes(term)) ||
      (c.email && c.email.toLowerCase().includes(term)) ||
      (c.phone && c.phone.includes(term))
    )
  })

  return (
    <div className="admin-customers-container">
      <div className="customers-top-card">
        <div className="customers-title-group">
          <h2>Client & Customer Database</h2>
          <span className="task-count-badge">{customers.length} total</span>
        </div>

        <div className="customers-actions-group">
          <input
            className="customer-search-input"
            placeholder="Search by name, company, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className="customer-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          <button
            type="button"
            className="btn-primary-add"
            onClick={() => setShowCreateModal(true)}
          >
            <i className="fa-solid fa-plus" aria-hidden="true" /> Add Customer
          </button>
        </div>
      </div>

      {error && (
        <div className="alert-error">
          <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" /> {error}
        </div>
      )}

      <div className="tasks-table-card">
        <div className="modern-table-container">
          {loading ? (
            <div className="task-empty-state">
              <div className="route-spinner" style={{ width: 28, height: 28 }} />
              <span className="task-empty-desc">Loading customer directory…</span>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="task-empty-state">
              <div className="task-empty-icon"><i className="fa-solid fa-address-book" aria-hidden="true" /></div>
              <div className="task-empty-title">No customers found</div>
              <p className="task-empty-desc">
                {search || statusFilter !== 'all'
                  ? 'No clients match your search or filter.'
                  : 'Click "+ Add Customer" to add your first customer.'}
              </p>
            </div>
          ) : (
            <table className="modern-table">
              <thead>
                <tr>
                  <th>Client / Contact Name</th>
                  <th>Company</th>
                  <th>Phone Number</th>
                  <th>Email Address</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className={c.active === false ? 'customer-row-inactive' : ''}>
                    <td style={{ fontWeight: 600 }}>{c.name}</td>
                    <td>{c.company || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td>{c.phone || <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                    <td>
                      {c.email ? (
                        <a href={`mailto:${c.email}`} style={{ color: 'var(--primary)', fontWeight: 500 }}>
                          {c.email}
                        </a>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${c.active !== false ? 'active' : 'inactive'}`}>
                        {c.active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          type="button"
                          className="btn-table-action"
                          onClick={() => setEditingCustomer(c)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn-table-action"
                          onClick={() => handleToggleActive(c)}
                          disabled={pendingToggleId === c.id}
                        >
                          {c.active !== false ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {!loading && filteredCustomers.length > 0 && (
            <MobileCardList
              items={filteredCustomers}
              detailTitle={(c) => c.name}
              detailSubtitle={(c) => c.company || 'No company on file'}
              renderCard={(c) => (
                <>
                  <span className="mdc-title">{c.name}</span>
                  <span className="mdc-subtitle">{c.company || 'No company'}</span>
                  <span className={`badge ${c.active !== false ? 'active' : 'inactive'}`}>
                    {c.active !== false ? 'Active' : 'Inactive'}
                  </span>
                </>
              )}
              renderDetail={(c, close) => (
                <div className="detail-list">
                  <div className="detail-row">
                    <span className="detail-row-label">Company</span>
                    <span className="detail-row-value">{c.company || '—'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-row-label">Phone</span>
                    <span className="detail-row-value">{c.phone || '—'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-row-label">Email</span>
                    <span className="detail-row-value">
                      {c.email ? (
                        <a href={`mailto:${c.email}`} style={{ color: 'var(--primary)', fontWeight: 500 }}>
                          {c.email}
                        </a>
                      ) : (
                        '—'
                      )}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-row-label">Status</span>
                    <span className="detail-row-value">
                      <span className={`badge ${c.active !== false ? 'active' : 'inactive'}`}>
                        {c.active !== false ? 'Active' : 'Inactive'}
                      </span>
                    </span>
                  </div>
                  <div className="detail-actions">
                    <button
                      type="button"
                      className="btn-table-action"
                      onClick={() => {
                        close()
                        setEditingCustomer(c)
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn-table-action"
                      onClick={() => handleToggleActive(c)}
                      disabled={pendingToggleId === c.id}
                    >
                      {c.active !== false ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              )}
            />
          )}
        </div>
      </div>

      {/* Popup Window: Add Customer Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New Customer"
        subtitle="Enter customer contact details for project assignment."
        size="md"
      >
        <CustomerForm
          submitLabel="Create Customer"
          onSubmit={handleCreate}
          onCancel={() => setShowCreateModal(false)}
        />
      </Modal>

      {/* Popup Window: Edit Customer Modal */}
      <Modal
        isOpen={Boolean(editingCustomer)}
        onClose={() => setEditingCustomer(null)}
        title={`Edit Customer: ${editingCustomer?.name || ''}`}
        subtitle="Update client company and contact credentials."
        size="md"
      >
        {editingCustomer && (
          <CustomerForm
            initial={editingCustomer}
            submitLabel="Save Changes"
            onSubmit={(form) => handleUpdate(editingCustomer.id, form)}
            onCancel={() => setEditingCustomer(null)}
          />
        )}
      </Modal>
    </div>
  )
}

