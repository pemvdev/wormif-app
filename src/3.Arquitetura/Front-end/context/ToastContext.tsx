import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export type ToastType = 'success' | 'error' | 'info';
export interface ToastMessage { id: string; type: ToastType; text: string }
interface ToastContextValue {
  toast: ToastMessage | null;
  showToast: (type: ToastType, text: string) => void;
  dismissToast: () => void;
}
const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const showToast = useCallback((type: ToastType, text: string) => {
    const id = crypto.randomUUID();
    setToast({ id, type, text });
    window.setTimeout(() => setToast((current) => current?.id === id ? null : current), 4000);
  }, []);
  const dismissToast = useCallback(() => setToast(null), []);
  const value = useMemo(() => ({ toast, showToast, dismissToast }), [toast, showToast, dismissToast]);
  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
