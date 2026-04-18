import { type LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  action?: React.ReactNode;
}

export function PageHeader({ title, subtitle, icon: Icon, action }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 pb-6">
      <div className="flex items-center gap-3">
        {Icon && (
          <div
            className="flex size-10 items-center justify-center rounded-xl"
            style={{
              background: 'color-mix(in srgb, var(--sma-najm-700) 10%, transparent)',
            }}
          >
            <Icon className="size-5" style={{ color: 'var(--sma-najm-700)' }} />
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
