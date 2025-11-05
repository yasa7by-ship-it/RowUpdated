import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ErrorDistributionChartProps {
  data: Array<{
    bucket: string;
    count: number;
    hit_rate?: number;
    avg_pct_error?: number;
  }>;
  title?: string;
}

export const ErrorDistributionChart: React.FC<ErrorDistributionChartProps> = ({ 
  data, 
  title = 'Error Distribution' 
}) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="bucket" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="count" fill="#4338ca" name="Forecast Count" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};



