import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { MapPin, Download, Share2, History } from 'lucide-react';
import { PageHeader } from '@Front-end/components/layout/PageHeader';
import { PageContainer } from '@Front-end/components/layout/PageContainer';
import { AnalysisFlowStepper } from '@Front-end/components/layout/AnalysisFlowStepper';
import { ResultadoDiagnostico } from '@Front-end/components/ResultadoDiagnostico';
import { Badge } from '@Front-end/components/ui/badge';
import { Button } from '@Front-end/components/ui/button';
import { Card } from '@Front-end/components/ui/card';
import { useAnalysisFlow } from '@Front-end/context/AnalysisFlowContext';
import { useApp } from '@Front-end/context/AppContext';
import { PageInfoGrid } from '@Front-end/components/layout/PageInfoGrid';
import { ANALYSIS_FLOW_MESSAGES } from '@Front-end/utils/analysisFlowNav';
import { BookOpen, ClipboardList, Lightbulb } from 'lucide-react';

export default function DiagnosticoView() {
  const navigate = useNavigate();
  const { resultado, location, clearFlow } = useAnalysisFlow();
  const { user, showToast } = useApp();

  useEffect(() => {
    if (!resultado) {
      showToast('info', ANALYSIS_FLOW_MESSAGES.needUploadForResultado);
      navigate('/upload', { replace: true });
    }
  }, [resultado, navigate, showToast]);

  const handleNovaAnalise = () => {
    clearFlow();
    navigate('/upload');
  };

  const handleExport = () => {
    if (!resultado?.success || !resultado.data) return;
    const payload = JSON.stringify(resultado.data, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wormif-analise-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('success', 'Relatório exportado (JSON).');
  };

  const handleShare = async () => {
    if (!resultado?.success || !resultado.data) return;
    const text = `${resultado.data.nomeComum} (${resultado.data.especie}) — confiança ${Math.round(resultado.data.nivelConfianca * 100)}%`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Wormif — Análise', text });
        showToast('success', 'Compartilhado.');
      } else {
        await navigator.clipboard.writeText(text);
        showToast('success', 'Resumo copiado para a área de transferência.');
      }
    } catch {
      showToast('info', 'Compartilhamento cancelado.');
    }
  };

  if (!resultado) return null;

  return (
    <PageContainer width="form">
      <AnalysisFlowStepper />
      <PageHeader
        title="Resultado da análise"
        description="Informações sobre a espécie identificada, estágio de vida e nível de confiança da IA."
      />

      {!user && (
        <Card className="p-4 mb-4 border-primary/30 bg-primary/5">
          <p className="text-sm text-foreground">
            Esta análise ainda não está no histórico.{' '}
            <button
              type="button"
              className="text-primary font-medium hover:underline"
              onClick={() => navigate('/login')}
            >
              Faça login
            </button>{' '}
            para salvar suas análises gratuitas.
          </p>
        </Card>
      )}

      {user && location && (
        <Badge variant="outline" className="mb-4 gap-1">
          <MapPin className="w-3 h-3" aria-hidden />
          Registrado em: {location.label}
        </Badge>
      )}

      {resultado.success && resultado.data && (
        <div className="flex flex-wrap gap-2 mb-6">
          <Button type="button" variant="outline" className="min-h-10" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button type="button" variant="outline" className="min-h-10" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-2" />
            Compartilhar
          </Button>
          <Button
            type="button"
            variant="outline"
            className="min-h-10"
            onClick={() => navigate(user ? '/historico' : '/login', user ? undefined : { state: { from: '/historico' } })}
          >
            <History className="w-4 h-4 mr-2" />
            {user ? 'Ver histórico' : 'Entrar para ver histórico'}
          </Button>
        </div>
      )}

      <ResultadoDiagnostico
        resultado={resultado}
        isLoading={false}
        onNovaAnalise={handleNovaAnalise}
      />

      {resultado.success && (
        <PageInfoGrid
          className="mt-10"
          title="Próximos passos"
          subtitle="Use o resultado em campo ou consulte análises anteriores."
          items={[
            {
              icon: ClipboardList,
              title: 'Registrar no histórico',
              description: 'Cada identificação concluída fica salva localmente para consulta e busca por espécie.'
            },
            {
              icon: BookOpen,
              title: 'Exportar ficha',
              description: 'Baixe um JSON com os dados da análise para relatórios ou integração futura.'
            },
            {
              icon: Lightbulb,
              title: 'Validar em campo',
              description: 'Confira o estágio visualmente; a IA apoia a decisão, mas não substitui o olhar do técnico.'
            }
          ]}
          columns={3}
        />
      )}
    </PageContainer>
  );
}
