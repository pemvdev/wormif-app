import { Check, Crown, Sparkles, Zap, HelpCircle, ShieldCheck, Headphones } from 'lucide-react';
import { PageHeader } from '@Front-end/components/layout/PageHeader';
import { PageContainer } from '@Front-end/components/layout/PageContainer';
import { PageInfoGrid } from '@Front-end/components/layout/PageInfoGrid';
import { Card } from '@Front-end/components/ui/card';
import { useApp, type PlanId } from '@Front-end/context/AppContext';
import { Button } from '@Front-end/components/ui/button';
import { Badge } from '@Front-end/components/ui/badge';

const plans: {
  id: PlanId;
  name: string;
  price: string;
  period: string;
  icon: typeof Zap;
  highlight: boolean;
  features: string[];
}[] = [
  {
    id: 'free',
    name: 'Essencial',
    price: 'Grátis',
    period: '',
    icon: Zap,
    highlight: false,
    features: ['5 análises por mês', 'Histórico básico', 'Suporte por e-mail']
  },
  {
    id: 'pro',
    name: 'Campo Pro',
    price: 'R$ 29',
    period: '/mês',
    icon: Sparkles,
    highlight: true,
    features: [
      'Análises ilimitadas',
      'Geolocalização automática',
      'Exportação de relatórios',
      'Prioridade na fila de IA'
    ]
  },
  {
    id: 'enterprise',
    name: 'Equipes',
    price: 'Sob consulta',
    period: '',
    icon: Crown,
    highlight: false,
    features: [
      'Múltiplos usuários',
      'API dedicada',
      'Treinamento da equipe',
      'SLA personalizado'
    ]
  }
];

export default function PlanosView() {
  const { activePlanId, subscribePlan, showToast } = useApp();

  const handleSelect = (planId: PlanId, planName: string) => {
    if (planId === 'enterprise') {
      showToast('info', 'Nossa equipe entrará em contato em breve (simulação).');
      return;
    }
    if (activePlanId === planId) return;
    subscribePlan(planId, planName);
  };

  return (
    <PageContainer width="wide">
      <PageHeader
        title="Planos premium"
        description="Compare opções e contrate o plano ideal. Três alternativas claras para decisão rápida — do uso individual ao trabalho em equipe no campo."
      />

      <Card className="p-6 mb-8 border-primary/20 bg-gradient-to-r from-card to-primary/5">
        <p className="text-sm text-muted-foreground leading-relaxed">
          Todos os planos incluem identificação por IA, histórico local e suporte em português. Upgrade e
          downgrade são simulados neste protótipo — nenhuma cobrança real é processada.
        </p>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => {
          const Icon = plan.icon;
          const isCurrent = activePlanId === plan.id;

          return (
            <Card
              key={plan.id}
              className={`p-6 flex flex-col border-border/80 overflow-hidden ${
                plan.highlight ? 'ring-2 ring-primary shadow-lg' : ''
              }`}
            >
              <div className="flex flex-wrap gap-2 mb-4 min-h-6">
                {plan.highlight && !isCurrent && (
                  <Badge variant="default">Mais popular</Badge>
                )}
                {isCurrent && <Badge variant="outline">Plano atual</Badge>}
              </div>
              <div className="flex items-center gap-2 mb-4">
                <span className="p-2 rounded-xl bg-primary/10">
                  <Icon className="w-5 h-5 text-primary" aria-hidden />
                </span>
                <h2 className="text-xl font-bold">{plan.name}</h2>
              </div>
              <p className="text-3xl font-bold mb-1">
                {plan.price}
                {plan.period && (
                  <span className="text-base font-normal text-muted-foreground">{plan.period}</span>
                )}
              </p>
              <ul className="space-y-3 my-6 flex-1" role="list">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                size="lg"
                className="w-full min-h-12"
                variant={plan.highlight && !isCurrent ? 'default' : 'outline'}
                disabled={isCurrent && plan.id !== 'enterprise'}
                onClick={() => handleSelect(plan.id, plan.name)}
              >
                {isCurrent && plan.id !== 'enterprise'
                  ? 'Plano ativo'
                  : plan.id === 'enterprise'
                    ? 'Falar com vendas'
                    : 'Contratar plano'}
              </Button>
            </Card>
          );
        })}
      </div>

      <PageInfoGrid
        className="mt-12"
        title="Perguntas frequentes"
        items={[
          {
            icon: HelpCircle,
            title: 'Posso mudar de plano?',
            description: 'Sim. Selecione outro plano a qualquer momento; a alteração é salva localmente.'
          },
          {
            icon: ShieldCheck,
            title: 'Meus dados estão seguros?',
            description: 'Neste protótipo os dados ficam no navegador. Na versão com backend, seguirão políticas de privacidade.'
          },
          {
            icon: Headphones,
            title: 'Suporte',
            description: 'Plano Pro inclui prioridade; Equipes oferece treinamento e SLA sob consulta.'
          }
        ]}
        columns={3}
      />
    </PageContainer>
  );
}
