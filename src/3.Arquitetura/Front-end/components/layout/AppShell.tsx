import { useState } from 'react';
import { Outlet, useNavigate } from 'react-router';
import { Menu } from 'lucide-react';
import { AppSidebar } from '@Front-end/components/layout/AppSidebar';
import { ToastBanner } from '@Front-end/components/layout/ToastBanner';
import { useApp } from '@Front-end/context/AppContext';
import { Button } from '@Front-end/components/ui/button';

/**
 * Layout em T (UX): barra superior curta + navegação fixa à esquerda + conteúdo à direita.
 * O olhar percorre logo → menu vertical → área principal (padrão F/T de leitura).
 */
export function AppShell() {
  const { user, logout } = useApp();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <a
        href="#conteudo-principal"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[60] bg-primary text-primary-foreground px-4 py-2 rounded-lg"
      >
        Ir para o conteúdo principal
      </a>

      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden>
        <div className="absolute top-24 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-primary/[0.03] rounded-full blur-3xl" />
      </div>

      <div className="relative flex min-h-screen">
        {mobileNavOpen && (
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            aria-label="Fechar menu"
            onClick={() => setMobileNavOpen(false)}
          />
        )}

        <AppSidebar
          userName={user?.name ?? ''}
          userEmail={user?.email ?? ''}
          onLogout={handleLogout}
          mobileOpen={mobileNavOpen}
          onMobileClose={() => setMobileNavOpen(false)}
        />

        <div className="flex flex-1 flex-col min-w-0 lg:pl-0">
          <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border/80 bg-background/80 backdrop-blur-md px-4 lg:px-8">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="lg:hidden shrink-0"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Abrir menu"
              aria-expanded={mobileNavOpen}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </header>

          <main
            id="conteudo-principal"
            className="relative flex-1 w-full px-4 py-8 lg:px-8"
          >
            <Outlet />
          </main>
        </div>
      </div>

      <ToastBanner />
    </div>
  );
}
