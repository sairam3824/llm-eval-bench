'use client';

import { useEffect, useState } from 'react';
import { GitCompare, Loader2, BarChart3 } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import ProviderBadge from '@/components/ProviderBadge';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, Cell
} from 'recharts';
import { clsx } from 'clsx';

type Model = { id: string; name: string; provider: string; color: string; enabled: number };
type Run = { id: string; suite_name: string; status: string; created_at: string };
type Metric = {
  model_name: string;
  avg_quality: number;
  avg_latency_ms: number;
  avg_cost_usd: number;
  consistency_score: number;
  token_efficiency: number;
  tests_completed: number;
};

export default function ComparePage() {
  const [models, setModels] = useState<Model[]>([]);
  const [runs, setRuns] = useState<Run[]>([]);
  const [selectedRun, setSelectedRun] = useState('');
  const [metrics, setMetrics] = useState<Metric[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/models').then(r => r.json()),
      fetch('/api/runs').then(r => r.json()),
    ]).then(([m, r]) => {
      setModels(m);
      const completed = r.filter((run: Run) => run.status === 'completed');
      setRuns(completed);
      if (completed.length > 0) setSelectedRun(completed[0].id);
    }).finally(() => setInitialLoad(false));
  }, []);

  useEffect(() => {
    if (!selectedRun) return;
    setLoading(true);
    fetch(`/api/runs/${selectedRun}`)
      .then(r => r.json())
      .then(d => setMetrics(d.metrics || []))
      .finally(() => setLoading(false));
  }, [selectedRun]);

  const modelColorMap = Object.fromEntries(models.map(m => [m.name, m.color]));
  const COLORS = metrics.map((m, i) => modelColorMap[m.model_name] || ['#6366F1', '#06B6D4', '#10B981', '#F59E0B', '#F43F5E'][i % 5]);

  const radarData = ['Quality', 'Speed', 'Cost Eff.', 'Consistency', 'Efficiency'].map(label => {
    const row: Record<string, number | string> = { label };
    metrics.forEach(m => {
      const modelKey = m.model_name.split(' ').slice(0, 2).join(' ');
      if (label === 'Quality') row[modelKey] = m.avg_quality || 0;
      else if (label === 'Speed') row[modelKey] = Math.max(0, 10 - (m.avg_latency_ms || 5000) / 500);
      else if (label === 'Cost Eff.') row[modelKey] = Math.max(0, 10 - (m.avg_cost_usd || 0) * 10000);
      else if (label === 'Consistency') row[modelKey] = m.consistency_score || 0;
      else if (label === 'Efficiency') row[modelKey] = Math.min(10, m.token_efficiency || 0);
    });
    return row;
  });

  const shortNames = metrics.map(m => m.model_name.split(' ').slice(0, 2).join(' '));

  if (initialLoad) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-accent animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      <PageHeader
        title="Model Comparison"
        subtitle="Side-by-side analysis of benchmark results"
        icon={GitCompare}
        actions={
          <select
            value={selectedRun}
            onChange={e => setSelectedRun(e.target.value)}
            className="input-field max-w-xs"
            disabled={runs.length === 0}
          >
            {runs.length === 0 ? (
              <option>No completed runs</option>
            ) : (
              runs.map(r => (
                <option key={r.id} value={r.id} className="bg-surface-2">
                  {r.suite_name} — {new Date(r.created_at).toLocaleDateString()}
                </option>
              ))
            )}
          </select>
        }
      />

      {runs.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center border border-border">
          <GitCompare className="w-14 h-14 text-text-muted mx-auto mb-4" />
          <h3 className="font-semibold text-text-primary mb-2">No completed benchmarks</h3>
          <p className="text-text-muted text-sm">Run a benchmark first to compare models here</p>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center h-60">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
        </div>
      ) : metrics.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center border border-border">
          <BarChart3 className="w-12 h-12 text-text-muted mx-auto mb-3" />
          <p className="text-text-muted">No metrics for this run yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Model legend */}
          <div className="glass rounded-2xl p-4 border border-border flex flex-wrap gap-3">
            {metrics.map((m, i) => (
              <div key={m.model_name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: COLORS[i] }} />
                <span className="text-sm text-text-primary">{m.model_name}</span>
                <ProviderBadge provider={models.find(mo => mo.name === m.model_name)?.provider || 'custom'} />
              </div>
            ))}
          </div>

          {/* Radar */}
          <div className="glass rounded-2xl p-6 border border-border">
            <h2 className="font-semibold text-text-primary mb-6">Multi-Dimensional Comparison</h2>
            <ResponsiveContainer width="100%" height={380}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#21262D" />
                <PolarAngleAxis dataKey="label" tick={{ fontSize: 12, fill: '#8B949E' }} />
                <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 10, fill: '#484F58' }} />
                {shortNames.map((name, i) => (
                  <Radar key={name} name={metrics[i].model_name} dataKey={name}
                    stroke={COLORS[i]} fill={COLORS[i]} fillOpacity={0.15} strokeWidth={2.5} />
                ))}
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Side-by-side bars */}
          <div className="grid grid-cols-2 gap-6">
            {[
              {
                title: 'Quality Score (1-10)',
                data: metrics.map(m => ({ name: m.model_name.split(' ')[0], value: m.avg_quality || 0 })),
                domain: [0, 10] as [number, number],
                color: '#6366F1',
              },
              {
                title: 'Response Time (seconds)',
                data: metrics.map(m => ({ name: m.model_name.split(' ')[0], value: (m.avg_latency_ms || 0) / 1000 })),
                domain: undefined,
                color: '#06B6D4',
              },
              {
                title: 'Cost per Call (USD)',
                data: metrics.map(m => ({ name: m.model_name.split(' ')[0], value: m.avg_cost_usd || 0 })),
                domain: undefined,
                color: '#10B981',
              },
              {
                title: 'Consistency Score',
                data: metrics.map(m => ({ name: m.model_name.split(' ')[0], value: m.consistency_score || 0 })),
                domain: [0, 10] as [number, number],
                color: '#F59E0B',
              },
            ].map(({ title, data, domain, color }) => (
              <div key={title} className="glass rounded-2xl p-6 border border-border">
                <h3 className="font-medium text-text-primary text-sm mb-4">{title}</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis domain={domain} tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: '#161B22', border: '1px solid #30363D', borderRadius: '8px', fontSize: '12px' }}
                      cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {data.map((_, i) => (
                        <Cell key={i} fill={COLORS[i]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ))}
          </div>

          {/* Comparison table */}
          <div className="glass rounded-2xl border border-border overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="font-semibold text-text-primary">Detailed Comparison</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-5 py-3 text-left text-xs font-medium text-text-secondary uppercase tracking-wider">Metric</th>
                    {metrics.map((m, i) => (
                      <th key={m.model_name} className="px-5 py-3 text-left text-xs font-medium uppercase tracking-wider"
                        style={{ color: COLORS[i] }}>
                        {m.model_name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: 'Avg Quality', key: 'avg_quality', format: (v: number) => v?.toFixed(1) + '/10', higher: true },
                    { label: 'Avg Latency', key: 'avg_latency_ms', format: (v: number) => (v / 1000)?.toFixed(2) + 's', higher: false },
                    { label: 'Avg Cost', key: 'avg_cost_usd', format: (v: number) => '$' + v?.toFixed(5), higher: false },
                    { label: 'Consistency', key: 'consistency_score', format: (v: number) => v?.toFixed(1) + '/10', higher: true },
                    { label: 'Token Efficiency', key: 'token_efficiency', format: (v: number) => v?.toFixed(2), higher: true },
                    { label: 'Tests Completed', key: 'tests_completed', format: (v: number) => v, higher: true },
                  ].map(({ label, key, format, higher }) => {
                    const values = metrics.map(m => m[key as keyof Metric] as number);
                    const best = higher ? Math.max(...values) : Math.min(...values);
                    return (
                      <tr key={key} className="border-b border-border/40 hover:bg-surface-2/50 transition-colors">
                        <td className="px-5 py-3 text-sm text-text-secondary">{label}</td>
                        {metrics.map((m, i) => {
                          const v = m[key as keyof Metric] as number;
                          const isBest = v === best && values.filter(x => x === best).length === 1;
                          return (
                            <td key={i} className={clsx('px-5 py-3 text-sm font-medium', isBest ? 'text-emerald-accent' : 'text-text-primary')}>
                              {format(v)}
                              {isBest && <span className="ml-1 text-xs">★</span>}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
