import React from "react";
import {
  Bar,
  Tooltip,
  ResponsiveContainer,
  XAxis,
  YAxis,
  BarChart,
} from "recharts";

interface SimpleBarChartProps {
  numbers: number[];
  labels: string[];
}

const SimpleBarChart: React.FC<SimpleBarChartProps> = ({ numbers, labels }) => {
  const data = numbers.map((value, index) => ({ name: labels[index], value }));

  return (
    <ResponsiveContainer width="80%" height={300}>
      <BarChart data={data}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar
          dataKey="value"
          fill="#8884d8"
          activeBar={false} // This disables the hover effect
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

export default SimpleBarChart;
