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
}

const SimpleLineChart: React.FC<SimpleLineChartProps> = ({
  numbers,
  globalMin,
  globalMax,
  color = "#8884d8",
}) => {
  const data = numbers.map((value, index) => ({ name: index + 1, value }));
  const gradientId = React.useId();

  return (
    <ResponsiveContainer height={300}>
      <ComposedChart data={data}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#ffffff10" vertical={false} />
        <YAxis domain={[globalMin, globalMax]} hide={true} />
        <Tooltip
          contentStyle={{
            background: "#171717",
            border: "1px solid #404040",
            borderRadius: 8,
            color: "white",
          }}
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
