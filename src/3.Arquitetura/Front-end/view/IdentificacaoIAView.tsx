import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Sparkles,
  MapPin,
  X,
  Brain,
  Shield,
  Zap,
  CheckCircle2,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { PageHeader } from '@Front-end/components/layout/PageHeader';
import { PageContainer } from '@Front-end/components/layout/PageContainer';
import { AnalysisFlowStepper } from '@Front-end/components/layout/AnalysisFlowStepper';
import { Card } from '@Front-end/components/ui/card';
import { Progress } from '@Front-end/components/ui/progress';
import { Badge } from '@Front-end/components/ui/badge';
import { Button } from '@Front-end/components/ui/button';
import { useAnalysisFlow } from '@Front-end/context/AnalysisFlowContext';
import { useApp } from '@Front-end/context/AppContext';
import { analisarImagemComFallback } from '@Front-end/service/analisarImagemComFallback';
import { PageInfoGrid } from '@Front-end/components/layout/PageInfoGrid';
import { ANALYSIS_FLOW_MESSAGES } from '@Front-end/utils/analysisFlowNav';
import type { DiagnosticoResponseDTO } from '@/3.Arquitetura/Front-end/dto/DiagnosticoResponseDTO-Front';

type AnalysisPhase = 'analyzing' | 'complete' | 'error';

