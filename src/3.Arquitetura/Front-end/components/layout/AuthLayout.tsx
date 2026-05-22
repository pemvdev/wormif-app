import { Outlet, Navigate } from 'react-router';
import { Bug, Camera, History, Sparkles } from 'lucide-react';
import { useApp } from '@Front-end/context/AppContext';
import { BrandLogo } from '@Front-end/components/layout/BrandLogo';
import { ToastBanner } from '@Front-end/components/layout/ToastBanner';
import { Card } from '@Front-end/components/ui/card';

const highlights = [
  {
    icon: Camera,
    title: 'Foto em campo',
    description: 'Envie uma imagem nítida do espécime direto do celular ou câmera.'
  },
  {
    icon: Sparkles,
    title: 'IA especializada',
    description: 'Identificação de espécie e estágio de vida com nível de confiança.'
  },
  {
    icon: History,
    title: 'Histórico local',
    description: 'Consulte análises anteriores, exporte e georreferencie coletas.'
  },
  {
    icon: Bug,
    title: 'Foco em pragas',
    description: 'Pensado para técnicos, pesquisadores e produtores em atividades de campo.'
  }
];

export function AuthLayout() {
  const { user } = useApp();

  if (user) {
    return <Navigate to="/upload" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 flex flex-col">
      <a
        href="#conteudo-auth"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 bg-primary text-primary-foreground px-4 py-2 rounded-lg"
      >
        Ir para o formulário
      </a>

      <header className="px-4 py-6 flex justify-center lg:justify-start lg:px-10">
        <BrandLogo />
      </header>

      <main
        id="conteudo-auth"
        className="flex-1 flex items-center justify-center px-4 pb-12 lg:px-10"
      >
        <div className="w-full max-w-5xl grid gap-10 lg:grid-cols-2 lg:items-center">
          <section className="hidden lg:block space-y-6 pr-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Identifique insetos e estágios de vida em minutos
              </h1>
              <p className="text-muted-foreground mt-3 leading-relaxed">
                O Wormif combina upload de imagem, inteligência artificial e histórico para apoiar
                decisões rápidas no campo — sem depender de laboratório em toda coleta.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {highlights.map(({ icon: Icon, title, description }) => (
                <Card key={title} className="p-4 border-border/80 bg-card/80">
                  <Icon className="w-5 h-5 text-primary mb-2" aria-hidden />
                  <h2 className="font-semibold text-sm">{title}</h2>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{description}</p>
                </Card>
              ))}
            </div>
          </section>

          <div className="w-full max-w-md mx-auto lg:max-w-none">
            <Outlet />
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-muted-foreground pb-6 px-4 space-y-1">
        <p>Identificação de espécies e estágios de vida com apoio de IA</p>
        <p className="lg:hidden">Protótipo educacional — dados salvos localmente no navegador</p>
      </footer>

      <ToastBanner />
    </div>
  );
}
