import React from "react";
import {
  Line,
  Area,
  ComposedChart,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  YAxis,
} from "recharts";

interface SimpleLineChartProps {
  numbers: number[];
  globalMin: number;
  globalMax: number;
  color?: string;
  height?: number;
}

// Tooltip payload shape we care about (recharts types this loosely).
interface TooltipEntry {
  value: number;
}

// A single, labelled tooltip: "Runde: N" over "Punkte: V". Replaces the default
// recharts tooltip, which printed the bare round number and repeated the value
// once per series (the Area and Line share `dataKey="value"`).
function ChartTooltip(props: {
  active?: boolean;
  label?: number | string;
  payload?: TooltipEntry[];
}) {
  const { active, label, payload } = props;
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm">
      <div className="text-neutral-400">
        Runde: <span className="font-semibold text-white">{label}</span>
      </div>
      <div className="text-neutral-400">
        Punkte:{" "}
        <span className="font-semibold text-white tabular-nums">
          {payload[0].value}
        </span>
      </div>
    </div>
  );
}

const SimpleLineChart: React.FC<SimpleLineChartProps> = ({
  numbers,
  globalMin,
  globalMax,
  color = "#8884d8",
  height = 300,
}) => {
  // `numbers[i]` is the cumulative total after round `i`, so index 0 is the
  // pre-game start (0 points). Drop it and label by the real round number so the
  // x-axis starts at Runde 1 rather than a "Runde 0 = 0" point.
  const data = numbers
    .map((value, index) => ({ name: index, value }))
    .slice(1);
  const gradientId = React.useId();

  // Pad the domain so the lowest/highest points don't hug the plot edges (the
  // dip was bottoming out flush against the card). 12% of the range, or a
  // sensible minimum when the range is tiny/flat.
  const pad = Math.max((globalMax - globalMin) * 0.12, 5);

  return (
    <ResponsiveContainer height={height}>
      {/* Bottom (and small top) margin so the line/area never runs flush
          against the card's edge. */}
      <ComposedChart data={data} margin={{ top: 8, bottom: 12, left: 0, right: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#ffffff10" vertical={false} />
        <YAxis domain={[globalMin - pad, globalMax + pad]} hide={true} />
        <Tooltip
          content={<ChartTooltip />}
          cursor={{ stroke: color, strokeOpacity: 0.3 }}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke="none"
          fill={`url(#${gradientId})`}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={2.5}
          dot={false}
          activeDot={{ r: 5, fill: color }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
};

export default SimpleLineChart;
