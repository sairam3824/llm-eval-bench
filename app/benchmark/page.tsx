'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { FlaskConical, ChevronRight, Check, Loader2, Zap, BookOpen, Cpu, Settings2 } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import ProviderBadge from '@/components/ProviderBadge';
import { clsx } from 'clsx';

type Model = { id: string; name: string; provider: string; model_id: string; enabled: number; color: string };
type Suite = { id: string; name: string; description?: string; category?: string; tests: unknown[]; builtin?: boolean };

const STEPS = ['Select Suite', 'Select Models', 'Configure', 'Review & Run'];

export default function BenchmarkPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [suites, setSuites] = useState<Suite[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedSuite, setSelectedSuite] = useState<Suite | null>(null);
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [judgeModel, setJudgeModel] = useState('gpt-4o');
  const [launching, setLaunching] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/suites').then(r => r.json()),
      fetch('/api/models').then(r => r.json()),
    ]).then(([s, m]) => {
      setSuites(s);
      setModels(m.filter((m: Model) => m.enabled));
    }).finally(() => setLoading(false));
  }, []);

  const toggleModel = (id: string) => {
    setSelectedModels(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  };

  const handleRun = async () => {
    if (!selectedSuite || selectedModels.length === 0) return;
    setLaunching(true);
    try {
      const res = await fetch('/api/benchmark', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          suiteName: selectedSuite.name,
          suiteId: selectedSuite.id,
          tests: selectedSuite.tests,
          modelIds: selectedModels,
          judgeModel,
        }),
      });
      const data = await res.json();
      router.push(`/results/${data.runId}`);
    } catch {
      setLaunching(false);
    }
  };

  const canProceed = [
    !!selectedSuite,
    selectedModels.length > 0,
    true,
    true,
  ];

  return (
    <div className="max-w-[900px] mx-auto space-y-6">
      <PageHeader
        title="New Benchmark"
        subtitle="Configure and launch a benchmark evaluation"
        icon={FlaskConical}
      />

      {/* Step indicator */}
      <div className="glass rounded-2xl p-4 border border-border">
        <div className="flex items-center">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center flex-1">
              <button
                onClick={() => i < step && setStep(i)}
                className={clsx('flex items-center gap-2 transition-all duration-200', i < step ? 'cursor-pointer' : 'cursor-default')}
              >
                <div className={clsx(
                  'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300',
                  i < step ? 'bg-emerald-accent text-white' :
                  i === step ? 'bg-accent text-white glow-accent' :
                  'bg-surface-3 text-text-muted border border-border'
                )}>
                  {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
                </div>
                <span className={clsx('text-xs font-medium hidden sm:block',
                  i === step ? 'text-text-primary' : i < step ? 'text-emerald-accent' : 'text-text-muted'
                )}>{s}</span>
              </button>
              {i < STEPS.length - 1 && (
                <div className={clsx('flex-1 h-px mx-3 transition-colors duration-300',
                  i < step ? 'bg-emerald-accent/50' : 'bg-border')} />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Step content */}
      <div className="glass rounded-2xl p-6 border border-border min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center h-60">
            <Loader2 className="w-8 h-8 text-accent animate-spin" />
          </div>
        ) : (
          <>
            {/* Step 0: Select Suite */}
            {step === 0 && (
              <StepSelectSuite
                suites={suites}
                selected={selectedSuite}
                onSelect={setSelectedSuite}
              />
            )}

            {/* Step 1: Select Models */}
            {step === 1 && (
              <StepSelectModels
                models={models}
                selected={selectedModels}
                onToggle={toggleModel}
              />
            )}

            {/* Step 2: Configure */}
            {step === 2 && (
              <StepConfigure judgeModel={judgeModel} setJudgeModel={setJudgeModel} />
            )}

            {/* Step 3: Review */}
            {step === 3 && (
              <StepReview
                suite={selectedSuite}
                selectedModels={selectedModels}
                allModels={models}
                judgeModel={judgeModel}
              />
            )}
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep(s => s - 1)}
          disabled={step === 0}
          className="btn-secondary disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Back
        </button>

        <div className="text-xs text-text-muted">Step {step + 1} of {STEPS.length}</div>

        {step < STEPS.length - 1 ? (
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!canProceed[step]}
            className="btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleRun}
            disabled={launching || !selectedSuite || selectedModels.length === 0}
            className="btn-primary flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {launching ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Launching...</>
            ) : (
              <><Zap className="w-4 h-4" /> Launch Benchmark</>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

function StepSelectSuite({ suites, selected, onSelect }: {
  suites: Suite[];
  selected: Suite | null;
  onSelect: (s: Suite) => void;
}) {
  const categories = Array.from(new Set(suites.map(s => s.category || 'custom')));

  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        <BookOpen className="w-5 h-5 text-accent" />
        <h2 className="font-semibold text-text-primary">Select Test Suite</h2>
      </div>
      <div className="space-y-4">
        {categories.map(cat => (
          <div key={cat}>
            <p className="text-xs text-text-muted uppercase tracking-wider mb-2 capitalize">{cat}</p>
            <div className="grid grid-cols-2 gap-3">
              {suites.filter(s => (s.category || 'custom') === cat).map(suite => (
                <button
                  key={suite.id}
                  onClick={() => onSelect(suite)}
                  className={clsx(
                    'text-left p-4 rounded-xl border transition-all duration-200',
                    selected?.id === suite.id
                      ? 'border-accent bg-accent/10'
                      : 'border-border hover:border-border-bright bg-surface-2 hover:bg-surface-3'
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-sm text-text-primary">{suite.name}</span>
                    {selected?.id === suite.id && <Check className="w-4 h-4 text-accent" />}
                  </div>
                  {suite.description && (
                    <p className="text-xs text-text-muted mb-2 line-clamp-2">{suite.description}</p>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted">{suite.tests.length} tests</span>
                    {suite.builtin && (
                      <span className="text-xs bg-accent/15 text-accent px-1.5 py-0.5 rounded-full border border-accent/20">Built-in</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepSelectModels({ models, selected, onToggle }: {
  models: Model[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  const providers = Array.from(new Set(models.map(m => m.provider)));

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Cpu className="w-5 h-5 text-accent" />
        <h2 className="font-semibold text-text-primary">Select Models</h2>
        <span className="ml-auto text-xs text-text-muted">{selected.length} selected</span>
      </div>
      <p className="text-xs text-text-muted mb-5">Choose which models to benchmark. All selected models will run on every test.</p>
      <div className="space-y-4">
        {providers.map(provider => (
          <div key={provider}>
            <div className="flex items-center gap-2 mb-2">
              <ProviderBadge provider={provider} />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {models.filter(m => m.provider === provider).map(model => {
                const isSelected = selected.includes(model.id);
                return (
                  <button
                    key={model.id}
                    onClick={() => onToggle(model.id)}
                    className={clsx(
                      'text-left p-3 rounded-xl border transition-all duration-200 relative',
                      isSelected
                        ? 'border-accent bg-accent/10'
                        : 'border-border hover:border-border-bright bg-surface-2'
                    )}
                  >
                    <div className="absolute top-2 right-2">
                      <div className={clsx(
                        'w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all duration-200',
                        isSelected ? 'border-accent bg-accent' : 'border-border'
                      )}>
                        {isSelected && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                    </div>
                    <div className="w-6 h-6 rounded-lg mb-2" style={{ background: model.color + '30', border: `1px solid ${model.color}50` }}>
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold" style={{ color: model.color }}>
                        {model.name.charAt(0)}
                      </div>
                    </div>
                    <div className="text-xs font-medium text-text-primary pr-5">{model.name}</div>
                    <div className="text-xs text-text-muted font-mono">{model.model_id}</div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StepConfigure({ judgeModel, setJudgeModel }: { judgeModel: string; setJudgeModel: (m: string) => void }) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        <Settings2 className="w-5 h-5 text-accent" />
        <h2 className="font-semibold text-text-primary">Configure Evaluation</h2>
      </div>
      <div className="space-y-6">
        <div className="glass rounded-xl p-4 border border-border">
          <label className="text-sm font-medium text-text-primary block mb-1">Judge Model</label>
          <p className="text-xs text-text-muted mb-3">This model will evaluate the quality of all responses (requires OpenAI API key)</p>
          <select className="input-field max-w-xs" value={judgeModel} onChange={e => setJudgeModel(e.target.value)}>
            <option value="gpt-4o">GPT-4o (Recommended)</option>
            <option value="gpt-4o-mini">GPT-4o Mini (Faster)</option>
            <option value="gpt-4-turbo">GPT-4 Turbo</option>
          </select>
        </div>

        <div className="glass rounded-xl p-4 border border-border">
          <h3 className="text-sm font-medium text-text-primary mb-3">Evaluation Metrics</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: 'LLM-as-Judge', desc: 'AI scores response quality 1-10', enabled: true },
              { name: 'Latency', desc: 'Response time + time to first token', enabled: true },
              { name: 'Cost', desc: 'Actual API cost per test', enabled: true },
              { name: 'Token Efficiency', desc: 'Quality per token spent', enabled: true },
            ].map(m => (
              <div key={m.name} className="flex items-start gap-3 p-3 rounded-lg bg-surface-3">
                <div className={clsx('w-4 h-4 rounded border flex items-center justify-center mt-0.5',
                  m.enabled ? 'bg-accent border-accent' : 'border-border'
                )}>
                  {m.enabled && <Check className="w-2.5 h-2.5 text-white" />}
                </div>
                <div>
                  <div className="text-xs font-medium text-text-primary">{m.name}</div>
                  <div className="text-xs text-text-muted">{m.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepReview({ suite, selectedModels, allModels, judgeModel }: {
  suite: Suite | null;
  selectedModels: string[];
  allModels: Model[];
  judgeModel: string;
}) {
  const models = allModels.filter(m => selectedModels.includes(m.id));
  const totalCalls = (suite?.tests.length || 0) * selectedModels.length;

  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        <Zap className="w-5 h-5 text-accent" />
        <h2 className="font-semibold text-text-primary">Review & Launch</h2>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="glass rounded-xl p-4 border border-border">
            <div className="text-xs text-text-muted mb-1">Test Suite</div>
            <div className="font-semibold text-text-primary">{suite?.name}</div>
            <div className="text-xs text-text-muted mt-1">{suite?.tests.length} tests</div>
          </div>
          <div className="glass rounded-xl p-4 border border-border">
            <div className="text-xs text-text-muted mb-1">Models Selected</div>
            <div className="font-semibold text-text-primary">{selectedModels.length} models</div>
            <div className="text-xs text-text-muted mt-1">{totalCalls} total API calls</div>
          </div>
        </div>

        <div className="glass rounded-xl p-4 border border-border">
          <div className="text-xs text-text-muted mb-3">Models to Benchmark</div>
          <div className="flex flex-wrap gap-2">
            {models.map(m => (
              <div key={m.id} className="flex items-center gap-2 text-xs bg-surface-3 rounded-lg px-3 py-1.5 border border-border">
                <div className="w-2 h-2 rounded-full" style={{ background: m.color }} />
                <span className="text-text-primary font-medium">{m.name}</span>
                <ProviderBadge provider={m.provider} />
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-xl p-4 border border-border">
          <div className="text-xs text-text-muted mb-1">Judge Model</div>
          <div className="font-medium text-text-primary text-sm">{judgeModel}</div>
        </div>

        <div className="rounded-xl p-4 bg-amber-accent/10 border border-amber-accent/20">
          <p className="text-xs text-amber-accent">
            This benchmark will make <strong>{totalCalls}</strong> LLM calls plus{' '}
            <strong>{totalCalls}</strong> judge calls. Costs will vary by provider and model.
          </p>
        </div>
      </div>
    </div>
  );
}
