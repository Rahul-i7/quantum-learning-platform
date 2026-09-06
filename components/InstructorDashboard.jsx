'use client';

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
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
import { Loader2, Info, ArrowLeft, CheckCircle2, CircleDashed, CircleDotDashed } from 'lucide-react';
import { COLORS, panelStyle, primaryButtonStyle, textareaStyle, presetButtonStyle } from './theme';

// ---------------------------------------------------------------------------
// Shared mock data shape — sync this with Role 5 (Backend/Data Lead), whose
// Supabase schema and progress-tracking APIs are the real source of this data:
//
//   {
//     cohortName: "Section A",
//     modules: ["Qubits & Superposition", "Entanglement", ...],
//     students: [
//       {
//         id, name, completionPct,
//         moduleProgress: [90, 85, 80, 70],   // % per module, same order as `modules`
//         quizzes: [{ name, score, max }],
//         challenges: [{ name, status: "completed" | "in_progress" | "not_started" }],
//         lastActive: "2 days ago"
//       }
//     ]
//   }
// ---------------------------------------------------------------------------

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

function parseCohortInput(text) {
  const data = JSON.parse(text);
  if (!data.students || !Array.isArray(data.students) || !data.modules) {
    throw new Error('missing students/modules');
  }
  return data;
}

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
  const [pasteText, setPasteText] = useState('');
  const [pasteError, setPasteError] = useState('');
  const delayRef = useRef(null);

  useEffect(() => {
    return () => {
      if (delayRef.current) clearTimeout(delayRef.current);
    };
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
    setPasteError('');
    setSelectedId(null);
    runWithDelay(() => setCohort(preset.data));
  };

  const handleParse = useCallback(() => {
    try {
      const parsed = parseCohortInput(pasteText);
      setPasteError('');
      setActivePreset('');
      setSelectedId(null);
      runWithDelay(() => setCohort(parsed));
    } catch (err) {
      setPasteError('Could not parse — expected {"modules":[...],"students":[...]}');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pasteText]);

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
    <div
      className="w-full h-full min-h-screen flex flex-col md:flex-row"
      style={{ background: COLORS.bg, fontFamily: 'system-ui, sans-serif' }}
    >
      {/* Main charts area */}
      <div className="flex-1 p-4 sm:p-6 flex flex-col gap-5">
        <div>
          <h2 style={{ color: COLORS.textBright, fontSize: '1.05rem', fontWeight: 600 }}>
            {cohort ? cohort.cohortName : 'Instructor dashboard'}
          </h2>
          <p style={{ color: COLORS.textDim, fontSize: '0.8rem', marginTop: 4 }}>
            {isEmpty ? 'No cohort loaded yet' : `${cohortStats?.count ?? 0} students`}
          </p>
        </div>

        {isEmpty && !isLoading && (
          <div
            style={{ border: `1px solid ${COLORS.border}`, background: 'rgba(15,26,46,0.4)', padding: '32px 20px', textAlign: 'center' }}
          >
            <p style={{ color: COLORS.textDim, fontSize: '0.85rem' }}>
              Choose a class section to load cohort progress
            </p>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center gap-2 px-4 py-3" style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, alignSelf: 'flex-start' }}>
            <Loader2 size={15} className="animate-spin" style={{ color: COLORS.accent }} />
            <span style={{ color: COLORS.textBright, fontSize: '0.8rem' }}>Loading cohort data…</span>
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
            <div style={{ border: `1px solid ${COLORS.border}`, background: 'rgba(15,26,46,0.4)', padding: 16 }}>
              <div style={{ color: COLORS.textBright, fontSize: '0.9rem', fontWeight: 600, marginBottom: 2 }}>
                Completion by student
              </div>
              <div style={{ color: COLORS.textDim, fontSize: '0.75rem', marginBottom: 10 }}>
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
                      cursor={{ fill: 'rgba(94, 234, 212, 0.06)' }}
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
                      radius={[2, 2, 0, 0]}
                      onClick={(data) => setSelectedId(data.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      {studentChartData.map((s) => (
                        <Cell
                          key={s.id}
                          fill={s.id === selectedId ? COLORS.accent2 : COLORS.accent}
                          opacity={selectedId && s.id !== selectedId ? 0.4 : 1}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Module completion chart */}
            <div style={{ border: `1px solid ${COLORS.border}`, background: 'rgba(15,26,46,0.4)', padding: 16 }}>
              <div style={{ color: COLORS.textBright, fontSize: '0.9rem', fontWeight: 600, marginBottom: 2 }}>
                Average completion by module
              </div>
              <div style={{ color: COLORS.textDim, fontSize: '0.75rem', marginBottom: 10 }}>
                Where the whole cohort is spending the most time
              </div>
              <div style={{ width: '100%', height: 200 }}>
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
                      width={150}
                      tick={{ fill: COLORS.textDim, fontSize: 11 }}
                      axisLine={{ stroke: COLORS.border }}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(94, 234, 212, 0.06)' }}
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
                    <Bar dataKey="avgCompletion" radius={[0, 2, 2, 0]} fill={COLORS.accent2} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Sidebar: cohort overview or student detail */}
      <div className="w-full md:w-96 flex flex-col gap-6 p-4 sm:p-6 md:overflow-y-auto" style={panelStyle}>
        <div>
          <div style={{ color: COLORS.textDim, fontSize: '0.75rem', marginBottom: 8 }}>
            Class sections
          </div>
          <div className="flex flex-col gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => applyPreset(p)}
                className="py-3 sm:py-2 px-3 text-sm text-left"
                style={presetButtonStyle(activePreset === p.label)}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {status === 'ready' && selectedStudent && (
          <div style={{ border: `1px solid ${COLORS.border}`, padding: 14 }}>
            <button
              onClick={() => setSelectedId(null)}
              className="flex items-center gap-1.5 mb-3"
              style={{ color: COLORS.textDim, fontSize: '0.75rem', background: 'transparent' }}
            >
              <ArrowLeft size={13} />
              Back to cohort overview
            </button>

            <div style={{ color: COLORS.textBright, fontSize: '0.95rem', fontWeight: 600 }}>
              {selectedStudent.name}
            </div>
            <div style={{ color: COLORS.textDim, fontSize: '0.75rem', marginTop: 2 }}>
              {selectedStudent.completionPct}% complete · active {selectedStudent.lastActive}
            </div>

            <div style={{ color: COLORS.textDim, fontSize: '0.72rem', margin: '14px 0 8px' }}>
              Module progress
            </div>
            <div className="flex flex-col gap-2">
              {selectedStudent.moduleProgress.map((pct, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div style={{ width: 100, color: COLORS.textBright, fontSize: '0.72rem' }}>
                    {MODULES[i]}
                  </div>
                  <div className="flex-1 h-2" style={{ background: COLORS.bg, border: `1px solid ${COLORS.border}` }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: COLORS.accent }} />
                  </div>
                  <div style={{ width: 32, textAlign: 'right', color: COLORS.textDim, fontSize: '0.7rem', fontFamily: 'ui-monospace, monospace' }}>
                    {pct}%
                  </div>
                </div>
              ))}
            </div>

            <div style={{ color: COLORS.textDim, fontSize: '0.72rem', margin: '14px 0 8px' }}>
              Quiz scores
            </div>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.78rem', color: COLORS.textBright, lineHeight: 1.7 }}>
              {selectedStudent.quizzes.map((q) => (
                <div key={q.name}>
                  {q.name}: {q.score}/{q.max}
                </div>
              ))}
            </div>

            <div style={{ color: COLORS.textDim, fontSize: '0.72rem', margin: '14px 0 8px' }}>
              Coding challenges
            </div>
            <div className="flex flex-col gap-2">
              {selectedStudent.challenges.map((c) => {
                const meta = statusMeta(c.status);
                const Icon = meta.icon;
                return (
                  <div key={c.name} className="flex items-center gap-2">
                    <Icon size={14} style={{ color: meta.color, flexShrink: 0 }} />
                    <span style={{ color: COLORS.textBright, fontSize: '0.78rem' }}>{c.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {status === 'ready' && !selectedStudent && cohortStats && (
          <div style={{ border: `1px solid ${COLORS.border}`, padding: 14 }}>
            <div style={{ color: COLORS.textDim, fontSize: '0.75rem', marginBottom: 8 }}>
              Cohort overview
            </div>
            <div style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.82rem', color: COLORS.textBright, lineHeight: 1.9 }}>
              <div>Students: {cohortStats.count}</div>
              <div>Avg. completion: {cohortStats.avgCompletion}%</div>
              <div>Avg. quiz score: {cohortStats.avgQuiz}%</div>
            </div>
            <div style={{ color: COLORS.textDim, fontSize: '0.72rem', marginTop: 12 }}>
              Click any bar in the chart to see that student's full breakdown.
            </div>
          </div>
        )}

        <div>
          <div style={{ color: COLORS.textDim, fontSize: '0.75rem', marginBottom: 8 }}>
            Preview a Progress Service response
          </div>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder='{"cohortName":"Section C","modules":[...],"students":[...]}'
            rows={4}
            className="w-full p-2 text-base sm:text-xs"
            style={textareaStyle}
          />
          <button onClick={handleParse} className="mt-2 w-full py-3 sm:py-2 text-sm" style={primaryButtonStyle}>
            Load cohort
          </button>
          {pasteError && (
            <div style={{ color: COLORS.danger, fontSize: '0.7rem', marginTop: 6 }}>{pasteError}</div>
          )}
        </div>

        <div className="text-xs flex items-start gap-1.5" style={{ color: COLORS.textDim }}>
          <Info size={13} style={{ marginTop: 2, flexShrink: 0 }} />
          <span>
            This assumes Role 5's Progress Service exposes per-student module/quiz/challenge data
            in roughly this shape — confirm the exact fields before wiring up real data.
          </span>
        </div>
      </div>
    </div>
  );
}

function StatChip({ label, value, accent, accent2 }) {
  const color = accent ? COLORS.accent : accent2 ? COLORS.accent2 : COLORS.textBright;
  return (
    <div style={{ border: `1px solid ${COLORS.border}`, padding: '10px 14px', flex: '1 1 160px' }}>
      <div style={{ color: COLORS.textDim, fontSize: '0.7rem' }}>{label}</div>
      <div style={{ color, fontSize: '1rem', fontWeight: 600, marginTop: 2, fontFamily: 'ui-monospace, monospace' }}>
        {value}
      </div>
    </div>
  );
}
