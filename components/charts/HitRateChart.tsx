import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface HitRateChartProps {
  data: Array<{
    forecast_date: string;
    total_forecasts: number;
    hit_count: number;
    hit_rate: number;
  }>;
  title?: string;
}

export const HitRateChart: React.FC<HitRateChartProps> = ({ data, title = 'Hit Rate Over Time' }) => {
  const chartData = data.map(item => ({
    date: new Date(item.forecast_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    hitRate: parseFloat(item.hit_rate.toFixed(2)),
    totalForecasts: item.total_forecasts,
    hitCount: item.hit_count,
  }));

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis domain={[0, 100]} />
          <Tooltip 
            formatter={(value: number) => [`${value}%`, 'Hit Rate']}
            labelFormatter={(label) => `Date: ${label}`}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="hitRate" 
            stroke="#4338ca" 
            strokeWidth={2}
            name="Hit Rate (%)"
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};




