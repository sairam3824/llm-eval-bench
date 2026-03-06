'use client';

import { useState } from 'react';
import { Settings, Eye, EyeOff, Check, Key, Database, Cpu } from 'lucide-react';
import PageHeader from '@/components/PageHeader';

const ENV_VARS = [
  { key: 'OPENAI_API_KEY', label: 'OpenAI API Key', desc: 'Required for GPT models and LLM-as-Judge', provider: 'openai' },
  { key: 'ANTHROPIC_API_KEY', label: 'Anthropic API Key', desc: 'Required for Claude models', provider: 'anthropic' },
  { key: 'GOOGLE_API_KEY', label: 'Google API Key', desc: 'Required for Gemini models', provider: 'google' },
  { key: 'MISTRAL_API_KEY', label: 'Mistral API Key', desc: 'Required for Mistral models', provider: 'mistral' },
  { key: 'OLLAMA_BASE_URL', label: 'Ollama Base URL', desc: 'URL for local Ollama instance', provider: 'ollama', default: 'http://localhost:11434' },
];

export default function SettingsPage() {
  const [show, setShow] = useState<Record<string, boolean>>({});

  return (
    <div className="max-w-[800px] mx-auto space-y-6">
      <PageHeader
        title="Settings"
        subtitle="Configure API keys and application settings"
        icon={Settings}
      />

      <div className="glass rounded-2xl p-6 border border-border">
        <div className="flex items-center gap-2 mb-5">
          <Key className="w-4 h-4 text-accent" />
          <h2 className="font-semibold text-text-primary">API Keys Configuration</h2>
        </div>
        <p className="text-text-muted text-sm mb-6">
          API keys are configured via environment variables in <code className="text-accent font-mono text-xs bg-surface-3 px-1.5 py-0.5 rounded">.env.local</code>.
          Copy <code className="text-accent font-mono text-xs bg-surface-3 px-1.5 py-0.5 rounded">.env.example</code> to <code className="text-accent font-mono text-xs bg-surface-3 px-1.5 py-0.5 rounded">.env.local</code> and fill in your keys.
        </p>

        <div className="space-y-4">
          {ENV_VARS.map(({ key, label, desc, provider, default: def }) => (
            <div key={key} className="bg-surface-3 rounded-xl p-4 border border-border">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-sm font-medium text-text-primary">{label}</span>
                  <p className="text-xs text-text-muted mt-0.5">{desc}</p>
                </div>
                <div className={`text-xs px-2 py-0.5 rounded-full capitalize badge-${provider}`}>{provider}</div>
              </div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs font-mono text-text-secondary bg-surface-2 rounded-lg px-3 py-2 border border-border">
                  {show[key] ? (def || `your_${key.toLowerCase()}`) : '••••••••••••••••••••••'}
                </code>
                <button
                  onClick={() => setShow(s => ({ ...s, [key]: !s[key] }))}
                  className="p-2 rounded-lg glass border border-border hover:border-border-bright transition-colors"
                >
                  {show[key] ? <EyeOff className="w-3.5 h-3.5 text-text-muted" /> : <Eye className="w-3.5 h-3.5 text-text-muted" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass rounded-2xl p-6 border border-border">
        <div className="flex items-center gap-2 mb-5">
          <Database className="w-4 h-4 text-accent" />
          <h2 className="font-semibold text-text-primary">Database</h2>
        </div>
        <div className="bg-surface-3 rounded-xl p-4 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <Check className="w-4 h-4 text-emerald-accent" />
            <span className="text-sm text-text-primary">SQLite database active</span>
          </div>
          <p className="text-xs text-text-muted">Stored at: <code className="font-mono text-accent">./data/bench.db</code></p>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 border border-border">
        <div className="flex items-center gap-2 mb-5">
          <Cpu className="w-4 h-4 text-accent" />
          <h2 className="font-semibold text-text-primary">Judge Model</h2>
        </div>
        <p className="text-sm text-text-muted mb-3">
          The judge model evaluates response quality. Set via <code className="text-accent font-mono text-xs bg-surface-3 px-1 py-0.5 rounded">JUDGE_MODEL</code> env variable.
        </p>
        <div className="bg-surface-3 rounded-xl p-4 border border-border">
          <span className="text-sm text-text-secondary">Current: </span>
          <span className="text-sm font-medium text-text-primary">gpt-4o</span>
        </div>
      </div>

      <div className="glass rounded-2xl p-6 border border-border">
        <h2 className="font-semibold text-text-primary mb-4">Quick Start</h2>
        <div className="space-y-2">
          {[
            'cp .env.example .env.local',
            'npm install',
            'npm run dev',
            '# Open http://localhost:3000',
          ].map((cmd, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="text-xs text-text-muted w-4">{i + 1}.</span>
              <code className="text-xs font-mono text-emerald-accent bg-surface-3 px-3 py-1.5 rounded-lg border border-border flex-1">{cmd}</code>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
