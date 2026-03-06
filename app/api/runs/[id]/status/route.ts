export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const db = getDb();
  const run = db.prepare('SELECT status, completed_at FROM benchmark_runs WHERE id = ?').get(params.id) as {
    status: string;
    completed_at: string | null;
  } | undefined;

  if (!run) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const total = db.prepare('SELECT COUNT(*) as c FROM benchmark_results WHERE run_id = ?').get(params.id) as { c: number };
  const done = db.prepare("SELECT COUNT(*) as c FROM benchmark_results WHERE run_id = ? AND (error IS NOT NULL OR response IS NOT NULL)").get(params.id) as { c: number };

  return NextResponse.json({
    status: run.status,
    completed_at: run.completed_at,
    progress: { total: total.c, completed: done.c },
  });
}
