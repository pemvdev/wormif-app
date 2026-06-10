import { NavLink, useLocation, useNavigate } from 'react-router';
import {
  Upload,
  Sparkles,
  FileText,
  History,
  MapPin,
  User,
  Settings,
  Crown,
  LogOut,
  LogIn,
  UserPlus,
  X
} from 'lucide-react';
import { BrandLogo } from '@Front-end/components/layout/BrandLogo';
import { Button } from '@Front-end/components/ui/button';
import { cn } from '@Front-end/lib/utils';
import { useAnalysisFlowNav } from '@Front-end/hooks/useAnalysisFlowNav';
import { useAnalysisFlow } from '@Front-end/context/AnalysisFlowContext';
import { useApp } from '@Front-end/context/AppContext';
import type { AnalysisFlowPath } from '@Front-end/utils/analysisFlowNav';
import { buildAuthRedirectState } from '@Front-end/utils/authRedirect';

export type NavSection = {
  title: string;
  items: {
    to: string;
    label: string;
    icon: typeof Upload;
    analysisStep?: AnalysisFlowPath;
    requiresAuth?: boolean;
  }[];
};

/** Navegação vertical: leitura em T (topo → coluna esquerda → conteúdo). */
export const sidebarSections: NavSection[] = [
  {
    title: 'Análise',
    items: [
      { to: '/upload', label: 'Upload de imagem', icon: Upload, analysisStep: '/upload' },
      {
        to: '/identificacao',
        label: 'Identificação IA',
        icon: Sparkles,
        analysisStep: '/identificacao'
      },
      { to: '/resultado', label: 'Resultados', icon: FileText, analysisStep: '/resultado' }
    ]
  },
  {
    title: 'Registros',
    items: [
      { to: '/historico', label: 'Histórico', icon: History, requiresAuth: true },
      { to: '/geolocalizacao', label: 'Geolocalização', icon: MapPin, requiresAuth: true }
    ]
  },
  {
    title: 'Conta',
    items: [
      { to: '/perfil', label: 'Meu perfil', icon: User, requiresAuth: true },
      { to: '/configuracoes', label: 'Configurações', icon: Settings, requiresAuth: true },
      { to: '/planos', label: 'Planos', icon: Crown, requiresAuth: true }
    ]
  }
];

interface AppSidebarProps {
  isLoggedIn: boolean;
  userName: string;
  userEmail: string;
  onLogout: () => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
  className?: string;
}

function NavItem({
  to,
  label,
  icon: Icon,
  analysisStep,
  requiresAuth,
  onNavigate
}: {
  to: string;
  label: string;
  icon: typeof Upload;
  analysisStep?: AnalysisFlowPath;
  requiresAuth?: boolean;
  onNavigate?: () => void;
}) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { navigateToAnalysisStep } = useAnalysisFlowNav();
  const { isAnalyzing } = useAnalysisFlow();
  const { user, showToast } = useApp();
  const isActive = pathname === to;

  const guardAuth = () => {
    if (!requiresAuth || user) return true;
    navigate('/login', { state: buildAuthRedirectState(to) });
    onNavigate?.();
    return false;
  };

  const handleClick = (e: React.MouseEvent) => {
    if (isAnalyzing) {
      e.preventDefault();
      showToast('info', 'Aguarde a identificação por IA terminar.');
      return;
    }
    if (!guardAuth()) {
      e.preventDefault();
      return;
    }
    if (analysisStep) {
      e.preventDefault();
      navigateToAnalysisStep(analysisStep, onNavigate);
      return;
    }
    onNavigate?.();
  };

  const className = cn(
    'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium min-h-11 transition-colors w-full',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    isActive
      ? 'bg-primary text-primary-foreground shadow-sm'
      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
    requiresAuth && !user && 'opacity-80'
  );

  if (analysisStep) {
    return (
      <button type="button" onClick={handleClick} className={className} aria-current={isActive ? 'page' : undefined}>
        <Icon className="w-5 h-5 shrink-0" aria-hidden />
        <span className="truncate">{label}</span>
      </button>
    );
  }

  const handleLinkClick = (e: React.MouseEvent) => {
    if (isAnalyzing) {
      e.preventDefault();
      showToast('info', 'Aguarde a identificação por IA terminar.');
      return;
    }
    if (!guardAuth()) {
      e.preventDefault();
      return;
    }
    onNavigate?.();
  };

  return (
    <NavLink to={to} onClick={handleLinkClick} className={className} aria-current={isActive ? 'page' : undefined}>
      <Icon className="w-5 h-5 shrink-0" aria-hidden />
      <span className="truncate">{label}</span>
    </NavLink>
  );
}

export function AppSidebar({
  isLoggedIn,
  userName,
  userEmail,
  onLogout,
  mobileOpen,
  onMobileClose,
  className
}: AppSidebarProps) {
  const navigate = useNavigate();

  return (
    <aside
      className={cn(
        'flex flex-col border-r border-border/80 bg-card/95 backdrop-blur-md',
        'w-[17rem] shrink-0',
        'fixed inset-y-0 left-0 z-50 lg:static lg:z-auto',
        'transition-transform duration-200 ease-out',
        mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
        className
      )}
      aria-label="Menu principal"
    >
      <div className="flex h-16 items-center justify-between gap-2 border-b border-border/80 px-4">
        <BrandLogo />
        {onMobileClose && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onMobileClose}
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        {sidebarSections.map((section) => (
          <div key={section.title}>
            <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {section.title}
            </p>
            <ul className="space-y-1" role="list">
              {section.items.map((item) => (
                <li key={item.to}>
                  <NavItem {...item} onNavigate={onMobileClose} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-border/80 p-4 space-y-3">
        {isLoggedIn ? (
          <>
            <div className="px-2 min-w-0">
              <p className="text-sm font-medium truncate">{userName}</p>
              <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full min-h-11 justify-start text-destructive hover:text-destructive"
              onClick={onLogout}
            >
              <LogOut className="w-4 h-4 mr-2 shrink-0" aria-hidden />
              Sair
            </Button>
          </>
        ) : (
          <>
            <div className="px-2">
              <p className="text-sm font-medium">Visitante</p>
              <p className="text-xs text-muted-foreground">Até 3 análises sem login</p>
            </div>
            <Button
              type="button"
              className="w-full min-h-11 justify-start"
              onClick={() => {
                onMobileClose?.();
                navigate('/login');
              }}
            >
              <LogIn className="w-4 h-4 mr-2 shrink-0" aria-hidden />
              Entrar
            </Button>
            <Button
              type="button"
              variant="outline"
              className="w-full min-h-11 justify-start"
              onClick={() => {
                onMobileClose?.();
                navigate('/cadastro');
              }}
            >
              <UserPlus className="w-4 h-4 mr-2 shrink-0" aria-hidden />
              Criar conta
            </Button>
          </>
        )}
      </div>
    </aside>
  );
}
