export default function EmidsMark({ className = "w-8 h-8" }) {
  return (
    <svg viewBox="0 0 64 40" fill="none" className={className} aria-label="emids">
      <path
        d="M20 4C11 4 4 11.2 4 20s7 16 16 16c5.6 0 10.5-2.9 13.5-7.2"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinecap="round"
      />
      <path
        d="M44 4c9 0 16 7.2 16 16s-7 16-16 16c-5.6 0-10.5-2.9-13.5-7.2"
        stroke="currentColor"
        strokeWidth="8"
        strokeLinecap="round"
      />
    </svg>
  );
}
