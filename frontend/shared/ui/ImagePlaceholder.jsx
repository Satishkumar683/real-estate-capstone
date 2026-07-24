export default function ImagePlaceholder({ label }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-beige/60">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" className="text-navy/30">
        <path
          d="M3 10.5L12 3l9 7.5M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {label && <span className="text-xs text-navy/40 text-center px-3">{label}</span>}
    </div>
  );
}