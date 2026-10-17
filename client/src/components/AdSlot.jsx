// Image-only house ad. Deliberately NOT a link and NOT clickable:
// pointer-events are disabled so a tap can never redirect.
export default function AdSlot({ showAd = true }) {
  if (!showAd) return null;
  return (
    <div className="ad-slot" aria-label="Advertisement" style={{ pointerEvents: 'none' }}>
      <svg viewBox="0 0 280 175" role="img" aria-label="Your ad here — Oja house ad">
        <rect x="1" y="1" width="278" height="173" rx="12" fill="var(--panel2)" stroke="var(--border)" strokeDasharray="8 6" strokeWidth="2" />
        <g transform="translate(140,62)" opacity="0.9">
          <rect x="-24" y="-24" width="48" height="48" rx="11" fill="var(--accent)" />
          <text x="0" y="9" textAnchor="middle" fontFamily="Georgia, serif" fontSize="24" fill="#ffffff">
            Oj
          </text>
        </g>
        <text x="140" y="118" textAnchor="middle" fontFamily="Georgia, serif" fontSize="17" fill="var(--text)">
          Your ad here
        </text>
        <text x="140" y="140" textAnchor="middle" fontFamily="system-ui, sans-serif" fontSize="11" fill="var(--muted)">
          Oja · house ad · image only
        </text>
      </svg>
    </div>
  );
}
