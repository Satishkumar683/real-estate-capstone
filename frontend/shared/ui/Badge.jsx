const TONE_CLASSES = {
  good: 'bg-[#033B30] text-[#E0FBE6] border border-[#033B30]',
  neutral: 'bg-white text-[#18181B] border border-[#18181B]/15 shadow-xs',
  lilac: 'bg-[#E8D5FF] text-[#18181B] border border-[#18181B]/30',
  bad: 'bg-rose-50 text-rose-800 border border-rose-200',
};

export default function Badge({ tone = 'neutral', className = '', children }) {
  const toneClass = TONE_CLASSES[tone] || TONE_CLASSES.neutral;

  return (
    <span
      className={`text-xs font-medium px-3 py-1 rounded-full inline-flex items-center gap-1.5 transition-colors ${toneClass} ${className}`}
    >
      {children}
    </span>
  );
}