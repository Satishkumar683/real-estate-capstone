export function formatINR(amount) {
  if (amount == null || Number.isNaN(amount)) return '—';
  if (amount >= 1e7) return `₹${(amount / 1e7).toFixed(2)} Cr`;
  if (amount >= 1e5) return `₹${(amount / 1e5).toFixed(1)} L`;
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
}

export function formatArea(sqft) {
  if (sqft == null) return '—';
  return `${Math.round(sqft).toLocaleString('en-IN')} sqft`;
}

export function formatPricePerSqft(amount) {
  if (amount == null || Number.isNaN(amount)) return '—';
  return `₹${Math.round(amount).toLocaleString('en-IN')}/sqft`;
}

/**
 * Turns recommend_properties()'s VALUE_SCORE ((predicted - actual) / predicted)
 * into a badge label + tone. Positive score = underpriced vs. the model.
 * The 3% band is deliberate -- smaller differences are within the model's own
 * error margin (MAPE ~11%), so calling them "above" or "below" would overstate
 * the model's precision.
 */
export function getValueBadge(valueScore) {
  if (valueScore == null || Number.isNaN(valueScore)) {
    return { label: 'NO ESTIMATE', tone: 'neutral' };
  }
  const pct = Math.round(valueScore * 100);
  if (pct >= 3) return { label: `${pct}% BELOW ESTIMATE`, tone: 'good' };
  if (pct <= -3) return { label: `${Math.abs(pct)}% ABOVE ESTIMATE`, tone: 'bad' };
  return { label: 'AT MARKET VALUE', tone: 'neutral' };
}