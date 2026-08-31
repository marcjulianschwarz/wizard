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

// Tooltip payload shape we care about (recharts types this loosely). Each entry
// carries the point's original datum, which holds the real round number in
// `name` — recharts' own `label` is the data array index (0-based), which would
// read as "Runde 0" for the first point.
interface TooltipEntry {
  value: number;
  payload?: { name: number };
}

// A single, labelled tooltip: "Runde: N" over "Punkte: V". Replaces the default
// recharts tooltip, which printed the bare round number and repeated the value
// once per series (the Area and Line share `dataKey="value"`).
function ChartTooltip(props: {
  active?: boolean;
  payload?: TooltipEntry[];
}) {
  const { active, payload } = props;
  if (!active || !payload || payload.length === 0) return null;
  const round = payload[0].payload?.name;
  // Index 0 is the pre-game anchor (0 points), so label it "Start" rather than
  // "Runde 0".
  const roundLabel = round === 0 ? "Start" : `Runde ${round}`;
  return (
    <div className="rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm">
      <div className="text-neutral-400">
        <span className="font-semibold text-white">{roundLabel}</span>
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
  // pre-game start (0 points). Keep it as an anchor so the line always spans
  // from the game start to the latest round — otherwise round 1 has a single
  // point and draws no line. `name` carries the real round number (0 = Start),
  // which the tooltip labels correctly.
  const data = numbers.map((value, index) => ({ name: index, value }));
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
