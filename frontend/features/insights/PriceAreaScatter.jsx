'use client';

import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function PriceAreaScatter({ data }) {
  if (!data || data.length === 0) return null;

  return (
    <ResponsiveContainer width="100%" height={320}>
      <ScatterChart margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
        <CartesianGrid stroke="#4A3B2C" strokeOpacity={0.08} />
        <XAxis
          type="number"
          dataKey="area_sqft"
          name="Area"
          unit=" sqft"
          tick={{ fontSize: 11, fill: '#6B5D4F' }}
          stroke="#6B5D4F"
        />
        <YAxis
          type="number"
          dataKey="price_cr"
          name="Price"
          unit=" Cr"
          tick={{ fontSize: 11, fill: '#6B5D4F' }}
          stroke="#6B5D4F"
        />
        <Tooltip
          cursor={{ strokeDasharray: '3 3' }}
          formatter={(value, name) => [name === 'Price' ? `₹${value} Cr` : `${value} sqft`, name]}
          contentStyle={{ borderRadius: 8, borderColor: '#E3CBA0', fontSize: 12 }}
        />
        <Scatter data={data} fill="#B8935A" fillOpacity={0.6} />
      </ScatterChart>
    </ResponsiveContainer>
  );
}