'use client';

import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { BarChart3, Loader2 } from 'lucide-react';

export default function MeasurementHistogram({ data, loading = false }) {
  const totalShots = useMemo(() => {
    const counts = data?.counts || {}
    if (!counts) return 0;
    return Object.values(counts).reduce((a, b) => a + b, 0);
  }, [data]);

  const chartData = useMemo(() => {
    const counts = data?.counts || {}
    if (counts && Object.keys(counts).length > 0) {
      return Object.entries(counts)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([bitstring, count]) => ({
          bitstring,
          count,
          probability: totalShots > 0 ? count / totalShots : 0,
        }));
    }

    if (data?.probabilities && Object.keys(data.probabilities).length > 0) {
      return Object.entries(data.probabilities)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([bitstring, prob]) => ({
          bitstring,
          count: null,
          probability: prob,
        }));
    }

    return [];
  }, [data, totalShots]);

  const hasData = chartData.length > 0;

  return (
    <div className="flex flex-col h-full rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold text-gray-800">
            Measurement Outcomes
          </h3>
          <p className="text-xs text-gray-500">
            {hasData
              ? totalShots > 0
                ? `${totalShots.toLocaleString()} shots across ${chartData.length} observed states`
                : `State probabilities across ${chartData.length} basis states`
              : 'Run simulation to inspect measurement probabilities'}
          </p>
        </div>
        {hasData && (
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 border border-blue-200">
            {totalShots > 0 ? `${totalShots} Shots` : 'Statevector'}
          </span>
        )}
      </div>

      <div className="relative flex-1 min-h-[260px] flex items-center justify-center">
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/80 backdrop-blur-xs rounded-lg">
            <Loader2 className="h-6 w-6 animate-spin text-blue-600 mb-2" />
            <span className="text-xs font-medium text-gray-600">Simulating circuit...</span>
          </div>
        )}

        {!hasData && !loading ? (
          <div className="flex flex-col items-center justify-center text-center p-6 border border-dashed border-gray-200 rounded-lg w-full h-full bg-gray-50/50">
            <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <BarChart3 className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-gray-700">No simulation results</p>
            <p className="text-xs text-gray-400 mt-1 max-w-xs">
              Add quantum gates to the canvas and click "Run Simulation" to see the output distribution.
            </p>
          </div>
        ) : (
          <div className="w-full h-full min-h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="bitstring"
                  tick={{ fill: '#475569', fontFamily: 'ui-monospace, monospace', fontSize: 12 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                />
                <YAxis
                  tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                  tick={{ fill: '#64748b', fontSize: 11 }}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickLine={false}
                  domain={[0, 1]}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(37, 99, 235, 0.05)' }}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="rounded-lg border border-gray-200 bg-white p-2.5 shadow-md text-xs font-sans">
                          <p className="font-mono font-bold text-blue-600">|{data.bitstring}⟩</p>
                          <p className="text-gray-700 mt-1">
                            Probability: <span className="font-semibold font-mono">{(data.probability * 100).toFixed(2)}%</span>
                          </p>
                          {data.count !== null && (
                            <p className="text-gray-500 text-[11px]">
                              Count: {data.count} shots
                            </p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="probability" radius={[4, 4, 0, 0]} maxBarSize={48}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${entry.bitstring}`}
                      fill={index % 2 === 0 ? '#2563eb' : '#3b82f6'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {hasData && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-2">
          {chartData.map((item) => (
            <div
              key={item.bitstring}
              className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-gray-50 border border-gray-200 font-mono text-xs text-gray-700"
            >
              <span className="font-bold text-blue-600">|{item.bitstring}⟩</span>
              <span className="text-gray-500">{(item.probability * 100).toFixed(1)}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
