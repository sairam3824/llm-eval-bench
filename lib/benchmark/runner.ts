import { v4 as uuidv4 } from 'uuid';
import { getDb, Model } from '../db';
import { callProvider } from '../providers';
import { judgeResponse } from './judge';

export type TestCase = {
  id: string;
  prompt: string;
  expected_criteria: string[];
  category?: string;
  difficulty?: string;
};

export type Suite = {
  name: string;
  description?: string;
  tests: TestCase[];
};

export type BenchmarkConfig = {
  suiteId?: string;
  suiteName: string;
  tests: TestCase[];
  modelIds: string[];
  judgeModel?: string;
  consistency?: boolean; // run 3x for variance
};

export type RunProgress = {
  runId: string;
  total: number;
  completed: number;
  failed: number;
  currentModel?: string;
  currentTest?: string;
};

export async function startBenchmarkRun(config: BenchmarkConfig): Promise<string> {
  const db = getDb();
  const runId = uuidv4();

  db.prepare(`
    INSERT INTO benchmark_runs (id, suite_id, suite_name, model_ids, status, judge_model, config)
    VALUES (?, ?, ?, ?, 'running', ?, ?)
  `).run(
    runId,
    config.suiteId || null,
    config.suiteName,
    JSON.stringify(config.modelIds),
    config.judgeModel || 'gpt-4o',
    JSON.stringify(config)
  );

  // Run asynchronously
  runBenchmark(runId, config).catch(console.error);

  return runId;
}

export async function runBenchmark(runId: string, config: BenchmarkConfig): Promise<void> {
  const db = getDb();

  // Get models
  const placeholders = config.modelIds.map(() => '?').join(',');
  const models = db.prepare(`SELECT * FROM models WHERE id IN (${placeholders})`).all(...config.modelIds) as Model[];

  const judgeModel = config.judgeModel || process.env.JUDGE_MODEL || 'gpt-4o';
  const tests = config.tests;

  const insertResult = db.prepare(`
    INSERT INTO benchmark_results (id, run_id, model_id, model_name, test_id, test_prompt, response,
      latency_ms, time_to_first_token_ms, input_tokens, output_tokens, cost_usd, quality_score, judge_reasoning, error)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const model of models) {
    for (const test of tests) {
      try {
        const providerResult = await callProvider(model.provider, model.model_id, test.prompt);

        const costUsd =
          (providerResult.inputTokens / 1000) * model.input_price_per_1k +
          (providerResult.outputTokens / 1000) * model.output_price_per_1k;

        // Judge the response
        let qualityScore = 0;
        let judgeReasoning = '';
        try {
          const judgeResult = await judgeResponse(
            test.prompt,
            providerResult.response,
            test.expected_criteria,
            judgeModel
          );
          qualityScore = judgeResult.score;
          judgeReasoning = judgeResult.reasoning;
        } catch {
          qualityScore = 0;
          judgeReasoning = 'Judging failed';
        }

        insertResult.run(
          uuidv4(), runId, model.id, model.name, test.id, test.prompt,
          providerResult.response, providerResult.latencyMs, providerResult.timeToFirstToken,
          providerResult.inputTokens, providerResult.outputTokens, costUsd,
          qualityScore, judgeReasoning, null
        );
      } catch (error: unknown) {
        insertResult.run(
          uuidv4(), runId, model.id, model.name, test.id, test.prompt,
          null, null, null, null, null, null, null, null,
          error instanceof Error ? error.message : String(error)
        );
      }
    }
  }

  // Compute aggregate metrics per model
  const insertMetrics = db.prepare(`
    INSERT INTO model_metrics (id, run_id, model_id, model_name, avg_quality, avg_latency_ms,
      avg_cost_usd, total_cost_usd, consistency_score, token_efficiency, tests_completed, tests_failed)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const model of models) {
    const results = db.prepare(`
      SELECT * FROM benchmark_results WHERE run_id = ? AND model_id = ?
    `).all(runId, model.id) as Array<{
      quality_score: number | null;
      latency_ms: number | null;
      cost_usd: number | null;
      output_tokens: number | null;
      error: string | null;
    }>;

    const completed = results.filter(r => !r.error);
    const failed = results.filter(r => r.error);

    if (completed.length === 0) continue;

    const avgQuality = avg(completed.map(r => r.quality_score || 0));
    const avgLatency = avg(completed.map(r => r.latency_ms || 0));
    const avgCost = avg(completed.map(r => r.cost_usd || 0));
    const totalCost = sum(completed.map(r => r.cost_usd || 0));

    // Token efficiency = quality per dollar (normalized)
    const tokenEfficiency = avgCost > 0 ? avgQuality / (avgCost * 1000) : avgQuality;

    // Consistency = inverse of quality variance (placeholder)
    const qualityScores = completed.map(r => r.quality_score || 0);
    const variance = computeVariance(qualityScores);
    const consistencyScore = Math.max(0, 10 - variance);

    insertMetrics.run(
      uuidv4(), runId, model.id, model.name,
      avgQuality, avgLatency, avgCost, totalCost,
      consistencyScore, Math.min(10, tokenEfficiency),
      completed.length, failed.length
    );
  }

  // Mark run as completed
  db.prepare(`UPDATE benchmark_runs SET status = 'completed', completed_at = datetime('now') WHERE id = ?`).run(runId);
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function sum(arr: number[]): number {
  return arr.reduce((a, b) => a + b, 0);
}

function computeVariance(arr: number[]): number {
  if (arr.length === 0) return 0;
  const mean = avg(arr);
  return avg(arr.map(x => Math.pow(x - mean, 2)));
}
