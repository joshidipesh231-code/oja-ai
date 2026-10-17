import { useEffect, useRef, useState } from 'react';
import { listMedia, uploadMedia, deleteMedia, mediaFileUrl } from '../api.js';

const FILTERS = [
  ['all', 'All'],
  ['photos', 'Photos'],
  ['videos', 'Videos'],
];

function fmtBytes(n) {
  if (n == null || Number.isNaN(n)) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let v = Number(n);
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

function isVideo(f) {
  return (f.mime || '').startsWith('video/');
}

export default function LibraryModal({ onClose }) {
  const [files, setFiles] = useState([]);
  const [usedBytes, setUsedBytes] = useState(0);
  const [limitBytes, setLimitBytes] = useState(0);
  const [filter, setFilter] = useState('all');
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const refresh = async () => {
    try {
      const d = await listMedia();
      setFiles(d.files || []);
      setUsedBytes(d.used_bytes || 0);
      setLimitBytes(d.limit_bytes || 0);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const onFilesChosen = async (e) => {
    const chosen = Array.from(e.target.files || []);
    e.target.value = '';
    if (!chosen.length) return;
    setUploading(true);
    setError('');
    try {
      await uploadMedia(chosen);
      await refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const remove = async (f) => {
    if (!window.confirm(`Delete "${f.filename}"?`)) return;
    try {
      await deleteMedia(f.id);
      setPreview(null);
      await refresh();
    } catch (e) {
      setError(e.message);
    }
  };

  const visible = files.filter((f) => {
    if (filter === 'photos') return !isVideo(f);
    if (filter === 'videos') return isVideo(f);
    return true;
  });

  const pct = limitBytes > 0 ? Math.min(100, (usedBytes / limitBytes) * 100) : 0;

  return (
    <div className="modal-backdrop" onClick={onClose} role="presentation">
      <div
        className="modal modal-lg"
        role="dialog"
        aria-modal="true"
        aria-label="Media library"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <h2>Library</h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close library">
            ✕
          </button>
        </div>

        <div className="lib-toolbar">
          <div className="segmented" role="tablist" aria-label="Filter media">
            {FILTERS.map(([v, l]) => (
              <button
                key={v}
                role="tab"
                aria-selected={filter === v}
                className={`segment${filter === v ? ' active' : ''}`}
                onClick={() => setFilter(v)}
              >
                {l}
              </button>
            ))}
          </div>
          <button
            className="btn btn-primary"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
          >
            {uploading ? 'Uploading…' : '⬆ Upload'}
          </button>
          <input
            ref={inputRef}
            type="file"
            multiple
            accept="image/*,video/*"
            hidden
            onChange={onFilesChosen}
          />
        </div>

        <div className="usage">
          <div className="usage-bar" aria-hidden="true">
            <div className="usage-fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="usage-meta">
            <span>
              {pct.toFixed(1)}% used · {fmtBytes(usedBytes)} of {fmtBytes(limitBytes)}
            </span>
            <span>
              {fmtBytes(Math.max(0, limitBytes - usedBytes))} free · {files.length}{' '}
              {files.length === 1 ? 'file' : 'files'}
            </span>
          </div>
        </div>

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        {visible.length === 0 ? (
          <p className="muted center">Nothing here yet. Upload photos or videos to keep them with Oja.</p>
        ) : (
          <div className="lib-grid">
            {visible.map((f) => (
              <button key={f.id} className="lib-item" onClick={() => setPreview(f)} title={f.filename}>
                {isVideo(f) ? (
                  <video src={mediaFileUrl(f.id)} preload="metadata" muted playsInline />
                ) : (
                  <img src={mediaFileUrl(f.id)} alt={f.filename} loading="lazy" />
                )}
                <span className="lib-item-name">{f.filename}</span>
              </button>
            ))}
          </div>
        )}

        {preview && (
          <div className="preview-backdrop" onClick={() => setPreview(null)} role="presentation">
            <div
              className="preview-modal"
              role="dialog"
              aria-modal="true"
              aria-label={preview.filename}
              onClick={(e) => e.stopPropagation()}
            >
              {isVideo(preview) ? (
                <video src={mediaFileUrl(preview.id)} controls autoPlay playsInline />
              ) : (
                <img src={mediaFileUrl(preview.id)} alt={preview.filename} />
              )}
              <div className="preview-foot">
                <span className="muted small">
                  {preview.filename} · {fmtBytes(preview.size)}
                </span>
                <span className="preview-actions">
                  <a
                    className="btn btn-ghost"
                    href={mediaFileUrl(preview.id)}
                    download={preview.filename}
                  >
                    ⬇ Download
                  </a>
                  <button className="btn btn-danger" onClick={() => remove(preview)}>
                    Delete
                  </button>
                  <button className="icon-btn" onClick={() => setPreview(null)} aria-label="Close preview">
                    ✕
                  </button>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
