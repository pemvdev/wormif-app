import type { ReactNode } from 'react';
import { cn } from '@Front-end/lib/utils';

type PageWidth = 'form' | 'content' | 'wide';

const widthClass: Record<PageWidth, string> = {
  /** Formulários e fluxo de análise (upload, IA, resultado) */
  form: 'max-w-4xl',
  /** Listas, perfil, configurações, geo */
  content: 'max-w-4xl',
  /** Grids amplos (ex.: planos) */
  wide: 'max-w-6xl'
};

interface PageContainerProps {
  children: ReactNode;
  width?: PageWidth;
  className?: string;
}

/**
 * Centraliza o conteúdo de cada tela no mesmo eixo visual (coerência / comunicabilidade).
 */
export function PageContainer({ children, width = 'content', className }: PageContainerProps) {
  return (
    <div className={cn('w-full mx-auto', widthClass[width], className)}>{children}</div>
  );
}
