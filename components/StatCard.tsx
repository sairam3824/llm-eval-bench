'use client';

import { clsx } from 'clsx';
import { LucideIcon } from 'lucide-react';

type StatCardProps = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  color?: 'accent' | 'cyan' | 'emerald' | 'rose' | 'amber';
  className?: string;
};

const colorMap = {
  accent: {
    bg: 'bg-accent/10',
    border: 'border-accent/20',
    icon: 'text-accent',
    iconBg: 'bg-accent/15',
    glow: 'shadow-[0_0_20px_rgba(99,102,241,0.15)]',
  },
  cyan: {
    bg: 'bg-cyan-accent/10',
    border: 'border-cyan-accent/20',
    icon: 'text-cyan-accent',
    iconBg: 'bg-cyan-accent/15',
    glow: 'shadow-[0_0_20px_rgba(6,182,212,0.15)]',
  },
  emerald: {
    bg: 'bg-emerald-accent/10',
    border: 'border-emerald-accent/20',
    icon: 'text-emerald-accent',
    iconBg: 'bg-emerald-accent/15',
    glow: 'shadow-[0_0_20px_rgba(16,185,129,0.15)]',
  },
  rose: {
    bg: 'bg-rose-accent/10',
    border: 'border-rose-accent/20',
    icon: 'text-rose-accent',
    iconBg: 'bg-rose-accent/15',
    glow: 'shadow-[0_0_20px_rgba(244,63,94,0.15)]',
  },
  amber: {
    bg: 'bg-amber-accent/10',
    border: 'border-amber-accent/20',
    icon: 'text-amber-accent',
    iconBg: 'bg-amber-accent/15',
    glow: 'shadow-[0_0_20px_rgba(245,158,11,0.15)]',
  },
};

export default function StatCard({ label, value, icon: Icon, trend, color = 'accent', className }: StatCardProps) {
  const colors = colorMap[color];

  return (
    <div className={clsx(
      'glass rounded-2xl p-6 transition-all duration-300 hover:scale-[1.02] cursor-default',
      colors.glow,
      `border ${colors.border}`,
      className
    )}>
      <div className="flex items-start justify-between mb-4">
        <div className={clsx('w-11 h-11 rounded-xl flex items-center justify-center', colors.iconBg)}>
          <Icon className={clsx('w-5 h-5', colors.icon)} />
        </div>
        {trend && (
          <span className={clsx(
            'text-xs font-medium px-2 py-1 rounded-full',
            trend.value >= 0 ? 'text-emerald-accent bg-emerald-accent/10' : 'text-rose-accent bg-rose-accent/10'
          )}>
            {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
          </span>
        )}
      </div>
      <div>
        <div className="text-3xl font-bold text-text-primary mb-1">{value}</div>
        <div className="text-sm text-text-secondary">{label}</div>
      </div>
    </div>
  );
}
