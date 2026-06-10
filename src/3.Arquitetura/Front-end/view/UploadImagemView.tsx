import { useNavigate } from 'react-router';
import {
  ArrowRight,
  Egg,
  Bug,
  Leaf,
  ImagePlus,
  Camera,
  Sun,
  Focus,
  Clock,
  Layers
} from 'lucide-react';
import { PageHeader } from '@Front-end/components/layout/PageHeader';
import { PageContainer } from '@Front-end/components/layout/PageContainer';
import { PageInfoGrid } from '@Front-end/components/layout/PageInfoGrid';
import { PageStatsRow } from '@Front-end/components/layout/PageStatsRow';
import { AnalysisFlowStepper } from '@Front-end/components/layout/AnalysisFlowStepper';
import { UploadImagem } from '@Front-end/components/UploadImagem';
import { Button } from '@Front-end/components/ui/button';
import { Card } from '@Front-end/components/ui/card';
import { useFileValidator } from '@Front-end/hooks/useFileValidator';
import { useAnalysisFlow } from '@Front-end/context/AnalysisFlowContext';
import { useApp } from '@Front-end/context/AppContext';
import { SAMPLE_IMAGE_BASE64 } from '@Front-end/service/MockDiagnosticoService';

export default function UploadImagemView() {
  const navigate = useNavigate();
  const { setPending, clearFlow } = useAnalysisFlow();
  const { user, showToast, history, canAnalyze, guestRemainingAnalyses, guestDiagnosisLimit } =
    useApp();
  const { file, preview, base64, error, isLoading, handleFile, reset } = useFileValidator();

  const handleContinue = () => {
    if (!file || !base64 || !preview) return;
    if (!canAnalyze()) {
      showToast('info', 'Você usou as 3 análises gratuitas. Faça login para continuar.');
      navigate('/login');
      return;
    }
    setPending({
      preview,
      base64,
      mimeType: file.type,
      fileName: file.name
    });
    navigate('/identificacao');
  };

  const handleReset = () => {
    clearFlow();
    reset();
  };

  const handleSampleImage = async () => {
    const bytes = Uint8Array.from(atob(SAMPLE_IMAGE_BASE64), (c) => c.charCodeAt(0));
    const sampleFile = new File([bytes], 'exemplo-especime.png', { type: 'image/png' });
    const ok = await handleFile(sampleFile);
    if (ok) {
      showToast('success', 'Imagem de exemplo carregada.');
    }
  };

  return (
    <PageContainer width="form">
      <AnalysisFlowStepper />
      <PageHeader
        title="Upload de imagem"
        description="Envie uma foto nítida do inseto ou estágio de vida. A qualidade da imagem impacta diretamente a precisão da identificação por IA. Formatos aceitos: JPEG, PNG, WebP ou GIF (até 10 MB)."
      />

      {!user && (
        <Card className="p-4 mb-6 border-primary/30 bg-primary/5">
          <p className="text-sm text-foreground">
            <span className="font-semibold">
              {guestRemainingAnalyses} de {guestDiagnosisLimit} análises gratuitas
            </span>{' '}
            restantes sem login. Faça login depois para salvar o histórico.
          </p>
        </Card>
      )}

      <PageStatsRow
        items={[
          { icon: Layers, label: 'Etapas', value: '3 passos' },
          { icon: Clock, label: 'Tempo médio', value: '~2 min' },
          {
            icon: Bug,
            label: user ? 'Seu histórico' : 'Análises grátis',
            value: user ? `${history.length} análises` : `${guestRemainingAnalyses} restantes`
          },
          { icon: Camera, label: 'Resolução', value: 'Recom. HD+' }
        ]}
      />

      <div className="flex flex-wrap gap-3 mb-6">
        {[
          { icon: Egg, label: 'Ovos', hint: 'Agrupamentos ou postura' },
          { icon: Bug, label: 'Larvas', hint: 'Corpo segmentado' },
          { icon: Leaf, label: 'Adultos', hint: 'Asas e coloração' }
        ].map(({ icon: Icon, label, hint }) => (
          <span
            key={label}
            className="inline-flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 px-4 py-2.5 rounded-2xl bg-card border border-border text-sm"
          >
            <span className="inline-flex items-center gap-2 font-medium">
              <Icon className="w-4 h-4 text-primary" aria-hidden />
              {label}
            </span>
            <span className="text-xs text-muted-foreground sm:border-l sm:border-border sm:pl-2">
              {hint}
            </span>
          </span>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3 space-y-4">
          <UploadImagem
            preview={preview}
            error={error}
            isLoading={isLoading}
            onFileSelect={handleFile}
            onReset={handleReset}
          />

          {!preview && (
            <Button
              type="button"
              variant="secondary"
              className="w-full min-h-11"
              onClick={handleSampleImage}
            >
              <ImagePlus className="w-4 h-4 mr-2" />
              Usar imagem de exemplo
            </Button>
          )}

          {preview && base64 && (
            <Button
              type="button"
              onClick={handleContinue}
              size="lg"
              className="w-full min-h-14 text-lg"
            >
              Continuar para identificação
              <ArrowRight className="w-5 h-5 ml-2" aria-hidden />
            </Button>
          )}
        </div>

        <aside className="lg:col-span-2 space-y-4">
          <Card className="p-5 border-primary/20 bg-primary/5">
            <h2 className="font-semibold text-foreground mb-3">Checklist rápido</h2>
            <ol className="space-y-2 text-sm text-muted-foreground list-decimal list-inside">
              <li>Fundo neutro ou folha isolada</li>
              <li>Espécime centralizado e em foco</li>
              <li>Boa iluminação (evite sombras fortes)</li>
              <li>Um estágio por foto (ovo, larva ou adulto)</li>
            </ol>
          </Card>
          <PageInfoGrid
            title="Dicas de campo"
            items={[
              {
                icon: Sun,
                title: 'Luz natural',
                description: 'Fotografe de dia; evite flash que apaga detalhes do exoesqueleto.'
              },
              {
                icon: Focus,
                title: 'Macro estável',
                description: 'Aproxime com cuidado e mantenha o celular firme por 1–2 segundos.'
              }
            ]}
          />
        </aside>
      </div>

      <PageInfoGrid
        className="mt-10"
        title="Como funciona a análise"
        subtitle="Siga a ordem das etapas no topo da página ou pelo menu lateral."
        items={[
          {
            icon: Camera,
            title: '1. Upload',
            description: 'Selecione ou arraste a imagem do espécime. Você pode usar a imagem de exemplo para testar.'
          },
          {
            icon: Bug,
            title: '2. Identificação IA',
            description: 'O modelo estima espécie, nome comum e estágio de vida com nível de confiança.'
          },
          {
            icon: Layers,
            title: '3. Resultados',
            description: 'Revise a ficha, exporte, compartilhe ou salve automaticamente no histórico.'
          }
        ]}
        columns={3}
      />
    </PageContainer>
  );
}
