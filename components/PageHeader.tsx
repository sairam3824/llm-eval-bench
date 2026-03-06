import { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';

type PageHeaderProps = {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  className?: string;
};

export default function PageHeader({ title, subtitle, icon: Icon, actions, className }: PageHeaderProps) {
  return (
    <div className={clsx('flex items-start justify-between mb-8', className)}>
      <div className="flex items-center gap-4">
        {Icon && (
          <div className="w-12 h-12 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center">
            <Icon className="w-6 h-6 text-accent" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-text-primary">{title}</h1>
          {subtitle && <p className="text-text-secondary text-sm mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </div>
  );
}
