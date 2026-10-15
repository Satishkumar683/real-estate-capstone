import { formatINR, formatPricePerSqft } from '@/shared/lib/format';

function FactorBar({ factor, maxMagnitude }) {
  const widthPct = Math.max(8, (factor.magnitude / maxMagnitude) * 100);
  const isPositive = factor.direction === 'positive';
  const color = isPositive ? 'bg-[#033B30]' : 'bg-rose-500';

  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-medium text-[#18181B] w-44 shrink-0 truncate">
        {factor.label}
      </span>
      <div className="flex-1 h-2.5 bg-[#FAF8EE] border border-[#18181B]/10 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all duration-500`} style={{ width: `${widthPct}%` }} />
      </div>
      <span className={`text-[10px] font-bold font-mono ${isPositive ? 'text-[#033B30]' : 'text-rose-600'}`}>
        {isPositive ? '+' : '-'}{factor.magnitude.toFixed(2)}
      </span>
    </div>
  );
}

export default function InsightPanel({ prediction, insight, loading, error }) {
  if (loading) {
    return (
      <div className="bg-white border border-[#18181B]/15 rounded-2xl shadow-sm p-8 text-center flex flex-col items-center justify-center min-h-[350px]">
        {/* Equalizer pulsing */}
        <div className="flex items-end gap-1 h-6 mb-4">
          <span className="w-1 h-3 bg-[#18181B] rounded-full animate-pulse" />
          <span className="w-1 h-6 bg-[#18181B] rounded-full animate-bounce" />
          <span className="w-1 h-4 bg-[#18181B] rounded-full animate-pulse" />
          <span className="w-1 h-2 bg-[#18181B] rounded-full" />
        </div>
        <p className="font-display font-semibold text-[#18181B] text-lg">Computing Fair Valuation</p>
        <p className="text-xs text-[#52525B] mt-1">Analyzing local market comparables and price drivers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white border border-rose-200 rounded-2xl shadow-sm p-6">
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-4 text-xs font-medium">
          {error}
        </div>
      </div>
    );
  }

  if (!prediction || !insight) {
    return (
      <div className="bg-white border border-[#18181B]/15 rounded-2xl shadow-sm p-8 text-center flex flex-col items-center justify-center min-h-[350px]">
        {/* Waveform icon */}
        <div className="w-12 h-12 rounded-2xl bg-[#FAF8EE] border border-[#18181B]/15 flex items-center justify-center mb-4">
          <span className="text-lg">⚡</span>
        </div>
        <h3 className="font-display font-semibold text-[#18181B] text-lg">Valuation Ready</h3>
        <p className="text-xs text-[#52525B] max-w-xs mt-2 leading-relaxed">
          Select property parameters on the left and click Calculate Fair Value to view the price breakdown and key drivers.
        </p>
      </div>
    );
  }

  const maxMagnitude = Math.max(...insight.top_factors.map((f) => f.magnitude));
  const isGlobalFallback = insight.matched_scenario === '__global__';

  return (
    <div className="bg-white border border-[#18181B]/15 rounded-2xl shadow-sm p-6">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-[#52525B] uppercase tracking-wider">
          Fair Market Valuation
        </span>
        <span className="bg-[#033B30] text-[#E0FBE6] border border-[#033B30] rounded-full px-2.5 py-0.5 text-[10px] font-bold">
          ✓ Verified Benchmark
        </span>
      </div>

      <p className="font-display font-bold text-[#18181B] text-3xl sm:text-4xl mt-2 tracking-tight">
        {formatINR(prediction.predicted_price)}
      </p>
      <p className="text-xs text-[#52525B] mt-1 font-mono font-medium">
        {formatPricePerSqft(prediction.predicted_price_per_sqft)}
      </p>

      <div className="my-5 pt-5 border-t border-[#18181B]/10">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold text-[#18181B] uppercase tracking-wide flex items-center gap-1.5">
            <span>⚡</span>
            <span>Key Price Drivers</span>
          </p>
          <span className="text-[11px] text-[#71717A]">Influence on Price</span>
        </div>

        <div className="flex flex-col gap-3">
          {insight.top_factors.map((factor) => (
            <FactorBar key={factor.label} factor={factor} maxMagnitude={maxMagnitude} />
          ))}
        </div>

        <div className="mt-5 p-3.5 bg-[#FAF8EE] rounded-xl border border-[#18181B]/10">
          <p className="text-xs text-[#18181B] leading-relaxed font-medium">
            {insight.insight}
          </p>
        </div>

        {isGlobalFallback && (
          <p className="text-[11px] text-[#71717A] mt-2 italic">
            Showing general submarket baseline drivers for this configuration.
          </p>
        )}

        <p className="text-[10px] text-[#71717A] mt-4 pt-3 border-t border-[#18181B]/5">
          Based on {insight.sample_size?.toLocaleString('en-IN') || 'thousands of'} comparable market transactions.
        </p>
      </div>
    </div>
  );
}