import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DATABASE_PATH || './data/bench.db';
const dbDir = path.dirname(DB_PATH);

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
  }
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS models (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      provider TEXT NOT NULL,
      model_id TEXT NOT NULL,
      description TEXT,
      context_window INTEGER,
      input_price_per_1k REAL,
      output_price_per_1k REAL,
      enabled INTEGER DEFAULT 1,
      color TEXT DEFAULT '#6366F1',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS suites (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      category TEXT,
      tests TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS benchmark_runs (
      id TEXT PRIMARY KEY,
      suite_id TEXT REFERENCES suites(id),
      suite_name TEXT NOT NULL,
      model_ids TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      judge_model TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT,
      config TEXT
    );

    CREATE TABLE IF NOT EXISTS benchmark_results (
      id TEXT PRIMARY KEY,
      run_id TEXT REFERENCES benchmark_runs(id),
      model_id TEXT NOT NULL,
      model_name TEXT NOT NULL,
      test_id TEXT NOT NULL,
      test_prompt TEXT NOT NULL,
      response TEXT,
      latency_ms INTEGER,
      time_to_first_token_ms INTEGER,
      input_tokens INTEGER,
      output_tokens INTEGER,
      cost_usd REAL,
      quality_score REAL,
      judge_reasoning TEXT,
      error TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS model_metrics (
      id TEXT PRIMARY KEY,
      run_id TEXT REFERENCES benchmark_runs(id),
      model_id TEXT NOT NULL,
      model_name TEXT NOT NULL,
      avg_quality REAL,
      avg_latency_ms REAL,
      avg_cost_usd REAL,
      total_cost_usd REAL,
      consistency_score REAL,
      token_efficiency REAL,
      tests_completed INTEGER,
      tests_failed INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_results_run_id ON benchmark_results(run_id);
    CREATE INDEX IF NOT EXISTS idx_results_model_id ON benchmark_results(model_id);
    CREATE INDEX IF NOT EXISTS idx_runs_status ON benchmark_runs(status);
  `);

  // Seed default models if none exist
  const count = db.prepare('SELECT COUNT(*) as c FROM models').get() as { c: number };
  if (count.c === 0) {
    seedDefaultModels(db);
  }
}

function seedDefaultModels(db: Database.Database) {
  const models = [
    {
      id: 'gpt-4o',
      name: 'GPT-4o',
      provider: 'openai',
      model_id: 'gpt-4o',
      description: 'OpenAI\'s most capable multimodal model',
      context_window: 128000,
      input_price_per_1k: 0.005,
      output_price_per_1k: 0.015,
      color: '#10B981',
    },
    {
      id: 'gpt-4o-mini',
      name: 'GPT-4o Mini',
      provider: 'openai',
      model_id: 'gpt-4o-mini',
      description: 'Fast and affordable small model',
      context_window: 128000,
      input_price_per_1k: 0.00015,
      output_price_per_1k: 0.0006,
      color: '#34D399',
    },
    {
      id: 'o1-mini',
      name: 'o1-mini',
      provider: 'openai',
      model_id: 'o1-mini',
      description: 'OpenAI reasoning model, fast',
      context_window: 128000,
      input_price_per_1k: 0.003,
      output_price_per_1k: 0.012,
      color: '#6EE7B7',
    },
    {
      id: 'claude-sonnet-4',
      name: 'Claude Sonnet 4',
      provider: 'anthropic',
      model_id: 'claude-sonnet-4-5',
      description: 'Anthropic\'s high-performance model',
      context_window: 200000,
      input_price_per_1k: 0.003,
      output_price_per_1k: 0.015,
      color: '#F59E0B',
    },
    {
      id: 'claude-haiku-3-5',
      name: 'Claude Haiku 3.5',
      provider: 'anthropic',
      model_id: 'claude-haiku-4-5-20251001',
      description: 'Fast, affordable Anthropic model',
      context_window: 200000,
      input_price_per_1k: 0.001,
      output_price_per_1k: 0.005,
      color: '#FCD34D',
    },
    {
      id: 'gemini-2-5-pro',
      name: 'Gemini 2.5 Pro',
      provider: 'google',
      model_id: 'gemini-2.0-flash-exp',
      description: 'Google\'s most capable model',
      context_window: 1000000,
      input_price_per_1k: 0.00125,
      output_price_per_1k: 0.005,
      color: '#6366F1',
    },
    {
      id: 'gemini-flash',
      name: 'Gemini Flash',
      provider: 'google',
      model_id: 'gemini-1.5-flash',
      description: 'Fast Google model',
      context_window: 1000000,
      input_price_per_1k: 0.000075,
      output_price_per_1k: 0.0003,
      color: '#818CF8',
    },
    {
      id: 'mistral-large',
      name: 'Mistral Large',
      provider: 'mistral',
      model_id: 'mistral-large-latest',
      description: 'Mistral\'s flagship model',
      context_window: 128000,
      input_price_per_1k: 0.003,
      output_price_per_1k: 0.009,
      color: '#EC4899',
    },
    {
      id: 'mistral-small',
      name: 'Mistral Small',
      provider: 'mistral',
      model_id: 'mistral-small-latest',
      description: 'Fast, efficient Mistral model',
      context_window: 32000,
      input_price_per_1k: 0.001,
      output_price_per_1k: 0.003,
      color: '#F472B6',
    },
  ];

  const stmt = db.prepare(`
    INSERT INTO models (id, name, provider, model_id, description, context_window, input_price_per_1k, output_price_per_1k, color)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const m of models) {
    stmt.run(m.id, m.name, m.provider, m.model_id, m.description, m.context_window, m.input_price_per_1k, m.output_price_per_1k, m.color);
  }
}

export type Model = {
  id: string;
  name: string;
  provider: string;
  model_id: string;
  description: string;
  context_window: number;
  input_price_per_1k: number;
  output_price_per_1k: number;
  enabled: number;
  color: string;
  created_at: string;
};

export type Suite = {
  id: string;
  name: string;
  description: string;
  category: string;
  tests: string;
  created_at: string;
  updated_at: string;
};

export type BenchmarkRun = {
  id: string;
  suite_id: string;
  suite_name: string;
  model_ids: string;
  status: string;
  judge_model: string;
  created_at: string;
  completed_at: string;
  config: string;
};

export type BenchmarkResult = {
  id: string;
  run_id: string;
  model_id: string;
  model_name: string;
  test_id: string;
  test_prompt: string;
  response: string;
  latency_ms: number;
  time_to_first_token_ms: number;
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
  quality_score: number;
  judge_reasoning: string;
  error: string;
  created_at: string;
};
