const TONE_CLASSES = {
  good: 'bg-emerald-700 text-white',
  neutral: 'bg-navy text-white',
  bad: 'bg-red-700 text-white',
};

export default function Badge({ tone = 'neutral', className = '', children }) {
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${TONE_CLASSES[tone]} ${className}`}>
      {children}
    </span>
  );
}