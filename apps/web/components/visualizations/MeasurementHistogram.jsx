'use client'

import { useMemo } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { BarChart3, Loader2 } from 'lucide-react'
import { useChartColors } from './useChartColors'


export default function MeasurementHistogram({
  data,
  loading = false,
}) {
  const C = useChartColors()

  const totalShots = useMemo(() => {
    const counts = data?.counts || {}

    return Object.values(counts).reduce(
      (total, count) => total + count,
      0
    )
  }, [data])

  const chartData = useMemo(() => {
    const counts = data?.counts || {}

    if (Object.keys(counts).length > 0) {
      return Object.entries(counts)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([bitstring, count]) => ({
          bitstring,
          count,
          probability: totalShots > 0 ? count / totalShots : 0,
        }))
    }

    const probabilities = data?.probabilities || {}

    if (Object.keys(probabilities).length > 0) {
      return Object.entries(probabilities)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([bitstring, probability]) => ({
          bitstring,
          count: null,
          probability,
        }))
    }

    return []
  }, [data, totalShots])

  const hasData = chartData.length > 0

  return (
    <div className="flex h-full flex-col bg-white dark:bg-[#111111]">
      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-4 border-b border-zinc-200 pb-4 dark:border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />

            <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-100">
              Measurement Outcomes
            </h3>
          </div>

          <p className="mt-1 font-mono text-[9px] uppercase tracking-[0.12em] text-zinc-400">
            {hasData
              ? totalShots > 0
                ? `${totalShots.toLocaleString()} shots · ${chartData.length} observed states`
                : `State probabilities · ${chartData.length} basis states`
              : 'Run simulation to inspect measurement probabilities'}
          </p>
        </div>

        {hasData && (
          <span className="shrink-0 font-mono text-[9px] font-semibold uppercase tracking-[0.12em] text-blue-600 dark:text-blue-400">
            {totalShots > 0 ? `${totalShots} Shots` : 'Statevector'}
          </span>
        )}
      </div>

      {/* Chart */}
      <div className="relative flex min-h-[280px] flex-1 items-center justify-center">
        {loading && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/85 backdrop-blur-sm dark:bg-zinc-900/85">
            <Loader2 className="mb-3 h-5 w-5 animate-spin text-blue-600 dark:text-blue-400" />

            <span className="font-mono text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400">
              Simulating circuit
            </span>
          </div>
        )}

        {!hasData && !loading ? (
          <div className="flex h-full min-h-[260px] w-full flex-col items-center justify-center border border-dashed border-zinc-200 dark:border-zinc-800">
            <BarChart3 className="mb-3 h-5 w-5 text-zinc-300" />

            <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              No simulation results
            </p>

            <p className="mt-1 max-w-xs text-center text-xs leading-5 text-zinc-400">
              Add quantum gates to the circuit and run the simulation
              to inspect the output distribution.
            </p>
          </div>
        ) : (
          <div className="h-65 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 12,
                  right: 12,
                  left: -18,
                  bottom: 18,
                }}
              >
                <CartesianGrid
                  strokeDasharray="2 4"
                  stroke={C.border}
                  vertical={false}
                />

                <XAxis
                  dataKey="bitstring"
                  tick={{
                    fill: C.textMid,
                    fontFamily: 'ui-monospace, monospace',
                    fontSize: 11,
                  }}
                  axisLine={{
                    stroke: C.axis,
                  }}
                  tickLine={false}
                />

                <YAxis
                  tickFormatter={(value) =>
                    `${(value * 100).toFixed(0)}%`
                  }
                  tick={{
                    fill: C.textDim,
                    fontFamily: 'ui-monospace, monospace',
                    fontSize: 10,
                  }}
                  axisLine={false}
                  tickLine={false}
                  domain={[0, 1]}
                />

                <Tooltip
                  cursor={{
                    fill: C.cursorSoft,
                  }}
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) {
                      return null
                    }

                    const item = payload[0].payload

                    return (
                      <div className="border border-zinc-200 bg-white px-3 py-2.5 shadow-lg dark:border-zinc-800 dark:bg-[#111111]">
                        <p className="font-mono text-xs font-semibold text-blue-600 dark:text-blue-400">
                          |{item.bitstring}⟩
                        </p>

                        <div className="mt-1.5 flex items-baseline gap-2">
                          <span className="text-[11px] text-zinc-500 dark:text-zinc-400">
                            Probability
                          </span>

                          <span className="font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                            {(item.probability * 100).toFixed(2)}%
                          </span>
                        </div>

                        {item.count !== null && (
                          <p className="mt-0.5 font-mono text-[10px] text-zinc-400">
                            {item.count} shots
                          </p>
                        )}
                      </div>
                    )
                  }}
                />

                <Bar
                  dataKey="probability"
                  fill={C.accent}
                  radius={[2, 2, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* State readout */}
      {hasData && (
        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          {chartData.map((item) => (
            <div
              key={item.bitstring}
              className="flex items-center gap-2"
            >
              <span className="font-mono text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                |{item.bitstring}⟩
              </span>

              <span className="font-mono text-[10px] text-zinc-400">
                {(item.probability * 100).toFixed(1)}%
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}