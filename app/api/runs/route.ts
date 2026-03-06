export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const runs = db.prepare(`
    SELECT r.*,
      COUNT(DISTINCT br.model_id) as model_count,
      COUNT(br.id) as total_results,
      COUNT(CASE WHEN br.error IS NULL THEN 1 END) as successful_results
    FROM benchmark_runs r
    LEFT JOIN benchmark_results br ON br.run_id = r.id
    GROUP BY r.id
    ORDER BY r.created_at DESC
    LIMIT 50
  `).all();

  return NextResponse.json(runs);
}
