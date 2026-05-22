import { CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { useApp } from '@Front-end/context/AppContext';
import { Button } from '@Front-end/components/ui/button';

export function ToastBanner() {
  const { toast, dismissToast } = useApp();
  if (!toast) return null;

  const Icon =
    toast.type === 'success' ? CheckCircle2 : toast.type === 'error' ? XCircle : Info;

  const tone =
    toast.type === 'success'
      ? 'bg-primary/10 border-primary/30 text-foreground'
      : toast.type === 'error'
        ? 'bg-destructive/10 border-destructive/30 text-foreground'
        : 'bg-card border-border text-foreground';

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-4 left-1/2 z-[100] w-[min(100%-2rem,28rem)] -translate-x-1/2 flex items-start gap-3 rounded-2xl border px-4 py-3 shadow-lg ${tone}`}
    >
      <Icon className="w-5 h-5 shrink-0 mt-0.5 text-primary" aria-hidden />
      <p className="text-sm font-medium flex-1">{toast.text}</p>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-8 w-8 shrink-0"
        onClick={dismissToast}
        aria-label="Fechar mensagem"
      >
        <X className="w-4 h-4" />
      </Button>
    </div>
  );
}
