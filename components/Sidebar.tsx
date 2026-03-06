'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { useTheme } from 'next-themes';
import {
  LayoutDashboard, FlaskConical, BarChart3, Cpu, GitCompare,
  BookOpen, Settings, Zap, ChevronRight, Sun, Moon
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/benchmark', label: 'Run Benchmark', icon: FlaskConical },
  { href: '/results', label: 'Results', icon: BarChart3 },
  { href: '/compare', label: 'Compare', icon: GitCompare },
  { href: '/suites', label: 'Test Suites', icon: BookOpen },
  { href: '/models', label: 'Models', icon: Cpu },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <aside className="fixed left-0 top-0 h-full w-64 z-50 flex flex-col"
      style={{ background: 'var(--sidebar-bg, rgba(8,11,20,0.95))', borderRight: '1px solid var(--border)', backdropFilter: 'blur(20px)' }}>

      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="font-bold text-text-primary text-sm leading-none">LLM Eval Bench</h1>
            <p className="text-text-muted text-xs mt-0.5">Model Benchmarking</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        <p className="text-text-muted text-xs uppercase tracking-wider font-medium px-3 pb-2 pt-2">Navigation</p>
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={clsx(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
                active
                  ? 'bg-accent/15 text-accent border border-accent/30'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-2'
              )}
            >
              <Icon className={clsx('w-4 h-4 flex-shrink-0', active ? 'text-accent' : 'text-text-muted group-hover:text-text-secondary')} />
              <span className="flex-1">{label}</span>
              {active && <ChevronRight className="w-3 h-3 text-accent" />}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="p-4 border-t border-border space-y-2">
        {mounted && (
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-all duration-200 group"
          >
            <span className="flex items-center gap-3">
              {theme === 'dark' ? <Moon className="w-4 h-4 text-text-muted group-hover:text-text-secondary" /> : <Sun className="w-4 h-4 text-text-muted group-hover:text-text-secondary" />}
              <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
            </span>
          </button>
        )}
        <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-all duration-200 group">
          <Settings className="w-4 h-4 text-text-muted group-hover:text-text-secondary" />
          <span>Settings</span>
        </Link>
        <div className="px-3 py-3 rounded-xl bg-surface-2 border border-border">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 bg-emerald-accent rounded-full animate-pulse" />
            <span className="text-xs text-text-secondary font-medium">API Status</span>
          </div>
          <div className="space-y-1">
            {['OpenAI', 'Anthropic', 'Google', 'Mistral'].map(p => (
              <div key={p} className="flex items-center justify-between">
                <span className="text-xs text-text-muted">{p}</span>
                <span className="text-xs text-text-muted">—</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </aside>
  );
}
