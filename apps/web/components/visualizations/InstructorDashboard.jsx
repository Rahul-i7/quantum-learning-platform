'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
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
import { Loader2, ArrowLeft, CheckCircle2, CircleDashed, CircleDotDashed, Wifi, WifiOff } from 'lucide-react';
import { contentApi } from '@/lib/api-client/content';

// Learn page ke look ke hisaab se colors (zinc + blue-600 accent).
// Recharts ko hex values chahiye, isliye yahan local rakhe hain.
const COLORS = {
  accent: '#2563eb',   // blue-600
  accent2: '#059669',  // emerald-600
  textDim: '#71717a',  // zinc-500
  textBright: '#18181b', // zinc-900
  border: '#e4e4e7',   // zinc-200
  grid: '#f4f4f5',     // zinc-100
  panel: '#ffffff',
};

// Matches supabase/seed.sql's demo cohort (see db/memory_store.py::DEMO_COHORT_ID
// on the content-progress service when Supabase isn't configured yet).
const LIVE_COHORT_ID = '00000000-0000-0000-0000-0000000000c1';

const SIMULATED_DELAY_MS = 400;

const MODULES = ['Qubits & Superposition', 'Entanglement', 'Quantum Gates', "Grover's Algorithm"];

function buildCohort(cohortName, seedOffset) {
  const names = [
    'Aditi R.', 'Rohan K.', 'Meera S.', 'Yusuf A.', 'Priya N.',
    'Kabir T.', 'Ishaan D.', 'Fatima Z.',
  ];
  return {
    cohortName,
    modules: MODULES,
    students: names.map((name, i) => {
      const base = 45 + ((i * 13 + seedOffset * 7) % 50);
      const moduleProgress = MODULES.map((_, m) =>
        Math.max(10, Math.min(100, base + ((i + m) * 9 + seedOffset * 5) % 30 - 15))
      );
      const completionPct = Math.round(moduleProgress.reduce((a, b) => a + b, 0) / moduleProgress.length);
      return {
        id: `s${seedOffset}-${i}`,
        name,
        completionPct,
        moduleProgress,
        quizzes: [
          { name: 'Quiz 1: Qubits', score: Math.min(10, Math.max(2, Math.round(base / 12))), max: 10 },
          { name: 'Quiz 2: Gates', score: Math.min(10, Math.max(1, Math.round((base - 10) / 12))), max: 10 },
        ],
        challenges: [
          { name: 'Build a Bell state circuit', status: completionPct > 55 ? 'completed' : 'in_progress' },
          { name: 'Grover search (2-qubit)', status: completionPct > 80 ? 'completed' : completionPct > 40 ? 'in_progress' : 'not_started' },
        ],
        lastActive: `${1 + ((i + seedOffset) % 6)} days ago`,
      };
    }),
  };
}

const PRESETS = [
  { label: 'Section A — Week 6', data: buildCohort('Section A', 0) },
  { label: 'Section B — Week 6', data: buildCohort('Section B', 1) },
];



function statusMeta(status) {
  if (status === 'completed') return { icon: CheckCircle2, color: COLORS.accent, label: 'Completed' };
  if (status === 'in_progress') return { icon: CircleDotDashed, color: COLORS.accent2, label: 'In progress' };
  return { icon: CircleDashed, color: COLORS.textDim, label: 'Not started' };
}

