import { useState } from 'react'
import Modal from '../Modal/Modal'
import './MobileCardList.css'

/**
 * Mobile-only replacement for a data table: renders each row as a tappable
 * card (hidden on desktop, where the real <table> takes over via CSS).
 * Tapping a card opens a popup with the full detail view.
 */
export default function MobileCardList({
  items,
  keyField = 'id',
  renderCard,
  renderDetail,
  detailTitle,
  detailSubtitle,
}) {
  const [selected, setSelected] = useState(null)

  return (
    <>
      <div className="mobile-card-list">
        {items.map((item) => (
          <button
            type="button"
            key={item[keyField]}
            className="mobile-data-card"
            onClick={() => setSelected(item)}
          >
            <div className="mobile-data-card-body">{renderCard(item)}</div>
            <i className="fa-solid fa-chevron-right mobile-data-card-chevron" aria-hidden="true" />
          </button>
        ))}
      </div>

      <Modal
        isOpen={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? (typeof detailTitle === 'function' ? detailTitle(selected) : detailTitle) : ''}
        subtitle={selected ? (typeof detailSubtitle === 'function' ? detailSubtitle(selected) : detailSubtitle) : ''}
        size="sm"
      >
        {selected && renderDetail(selected, () => setSelected(null))}
      </Modal>
    </>
  )
}
