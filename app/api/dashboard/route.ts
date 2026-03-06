export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();

  const totalRuns = (db.prepare("SELECT COUNT(*) as c FROM benchmark_runs").get() as { c: number }).c;
  const completedRuns = (db.prepare("SELECT COUNT(*) as c FROM benchmark_runs WHERE status = 'completed'").get() as { c: number }).c;
  const totalModels = (db.prepare("SELECT COUNT(*) as c FROM models WHERE enabled = 1").get() as { c: number }).c;
  const totalSuites = (db.prepare("SELECT COUNT(*) as c FROM suites").get() as { c: number }).c;

  const recentRuns = db.prepare(`
    SELECT id, suite_name, status, created_at, model_ids
    FROM benchmark_runs ORDER BY created_at DESC LIMIT 5
  `).all();

  const topModels = db.prepare(`
    SELECT model_name, AVG(avg_quality) as avg_quality, AVG(avg_latency_ms) as avg_latency,
      AVG(avg_cost_usd) as avg_cost, COUNT(*) as run_count
    FROM model_metrics
    GROUP BY model_name
    ORDER BY avg_quality DESC
    LIMIT 8
  `).all();

  const qualityOverTime = db.prepare(`
    SELECT DATE(r.created_at) as date, m.model_name, AVG(m.avg_quality) as quality
    FROM model_metrics m
    JOIN benchmark_runs r ON r.id = m.run_id
    GROUP BY DATE(r.created_at), m.model_name
    ORDER BY date
    LIMIT 100
  `).all();

  return NextResponse.json({
    stats: { totalRuns, completedRuns, totalModels, totalSuites },
    recentRuns,
    topModels,
    qualityOverTime,
  });
}
