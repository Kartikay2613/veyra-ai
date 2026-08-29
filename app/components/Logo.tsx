export default function Logo({ onClick, theme = "dark" }: { onClick?: () => void; theme?: "dark" | "light" }) {
  const textColor = theme === "dark" ? "#ffffff" : "var(--color-ink)";
  return (
    <div
      className="nav-bar__logo"
      onClick={onClick}
      style={{ cursor: onClick ? "pointer" : "default", display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <span className="logo-sprint logo-sprint--with-symbol" style={{ fontSize: '1.75rem', fontWeight: 900, display: 'inline-flex', alignItems: 'center', gap: '4px', color: textColor }}>
        Veyra AI
        <svg
          className="logo-sprint__arrows"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          style={{ width: '28px', height: '28px' }}
        >
          {/* Left Arrow - Dark Slate */}
          <path
            d="M6 5L13 12L6 19"
            stroke={theme === "dark" ? "#0f172a" : "#ffffff"}
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Right Arrow - Coral Orange */}
          <path
            d="M13 5L20 12L13 19"
            stroke="#ff5a36"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </div>
  );
}
