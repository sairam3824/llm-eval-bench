<p align="center">
  <a href="https://claude.ai/code"><img src="https://img.shields.io/badge/Built%20with-Claude%20Code-6366F1?style=for-the-badge&logo=anthropic&logoColor=white" alt="Built with Claude Code" /></a>
  <img src="https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=nextdotjs" alt="Next.js 14" />
  <img src="https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
</p>

# ⚡ LLM Eval Bench

**Benchmark & Compare LLMs Across Providers — CLI + Premium Next.js Dashboard**

Run any prompt suite against OpenAI, Anthropic, Google, Mistral, and local Ollama models. Every response is scored by a **GPT-4o "LLM-as-Judge"** on quality (1–10), and you get latency, cost, token efficiency, and consistency metrics — all visualized on a sleek dashboard with radar, bar, and scatter charts.

---

## ✨ Features

- 🔌 **Multi-Provider** — OpenAI (GPT-4o, o1), Anthropic (Claude Sonnet 4, Haiku 3.5), Google (Gemini 2.5 Pro, Flash), Mistral (Large, Small), Ollama (any local model)
- 🧑‍⚖️ **LLM-as-Judge Scoring** — GPT-4o evaluates every response against your criteria on a 1–10 scale
- 📊 **5 Metrics** — Quality, Latency, Cost, Token Efficiency, Consistency
- 📈 **Rich Visualizations** — Radar charts, bar charts, scatter plots, per-test comparison tables
- 🧪 **5 Built-in Test Suites** — 70 tests across coding, reasoning, summarization, creative writing, and instruction following
- ⌨️ **CLI + Web** — Full Commander.js CLI alongside a Next.js 14 dashboard
- 🗄️ **Zero Infrastructure** — SQLite storage, no external database needed
- 🎨 **Premium UI** — Dark/light theme, glassmorphism, gradient accents, Framer Motion animations
- ➕ **Model Management** — Add, remove, and toggle models from the UI

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** ≥ 18
- At minimum, an **OpenAI API key** (used for models and as the default judge)

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/your-username/llm-eval-bench.git
cd llm-eval-bench

# 2. Configure environment
cp .env.example .env.local
# Edit .env.local and add your API keys

# 3. Install dependencies & launch
npm install
npm run dev
```

Open **http://localhost:3000** — the database and default models are created automatically on first run.

---

## 🔑 Environment Variables

Create a `.env.local` file from the provided example:

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | **Yes** | Powers OpenAI models + default Judge |
| `ANTHROPIC_API_KEY` | No | Enables Anthropic (Claude) models |
| `GOOGLE_API_KEY` | No | Enables Google (Gemini) models |
| `MISTRAL_API_KEY` | No | Enables Mistral models |
| `OLLAMA_BASE_URL` | No | Ollama endpoint (default: `http://localhost:11434`) |
| `DATABASE_PATH` | No | SQLite DB path (default: `./data/bench.db`) |
| `JUDGE_MODEL` | No | Which model judges responses (default: `gpt-4o`) |

---

## 🖥️ Web Dashboard

The Next.js dashboard provides a full UI for managing benchmarks:

| Page | Description |
|------|-------------|
| **Dashboard** (`/`) | Overview stats, top-performing models (bar + radar charts), recent runs |
| **Benchmark** (`/benchmark`) | Select a test suite and models, then trigger a run |
| **Results** (`/results`) | Browse all benchmark runs |
| **Result Detail** (`/results/[id]`) | Per-test breakdown with scores, latency, and judge reasoning |
| **Compare** (`/compare`) | Side-by-side model comparison across metrics |
| **Models** (`/models`) | Add, remove, enable, or disable LLM models |
| **Suites** (`/suites`) | Create and manage test suites |
| **Settings** (`/settings`) | Application configuration |

---

## ⌨️ CLI

The CLI is a separate package inside `cli/` and communicates with the running Next.js server.

```bash
cd cli && npm install
```

### Commands

```bash
# Run a benchmark suite
node src/index.js run --suite ../suites/coding-basics.json

# Compare models from the latest run
node src/index.js compare

# Generate a report
node src/index.js report --format html    # also: json, csv

# Interactively create a new test suite
node src/index.js create-suite
```

### CLI Options

| Command | Flag | Description |
|---------|------|-------------|
| `run` | `-s, --suite <path>` | Path to test suite JSON |
| | `-m, --models <ids>` | Comma-separated model IDs |
| | `-j, --judge <model>` | Judge model (default: `gpt-4o`) |
| | `-u, --url <url>` | API server URL (default: `http://localhost:3000`) |
| `compare` | `-m, --models <names>` | Comma-separated model names |
| | `-r, --run <id>` | Specific run ID |
| `report` | `-r, --run <id>` | Run ID (default: latest) |
| | `-f, --format <fmt>` | Output format: `json`, `csv`, `html` |
| | `-o, --output <path>` | Output file path |
| `create-suite` | `-o, --output <path>` | Output file (default: `./my-suite.json`) |

---

## 🧪 Test Suites

Five built-in suites are included in the `suites/` directory:

| Suite | Tests | Difficulty | Description |
|-------|:-----:|------------|-------------|
| `coding-basics.json` | 20 | Easy → Hard | Algorithms, data structures, decorators, concurrency |
| `reasoning.json` | 15 | Mixed | Logic puzzles, math, analytical reasoning |
| `summarization.json` | 10 | Mixed | Text compression and key-point extraction |
| `creative-writing.json` | 10 | Mixed | Stories, poetry, creative content |
| `instruction-following.json` | 15 | Mixed | Precision in following complex multi-step instructions |

### Custom Suite Format

