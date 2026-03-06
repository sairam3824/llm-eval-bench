export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  const run = db.prepare('SELECT * FROM benchmark_runs WHERE id = ?').get(params.id);
  if (!run) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const results = db.prepare('SELECT * FROM benchmark_results WHERE run_id = ? ORDER BY model_id, test_id').all(params.id);
  const metrics = db.prepare('SELECT * FROM model_metrics WHERE run_id = ?').all(params.id);

  return NextResponse.json({ run, results, metrics });
}
