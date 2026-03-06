export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { startBenchmarkRun } from '@/lib/benchmark/runner';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { suiteName, suiteId, tests, modelIds, judgeModel } = body;

  if (!tests || !Array.isArray(tests) || tests.length === 0) {
    return NextResponse.json({ error: 'tests array is required' }, { status: 400 });
  }
  if (!modelIds || !Array.isArray(modelIds) || modelIds.length === 0) {
    return NextResponse.json({ error: 'modelIds array is required' }, { status: 400 });
  }

  const runId = await startBenchmarkRun({
    suiteName: suiteName || 'Custom Benchmark',
    suiteId,
    tests,
    modelIds,
    judgeModel: judgeModel || process.env.JUDGE_MODEL || 'gpt-4o',
  });

  return NextResponse.json({ runId, status: 'running' }, { status: 202 });
}
