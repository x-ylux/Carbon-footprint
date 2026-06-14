import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';

interface TrendChartProps {
  data: Array<{ name: string; emissions: number }>;
}

const CustomTooltip = ({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value?: number | string }>;
  label?: string | number;
}): React.ReactElement | null => {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="rounded-2xl bg-slate-950/95 border border-slate-800 p-3 shadow-xl text-white">
      <p className="text-xs uppercase tracking-wider text-slate-400 mb-1">{label}</p>
      <div className="text-sm font-semibold">{payload[0].value} kg CO2e</div>
    </div>
  );
};

export const TrendChart: React.FC<TrendChartProps> = ({ data }) => {
  return (
    <div className="h-64 sm:h-80 w-full text-xs">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#e2e8f0"
            className="dark:stroke-slate-800"
          />
          <XAxis dataKey="name" stroke="#94a3b8" />
          <YAxis stroke="#94a3b8" />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="emissions"
            stroke="#52b788"
            strokeWidth={3}
            dot={{ r: 5, strokeWidth: 2, stroke: '#52b788', fill: '#fff' }}
            activeDot={{ r: 7 }}
            name="Emissions (kg CO2e)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TrendChart;
