import { useEffect, useState } from 'react';
import { getDonate } from '../api.js';

const PHOTO = '/assets/dipesh.jpg';

function renderDetails(details) {
  if (!details) return null;
  if (typeof details === 'string') return <p className="donate-details">{details}</p>;
  if (typeof details === 'object') {
    return (
      <dl className="donate-details-list">
        {Object.entries(details).map(([k, v]) => (
          <div key={k} className="donate-detail-row">
            <dt>{k}</dt>
            <dd>{String(v)}</dd>
          </div>
        ))}
      </dl>
    );
  }
  return null;
}

export default function DonateModal({ onClose }) {
  const [methods, setMethods] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imgOk, setImgOk] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const d = await getDonate();
        const arr = Array.isArray(d) ? d : d.methods || [];
        setMethods(arr);
        if (arr[0]) setSelectedId(arr[0].id);
      } catch {
        setMethods([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selected = methods.find((m) => m.id === selectedId);

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Donate"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h2>Donate</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close donate">
            ✕
          </button>
        </div>

        <div className="donate-creator">
          {imgOk ? (
            <img
              src={PHOTO}
              alt="Dipesh Joshi"
              className="about-photo"
              onError={() => setImgOk(false)}
            />
          ) : (
            <div className="about-photo fallback" aria-hidden="true">
              DJ
            </div>
          )}
          <div>
            <div className="donate-name">Dipesh Joshi</div>
            <p className="muted small">
              Oja is free to use. If it helped you, consider supporting its creator.
            </p>
          </div>
        </div>

        {loading ? (
          <p className="muted">Loading payment methods…</p>
        ) : methods.length === 0 ? (
          <p className="muted">Donation methods are coming soon.</p>
        ) : (
          <div className="donate-body">
            <div className="method-list" role="tablist" aria-label="Payment methods">
              {methods.map((m) => (
                <button
                  key={m.id}
                  role="tab"
                  aria-selected={m.id === selectedId}
                  className={`method-btn${m.id === selectedId ? ' active' : ''}`}
                  onClick={() => setSelectedId(m.id)}
                >
                  {m.label || m.id}
                </button>
              ))}
            </div>
            {selected && (
              <div className="method-detail">
                <h3>{selected.label || selected.id}</h3>
                {selected.note && <p className="muted small">{selected.note}</p>}
                {selected.details ? (
                  renderDetails(selected.details)
                ) : (
                  <p className="coming-soon">Coming soon — this payment method isn't available yet.</p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
