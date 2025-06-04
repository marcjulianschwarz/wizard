import React from "react";
import {
  LineChart,
  Line,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  YAxis,
} from "recharts";

interface SimpleLineChartProps {
  numbers: number[];
  globalMin: number;
  globalMax: number;
}

const SimpleLineChart: React.FC<SimpleLineChartProps> = ({
  numbers,
  globalMin,
  globalMax,
}) => {
  const data = numbers.map((value, index) => ({ name: index + 1, value }));

  return (
    <ResponsiveContainer height={300}>
      <LineChart data={data}>
        <CartesianGrid />
        <YAxis domain={[globalMin, globalMax]} hide={true}/>
        <Tooltip />
        <Line type="monotone" dataKey="value" stroke="#8884d8" />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default SimpleLineChart;
