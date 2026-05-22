import type { LucideIcon } from 'lucide-react';
import { Card } from '@Front-end/components/ui/card';
import { cn } from '@Front-end/lib/utils';

export interface PageInfoItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface PageInfoGridProps {
  title?: string;
  subtitle?: string;
  items: PageInfoItem[];
  className?: string;
  columns?: 2 | 3;
}

export function PageInfoGrid({
  title,
  subtitle,
  items,
  className,
  columns = 2
}: PageInfoGridProps) {
  return (
    <section className={cn('space-y-4', className)} aria-labelledby={title ? 'page-info-title' : undefined}>
      {(title || subtitle) && (
        <div>
          {title && (
            <h2 id="page-info-title" className="text-lg font-semibold text-foreground">
              {title}
            </h2>
          )}
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </div>
      )}
      <div
        className={cn(
          'grid gap-4',
          columns === 3 ? 'sm:grid-cols-2 lg:grid-cols-3' : 'sm:grid-cols-2'
        )}
      >
        {items.map(({ icon: Icon, title: itemTitle, description }) => (
          <Card key={itemTitle} className="p-5 border-border/80 bg-card/80">
            <div className="flex gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                <Icon className="w-5 h-5 text-primary" aria-hidden />
              </span>
              <div className="min-w-0">
                <h3 className="font-medium text-foreground">{itemTitle}</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
