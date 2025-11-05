import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface ForecastTrendChartProps {
  data: Array<{
    stock_symbol: string;
    stock_name?: string;
    total_forecasts: number;
    hit_rate: number;
    avg_pct_error: number;
  }>;
  title?: string;
  maxItems?: number;
}

export const ForecastTrendChart: React.FC<ForecastTrendChartProps> = ({ 
  data, 
  title = 'Forecast Performance by Stock',
  maxItems = 10
}) => {
  const sortedData = [...data]
    .sort((a, b) => b.hit_rate - a.hit_rate)
    .slice(0, maxItems);

  const chartData = sortedData.map(item => ({
    name: item.stock_name || item.stock_symbol,
    hitRate: parseFloat(item.hit_rate.toFixed(2)),
    avgError: parseFloat(item.avg_pct_error.toFixed(2)),
    totalForecasts: item.total_forecasts,
  }));

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">{title}</h3>
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />
          <Bar yAxisId="left" dataKey="hitRate" fill="#4338ca" name="Hit Rate (%)" />
          <Bar yAxisId="right" dataKey="avgError" fill="#ef4444" name="Avg Error (%)" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};