export default function IdentificacaoIAView() {
  const navigate = useNavigate();
  const { pending, resultado, setResultado, setLocation, location, clearFlow, setIsAnalyzing } =
    useAnalysisFlow();
  const { addAnalysisFromResult, resolveMockLocation, settings, showToast } = useApp();
  const [phase, setPhase] = useState<AnalysisPhase>('analyzing');
  const [progress, setProgress] = useState(12);
  const [statusText, setStatusText] = useState('Preparando imagem...');
  const [localResult, setLocalResult] = useState<DiagnosticoResponseDTO | null>(null);
  const started = useRef(false);
  const savedToHistory = useRef(false);

  const isAnalyzing = phase === 'analyzing';
  const displayResult = localResult ?? resultado;

  useEffect(() => {
    if (!pending) {
      showToast('info', ANALYSIS_FLOW_MESSAGES.needUploadForIdentificacao);
      navigate('/upload', { replace: true });
      return;
    }

    if (started.current) return;
    started.current = true;

    const loc = resolveMockLocation();
    setLocation(loc ?? null);

    const run = async () => {
      setIsAnalyzing(true);
      setPhase('analyzing');
      setStatusText('Enviando imagem para o modelo de IA...');
      setProgress(35);

      try {
        setStatusText('Identificando espécie e estágio de vida...');
        setProgress(68);

        const { response, source } = await analisarImagemComFallback(
          pending.base64,
          pending.mimeType,
          pending.fileName
        );

        setProgress(100);
        setResultado(response);
        setLocalResult(response);

        if (response.success && response.data) {
          setPhase('complete');
          setStatusText('Identificação concluída. Revise o resumo e avance quando quiser.');
          if (source === 'mock') {
            showToast(
              'info',
              'Servidor de IA indisponível — exibindo resultado de demonstração local.'
            );
          }
        } else {
          setPhase('error');
          setStatusText(response.error ?? 'Não foi possível identificar o espécime.');
          showToast('error', response.error ?? 'Falha na identificação.');
        }
      } catch {
        setPhase('error');
        setStatusText('Erro inesperado ao processar a imagem.');
        showToast('error', 'Erro inesperado ao processar a imagem.');
      } finally {
        setIsAnalyzing(false);
      }
    };

    void run();
  }, [
    pending,
    navigate,
    setResultado,
    setLocation,
    resolveMockLocation,
    showToast,
    setIsAnalyzing
  ]);

  const handleCancel = () => {
    if (isAnalyzing) return;
    clearFlow();
    showToast('info', 'Análise cancelada.');
    navigate('/upload');
  };

  const handleVerResultado = () => {
    if (!displayResult?.success || !displayResult.data) return;
    if (!savedToHistory.current) {
      addAnalysisFromResult(displayResult, location ?? undefined);
      savedToHistory.current = true;
    }
    navigate('/resultado');
  };

  const handleNovaAnalise = () => {
    clearFlow();
    navigate('/upload');
  };

  if (!pending) return null;

  return (
    <PageContainer width="form" className="relative">
      <div
        className={isAnalyzing ? 'pointer-events-none select-none opacity-60' : undefined}
        aria-hidden={isAnalyzing}
      >
        <AnalysisFlowStepper />
      </div>

      <div className={isAnalyzing ? 'relative' : undefined}>
        <PageHeader
          title="Identificação por IA"
          description={
            isAnalyzing
              ? 'Aguarde enquanto o modelo analisa a imagem. As demais ações ficam bloqueadas nesta etapa.'
              : 'Revise o resumo abaixo e avance para a ficha completa quando estiver pronto.'
          }
        />

        {settings.geolocationEnabled && location && (
          <Badge variant="outline" className="mb-4 gap-1">
            <MapPin className="w-3 h-3" aria-hidden />
            {location.label}
          </Badge>
        )}

        <Card className="p-8 border-primary/20 bg-gradient-to-br from-card to-primary/5">
          <div className="flex flex-col items-center text-center gap-6">
            <div className="relative">
              {isAnalyzing && (
                <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
              )}
              <div className="relative p-6 rounded-full bg-gradient-to-br from-primary to-primary/80">
                {phase === 'complete' ? (
                  <CheckCircle2 className="w-10 h-10 text-primary-foreground" aria-hidden />
                ) : isAnalyzing ? (
                  <Loader2 className="w-10 h-10 text-primary-foreground animate-spin" aria-hidden />
                ) : (
                  <Sparkles className="w-10 h-10 text-primary-foreground" aria-hidden />
                )}
              </div>
            </div>
            <div>
              <h2 className="text-xl font-semibold">
                {phase === 'complete'
                  ? 'Identificação concluída'
                  : phase === 'error'
                    ? 'Não foi possível concluir'
                    : 'Processando com inteligência artificial'}
              </h2>
              <p className="text-muted-foreground mt-2" role="status" aria-live="polite">
                {statusText}
              </p>
            </div>
            <Progress
              value={phase === 'complete' ? 100 : progress}
              className="w-full max-w-xs h-2"
              aria-label="Progresso da análise"
            />
          </div>
        </Card>

        {phase === 'complete' && displayResult?.success && displayResult.data && (
          <Card className="p-6 mt-6 border-primary/30 bg-primary/5">
            <p className="text-sm text-muted-foreground uppercase tracking-wide mb-1">
              Resumo da identificação
            </p>
            <p className="text-2xl font-bold italic">{displayResult.data.especie}</p>
            <p className="text-lg text-muted-foreground mt-1">{displayResult.data.nomeComum}</p>
            <p className="text-sm text-primary mt-3 font-medium">
              Confiança: {Math.round(displayResult.data.nivelConfianca * 100)}%
            </p>
          </Card>
        )}

        <div className="mt-6 rounded-2xl overflow-hidden border border-border">
          <img
            src={pending.preview}
            alt="Espécime em análise"
            className="w-full max-h-64 object-contain bg-muted/30"
          />
        </div>

        <div className="flex flex-col gap-3 mt-4">
          {phase === 'complete' && (
            <Button type="button" size="lg" className="w-full min-h-12" onClick={handleVerResultado}>
              Ver resultado completo
              <ArrowRight className="w-5 h-5 ml-2" aria-hidden />
            </Button>
          )}

          {phase === 'error' && (
            <Button type="button" size="lg" className="w-full min-h-12" onClick={handleNovaAnalise}>
              Tentar com outra imagem
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            className="w-full min-h-11"
            onClick={handleCancel}
            disabled={isAnalyzing}
          >
            <X className="w-4 h-4 mr-2" />
            {isAnalyzing ? 'Aguarde a identificação...' : 'Cancelar e voltar ao upload'}
          </Button>
        </div>
      </div>

      <PageInfoGrid
        className={`mt-10 ${isAnalyzing ? 'pointer-events-none opacity-50' : ''}`}
        title="O que a IA está fazendo"
        subtitle="Prioriza o servidor de IA; em caso de indisponibilidade, usa resultado local de demonstração."
        items={[
          {
            icon: Brain,
            title: 'Classificação visual',
            description:
              'Compara padrões de corpo, segmentação e textura com espécies conhecidas de pragas agrícolas.'
          },
          {
            icon: Zap,
            title: 'Estágio de vida',
            description:
              'Estima se o espécime está em fase de ovo, larva, pupa ou adulto com base na morfologia.'
          },
          {
            icon: Shield,
            title: 'Confiança',
            description: 'Cada resultado traz um percentual de confiança para apoiar a decisão em campo.'
          }
        ]}
        columns={3}
      />
    </PageContainer>
  );
}
