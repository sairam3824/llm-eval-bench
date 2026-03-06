'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3, FlaskConical, Cpu, BookOpen, TrendingUp,
  ArrowRight, Clock, CheckCircle2, AlertCircle, Loader2, Zap
} from 'lucide-react';
import StatCard from '@/components/StatCard';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Cell, Legend
} from 'recharts';
import { clsx } from 'clsx';

type DashboardData = {
  stats: { totalRuns: number; completedRuns: number; totalModels: number; totalSuites: number };
  recentRuns: Array<{ id: string; suite_name: string; status: string; created_at: string; model_ids: string }>;
  topModels: Array<{ model_name: string; avg_quality: number; avg_latency: number; avg_cost: number; run_count: number }>;
  qualityOverTime: Array<{ date: string; model_name: string; quality: number }>;
};

const STATUS_ICON = {
  completed: <CheckCircle2 className="w-4 h-4 text-emerald-accent" />,
  running: <Loader2 className="w-4 h-4 text-amber-accent animate-spin" />,
  failed: <AlertCircle className="w-4 h-4 text-rose-accent" />,
  pending: <Clock className="w-4 h-4 text-text-muted" />,
};

const MODEL_COLORS = ['#6366F1', '#06B6D4', '#10B981', '#F59E0B', '#F43F5E', '#EC4899', '#8B5CF6', '#14B8A6'];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) => {
  if (!active || !payload) return null;
  return (
    <div className="glass-bright rounded-xl p-3 text-xs shadow-xl">
      <p className="text-text-secondary mb-2 font-medium">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: MODEL_COLORS[i % MODEL_COLORS.length] }} />
          <span className="text-text-primary">{typeof p.value === 'number' ? p.value.toFixed(2) : p.value}</span>
          {p.name && <span className="text-text-muted">{p.name}</span>}
        </div>
      ))}
    </div>
  );
};

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/dashboard')
      .then(r => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-accent animate-pulse" />
          </div>
          <p className="text-text-secondary">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = data?.stats || { totalRuns: 0, completedRuns: 0, totalModels: 0, totalSuites: 0 };
  const topModels = data?.topModels || [];

  // Prepare radar chart data from top models
  const radarData = topModels.slice(0, 5).map(m => ({
    model: m.model_name.split(' ').slice(0, 2).join(' '),
    quality: m.avg_quality || 0,
    speed: m.avg_latency ? Math.max(0, 10 - m.avg_latency / 1000) : 5,
    cost: m.avg_cost ? Math.max(0, 10 - m.avg_cost * 10000) : 5,
    consistency: 7,
  }));

  return (
    <div className="space-y-8 max-w-[1400px] mx-auto">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-3xl p-8 border border-border"
        style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(6,182,212,0.05) 50%, rgba(8,11,20,0.8) 100%)' }}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2 h-2 bg-emerald-accent rounded-full animate-pulse" />
            <span className="text-xs text-emerald-accent font-medium uppercase tracking-wider">Live Dashboard</span>
          </div>
          <h1 className="text-4xl font-bold mb-2">
            <span className="gradient-text">LLM Eval Bench</span>
          </h1>
          <p className="text-text-secondary text-lg mb-6 max-w-xl">
            Benchmark and compare language models across quality, speed, cost, and consistency metrics.
          </p>
          <div className="flex gap-3">
            <Link href="/benchmark" className="btn-primary flex items-center gap-2 text-sm">
              <FlaskConical className="w-4 h-4" />
              Run Benchmark
            </Link>
            <Link href="/results" className="btn-secondary flex items-center gap-2 text-sm">
              <BarChart3 className="w-4 h-4" />
              View Results
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Benchmark Runs" value={stats.totalRuns} icon={FlaskConical} color="accent" />
        <StatCard label="Completed Runs" value={stats.completedRuns} icon={CheckCircle2} color="emerald" />
        <StatCard label="Active Models" value={stats.totalModels} icon={Cpu} color="cyan" />
        <StatCard label="Test Suites" value={stats.totalSuites} icon={BookOpen} color="amber" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-2 gap-6">
        {/* Quality scores bar chart */}
        <div className="glass rounded-2xl p-6 border border-border">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-text-primary">Model Quality Rankings</h2>
              <p className="text-text-muted text-xs mt-0.5">Average LLM-judge scores (1–10)</p>
            </div>
            <TrendingUp className="w-4 h-4 text-text-muted" />
          </div>
          {topModels.length === 0 ? (
            <EmptyState message="Run a benchmark to see results" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={topModels.slice(0, 7)} layout="vertical" margin={{ left: 20, right: 20 }}>
                <XAxis type="number" domain={[0, 10]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="model_name" tick={{ fontSize: 11 }} width={100} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="avg_quality" radius={[0, 6, 6, 0]}>
                  {topModels.slice(0, 7).map((_, i) => (
                    <Cell key={i} fill={MODEL_COLORS[i % MODEL_COLORS.length]} opacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Radar chart */}
        <div className="glass rounded-2xl p-6 border border-border">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-semibold text-text-primary">Performance Radar</h2>
              <p className="text-text-muted text-xs mt-0.5">Multi-dimensional comparison</p>
            </div>
          </div>
          {radarData.length === 0 ? (
            <EmptyState message="Run a benchmark to see radar" />
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={[
                { metric: 'Quality', ...Object.fromEntries(radarData.map(m => [m.model, m.quality])) },
                { metric: 'Speed', ...Object.fromEntries(radarData.map(m => [m.model, m.speed])) },
                { metric: 'Cost Eff.', ...Object.fromEntries(radarData.map(m => [m.model, m.cost])) },
                { metric: 'Consistency', ...Object.fromEntries(radarData.map(m => [m.model, m.consistency])) },
              ]}>
                <PolarGrid stroke="#21262D" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fill: '#8B949E' }} />
                <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 10, fill: '#484F58' }} />
                {radarData.map((m, i) => (
                  <Radar key={m.model} name={m.model} dataKey={m.model}
                    stroke={MODEL_COLORS[i]} fill={MODEL_COLORS[i]} fillOpacity={0.1} strokeWidth={2} />
                ))}
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent runs */}
      <div className="glass rounded-2xl p-6 border border-border">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-base font-semibold text-text-primary">Recent Benchmark Runs</h2>
            <p className="text-text-muted text-xs mt-0.5">Latest evaluations</p>
          </div>
          <Link href="/results" className="flex items-center gap-1 text-xs text-accent hover:text-accent-light transition-colors">
            View all <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        {!data?.recentRuns?.length ? (
          <EmptyState message="No benchmark runs yet. Start your first benchmark!" />
        ) : (
          <table className="w-full data-table">
            <thead>
              <tr>
                <th className="text-left">Suite</th>
                <th className="text-left">Status</th>
                <th className="text-left">Models</th>
                <th className="text-left">Created</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {data.recentRuns.map(run => (
                <tr key={run.id} className="group">
                  <td className="font-medium">{run.suite_name}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      {STATUS_ICON[run.status as keyof typeof STATUS_ICON] || STATUS_ICON.pending}
                      <span className={clsx('text-xs capitalize',
                        run.status === 'completed' ? 'text-emerald-accent' :
                        run.status === 'running' ? 'text-amber-accent' :
                        run.status === 'failed' ? 'text-rose-accent' : 'text-text-muted'
                      )}>{run.status}</span>
                    </div>
                  </td>
                  <td className="text-text-secondary">
                    {JSON.parse(run.model_ids).length} models
                  </td>
                  <td className="text-text-muted text-xs">
                    {new Date(run.created_at).toLocaleDateString()}
                  </td>
                  <td className="text-right">
                    <Link href={`/results/${run.id}`}
                      className="text-xs text-accent hover:text-accent-light transition-colors opacity-0 group-hover:opacity-100">
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { href: '/benchmark', title: 'New Benchmark', desc: 'Select models and test suite to run', icon: FlaskConical, color: 'accent' as const },
          { href: '/suites', title: 'Browse Suites', desc: 'Explore pre-built test collections', icon: BookOpen, color: 'cyan' as const },
          { href: '/models', title: 'Manage Models', desc: 'Add, remove, or configure LLM models', icon: Cpu, color: 'emerald' as const },
        ].map(({ href, title, desc, icon: Icon, color }) => (
          <Link key={href} href={href}
            className="glass rounded-2xl p-5 border border-border hover:border-border-bright transition-all duration-300 group hover:scale-[1.02]">
            <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center mb-4',
              color === 'accent' ? 'bg-accent/15' : color === 'cyan' ? 'bg-cyan-accent/15' : 'bg-emerald-accent/15'
            )}>
              <Icon className={clsx('w-5 h-5',
                color === 'accent' ? 'text-accent' : color === 'cyan' ? 'text-cyan-accent' : 'text-emerald-accent'
              )} />
            </div>
            <h3 className="font-semibold text-text-primary text-sm mb-1">{title}</h3>
            <p className="text-text-muted text-xs">{desc}</p>
            <div className="flex items-center gap-1 mt-3 text-xs text-text-muted group-hover:text-text-secondary transition-colors">
              Go <ArrowRight className="w-3 h-3" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-48 text-center">
      <div className="w-12 h-12 rounded-full bg-surface-2 flex items-center justify-center mb-3">
        <BarChart3 className="w-6 h-6 text-text-muted" />
      </div>
      <p className="text-text-muted text-sm">{message}</p>
    </div>
  );
}
