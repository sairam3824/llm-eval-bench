# LLM Eval Bench

Benchmark & Compare LLMs Across Providers — CLI + Premium Next.js Dashboard

## Quick Start

```bash
cp .env.example .env.local   # add your API keys
npm install
npm run dev                  # open http://localhost:3000
```

## CLI

```bash
cd cli && npm install
node src/index.js run --suite ../suites/coding-basics.json
node src/index.js compare
node src/index.js report --format html
node src/index.js create-suite
```

## Features
- Multi-provider: OpenAI, Anthropic, Google, Mistral, Ollama
- LLM-as-Judge scoring (1-10) via GPT-4o
- Quality, Latency, Cost, Efficiency, Consistency metrics
- Add/remove models from the UI
- Radar, Bar, Scatter charts
- 5 built-in test suites (70 tests total)
- SQLite storage, no external DB needed