export default function InstructorDashboard() {
  const [activePreset, setActivePreset] = useState('');
  const [cohort, setCohort] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [status, setStatus] = useState('empty');
  const [liveError, setLiveError] = useState('');
  const delayRef = useRef(null);

  useEffect(() => {
    // Auto-load first preset for now since backend is not connected
    if (status === 'empty' && PRESETS.length > 0) {
      applyPreset(PRESETS[0]);
    }
    return () => {
      if (delayRef.current) clearTimeout(delayRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runWithDelay = (fn) => {
    setStatus('loading');
    if (delayRef.current) clearTimeout(delayRef.current);
    delayRef.current = setTimeout(() => {
      fn();
      setStatus('ready');
    }, SIMULATED_DELAY_MS);
  };

  const applyPreset = (preset) => {
    setActivePreset(preset.label);
    setLiveError('');
    setSelectedId(null);
    runWithDelay(() => setCohort(preset.data));
  };

  const loadLiveCohort = async () => {
    setActivePreset('Live — Content Service');
    setLiveError('');
    setSelectedId(null);
    setStatus('loading');
    try {
      const data = await contentApi.getCohortSummary(LIVE_COHORT_ID);
      setCohort(data);
      setStatus('ready');
    } catch (err) {
      // content-progress service isn't running / not configured yet — fall
      // back to the first demo preset rather than leaving the dashboard blank.
      console.error('Live cohort fetch failed, falling back to demo data:', err);
      setLiveError('Could not reach the content service — showing demo data instead.');
      applyPreset(PRESETS[0]);
    }
  };



  const studentChartData = useMemo(() => {
    if (!cohort) return [];
    return [...cohort.students]
      .sort((a, b) => a.completionPct - b.completionPct)
      .map((s) => ({ ...s, shortName: s.name.split(' ')[0] }));
  }, [cohort]);

  const moduleChartData = useMemo(() => {
    if (!cohort) return [];
    return cohort.modules.map((name, i) => {
      const avg =
        cohort.students.reduce((sum, s) => sum + (s.moduleProgress[i] || 0), 0) / cohort.students.length;
      return { module: name, avgCompletion: Math.round(avg) };
    });
  }, [cohort]);

  const cohortStats = useMemo(() => {
    if (!cohort) return null;
    const avgCompletion = Math.round(
      cohort.students.reduce((s, st) => s + st.completionPct, 0) / cohort.students.length
    );
    const allQuizPct = cohort.students.flatMap((s) => s.quizzes.map((q) => q.score / q.max));
    const avgQuiz = Math.round((allQuizPct.reduce((a, b) => a + b, 0) / allQuizPct.length) * 100);
    const sorted = [...cohort.students].sort((a, b) => b.completionPct - a.completionPct);
    return {
      avgCompletion,
      avgQuiz,
      count: cohort.students.length,
      top: sorted[0],
      bottom: sorted[sorted.length - 1],
    };
  }, [cohort]);

  const selectedStudent = useMemo(
    () => (cohort ? cohort.students.find((s) => s.id === selectedId) : null),
    [cohort, selectedId]
  );

  const isEmpty = status === 'empty';
  const isLoading = status === 'loading';

  return (
    <div className="w-full">
      {/* Hero / page header (Learn page style) */}
      <section className="relative overflow-hidden border-b border-zinc-200">
        <div className="pointer-events-none absolute inset-0 opacity-40">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(to right, #e4e4e7 1px, transparent 1px),
                linear-gradient(to bottom, #e4e4e7 1px, transparent 1px)
              `,
              backgroundSize: '64px 64px',
            }}
          />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 py-16 lg:px-8 lg:py-20">
          <div className="mb-6 flex items-center gap-3">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-blue-600">
              Dashboard / Instructor
            </span>
            <span className="h-px w-12 bg-zinc-300" />
          </div>

          <h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.04em] text-zinc-950 sm:text-6xl">
            Track your cohort
            <br />
            <span className="text-zinc-400">at a glance.</span>
          </h1>

          <p className="mt-7 max-w-xl text-base leading-7 text-zinc-500">
            Monitor completion, quiz scores, and challenge progress across
            every class section — and spot who needs attention.
          </p>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-8 px-4 py-8 lg:flex-row lg:px-8">
        {/* Main charts area */}
        <div className="flex min-w-0 flex-1 flex-col gap-6">
          <div className="border-b border-zinc-200 pb-6">
            <div className="mb-3 flex items-center gap-3">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-blue-600">
                Cohort
              </span>
              <span className="h-px w-8 bg-zinc-300" />
              <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-zinc-400">
                {isEmpty ? 'No cohort loaded yet' : `${cohortStats?.count ?? 0} students`}
              </span>
            </div>
            <h2 className="text-3xl font-semibold tracking-[-0.035em] text-zinc-950">
              {cohort ? cohort.cohortName : 'Instructor dashboard'}
            </h2>
          </div>

          {isEmpty && !isLoading && (
            <div className="border border-zinc-200 bg-white px-5 py-8 text-center">
              <p className="text-sm text-zinc-500">
                Choose a class section to load cohort progress
              </p>
            </div>
          )}

          {isLoading && (
            <div className="flex items-center gap-2 self-start border border-zinc-200 bg-white px-4 py-3">
              <Loader2 size={15} className="animate-spin text-blue-600" />
              <span className="font-mono text-[11px] uppercase tracking-wider text-zinc-500">
                Loading cohort data…
              </span>
            </div>
          )}

          {status === 'ready' && cohort && (
            <>
              {/* Summary chips */}
              <div className="flex flex-wrap gap-3">
                <StatChip label="Avg. completion" value={`${cohortStats.avgCompletion}%`} />
                <StatChip label="Avg. quiz score" value={`${cohortStats.avgQuiz}%`} />
                <StatChip label="Top performer" value={cohortStats.top.name} accent />
                <StatChip label="Needs attention" value={cohortStats.bottom.name} accent2 />
              </div>

              {/* Per-student completion chart */}
              <div className="border border-zinc-200 bg-white p-5">
                <div className="text-sm font-semibold text-zinc-950">Completion by student</div>
                <div className="mb-3 mt-1 font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                  Sorted lowest to highest — click a bar for detail
                </div>
                <div style={{ width: '100%', height: 260 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={studentChartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} vertical={false} />
                      <XAxis
                        dataKey="shortName"
                        tick={{ fill: COLORS.textDim, fontSize: 11 }}
                        axisLine={{ stroke: COLORS.border }}
                        tickLine={false}
                      />
                      <YAxis
                        tickFormatter={(v) => `${v}%`}
                        tick={{ fill: COLORS.textDim, fontSize: 11 }}
                        axisLine={{ stroke: COLORS.border }}
                        tickLine={false}
                        domain={[0, 100]}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(37, 99, 235, 0.06)' }}
                        contentStyle={{
                          background: COLORS.panel,
                          border: `1px solid ${COLORS.border}`,
                          borderRadius: 0,
                          fontFamily: 'ui-monospace, monospace',
                          fontSize: 12,
                        }}
                        labelStyle={{ color: COLORS.textBright }}
                        itemStyle={{ color: COLORS.textBright }}
                        formatter={(value) => [`${value}%`, 'completion']}
                      />
                      <Bar
                        dataKey="completionPct"
                        radius={0}
                        maxBarSize={36}
                        onClick={(data) => setSelectedId(data.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        {studentChartData.map((s) => (
                          <Cell
                            key={s.id}
                            fill={s.id === selectedId ? '#18181b' : COLORS.accent}
                            opacity={selectedId && s.id !== selectedId ? 0.35 : 1}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Module completion chart */}
              <div className="border border-zinc-200 bg-white p-5">
                <div className="text-sm font-semibold text-zinc-950">Average completion by module</div>
                <div className="mb-3 mt-1 font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                  Where the whole cohort is spending the most time
                </div>
                <div style={{ width: '100%', height: Math.max(160, moduleChartData.length * 44 + 40) }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={moduleChartData}
                      layout="vertical"
                      margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke={COLORS.grid} horizontal={false} />
                      <XAxis
                        type="number"
                        domain={[0, 100]}
                        tickFormatter={(v) => `${v}%`}
                        tick={{ fill: COLORS.textDim, fontSize: 11 }}
                        axisLine={{ stroke: COLORS.border }}
                        tickLine={false}
                      />
                      <YAxis
                        type="category"
                        dataKey="module"
                        width={170}
                        tick={{ fill: COLORS.textDim, fontSize: 11 }}
                        axisLine={{ stroke: COLORS.border }}
                        tickLine={false}
                      />
                      <Tooltip
                        cursor={{ fill: 'rgba(37, 99, 235, 0.06)' }}
                        contentStyle={{
                          background: COLORS.panel,
                          border: `1px solid ${COLORS.border}`,
                          borderRadius: 0,
                          fontFamily: 'ui-monospace, monospace',
                          fontSize: 12,
                        }}
                        labelStyle={{ color: COLORS.textBright }}
                        itemStyle={{ color: COLORS.textBright }}
                        formatter={(value) => [`${value}%`, 'avg. completion']}
                      />
                      <Bar dataKey="avgCompletion" radius={0} fill={COLORS.accent} barSize={8} background={{ fill: '#f4f4f5' }} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Sidebar: cohort overview or student detail */}
        <aside className="w-full shrink-0 lg:w-80">
          <div className="flex flex-col gap-7 lg:sticky lg:top-24">
            <div>
              <div className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                Class sections
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={loadLiveCohort}
                  className={`flex items-center gap-2 border px-3 py-3 text-left text-xs font-medium transition-all sm:py-2.5 ${
                    activePreset === 'Live — Content Service'
                      ? 'border-blue-600 bg-white text-zinc-950'
                      : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:text-zinc-900'
                  }`}
                >
                  {activePreset === 'Live — Content Service' && !liveError ? (
                    <Wifi size={13} className="text-blue-600" />
                  ) : (
                    <WifiOff size={13} className="text-zinc-400" />
                  )}
                  Live — Content Service
                </button>
                {PRESETS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => applyPreset(p)}
                    className={`border px-3 py-3 text-left text-xs font-medium transition-all sm:py-2.5 ${
                      activePreset === p.label
                        ? 'border-blue-600 bg-white text-zinc-950'
                        : 'border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300 hover:text-zinc-900'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              {liveError && (
                <p className="mt-2 text-[11px] text-zinc-500">{liveError}</p>
              )}
            </div>

            {status === 'ready' && selectedStudent && (
              <div className="border border-zinc-200 bg-white p-4">
                <button
                  onClick={() => setSelectedId(null)}
                  className="mb-4 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 transition-colors hover:text-zinc-900"
                >
                  <ArrowLeft size={13} />
                  Back to cohort overview
                </button>

                <div className="text-base font-semibold text-zinc-950">
                  {selectedStudent.name}
                </div>
                <div className="mt-1 font-mono text-[10px] uppercase tracking-wider text-zinc-400">
                  {selectedStudent.completionPct}% complete · active {selectedStudent.lastActive}
                </div>

                <div className="mb-2 mt-5 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
                  Module progress
                </div>
                <div className="flex flex-col gap-2.5">
                  {selectedStudent.moduleProgress.map((pct, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-24 text-[11px] text-zinc-700">{MODULES[i]}</div>
                      <div className="h-px flex-1 bg-zinc-200">
                        <div className="h-px bg-blue-600 transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="w-9 text-right font-mono text-[10px] text-zinc-400">
                        {pct}%
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mb-2 mt-5 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
                  Quiz scores
                </div>
                <div className="font-mono text-xs leading-7 text-zinc-900">
                  {selectedStudent.quizzes.map((q) => (
                    <div key={q.name}>
                      {q.name}: {q.score}/{q.max}
                    </div>
                  ))}
                </div>

                <div className="mb-2 mt-5 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
                  Coding challenges
                </div>
                <div className="flex flex-col gap-2">
                  {selectedStudent.challenges.map((c) => {
                    const meta = statusMeta(c.status);
                    const Icon = meta.icon;
                    return (
                      <div key={c.name} className="flex items-center gap-2">
                        <Icon size={14} style={{ color: meta.color, flexShrink: 0 }} />
                        <span className="text-xs text-zinc-700">{c.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {status === 'ready' && !selectedStudent && cohortStats && (
              <div className="border border-zinc-200 bg-white p-4">
                <div className="mb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-zinc-500">
                  Cohort overview
                </div>
                <div className="font-mono text-xs leading-8 text-zinc-900">
                  <div>Students: {cohortStats.count}</div>
                  <div>Avg. completion: {cohortStats.avgCompletion}%</div>
                  <div>Avg. quiz score: {cohortStats.avgQuiz}%</div>
                </div>
                <div className="mt-3 border-t border-zinc-100 pt-3 text-[11px] leading-5 text-zinc-500">
                  Click any bar in the chart to see that student's full breakdown.
                </div>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function StatChip({ label, value, accent, accent2 }) {
  const color = accent ? 'text-blue-600' : accent2 ? 'text-emerald-600' : 'text-zinc-900';
  return (
    <div className="flex-[1_1_160px] border border-zinc-200 bg-white px-4 py-3">
      <div className="font-mono text-[10px] uppercase tracking-wider text-zinc-400">{label}</div>
      <div className={`mt-1 font-mono text-base font-semibold ${color}`}>{value}</div>
    </div>
  );
}