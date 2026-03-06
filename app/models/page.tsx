'use client';

import { useEffect, useState } from 'react';
import { Cpu, Plus, Trash2, ToggleLeft, ToggleRight, Edit3, Check, X, Search } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import ProviderBadge from '@/components/ProviderBadge';
import { clsx } from 'clsx';

type Model = {
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

const PROVIDERS = ['openai', 'anthropic', 'google', 'mistral', 'ollama'];
const COLORS = ['#6366F1', '#06B6D4', '#10B981', '#F59E0B', '#F43F5E', '#EC4899', '#8B5CF6', '#14B8A6'];

const defaultForm = {
  name: '', provider: 'openai', model_id: '', description: '',
  context_window: 128000, input_price_per_1k: 0, output_price_per_1k: 0, color: '#6366F1',
};

export default function ModelsPage() {
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterProvider, setFilterProvider] = useState('');

  const fetchModels = () => {
    fetch('/api/models').then(r => r.json()).then(setModels).finally(() => setLoading(false));
  };

  useEffect(() => { fetchModels(); }, []);

  const filtered = models.filter(m => {
    const matchSearch = !search || m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.model_id.toLowerCase().includes(search.toLowerCase());
    const matchProvider = !filterProvider || m.provider === filterProvider;
    return matchSearch && matchProvider;
  });

  const groupedByProvider = PROVIDERS.reduce((acc, p) => {
    const group = filtered.filter(m => m.provider === p);
    if (group.length) acc[p] = group;
    return acc;
  }, {} as Record<string, Model[]>);

  // Also handle unknown providers
  const unknownProviders = Array.from(new Set(filtered.filter(m => !PROVIDERS.includes(m.provider)).map(m => m.provider)));
  unknownProviders.forEach(p => { groupedByProvider[p] = filtered.filter(m => m.provider === p); });

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setShowAdd(false);
        setForm(defaultForm);
        fetchModels();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (model: Model) => {
    await fetch(`/api/models/${model.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: !model.enabled }),
    });
    fetchModels();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this model?')) return;
    await fetch(`/api/models/${id}`, { method: 'DELETE' });
    fetchModels();
  };

  return (
    <div className="max-w-[1200px] mx-auto space-y-6">
      <PageHeader
        title="Model Management"
        subtitle="Add, remove, and configure LLM models from any provider"
        icon={Cpu}
        actions={
          <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Add Model
          </button>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search models..."
            className="input-field pl-9"
          />
        </div>
        <div className="flex gap-2">
          {['', ...PROVIDERS].map(p => (
            <button
              key={p || 'all'}
              onClick={() => setFilterProvider(p)}
              className={clsx('text-xs px-3 py-1.5 rounded-lg transition-all duration-200 capitalize',
                filterProvider === p
                  ? 'bg-accent text-white'
                  : 'glass text-text-secondary hover:text-text-primary'
              )}
            >
              {p || 'All'}
            </button>
          ))}
        </div>
        <div className="ml-auto text-xs text-text-muted">
          {filtered.length} model{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Model groups */}
      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="glass rounded-2xl p-5 border border-border h-36 shimmer" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByProvider).map(([provider, providerModels]) => (
            <div key={provider}>
              <div className="flex items-center gap-3 mb-3">
                <ProviderBadge provider={provider} />
                <span className="text-text-muted text-xs">{providerModels.length} model{providerModels.length !== 1 ? 's' : ''}</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                {providerModels.map(model => (
                  <ModelCard
                    key={model.id}
                    model={model}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="glass rounded-2xl p-12 text-center border border-border">
              <Cpu className="w-12 h-12 text-text-muted mx-auto mb-4" />
              <p className="text-text-secondary mb-2">No models found</p>
              <p className="text-text-muted text-sm">Try adjusting your search or add a new model</p>
            </div>
          )}
        </div>
      )}

      {/* Add Model Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="glass-bright rounded-2xl p-6 w-full max-w-lg border border-border-bright shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-text-primary flex items-center gap-2">
                <Plus className="w-4 h-4 text-accent" /> Add New Model
              </h2>
              <button onClick={() => setShowAdd(false)} className="text-text-muted hover:text-text-primary transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Model Name *</label>
                  <input className="input-field" placeholder="e.g. GPT-4 Turbo" value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                </div>
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Provider *</label>
                  <select className="input-field" value={form.provider}
                    onChange={e => setForm(f => ({ ...f, provider: e.target.value }))}>
                    {PROVIDERS.map(p => <option key={p} value={p} className="bg-surface-2 capitalize">{p}</option>)}
                    <option value="custom" className="bg-surface-2">Custom</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs text-text-secondary mb-1 block">Model ID * <span className="text-text-muted">(as used in API)</span></label>
                <input className="input-field font-mono text-xs" placeholder="e.g. gpt-4-turbo-preview" value={form.model_id}
                  onChange={e => setForm(f => ({ ...f, model_id: e.target.value }))} required />
              </div>

              <div>
                <label className="text-xs text-text-secondary mb-1 block">Description</label>
                <input className="input-field" placeholder="Brief description..." value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Context Window</label>
                  <input className="input-field" type="number" value={form.context_window}
                    onChange={e => setForm(f => ({ ...f, context_window: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Input $/1K tokens</label>
                  <input className="input-field" type="number" step="0.0001" value={form.input_price_per_1k}
                    onChange={e => setForm(f => ({ ...f, input_price_per_1k: Number(e.target.value) }))} />
                </div>
                <div>
                  <label className="text-xs text-text-secondary mb-1 block">Output $/1K tokens</label>
                  <input className="input-field" type="number" step="0.0001" value={form.output_price_per_1k}
                    onChange={e => setForm(f => ({ ...f, output_price_per_1k: Number(e.target.value) }))} />
                </div>
              </div>

              <div>
                <label className="text-xs text-text-secondary mb-2 block">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map(c => (
                    <button key={c} type="button" onClick={() => setForm(f => ({ ...f, color: c }))}
                      className={clsx('w-8 h-8 rounded-lg transition-all duration-200',
                        form.color === c ? 'scale-125 ring-2 ring-white/30' : 'hover:scale-110'
                      )}
                      style={{ background: c }} />
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAdd(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                  {saving ? <><Loader className="w-4 h-4 animate-spin" />Saving...</> : <><Check className="w-4 h-4" />Add Model</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function ModelCard({ model, onToggle, onDelete }: {
  model: Model;
  onToggle: (m: Model) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className={clsx(
      'glass rounded-2xl p-5 border transition-all duration-300 hover:scale-[1.02] group relative',
      model.enabled ? 'border-border hover:border-border-bright' : 'border-border opacity-60'
    )}>
      {/* Color stripe */}
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: model.color }} />

      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
            style={{ background: model.color + '30', border: `1px solid ${model.color}50` }}>
            {model.name.charAt(0)}
          </div>
          <div>
            <div className="text-sm font-semibold text-text-primary">{model.name}</div>
            <div className="text-xs text-text-muted font-mono">{model.model_id}</div>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onToggle(model)} className="p-1 hover:bg-surface-3 rounded-lg transition-colors"
            title={model.enabled ? 'Disable' : 'Enable'}>
            {model.enabled
              ? <ToggleRight className="w-4 h-4 text-emerald-accent" />
              : <ToggleLeft className="w-4 h-4 text-text-muted" />}
          </button>
          <button onClick={() => onDelete(model.id)} className="p-1 hover:bg-rose-accent/10 rounded-lg transition-colors">
            <Trash2 className="w-4 h-4 text-text-muted hover:text-rose-accent" />
          </button>
        </div>
      </div>

      <ProviderBadge provider={model.provider} className="mb-3" />

      {model.description && (
        <p className="text-xs text-text-muted mb-3 line-clamp-2">{model.description}</p>
      )}

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="bg-surface-3 rounded-lg px-2 py-1.5">
          <div className="text-text-muted mb-0.5">Context</div>
          <div className="text-text-secondary font-medium">{(model.context_window / 1000).toFixed(0)}K</div>
        </div>
        <div className="bg-surface-3 rounded-lg px-2 py-1.5">
          <div className="text-text-muted mb-0.5">Cost/1K out</div>
          <div className="text-text-secondary font-medium">${model.output_price_per_1k}</div>
        </div>
      </div>

      <div className={clsx('mt-3 flex items-center gap-1.5 text-xs',
        model.enabled ? 'text-emerald-accent' : 'text-text-muted'
      )}>
        <div className={clsx('w-1.5 h-1.5 rounded-full', model.enabled ? 'bg-emerald-accent' : 'bg-text-muted')} />
        {model.enabled ? 'Enabled' : 'Disabled'}
      </div>
    </div>
  );
}

function Loader({ className }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
  </svg>;
}
