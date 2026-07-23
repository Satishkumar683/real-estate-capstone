'use client';

const COLORS = ['#B8935A', '#4A3B2C', '#8A9A8B', '#A0704D'];

export default function PriceBoxPlot({ data }) {
  if (!data || data.length === 0) return null;

  const width = 640;
  const height = 320;
  const padding = { top: 20, right: 20, bottom: 50, left: 50 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const globalMax = Math.max(...data.map((d) => d.max));
  const globalMin = Math.min(...data.map((d) => d.min));
  const range = globalMax - globalMin || 1;

  const y = (value) => padding.top + plotH - ((value - globalMin) / range) * plotH;
  const bandWidth = plotW / data.length;
  const boxWidth = Math.min(70, bandWidth * 0.5);

  return (
    <div className="overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" style={{ minWidth: 480 }}>
        {/* Y-axis gridlines + labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((t) => {
          const value = globalMin + t * range;
          const yPos = y(value);
          return (
            <g key={t}>
              <line x1={padding.left} x2={width - padding.right} y1={yPos} y2={yPos} stroke="#4A3B2C" strokeOpacity={0.08} />
              <text x={padding.left - 8} y={yPos} fontSize="11" fill="#6B5D4F" textAnchor="end" dominantBaseline="middle">
                {value.toFixed(1)}Cr
              </text>
            </g>
          );
        })}

        {data.map((d, i) => {
          const cx = padding.left + bandWidth * i + bandWidth / 2;
          const color = COLORS[i % COLORS.length];
          return (
            <g key={d.category}>
              {/* whiskers */}
              <line x1={cx} x2={cx} y1={y(d.min)} y2={y(d.q1)} stroke={color} strokeWidth={1.5} />
              <line x1={cx} x2={cx} y1={y(d.q3)} y2={y(d.max)} stroke={color} strokeWidth={1.5} />
              <line x1={cx - boxWidth / 4} x2={cx + boxWidth / 4} y1={y(d.min)} y2={y(d.min)} stroke={color} strokeWidth={1.5} />
              <line x1={cx - boxWidth / 4} x2={cx + boxWidth / 4} y1={y(d.max)} y2={y(d.max)} stroke={color} strokeWidth={1.5} />
              {/* box (Q1-Q3) */}
              <rect
                x={cx - boxWidth / 2}
                y={y(d.q3)}
                width={boxWidth}
                height={y(d.q1) - y(d.q3)}
                fill={color}
                fillOpacity={0.25}
                stroke={color}
                strokeWidth={1.5}
              />
              {/* median line */}
              <line x1={cx - boxWidth / 2} x2={cx + boxWidth / 2} y1={y(d.median)} y2={y(d.median)} stroke={color} strokeWidth={2} />
              {/* category label */}
              <text x={cx} y={height - padding.bottom + 20} fontSize="11" fill="#6B5D4F" textAnchor="middle">
                {d.category.length > 18 ? d.category.slice(0, 16) + '…' : d.category}
              </text>
              <text x={cx} y={height - padding.bottom + 34} fontSize="10" fill="#6B5D4F" textAnchor="middle" opacity={0.7}>
                n={d.count}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}