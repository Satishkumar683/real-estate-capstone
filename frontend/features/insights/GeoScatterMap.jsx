'use client';

import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const TIER_COLORS = {
  Budget: '#8A9A8B',
  Mid: '#B8935A',
  Premium: '#A0704D',
  Luxury: '#4A3B2C',
};

function bucketByPrice(points) {
  const prices = points.map((p) => p.price_cr).sort((a, b) => a - b);
  const q1 = prices[Math.floor(prices.length * 0.25)];
  const q2 = prices[Math.floor(prices.length * 0.5)];
  const q3 = prices[Math.floor(prices.length * 0.75)];

  const tiers = { Budget: [], Mid: [], Premium: [], Luxury: [] };
  for (const p of points) {
    if (p.price_cr <= q1) tiers.Budget.push(p);
    else if (p.price_cr <= q2) tiers.Mid.push(p);
    else if (p.price_cr <= q3) tiers.Premium.push(p);
    else tiers.Luxury.push(p);
  }
  return tiers;
}

export default function GeoScatterMap({ data }) {
  if (!data || data.length === 0) return null;
  const tiers = bucketByPrice(data);

  return (
    <ResponsiveContainer width="100%" height={360}>
      <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
        <CartesianGrid stroke="#4A3B2C" strokeOpacity={0.08} />
        <XAxis type="number" dataKey="lng" name="Longitude" tick={{ fontSize: 11, fill: '#6B5D4F' }} stroke="#6B5D4F" />
        <YAxis type="number" dataKey="lat" name="Latitude" tick={{ fontSize: 11, fill: '#6B5D4F' }} stroke="#6B5D4F" />
        <Tooltip
          cursor={{ strokeDasharray: '3 3' }}
          formatter={(value, name) => [name === 'price_cr' ? `₹${value} Cr` : value, name]}
          contentStyle={{ borderRadius: 8, borderColor: '#E3CBA0', fontSize: 12 }}
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        {Object.entries(tiers).map(([tier, points]) => (
          <Scatter key={tier} name={tier} data={points} fill={TIER_COLORS[tier]} fillOpacity={0.7} />
        ))}
      </ScatterChart>
    </ResponsiveContainer>
  );
}