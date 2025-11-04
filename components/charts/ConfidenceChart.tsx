import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface ConfidenceChartProps {
  data: {
    high_confidence: { count: number; hit_rate: number };
    medium_confidence: { count: number; hit_rate: number };
    low_confidence: { count: number; hit_rate: number };
  };
  title?: string;
}

const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

export const ConfidenceChart: React.FC<ConfidenceChartProps> = ({ data, title = 'Forecasts by Confidence Level' }) => {
  const chartData = [
    { name: 'High Confidence (≥70%)', value: data.high_confidence.count, hitRate: data.high_confidence.hit_rate },
    { name: 'Medium Confidence (50-69%)', value: data.medium_confidence.count, hitRate: data.medium_confidence.hit_rate },
    { name: 'Low Confidence (<50%)', value: data.low_confidence.count, hitRate: data.low_confidence.hit_rate },
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
        {chartData.map((item, index) => (
          <div key={index} className="text-center">
            <div className="font-semibold">{item.name}</div>
            <div className="text-gray-600">Hit Rate: {item.hitRate.toFixed(1)}%</div>
          </div>
        ))}
      </div>
    </div>
  );
};