```json
{
  "name": "My Custom Suite",
  "description": "Description of what this suite tests",
  "category": "coding",
  "tests": [
    {
      "id": "test-1",
      "prompt": "Write a Python function to reverse a string.",
      "expected_criteria": ["correct output", "handles edge cases", "clean code"],
      "category": "coding",
      "difficulty": "easy"
    }
  ]
}
```

---

## ⚙️ How It Works

### Benchmark Flow

```
1. SELECT suite + models
2. For each (model × test):
   ├── Call provider API → get response, latency, tokens
   ├── Calculate cost from token usage × model pricing
   └── Send to GPT-4o Judge → quality score (1–10) + reasoning
3. Aggregate per-model metrics
4. Store everything in SQLite
5. Visualize on dashboard
```

### Evaluation Metrics

| Metric | How It's Calculated |
|--------|-------------------|
| **Quality** | LLM-as-Judge score (1–10 scale) |
| **Latency** | Total response time in milliseconds |
| **Cost** | `(input_tokens / 1000) × input_price + (output_tokens / 1000) × output_price` |
| **Token Efficiency** | Quality per dollar spent — higher is better |
| **Consistency** | `10 − variance(quality_scores)` — how stable scores are across tests |

### Default Models (auto-seeded)

| Model | Provider | Context Window |
|-------|----------|:--------------:|
| GPT-4o | OpenAI | 128K |
| GPT-4o Mini | OpenAI | 128K |
| o1-mini | OpenAI | 128K |
| Claude Sonnet 4 | Anthropic | 200K |
| Claude Haiku 3.5 | Anthropic | 200K |
| Gemini 2.5 Pro | Google | 1M |
| Gemini Flash | Google | 1M |
| Mistral Large | Mistral | 128K |
| Mistral Small | Mistral | 32K |

---

## 🏗️ Project Structure

```
llm-eval-bench/
├── app/                        # Next.js 14 App Router
│   ├── page.tsx                # Dashboard home
│   ├── layout.tsx              # Root layout (sidebar + theme)
│   ├── globals.css             # Global styles + Tailwind
│   ├── api/                    # API Routes
│   │   ├── benchmark/route.ts  #   POST — start a run
│   │   ├── dashboard/route.ts  #   GET  — aggregated stats
│   │   ├── models/route.ts     #   GET/POST — list/create models
│   │   ├── models/[id]/route.ts#   PUT/DELETE — update/delete model
│   │   ├── runs/route.ts       #   GET  — list runs
│   │   ├── runs/[id]/route.ts  #   GET  — run details
│   │   ├── runs/[id]/status/   #   GET  — poll run status
│   │   ├── suites/route.ts     #   GET/POST — list/create suites
│   │   └── suites/[id]/route.ts#   GET/PUT/DELETE — suite CRUD
│   ├── benchmark/              # Run benchmark page
│   ├── compare/                # Model comparison page
│   ├── models/                 # Model management page
│   ├── results/                # Results list + detail pages
│   ├── settings/               # Settings page
│   └── suites/                 # Suite management page
├── cli/                        # Standalone CLI (separate package)
│   ├── package.json
│   └── src/
│       ├── index.js            # Entry point (Commander.js)
│       └── commands/           # run, compare, report, create-suite
├── components/                 # Shared React components
│   ├── Sidebar.tsx
│   ├── StatCard.tsx
│   ├── PageHeader.tsx
│   ├── ProviderBadge.tsx
│   └── ThemeProvider.tsx
├── lib/                        # Core logic
│   ├── db.ts                   # SQLite schema + seed data
│   ├── providers/              # LLM provider adapters
│   │   ├── index.ts            #   Unified callProvider() dispatcher
│   │   ├── openai.ts
│   │   ├── anthropic.ts
│   │   ├── google.ts
│   │   ├── mistral.ts
│   │   └── ollama.ts
│   └── benchmark/
│       ├── runner.ts           # Benchmark execution engine
│       └── judge.ts            # LLM-as-Judge (GPT-4o)
├── suites/                     # 5 built-in test suites (70 tests)
├── data/                       # SQLite database (auto-created)
├── .env.example                # Environment variable template
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── next.config.js
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 14](https://nextjs.org) (App Router) |
| Language | TypeScript 5.5 |
| Styling | Tailwind CSS 3.4 |
| Charts | [Recharts](https://recharts.org) |
| Animations | [Framer Motion](https://www.framer.com/motion/) |
| Icons | [Lucide React](https://lucide.dev) |
| Database | SQLite via [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) |
| Theming | [next-themes](https://github.com/pacocoursey/next-themes) |
| CLI | [Commander.js](https://github.com/tj/commander.js) + [chalk](https://github.com/chalk/chalk) |
| Validation | [Zod](https://zod.dev) |
| LLM SDKs | openai, @anthropic-ai/sdk, @google/generative-ai, @mistralai/mistralai |

---

## 📄 API Reference

All API routes use `export const dynamic = 'force-dynamic'` to avoid build-time prerender issues with SQLite.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/dashboard` | GET | Aggregated dashboard statistics |
| `/api/benchmark` | POST | Start a new benchmark run |
| `/api/runs` | GET | List all benchmark runs |
| `/api/runs/:id` | GET | Get run details with all results |
| `/api/runs/:id/status` | GET | Poll run status (for progress tracking) |
| `/api/models` | GET | List all registered models |
| `/api/models` | POST | Add a new model |
| `/api/models/:id` | PUT | Update a model |
| `/api/models/:id` | DELETE | Remove a model |
| `/api/suites` | GET | List all test suites |
| `/api/suites` | POST | Create a new test suite |
| `/api/suites/:id` | GET | Get a specific suite |
| `/api/suites/:id` | PUT | Update a suite |
| `/api/suites/:id` | DELETE | Delete a suite |

---

## 📝 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.