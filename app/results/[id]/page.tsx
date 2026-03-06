'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  BarChart3, ArrowLeft, Loader2, CheckCircle2, AlertCircle,
  Clock, DollarSign, Zap, Star, Target, TrendingUp
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, CartesianGrid, Legend, Cell,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { clsx } from 'clsx';

const MODEL_COLORS = ['#6366F1', '#06B6D4', '#10B981', '#F59E0B', '#F43F5E', '#EC4899', '#8B5CF6', '#14B8A6'];

type Metric = {
  model_name: string;
  avg_quality: number;
  avg_latency_ms: number;
  avg_cost_usd: number;
  total_cost_usd: number;
  consistency_score: number;
  token_efficiency: number;
  tests_completed: number;
  tests_failed: number;
};

type Result = {
  model_name: string;
  test_id: string;
  test_prompt: string;
  response: string;
  quality_score: number;
  latency_ms: number;
  cost_usd: number;
  judge_reasoning: string;
  error: string;
};

type RunData = {
  run: { id: string; suite_name: string; status: string; created_at: string; model_ids: string };
  results: Result[];
  metrics: Metric[];
};

const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ name: string; value: number }> }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-bright rounded-xl p-3 text-xs shadow-xl border border-border-bright">
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4">
          <span className="text-text-secondary">{p.name}</span>
          <span className="text-text-primary font-medium">
            {typeof p.value === 'number' ? p.value.toFixed(3) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

export default function ResultDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [data, setData] = useState<RunData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'responses'>('overview');
  const [polling, setPolling] = useState(false);
  const [expandedResult, setExpandedResult] = useState<string | null>(null);

  const fetchData = useCallback(() => {
    fetch(`/api/runs/${id}`)
      .then(r => r.json())
      .then(d => {
        setData(d);
        if (d.run?.status === 'running') setPolling(true);
        else setPolling(false);
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    if (!polling) return;
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [polling, fetchData]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-accent animate-spin mx-auto mb-3" />
          <p className="text-text-secondary">Loading results...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-10 h-10 text-rose-accent mx-auto mb-3" />
        <p className="text-text-secondary">Run not found</p>
        <Link href="/results" className="text-accent text-sm mt-2 inline-block hover:text-accent-light">← Back to results</Link>
      </div>
    );
  }

  const { run, results, metrics } = data;
  const modelColors = Object.fromEntries(metrics.map((m, i) => [m.model_name, MODEL_COLORS[i % MODEL_COLORS.length]]));

  // Chart data
  const qualityData = metrics.map(m => ({ name: m.model_name.split(' ').slice(0, 2).join(' '), quality: m.avg_quality || 0 }));
  const latencyData = metrics.map(m => ({ name: m.model_name.split(' ').slice(0, 2).join(' '), latency: (m.avg_latency_ms || 0) / 1000 }));
  const scatterData = metrics.map(m => ({
    name: m.model_name,
    cost: (m.avg_cost_usd || 0) * 1000,
    quality: m.avg_quality || 0,
  }));

  const radarMetrics = metrics.slice(0, 5).map(m => ({
    model: m.model_name.split(' ').slice(0, 2).join(' '),
    quality: m.avg_quality || 0,
    speed: Math.max(0, 10 - (m.avg_latency_ms || 5000) / 500),
    cost: Math.max(0, 10 - (m.avg_cost_usd || 0) * 10000),
    consistency: m.consistency_score || 0,
    efficiency: m.token_efficiency || 0,
  }));

  const radarChartData = ['Quality', 'Speed', 'Cost Eff.', 'Consistency'].map(metric => {
    const key = metric === 'Quality' ? 'quality' : metric === 'Speed' ? 'speed' : metric === 'Cost Eff.' ? 'cost' : 'consistency';
    const row: Record<string, number | string> = { metric };
    radarMetrics.forEach(m => { row[m.model] = m[key as keyof typeof m] as number; });
    return row;
  });

  return (
    <div className="max-w-[1300px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/results" className="p-2 rounded-lg glass border border-border hover:border-border-bright transition-colors">
            <ArrowLeft className="w-4 h-4 text-text-secondary" />
          </Link>
          <div className="w-12 h-12 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center">
            <BarChart3 className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-text-primary">{run.suite_name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className={clsx('inline-flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full',
                run.status === 'completed' ? 'status-completed' :
                run.status === 'running' ? 'status-running' : 'status-pending'
              )}>
                {run.status === 'running' ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                <span className="capitalize">{run.status}</span>
              </span>
              <span className="text-text-muted text-xs">{new Date(run.created_at).toLocaleString()}</span>
              <span className="text-text-muted text-xs">{metrics.length} models evaluated</span>
            </div>
          </div>
        </div>
      </div>

      {/* Running indicator */}
      {run.status === 'running' && (
        <div className="glass rounded-xl p-4 border border-amber-accent/30 bg-amber-accent/5 flex items-center gap-3">
          <Loader2 className="w-5 h-5 text-amber-accent animate-spin flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-accent">Benchmark in progress</p>
            <p className="text-xs text-text-muted">Results will update automatically. This may take several minutes.</p>
          </div>
        </div>
      )}

      {/* Summary metrics */}
      {metrics.length > 0 && (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Best Quality', value: Math.max(...metrics.map(m => m.avg_quality || 0)).toFixed(1) + '/10', icon: Star, color: 'accent' as const },
            { label: 'Fastest Model', value: (Math.min(...metrics.map(m => m.avg_latency_ms || Infinity)) / 1000).toFixed(1) + 's', icon: Zap, color: 'cyan' as const },
            { label: 'Most Efficient', value: '$' + Math.min(...metrics.map(m => m.avg_cost_usd || Infinity)).toFixed(4), icon: DollarSign, color: 'emerald' as const },
            { label: 'Total Tests', value: metrics.reduce((a, m) => a + m.tests_completed, 0), icon: Target, color: 'amber' as const },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className={clsx('glass rounded-2xl p-5 border transition-all duration-300',
              color === 'accent' ? 'border-accent/20' :
              color === 'cyan' ? 'border-cyan-accent/20' :
              color === 'emerald' ? 'border-emerald-accent/20' : 'border-amber-accent/20'
            )}>
              <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center mb-3',
                color === 'accent' ? 'bg-accent/15' :
                color === 'cyan' ? 'bg-cyan-accent/15' :
                color === 'emerald' ? 'bg-emerald-accent/15' : 'bg-amber-accent/15'
              )}>
                <Icon className={clsx('w-4 h-4',
                  color === 'accent' ? 'text-accent' :
                  color === 'cyan' ? 'text-cyan-accent' :
                  color === 'emerald' ? 'text-emerald-accent' : 'text-amber-accent'
                )} />
              </div>
              <div className="text-2xl font-bold text-text-primary">{value}</div>
              <div className="text-xs text-text-secondary mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 glass rounded-xl border border-border w-fit">
        {(['overview', 'details', 'responses'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 capitalize',
              activeTab === tab ? 'bg-accent text-white' : 'text-text-secondary hover:text-text-primary'
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && metrics.length > 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            {/* Quality bar chart */}
            <div className="glass rounded-2xl p-6 border border-border">
              <h3 className="font-medium text-text-primary mb-4 flex items-center gap-2">
                <Star className="w-4 h-4 text-amber-accent" /> Quality Scores
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={qualityData}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="quality" radius={[6, 6, 0, 0]}>
                    {qualityData.map((_, i) => (
                      <Cell key={i} fill={MODEL_COLORS[i % MODEL_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Latency bar chart */}
            <div className="glass rounded-2xl p-6 border border-border">
              <h3 className="font-medium text-text-primary mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-cyan-accent" /> Response Time (seconds)
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={latencyData}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="latency" radius={[6, 6, 0, 0]}>
                    {latencyData.map((_, i) => (
                      <Cell key={i} fill={MODEL_COLORS[i % MODEL_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Scatter: cost vs quality */}
            <div className="glass rounded-2xl p-6 border border-border">
              <h3 className="font-medium text-text-primary mb-4 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-accent" /> Cost vs Quality
              </h3>
              <ResponsiveContainer width="100%" height={220}>
                <ScatterChart>
                  <CartesianGrid stroke="#21262D" />
                  <XAxis dataKey="cost" name="Cost ($/1K calls)" tick={{ fontSize: 11 }} label={{ value: 'Cost (m$/call)', position: 'bottom', fontSize: 10 }} />
                  <YAxis dataKey="quality" name="Quality" domain={[0, 10]} tick={{ fontSize: 11 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} content={({ active, payload }) => {
                    if (!active || !payload?.[0]) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="glass-bright rounded-xl p-3 text-xs border border-border-bright">
                        <p className="font-medium text-text-primary mb-1">{d.name}</p>
                        <p className="text-text-secondary">Quality: {d.quality?.toFixed(1)}/10</p>
                        <p className="text-text-secondary">Cost: ${d.cost?.toFixed(3)}/1K</p>
                      </div>
                    );
                  }} />
                  {scatterData.map((d, i) => (
                    <Scatter key={d.name} name={d.name} data={[d]} fill={MODEL_COLORS[i % MODEL_COLORS.length]} />
                  ))}
                  <Legend />
                </ScatterChart>
              </ResponsiveContainer>
            </div>

            {/* Radar chart */}
            <div className="glass rounded-2xl p-6 border border-border">
              <h3 className="font-medium text-text-primary mb-4">Multi-dimension Comparison</h3>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarChartData}>
                  <PolarGrid stroke="#21262D" />
                  <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: '#8B949E' }} />
                  <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 9, fill: '#484F58' }} />
                  {radarMetrics.map((m, i) => (
                    <Radar key={m.model} name={m.model} dataKey={m.model}
                      stroke={MODEL_COLORS[i]} fill={MODEL_COLORS[i]} fillOpacity={0.1} strokeWidth={2} />
                  ))}
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Tooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Details Table Tab */}
      {activeTab === 'details' && (
        <div className="glass rounded-2xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                {['Model', 'Quality', 'Latency', 'Cost/call', 'Consistency', 'Tests Done', 'Failures'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {metrics.map((m, i) => (
                <tr key={m.model_name} className="border-b border-border/40 last:border-0 hover:bg-surface-2/50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: MODEL_COLORS[i % MODEL_COLORS.length] }} />
                      <span className="font-medium text-sm text-text-primary">{m.model_name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm" style={{ color: MODEL_COLORS[i % MODEL_COLORS.length] }}>
                        {(m.avg_quality || 0).toFixed(1)}
                      </span>
                      <div className="w-16 h-1.5 bg-surface-3 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${(m.avg_quality / 10) * 100}%`, background: MODEL_COLORS[i % MODEL_COLORS.length] }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-sm text-text-secondary">{((m.avg_latency_ms || 0) / 1000).toFixed(2)}s</td>
                  <td className="px-5 py-3.5 text-sm text-text-secondary">${(m.avg_cost_usd || 0).toFixed(4)}</td>
                  <td className="px-5 py-3.5 text-sm text-text-secondary">{(m.consistency_score || 0).toFixed(1)}/10</td>
                  <td className="px-5 py-3.5 text-sm text-emerald-accent">{m.tests_completed}</td>
                  <td className="px-5 py-3.5 text-sm text-rose-accent">{m.tests_failed}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Responses Tab */}
      {activeTab === 'responses' && (
        <div className="space-y-3">
          {results.slice(0, 30).map((r, i) => {
            const key = `${r.model_name}-${r.test_id}`;
            const expanded = expandedResult === key;
            return (
              <div key={i} className="glass rounded-2xl border border-border overflow-hidden">
                <button
                  className="w-full text-left px-5 py-4 flex items-center gap-4 hover:bg-surface-2/50 transition-colors"
                  onClick={() => setExpandedResult(expanded ? null : key)}
                >
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: modelColors[r.model_name] || '#6366F1' }} />
                  <span className="font-medium text-sm text-text-primary">{r.model_name}</span>
                  <span className="text-xs text-text-muted flex-1 truncate">{r.test_prompt}</span>
                  {r.quality_score && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-accent/15 text-accent">
                      {r.quality_score}/10
                    </span>
                  )}
                  {r.error && <span className="text-xs text-rose-accent">Error</span>}
                  <span className="text-text-muted text-xs">{expanded ? '▲' : '▼'}</span>
                </button>
                {expanded && (
                  <div className="px-5 pb-4 border-t border-border pt-4 space-y-3">
                    <div>
                      <p className="text-xs text-text-muted mb-1 uppercase tracking-wide">Prompt</p>
                      <p className="text-sm text-text-secondary bg-surface-3 rounded-lg p-3">{r.test_prompt}</p>
                    </div>
                    {r.response && (
                      <div>
                        <p className="text-xs text-text-muted mb-1 uppercase tracking-wide">Response</p>
                        <p className="text-sm text-text-primary bg-surface-3 rounded-lg p-3 font-mono text-xs max-h-48 overflow-auto whitespace-pre-wrap">{r.response}</p>
                      </div>
                    )}
                    {r.judge_reasoning && (
                      <div>
                        <p className="text-xs text-text-muted mb-1 uppercase tracking-wide">Judge Reasoning</p>
                        <p className="text-sm text-text-secondary bg-surface-3 rounded-lg p-3 italic">{r.judge_reasoning}</p>
                      </div>
                    )}
                    {r.error && (
                      <div className="bg-rose-accent/10 border border-rose-accent/20 rounded-lg p-3">
                        <p className="text-xs text-rose-accent">{r.error}</p>
                      </div>
                    )}
                    <div className="flex gap-4 text-xs text-text-muted">
                      {r.latency_ms && <span>Latency: {(r.latency_ms / 1000).toFixed(2)}s</span>}
                      {r.cost_usd && <span>Cost: ${r.cost_usd.toFixed(5)}</span>}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
