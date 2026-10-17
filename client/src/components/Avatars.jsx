// Oja profile avatars: ~10 original flat geometric character icons in a
// playful circle/triangle/square style (pink/teal/green palette).
//
// AVATAR_IDS must match server/avatar.js AVATARS. AvatarIcon falls back to
// the first avatar for unknown ids so a stale user row never breaks the UI.

export const AVATARS = [
  { id: 'fox', label: 'Fox' },
  { id: 'robot', label: 'Robot' },
  { id: 'panda', label: 'Panda' },
  { id: 'ghost', label: 'Ghost' },
  { id: 'frog', label: 'Frog' },
  { id: 'cat', label: 'Cat' },
  { id: 'owl', label: 'Owl' },
  { id: 'alien', label: 'Alien' },
  { id: 'ninja', label: 'Ninja' },
  { id: 'astronaut', label: 'Astronaut' },
];

export const AVATAR_IDS = AVATARS.map((a) => a.id);

// Each entry is SVG children drawn on a 0 0 48 48 viewBox.
const ART = {
  fox: (
    <>
      <polygon points="9,21 5,3 25,11" fill="#ea580c" />
      <polygon points="39,21 43,3 23,11" fill="#ea580c" />
      <polygon points="11,16 9,7 19,11" fill="#fda4af" />
      <polygon points="37,16 39,7 29,11" fill="#fda4af" />
      <circle cx="24" cy="28" r="15" fill="#fb923c" />
      <ellipse cx="24" cy="35.5" rx="8" ry="5.5" fill="#fff7ed" />
      <circle cx="17" cy="26" r="2.2" fill="#431407" />
      <circle cx="31" cy="26" r="2.2" fill="#431407" />
      <circle cx="24" cy="32.5" r="2.6" fill="#431407" />
    </>
  ),
  robot: (
    <>
      <rect x="22.5" y="4" width="3" height="8" fill="#94a3b8" />
      <circle cx="24" cy="4.5" r="3" fill="#f472b6" />
      <rect x="10" y="12" width="28" height="27" rx="9" fill="#14b8a6" />
      <rect x="15" y="17" width="18" height="12" rx="6" fill="#0f172a" />
      <circle cx="21.5" cy="23" r="2.6" fill="#5eead4" />
      <circle cx="29.5" cy="23" r="2.6" fill="#5eead4" />
      <rect x="19" y="32.5" width="10" height="3" rx="1.5" fill="#0f172a" />
    </>
  ),
  panda: (
    <>
      <circle cx="11" cy="13" r="7" fill="#1f2937" />
      <circle cx="37" cy="13" r="7" fill="#1f2937" />
      <circle cx="24" cy="27" r="15" fill="#f8fafc" />
      <ellipse cx="17" cy="25" rx="4.5" ry="5.5" fill="#1f2937" transform="rotate(-15 17 25)" />
      <ellipse cx="31" cy="25" rx="4.5" ry="5.5" fill="#1f2937" transform="rotate(15 31 25)" />
      <circle cx="17.6" cy="24.4" r="1.8" fill="#ffffff" />
      <circle cx="30.4" cy="24.4" r="1.8" fill="#ffffff" />
      <ellipse cx="24" cy="33.5" rx="3" ry="2.2" fill="#1f2937" />
    </>
  ),
  ghost: (
    <>
      <path
        d="M13 44 V22 a11 11 0 0 1 22 0 V44 l-5.5 -4.5 L24 44 l-5.5 -4.5 Z"
        fill="#e8edf5"
      />
      <circle cx="19" cy="22" r="2.6" fill="#0f172a" />
      <circle cx="29" cy="22" r="2.6" fill="#0f172a" />
      <ellipse cx="24" cy="30" rx="2.4" ry="3.2" fill="#0f172a" />
      <circle cx="15" cy="28" r="2" fill="#f9a8d4" opacity="0.8" />
      <circle cx="33" cy="28" r="2" fill="#f9a8d4" opacity="0.8" />
    </>
  ),
  frog: (
    <>
      <circle cx="15" cy="12" r="7" fill="#22c55e" />
      <circle cx="33" cy="12" r="7" fill="#22c55e" />
      <circle cx="15" cy="12" r="4" fill="#ffffff" />
      <circle cx="33" cy="12" r="4" fill="#ffffff" />
      <circle cx="15" cy="12.5" r="2" fill="#052e16" />
      <circle cx="33" cy="12.5" r="2" fill="#052e16" />
      <circle cx="24" cy="29" r="15" fill="#4ade80" />
      <path
        d="M16 29.5 q8 8 16 0"
        stroke="#052e16"
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="14.5" cy="33.5" r="2.4" fill="#f9a8d4" opacity="0.9" />
      <circle cx="33.5" cy="33.5" r="2.4" fill="#f9a8d4" opacity="0.9" />
    </>
  ),
  cat: (
    <>
      <polygon points="10,20 6,2 24,10" fill="#ec4899" />
      <polygon points="38,20 42,2 24,10" fill="#ec4899" />
      <polygon points="11,15 9.5,7.5 17,11" fill="#fbcfe3" />
      <polygon points="37,15 38.5,7.5 31,11" fill="#fbcfe3" />
      <circle cx="24" cy="28" r="15" fill="#f9a8d4" />
      <path
        d="M7 28 h7 M7 33.5 l7 -2 M41 28 h-7 M41 33.5 l-7 -2"
        stroke="#831843"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <circle cx="17.5" cy="26" r="2.2" fill="#4a044e" />
      <circle cx="30.5" cy="26" r="2.2" fill="#4a044e" />
      <polygon points="24,31 21.5,34.5 26.5,34.5" fill="#4a044e" />
      <path
        d="M24 34.5 v2 M24 36.5 q-3 2.5 -6 1 M24 36.5 q3 2.5 6 1"
        stroke="#4a044e"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      />
    </>
  ),
  owl: (
    <>
      <polygon points="13,15 10,3 22,9" fill="#0d9488" />
      <polygon points="35,15 38,3 26,9" fill="#0d9488" />
      <circle cx="24" cy="27" r="16" fill="#14b8a6" />
      <circle cx="17.5" cy="24" r="7" fill="#ffffff" />
      <circle cx="30.5" cy="24" r="7" fill="#ffffff" />
      <circle cx="17.5" cy="24.5" r="3.2" fill="#134e4a" />
      <circle cx="30.5" cy="24.5" r="3.2" fill="#134e4a" />
      <circle cx="18.6" cy="23.4" r="1.1" fill="#ffffff" />
      <circle cx="31.6" cy="23.4" r="1.1" fill="#ffffff" />
      <polygon points="24,30 20.5,34 27.5,34" fill="#fbbf24" />
    </>
  ),
  alien: (
    <>
      <line x1="18" y1="13" x2="13" y2="5" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="30" y1="13" x2="35" y2="5" stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="13" cy="4.5" r="2.6" fill="#f472b6" />
      <circle cx="35" cy="4.5" r="2.6" fill="#f472b6" />
      <ellipse cx="24" cy="28" rx="14" ry="16" fill="#4ade80" />
      <ellipse cx="17.5" cy="26" rx="4" ry="6" fill="#052e16" transform="rotate(20 17.5 26)" />
      <ellipse cx="30.5" cy="26" rx="4" ry="6" fill="#052e16" transform="rotate(-20 30.5 26)" />
      <path
        d="M20 37 q4 3 8 0"
        stroke="#052e16"
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
      />
    </>
  ),
  ninja: (
    <>
      <circle cx="24" cy="26" r="16" fill="#1f2937" />
      <polygon points="38.5,21 46,17 43.5,26" fill="#db2777" />
      <polygon points="38.5,28 45.5,30 40.5,34.5" fill="#db2777" />
      <rect x="8" y="19" width="32" height="13" rx="6.5" fill="#ec4899" />
      <ellipse cx="17" cy="25.5" rx="3.6" ry="2.3" fill="#ffffff" />
      <ellipse cx="31" cy="25.5" rx="3.6" ry="2.3" fill="#ffffff" />
      <circle cx="17.6" cy="25.5" r="1.3" fill="#1f2937" />
      <circle cx="30.4" cy="25.5" r="1.3" fill="#1f2937" />
    </>
  ),
  astronaut: (
    <>
      <rect x="19" y="39" width="10" height="6" rx="2.5" fill="#94a3b8" />
      <circle cx="24" cy="24" r="17" fill="#e2e8f0" />
      <circle cx="24" cy="24" r="17" fill="none" stroke="#94a3b8" strokeWidth="2" />
      <rect x="12" y="15" width="24" height="19" rx="9.5" fill="#0e7490" />
      <rect x="12" y="15" width="24" height="19" rx="9.5" fill="none" stroke="#155e75" strokeWidth="2" />
      <path d="M17.5 20.5 l6 -3.5" stroke="#a5f3fc" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="32" cy="29" r="1.4" fill="#a5f3fc" />
    </>
  ),
};

/** Render one avatar's inline SVG, falling back to the first avatar. */
export function AvatarIcon({ id, size = 32 }) {
  const art = ART[id] || ART[AVATAR_IDS[0]];
  return (
    <svg
      className="avatar-icon"
      viewBox="0 0 48 48"
      width={size}
      height={size}
      aria-hidden="true"
      focusable="false"
    >
      {art}
    </svg>
  );
}

/** Selectable grid of avatars; calls onPick(id) when one is chosen. */
export function AvatarPicker({ value, onPick }) {
  return (
    <div className="avatar-grid" role="radiogroup" aria-label="Choose your avatar">
      {AVATARS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={value === id}
          title={label}
          className={`avatar-btn${value === id ? ' selected' : ''}`}
          onClick={() => onPick(id)}
        >
          <AvatarIcon id={id} size={44} />
          <span className="avatar-name">{label}</span>
        </button>
      ))}
    </div>
  );
}
