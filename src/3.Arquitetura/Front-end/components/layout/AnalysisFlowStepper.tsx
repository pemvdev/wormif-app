import { useLocation } from 'react-router';
import { Check, Upload, Sparkles, FileText } from 'lucide-react';
import { cn } from '@Front-end/lib/utils';
import { useAnalysisFlowNav } from '@Front-end/hooks/useAnalysisFlowNav';
import type { AnalysisFlowPath } from '@Front-end/utils/analysisFlowNav';

const steps: {
  path: AnalysisFlowPath;
  label: string;
  icon: typeof Upload;
}[] = [
  { path: '/upload', label: 'Upload', icon: Upload },
  { path: '/identificacao', label: 'Identificação IA', icon: Sparkles },
  { path: '/resultado', label: 'Resultados', icon: FileText }
];

export function AnalysisFlowStepper() {
  const { pathname } = useLocation();
  const { navigateToAnalysisStep } = useAnalysisFlowNav();
  const currentIndex = steps.findIndex((s) => s.path === pathname);

  const handleStep = (path: AnalysisFlowPath) => {
    navigateToAnalysisStep(path);
  };

  return (
    <nav
      aria-label="Etapas da análise"
      className="mb-8 rounded-2xl border border-border/80 bg-card/60 p-4"
    >
      <ol className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-2">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = pathname === step.path;
          const isDone = currentIndex > index;

          return (
            <li key={step.path} className="flex items-center gap-2 flex-1 min-w-0">
              <button
                type="button"
                onClick={() => handleStep(step.path)}
                className={cn(
                  'flex items-center gap-2 rounded-xl px-3 py-2.5 min-h-11 w-full sm:w-auto text-sm font-medium transition-colors text-left',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                  isActive && 'bg-primary text-primary-foreground',
                  !isActive && isDone && 'text-primary hover:bg-muted/60',
                  !isActive && !isDone && 'text-muted-foreground hover:bg-muted/60'
                )}
                aria-current={isActive ? 'step' : undefined}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border',
                    isActive && 'border-primary-foreground/30 bg-primary-foreground/10',
                    isDone && !isActive && 'bg-primary/15 border-primary/30',
                    !isActive && !isDone && 'border-border'
                  )}
                >
                  {isDone && !isActive ? (
                    <Check className="w-4 h-4" aria-hidden />
                  ) : (
                    <Icon className="w-4 h-4" aria-hidden />
                  )}
                </span>
                <span className="truncate">{step.label}</span>
              </button>
              {index < steps.length - 1 && (
                <span className="hidden sm:block h-px flex-1 bg-border mx-1" aria-hidden />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
