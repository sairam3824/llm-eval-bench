'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen, Plus, Trash2, FlaskConical, Upload, X, Check } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { clsx } from 'clsx';

type Suite = {
  id: string;
  name: string;
  description?: string;
  category?: string;
  tests: Array<{ id: string; prompt: string; expected_criteria: string[]; category?: string; difficulty?: string }>;
  builtin?: boolean;
};

const CATEGORY_COLORS: Record<string, string> = {
  coding: '#6366F1',
  reasoning: '#06B6D4',
  summarization: '#10B981',
  'creative-writing': '#F59E0B',
  'instruction-following': '#EC4899',
  custom: '#8B949E',
};

const defaultForm = {
  name: '',
  description: '',
  category: 'custom',
  tests: [{ id: 'test-1', prompt: '', expected_criteria: ['accurate', 'relevant'], category: 'general', difficulty: 'medium' }],
};

export default function SuitesPage() {
  const [suites, setSuites] = useState<Suite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [selectedSuite, setSelectedSuite] = useState<Suite | null>(null);

  const fetchSuites = () => {
    fetch('/api/suites').then(r => r.json()).then(setSuites).finally(() => setLoading(false));
  };

  useEffect(() => { fetchSuites(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      let payload = form;
      if (jsonMode) {
        const parsed = JSON.parse(jsonText);
        payload = { name: parsed.name, description: parsed.description, category: parsed.category || 'custom', tests: parsed.tests };
      }
      const res = await fetch('/api/suites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setShowCreate(false);
        setForm(defaultForm);
        fetchSuites();
      }
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this suite?')) return;
    await fetch(`/api/suites/${id}`, { method: 'DELETE' });
    fetchSuites();
  };

  const addTest = () => {
    setForm(f => ({
      ...f,
      tests: [...f.tests, {
        id: `test-${f.tests.length + 1}`,
        prompt: '',
        expected_criteria: ['accurate', 'relevant'],
        category: 'general',
        difficulty: 'medium',
      }],
    }));
  };

  const updateTest = (i: number, key: string, value: string | string[]) => {
    setForm(f => ({
      ...f,
      tests: f.tests.map((t, j) => j === i ? { ...t, [key]: value } : t),
    }));
  };

  const removeTest = (i: number) => {
    setForm(f => ({ ...f, tests: f.tests.filter((_, j) => j !== i) }));
  };

  const groupedSuites = suites.reduce((acc, s) => {
    const cat = s.category || 'custom';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s);
    return acc;
  }, {} as Record<string, Suite[]>);

  return (
    <div className="max-w-[1100px] mx-auto space-y-6">
      <PageHeader
        title="Test Suites"
        subtitle="Browse and manage benchmark test collections"
        icon={BookOpen}
        actions={
          <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2 text-sm">
            <Plus className="w-4 h-4" /> Create Suite
          </button>
        }
      />

      {loading ? (
        <div className="grid grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="glass rounded-2xl h-40 shimmer border border-border" />)}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedSuites).map(([category, catSuites]) => (
            <div key={category}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xs px-2.5 py-1 rounded-full font-medium capitalize"
                  style={{ background: (CATEGORY_COLORS[category] || '#8B949E') + '20', color: CATEGORY_COLORS[category] || '#8B949E', border: `1px solid ${CATEGORY_COLORS[category] || '#8B949E'}30` }}>
                  {category.replace('-', ' ')}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                {catSuites.map(suite => (
                  <SuiteCard key={suite.id} suite={suite} onDelete={handleDelete} onClick={() => setSelectedSuite(suite)} categoryColor={CATEGORY_COLORS[category] || '#8B949E'} />
                ))}
              </div>
            </div>
          ))}
          {suites.length === 0 && (
            <div className="glass rounded-2xl p-16 text-center border border-border">
              <BookOpen className="w-14 h-14 text-text-muted mx-auto mb-4" />
              <h3 className="font-semibold text-text-primary mb-2">No suites yet</h3>
              <p className="text-text-muted text-sm mb-6">Create a custom suite or check the suites/ folder</p>
              <button onClick={() => setShowCreate(true)} className="btn-primary inline-flex items-center gap-2">
                <Plus className="w-4 h-4" /> Create Suite
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-auto" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="glass-bright rounded-2xl w-full max-w-2xl border border-border-bright shadow-2xl my-4">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="font-semibold text-text-primary flex items-center gap-2">
                <Plus className="w-4 h-4 text-accent" /> Create Test Suite
              </h2>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 glass rounded-lg p-1">
                  <button onClick={() => setJsonMode(false)}
                    className={clsx('text-xs px-3 py-1.5 rounded-md transition-all', !jsonMode ? 'bg-accent text-white' : 'text-text-muted')}>
                    Form
                  </button>
                  <button onClick={() => { setJsonMode(true); setJsonText(JSON.stringify({ name: form.name, description: form.description, category: form.category, tests: form.tests }, null, 2)); }}
                    className={clsx('text-xs px-3 py-1.5 rounded-md transition-all', jsonMode ? 'bg-accent text-white' : 'text-text-muted')}>
                    JSON
                  </button>
                </div>
                <button onClick={() => setShowCreate(false)} className="text-text-muted hover:text-text-primary">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[70vh] overflow-auto">
              <form onSubmit={handleCreate}>
                {!jsonMode ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-text-secondary mb-1 block">Suite Name *</label>
                        <input className="input-field" placeholder="My Test Suite" value={form.name}
                          onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
                      </div>
                      <div>
                        <label className="text-xs text-text-secondary mb-1 block">Category</label>
                        <select className="input-field" value={form.category}
                          onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                          {['custom', 'coding', 'reasoning', 'summarization', 'creative-writing', 'instruction-following'].map(c => (
                            <option key={c} value={c} className="bg-surface-2 capitalize">{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-text-secondary mb-1 block">Description</label>
                      <input className="input-field" placeholder="Brief description..." value={form.description}
                        onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <label className="text-xs text-text-secondary">Test Cases ({form.tests.length})</label>
                        <button type="button" onClick={addTest} className="text-xs text-accent hover:text-accent-light flex items-center gap-1">
                          <Plus className="w-3 h-3" /> Add Test
                        </button>
                      </div>
                      <div className="space-y-3">
                        {form.tests.map((test, i) => (
                          <div key={i} className="bg-surface-3 rounded-xl p-4 border border-border">
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-xs text-text-muted font-mono">Test #{i + 1}</span>
                              {form.tests.length > 1 && (
                                <button type="button" onClick={() => removeTest(i)} className="text-text-muted hover:text-rose-accent transition-colors">
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                            <textarea
                              className="input-field text-xs mb-2 h-20 resize-none font-mono"
                              placeholder="Enter prompt for this test..."
                              value={test.prompt}
                              onChange={e => updateTest(i, 'prompt', e.target.value)}
                            />
                            <input
                              className="input-field text-xs"
                              placeholder="Criteria (comma-separated): accurate, relevant, concise"
                              value={test.expected_criteria.join(', ')}
                              onChange={e => updateTest(i, 'expected_criteria', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-xs text-text-muted mb-2">Paste JSON in the suite format</p>
                    <textarea
                      className="input-field font-mono text-xs h-72 resize-none"
                      value={jsonText}
                      onChange={e => setJsonText(e.target.value)}
                      placeholder='{"name": "My Suite", "tests": [...]}'
                    />
                  </div>
                )}

                <div className="flex gap-3 mt-6">
                  <button type="button" onClick={() => setShowCreate(false)} className="btn-secondary flex-1">Cancel</button>
                  <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                    {saving ? 'Saving...' : <><Check className="w-4 h-4" /> Create Suite</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* View Suite Modal */}
      {selectedSuite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-auto" onClick={() => setSelectedSuite(null)} style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
          <div className="glass-bright rounded-2xl w-full max-w-3xl border border-border-bright shadow-2xl my-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: (CATEGORY_COLORS[selectedSuite.category || 'custom'] || CATEGORY_COLORS.custom) + '20', border: `1px solid ${(CATEGORY_COLORS[selectedSuite.category || 'custom'] || CATEGORY_COLORS.custom)}30` }}>
                  <BookOpen className="w-5 h-5" style={{ color: CATEGORY_COLORS[selectedSuite.category || 'custom'] || CATEGORY_COLORS.custom }} />
                </div>
                <div>
                  <h2 className="font-semibold text-text-primary text-lg">{selectedSuite.name}</h2>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-text-muted capitalize">{selectedSuite.category?.replace('-', ' ') || 'Custom'}</span>
                    <span className="text-xs text-text-muted">• {selectedSuite.tests.length} tests</span>
                    {selectedSuite.builtin && <span className="text-[10px] bg-accent/15 text-accent px-1.5 py-0.5 rounded-sm border border-accent/20">Built-in</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link href={`/benchmark`} title="Run benchmark with this suite" className="btn-primary flex items-center gap-2 text-sm px-4">
                  <FlaskConical className="w-4 h-4" /> Run
                </Link>
                <button onClick={() => setSelectedSuite(null)} className="p-2 text-text-muted hover:text-text-primary bg-surface/50 hover:bg-surface-2 rounded-lg transition-colors border border-border">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[60vh] overflow-auto space-y-4">
              {selectedSuite.description && (
                <div className="bg-surface-2 rounded-xl p-4 border border-border">
                  <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2">Description</h3>
                  <p className="text-sm text-text-primary leading-relaxed">{selectedSuite.description}</p>
                </div>
              )}

              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider mb-2 drop-shadow-sm flex items-center gap-2">Test Cases</h3>
              <div className="space-y-3">
                {selectedSuite.tests.map((test, i) => (
                  <div key={test.id || i} className="bg-surface-2/50 rounded-xl p-4 border border-border hover:border-border-bright transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs font-mono text-accent">Test #{i + 1}</span>
                      {test.difficulty && (
                        <span className="text-[10px] uppercase font-bold text-text-muted tracking-wider">{test.difficulty}</span>
                      )}
                    </div>
                    <div className="text-sm text-text-primary mb-3 whitespace-pre-wrap leading-relaxed">{test.prompt}</div>
                    
                    {test.expected_criteria && test.expected_criteria.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {test.expected_criteria.map((criteria, j) => (
                          <span key={j} className="text-xs bg-surface-3 text-text-secondary px-2 py-1 rounded-md border border-border/50">
                            {criteria}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SuiteCard({ suite, onDelete, onClick, categoryColor }: { suite: Suite; onDelete: (id: string) => void; onClick: () => void; categoryColor: string }) {
  return (
    <div 
      className="glass rounded-2xl p-5 border border-border hover:border-border-bright transition-all duration-300 hover:scale-[1.02] group relative cursor-pointer"
      onClick={onClick}
    >
      <div className="absolute top-0 left-0 right-0 h-0.5 rounded-t-2xl" style={{ background: categoryColor }} />

      <div className="flex items-start justify-between mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: categoryColor + '20', border: `1px solid ${categoryColor}30` }}>
          <BookOpen className="w-4 h-4" style={{ color: categoryColor }} />
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Link href={`/benchmark`}
            onClick={(e) => e.stopPropagation()}
            className="p-1.5 hover:bg-accent/10 rounded-lg transition-colors" title="Run benchmark with this suite">
            <FlaskConical className="w-3.5 h-3.5 text-accent" />
          </Link>
          {!suite.builtin && (
            <button onClick={(e) => { e.stopPropagation(); onDelete(suite.id); }} className="p-1.5 hover:bg-rose-accent/10 rounded-lg transition-colors">
              <Trash2 className="w-3.5 h-3.5 text-text-muted hover:text-rose-accent" />
            </button>
          )}
        </div>
      </div>

      <h3 className="font-semibold text-sm text-text-primary mb-1">{suite.name}</h3>
      {suite.description && <p className="text-xs text-text-muted mb-3 line-clamp-2">{suite.description}</p>}

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-text-muted">{suite.tests.length} tests</span>
        {suite.builtin && (
          <span className="text-xs bg-accent/15 text-accent px-1.5 py-0.5 rounded-full border border-accent/20">Built-in</span>
        )}
      </div>
    </div>
  );
}
