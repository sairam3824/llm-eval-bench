# LLM Eval Bench — Memory

## Project Structure
- Next.js 14 app router at root (web + API)
- `/lib/db.ts` — SQLite via better-sqlite3, auto-seeds 9 default models on first run
- `/lib/providers/` — OpenAI, Anthropic, Google, Mistral, Ollama streaming clients
- `/lib/benchmark/runner.ts` — async benchmark runner; `startBenchmarkRun()` returns runId
- `/lib/benchmark/judge.ts` — LLM-as-judge using GPT-4o sync call
- `/app/api/` — all routes have `export const dynamic = 'force-dynamic'`
- `/cli/` — ESM Commander.js CLI (separate package.json)
- `/suites/` — 5 built-in JSON suites (70 total tests)
- `/data/bench.db` — SQLite database (gitignored)

## Key Decisions
- `Set` spread requires `Array.from(new Set(...))` due to tsconfig target
- API routes must be `force-dynamic` to avoid build-time SQLite prerender errors
- Tailwind custom colors: accent=#6366F1, cyan-accent=#06B6D4, emerald-accent=#10B981
- DB path: `./data/bench.db` via `DATABASE_PATH` env var

## Running
```
npm run dev          # start web at :3000
cd cli && npm install && node src/index.js --help
```

## User Preferences
- Premium dark theme UI (glassmorphism, gradient accents)
- Model add/remove from frontend required
