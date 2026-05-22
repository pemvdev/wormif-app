import type { LucideIcon } from 'lucide-react';
import { cn } from '@Front-end/lib/utils';

export interface PageStatItem {
  icon: LucideIcon;
  label: string;
  value: string;
}

interface PageStatsRowProps {
  items: PageStatItem[];
  className?: string;
}

export function PageStatsRow({ items, className }: PageStatsRowProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8',
        className
      )}
      role="list"
    >
      {items.map(({ icon: Icon, label, value }) => (
        <div
          key={label}
          role="listitem"
          className="rounded-2xl border border-border/80 bg-card/60 px-4 py-3"
        >
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Icon className="w-4 h-4 shrink-0" aria-hidden />
            <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
          </div>
          <p className="text-sm font-semibold text-foreground">{value}</p>
        </div>
      ))}
    </div>
  );
}
