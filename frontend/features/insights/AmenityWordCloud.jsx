const COLOR_CYCLE = ['text-gold', 'text-navy', 'text-charcoal'];

export default function AmenityWordCloud({ data }) {
  if (!data || data.length === 0) return null;

  const counts = data.map((d) => d.count);
  const min = Math.min(...counts);
  const max = Math.max(...counts);
  const range = max - min || 1;

  // Font size scaled by sqrt of frequency (not linear) -- linear scaling makes
  // the single most common word overwhelmingly dominant and everything else
  // unreadably tiny; sqrt keeps the size differences visible but proportionate.
  const fontSize = (count) => {
    const t = Math.sqrt((count - min) / range);
    return 14 + t * 34; // 14px to 48px
  };

  return (
    <div className="flex flex-wrap items-baseline justify-center gap-x-4 gap-y-2 p-4">
      {data.map((word, i) => (
        <span
          key={word.text}
          className={`font-display font-semibold ${COLOR_CYCLE[i % COLOR_CYCLE.length]}`}
          style={{ fontSize: `${fontSize(word.count)}px` }}
          title={`${word.count.toLocaleString('en-IN')} mentions`}
        >
          {word.text}
        </span>
      ))}
    </div>
  );
}