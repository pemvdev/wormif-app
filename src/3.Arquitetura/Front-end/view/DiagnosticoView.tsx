import { useState, useCallback, useMemo } from 'react';
import { Leaf, Bug, Egg } from 'lucide-react';
import { Button } from '@Front-end/components/ui/button';
import { UploadImagem } from '@Front-end/components/UploadImagem';
import { ResultadoDiagnostico } from '@Front-end/components/ResultadoDiagnostico';
import { useFileValidator } from '../hooks/useFileValidator.ts';
import { DiagnosticoService } from '@Front-end/service/DiagnosticoService';
import type { DiagnosticoResponseDTO } from '@Front-end/dto/DiagnosticoResponseDTO';

export default function DiagnosticoView() {
  const { file, preview, base64, error, isLoading: fileLoading, handleFile, reset } = useFileValidator();
  const [resultado, setResultado] = useState<DiagnosticoResponseDTO | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const diagnosticoService = useMemo(() => new DiagnosticoService(), []);

  const handleAnalise = useCallback(async () => {
    if (!base64 || !file) return;

    setIsAnalyzing(true);
    setResultado(null);

    try {
      const response = await diagnosticoService.analisar(base64, file.type, file.name);
      setResultado(response);
    } catch {
      setResultado({
        success: false,
        error: 'Erro ao conectar com o servidor. Tente novamente.'
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [base64, file, diagnosticoService]);

  const handleNovaAnalise = useCallback(() => {
    reset();
    setResultado(null);
  }, [reset]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-secondary/20 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-2xl mx-auto px-4 py-12">
        <header className="text-center mb-12">
          <div className="inline-flex items-center justify-center gap-3 mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse" />
              <div className="relative p-4 bg-gradient-to-br from-primary to-primary/80 rounded-full">
                <Bug className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold text-foreground tracking-tight">Wormif</h1>
          <p className="text-lg text-muted-foreground mt-4 max-w-md mx-auto">
            Identificação de espécies em todos os estágios de vida usando inteligência artificial
          </p>

          <div className="flex flex-wrap justify-center gap-3 mt-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border text-sm">
              <Egg className="w-4 h-4 text-secondary" />
              Ovos
            </span>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border text-sm">
              <Bug className="w-4 h-4 text-primary" />
              Larvas
            </span>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border text-sm">
              <Leaf className="w-4 h-4 text-accent" />
              Adultos
            </span>
          </div>
        </header>

        <main className="space-y-8">
          <section>
            <UploadImagem
              preview={preview}
              error={error}
              isLoading={fileLoading}
              onFileSelect={handleFile}
              onReset={handleNovaAnalise}
              disabled={isAnalyzing}
            />

            {preview && !resultado && (
              <Button
                onClick={handleAnalise}
                disabled={isAnalyzing || !base64}
                size="lg"
                className="w-full mt-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-lg py-6"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3" />
                    Analisando...
                  </>
                ) : (
                  <>
                    <Bug className="w-5 h-5 mr-2" />
                    Identificar Espécie
                  </>
                )}
              </Button>
            )}
          </section>

          <section>
            <ResultadoDiagnostico
              resultado={resultado}
              isLoading={isAnalyzing}
              onNovaAnalise={handleNovaAnalise}
            />
          </section>
        </main>

        <footer className="mt-16 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            Powered by IA • Identifica larvas, ninfas, pupas e formas adultas
          </p>
          <p className="text-xs text-muted-foreground/90 max-w-lg mx-auto leading-relaxed">
            Criadores: Matheus Oliveira, Pedro Valim, Thales Andre, Arthur e Ryan
          </p>
        </footer>
      </div>
    </div>
  );
}
