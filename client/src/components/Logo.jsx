export default function Logo({ size = 32 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label="Oja logo"
      style={{ flexShrink: 0, display: 'block' }}
    >
      <rect width="64" height="64" rx="14" fill="var(--accent)" />
      <text
        x="32"
        y="43"
        textAnchor="middle"
        fontFamily="Georgia, 'Times New Roman', serif"
        fontSize="30"
        fill="#ffffff"
      >
        Oj
      </text>
    </svg>
  );
}
