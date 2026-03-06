'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BarChart3, Clock, CheckCircle2, AlertCircle, Loader2, FlaskConical, ArrowRight } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { clsx } from 'clsx';

type Run = {
  id: string;
  suite_name: string;
  status: string;
  created_at: string;
  model_ids: string;
  model_count: number;
  total_results: number;
  successful_results: number;
};

const STATUS_CONFIG = {
  completed: { icon: CheckCircle2, color: 'text-emerald-accent', badge: 'status-completed' },
  running: { icon: Loader2, color: 'text-amber-accent', badge: 'status-running' },
  failed: { icon: AlertCircle, color: 'text-rose-accent', badge: 'status-failed' },
  pending: { icon: Clock, color: 'text-text-muted', badge: 'status-pending' },
};

export default function ResultsPage() {
  const [runs, setRuns] = useState<Run[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRuns = () => {
      fetch('/api/runs').then(r => r.json()).then(setRuns).finally(() => setLoading(false));
    };
    fetchRuns();
    // Poll for running benchmarks
    const interval = setInterval(fetchRuns, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="max-w-[1100px] mx-auto space-y-6">
      <PageHeader
        title="Benchmark Results"
        subtitle="History of all benchmark runs"
        icon={BarChart3}
        actions={
          <Link href="/benchmark" className="btn-primary flex items-center gap-2 text-sm">
            <FlaskConical className="w-4 h-4" /> New Benchmark
          </Link>
        }
      />

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="glass rounded-2xl h-20 shimmer border border-border" />
          ))}
        </div>
      ) : runs.length === 0 ? (
        <div className="glass rounded-2xl p-16 text-center border border-border">
          <BarChart3 className="w-16 h-16 text-text-muted mx-auto mb-4" />
          <h3 className="font-semibold text-text-primary mb-2">No benchmark runs yet</h3>
          <p className="text-text-muted text-sm mb-6">Run your first benchmark to see results here</p>
          <Link href="/benchmark" className="btn-primary inline-flex items-center gap-2">
            <FlaskConical className="w-4 h-4" /> Run First Benchmark
          </Link>
        </div>
      ) : (
        <div className="glass rounded-2xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-5 py-4 text-xs font-medium text-text-secondary uppercase tracking-wider">Suite</th>
                <th className="text-left px-5 py-4 text-xs font-medium text-text-secondary uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-4 text-xs font-medium text-text-secondary uppercase tracking-wider">Models</th>
                <th className="text-left px-5 py-4 text-xs font-medium text-text-secondary uppercase tracking-wider">Results</th>
                <th className="text-left px-5 py-4 text-xs font-medium text-text-secondary uppercase tracking-wider">Date</th>
                <th className="text-right px-5 py-4 text-xs font-medium text-text-secondary uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody>
              {runs.map(run => {
                const statusKey = (run.status as keyof typeof STATUS_CONFIG) in STATUS_CONFIG ? run.status as keyof typeof STATUS_CONFIG : 'pending';
                const status = STATUS_CONFIG[statusKey];
                const StatusIcon = status.icon;

                return (
                  <tr key={run.id} className="border-b border-border/50 last:border-0 hover:bg-surface-2/50 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="font-medium text-sm text-text-primary">{run.suite_name}</div>
                      <div className="text-xs text-text-muted font-mono mt-0.5">{run.id.slice(0, 8)}...</div>
                    </td>
                    <td className="px-5 py-4">
                      <div className={clsx('inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium', status.badge)}>
                        <StatusIcon className={clsx('w-3 h-3', run.status === 'running' && 'animate-spin')} />
                        <span className="capitalize">{run.status}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-text-secondary">
                      {run.model_count} model{run.model_count !== 1 ? 's' : ''}
                    </td>
                    <td className="px-5 py-4">
                      <div className="text-sm text-text-secondary">{run.successful_results}/{run.total_results}</div>
                      {run.total_results > 0 && (
                        <div className="mt-1 h-1 w-24 bg-surface-3 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-accent rounded-full transition-all duration-500"
                            style={{ width: `${(run.successful_results / run.total_results) * 100}%` }}
                          />
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-text-muted">
                      {new Date(run.created_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/results/${run.id}`}
                        className="inline-flex items-center gap-1 text-xs text-accent hover:text-accent-light transition-colors opacity-60 group-hover:opacity-100"
                      >
                        View Details <ArrowRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
