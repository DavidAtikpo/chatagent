"use client";

import type { EmbedMetricKey, EmbedTimeseriesPoint } from "@/lib/dashboard-data";

type ChartPoint = { label: string; value: number };

type Props = {
  points: EmbedTimeseriesPoint[];
  metric: EmbedMetricKey;
  metricLabel: string;
};

function toChartPoints(points: EmbedTimeseriesPoint[], metric: EmbedMetricKey): ChartPoint[] {
  return points.map((p) => ({ label: p.label, value: p[metric] }));
}

export function EmbedStatsChart({ points, metric, metricLabel }: Props) {
  const data = toChartPoints(points, metric);
  const max = Math.max(1, ...data.map((p) => p.value));
  const w = 640;
  const h = 200;
  const pad = { top: 16, right: 16, bottom: 32, left: 40 };
  const innerW = w - pad.left - pad.right;
  const innerH = h - pad.top - pad.bottom;

  const coords = data.map((p, i) => {
    const x = pad.left + (data.length <= 1 ? innerW / 2 : (i / (data.length - 1)) * innerW);
    const y = pad.top + innerH - (p.value / max) * innerH;
    return { x, y, ...p };
  });

  const linePath =
    coords.length > 0
      ? coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(" ")
      : "";

  const areaPath =
    coords.length > 0
      ? `${linePath} L${coords[coords.length - 1].x.toFixed(1)},${(pad.top + innerH).toFixed(1)} L${coords[0].x.toFixed(1)},${(pad.top + innerH).toFixed(1)} Z`
      : "";

  const yTicks = [0, Math.round(max / 2), max];

  return (
    <div className="mt-4 rounded-lg border border-slate-100 bg-slate-50/80 p-3">
      <p className="mb-2 text-xs font-medium text-slate-600">{metricLabel}</p>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="h-auto w-full max-h-[220px]"
        role="img"
        aria-label={`Courbe ${metricLabel}`}
      >
        <defs>
          <linearGradient id="embedChartFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#2563eb" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {yTicks.map((tick) => {
          const y = pad.top + innerH - (tick / max) * innerH;
          return (
            <g key={tick}>
              <line
                x1={pad.left}
                y1={y}
                x2={w - pad.right}
                y2={y}
                stroke="#e2e8f0"
                strokeWidth="1"
              />
              <text x={pad.left - 6} y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8">
                {tick}
              </text>
            </g>
          );
        })}

        {areaPath && <path d={areaPath} fill="url(#embedChartFill)" />}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke="#2563eb"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {coords.map((c, i) => (
          <g key={i}>
            <circle cx={c.x} cy={c.y} r="3.5" fill="#2563eb" stroke="#fff" strokeWidth="1.5" />
            {(data.length <= 12 || i % Math.ceil(data.length / 8) === 0 || i === data.length - 1) && (
              <text
                x={c.x}
                y={h - 8}
                textAnchor="middle"
                fontSize="9"
                fill="#64748b"
              >
                {c.label}
              </text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}
