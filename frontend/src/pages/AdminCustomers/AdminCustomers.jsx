import { useEffect, useState } from 'react'
import api, { apiErrorMessage } from '../../api/client'
import CustomerForm from '../../components/CustomerForm/CustomerForm'
import Modal from '../../components/Modal/Modal'
import './AdminCustomers.css'

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  // Modal states for popup creation and editing
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)

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

  const filteredCustomers = customers.filter((c) => {
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

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input
            className="customer-search-input"
            placeholder="Search by name, company, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            type="button"
            className="btn-primary-add"
            onClick={() => setShowCreateModal(true)}
          >
            <span>+</span> Add Customer
          </button>
        </div>
      </div>

      {error && (
        <div className="alert-error">
          <span>⚠️</span> {error}
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
              <div className="task-empty-icon">👥</div>
              <div className="task-empty-title">No customers found</div>
              <p className="task-empty-desc">
                {search ? 'No clients match your search query.' : 'Click "+ Add Customer" to add your first customer.'}
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((c) => (
                  <tr key={c.id}>
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
                      <button
                        type="button"
                        className="btn-table-action"
                        onClick={() => setEditingCustomer(c)}
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

