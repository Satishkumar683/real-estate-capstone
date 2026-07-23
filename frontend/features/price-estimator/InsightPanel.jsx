import { formatINR, formatPricePerSqft } from '@/shared/lib/format';

function FactorBar({ factor, maxMagnitude }) {
  const widthPct = Math.max(6, (factor.magnitude / maxMagnitude) * 100);
  const color = factor.direction === 'positive' ? 'bg-emerald-600' : 'bg-red-500';
  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-charcoal w-48 shrink-0">{factor.label}</span>
      <div className="flex-1 h-2 bg-navy/5 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${widthPct}%` }} />
      </div>
    </div>
  );
}

export default function InsightPanel({ prediction, insight, loading, error }) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <p className="text-sm text-charcoal">Calculating estimate...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  if (!prediction || !insight) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <p className="text-sm text-charcoal">
          Fill out the form and click Predict Price to see an estimate and the factors behind it.
        </p>
      </div>
    );
  }

  const maxMagnitude = Math.max(...insight.top_factors.map((f) => f.magnitude));
  const isGlobalFallback = insight.matched_scenario === '__global__';

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <p className="text-sm text-charcoal">Predicted Price</p>
      <p className="font-display font-semibold text-navy text-3xl mt-1">
        {formatINR(prediction.predicted_price)}
      </p>
      <p className="text-sm text-charcoal mt-1">
        {formatPricePerSqft(prediction.predicted_price_per_sqft)}
      </p>

      <hr className="my-5 border-navy/10" />

      <p className="text-sm font-medium text-navy mb-4">What's driving this estimate</p>
      <div className="flex flex-col gap-3">
        {insight.top_factors.map((factor) => (
          <FactorBar key={factor.label} factor={factor} maxMagnitude={maxMagnitude} />
        ))}
      </div>

      <p className="text-sm text-charcoal mt-5 leading-relaxed">{insight.insight}</p>

      {isGlobalFallback && (
        <p className="text-xs text-charcoal/70 mt-3 italic">
          Not enough listings for this exact locality + BHK combination &mdash; showing
          general market factors instead of ones specific to this scenario.
        </p>
      )}

      <p className="text-xs text-charcoal/60 mt-4">
        Based on {insight.sample_size.toLocaleString('en-IN')} comparable listings. Estimate, not a valuation.
      </p>
    </div>
  );
}