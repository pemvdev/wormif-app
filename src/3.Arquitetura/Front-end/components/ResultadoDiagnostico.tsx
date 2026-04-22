import {
  Bug,
  Dna,
  MapPin,
  ArrowRight,
  CheckCircle2,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { Card } from '@Front-end/components/ui/card';
import { Badge } from '@Front-end/components/ui/badge';
import { Progress } from '@Front-end/components/ui/progress';
import { Button } from '@Front-end/components/ui/button';
import type { DiagnosticoResponseDTO } from '@Front-end/dto/DiagnosticoResponseDTO';
import { estagioVidaLabels, type EstagioVida } from '@Front-end/model/Diagnostico';

interface ResultadoDiagnosticoProps {
  resultado: DiagnosticoResponseDTO | null;
  isLoading: boolean;
  onNovaAnalise: () => void;
}

export function ResultadoDiagnostico({
  resultado,
  isLoading,
  onNovaAnalise
}: ResultadoDiagnosticoProps) {
  if (isLoading) {
    return (
      <Card className="p-8 bg-card border-border">
        <div className="flex flex-col items-center gap-6">
          <div className="relative">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
            <div className="relative p-6 rounded-full bg-gradient-to-br from-primary to-accent">
              <Loader2 className="w-10 h-10 text-white animate-spin" />
            </div>
          </div>
          <div className="text-center">
            <h3 className="text-xl font-semibold text-foreground">
              Analisando espécime...
            </h3>
            <p className="text-muted-foreground mt-2">
              Identificando espécie e estágio de vida
            </p>
          </div>
          <Progress value={66} className="w-48" />
        </div>
      </Card>
    );
  }

  if (!resultado) {
    return null;
  }

  if (!resultado.success || !resultado.data) {
    return (
      <Card className="p-8 bg-destructive/10 border-destructive/30">
        <div className="text-center">
          <p className="text-destructive font-semibold">
            {resultado.error || 'Não foi possível analisar a imagem'}
          </p>
          <Button onClick={onNovaAnalise} variant="outline" className="mt-4">
            <RefreshCw className="w-4 h-4 mr-2" />
            Tentar novamente
          </Button>
        </div>
      </Card>
    );
  }

  const { data } = resultado;
  const confiancaPercent = Math.round(data.nivelConfianca * 100);

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-card to-primary/5 border-primary/20">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Bug className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Espécie Identificada
              </span>
            </div>
            <h2 className="text-2xl font-bold text-foreground italic">
              {data.especie}
            </h2>
            <p className="text-lg text-muted-foreground mt-1">
              {data.nomeComum}
            </p>
          </div>
          
          <Badge 
            variant={data.estagioVida === 'desconhecido' ? 'secondary' : 'default'}
            className="text-sm px-4 py-2 bg-secondary text-secondary-foreground"
          >
            {estagioVidaLabels[data.estagioVida as EstagioVida] || data.estagioVida}
          </Badge>
        </div>

        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">
              Nível de confiança
            </span>
            <span className="text-sm font-bold text-primary">
              {confiancaPercent}%
            </span>
          </div>
          <Progress value={confiancaPercent} className="h-2" />
        </div>
      </Card>

      <Card className="p-6 bg-card border-border">
        <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
          <Dna className="w-5 h-5 text-primary" />
          Descrição
        </h3>
        <p className="text-foreground/80 leading-relaxed">
          {data.descricao}
        </p>
      </Card>

      {data.caracteristicas.length > 0 && (
        <Card className="p-6 bg-card border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary" />
            Características Identificadas
          </h3>
          <ul className="space-y-2">
            {data.caracteristicas.map((carac, index) => (
              <li key={index} className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-accent mt-2 shrink-0" />
                <span className="text-foreground/80">{carac}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {data.habitat && (
        <Card className="p-6 bg-card border-border">
          <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Habitat Natural
          </h3>
          <p className="text-foreground/80 leading-relaxed">
            {data.habitat}
          </p>
        </Card>
      )}

      {data.cicloDeVida && (
        <Card className="p-6 bg-gradient-to-br from-card to-accent/5 border-accent/20">
          <h3 className="text-lg font-semibold text-foreground mb-3 flex items-center gap-2">
            <RefreshCw className="w-5 h-5 text-accent" />
            Ciclo de Vida
          </h3>
          <p className="text-foreground/80 leading-relaxed">
            {data.cicloDeVida}
          </p>
          
          {data.proximoEstagio && (
            <div className="mt-4 p-4 bg-accent/10 rounded-xl">
              <div className="flex items-center gap-2 text-accent font-medium">
                <ArrowRight className="w-4 h-4" />
                <span>Próximo estágio:</span>
              </div>
              <p className="text-foreground/80 mt-2">
                {data.proximoEstagio}
              </p>
            </div>
          )}
        </Card>
      )}

      <Button 
        onClick={onNovaAnalise} 
        size="lg" 
        className="w-full bg-primary hover:bg-primary/90"
      >
        <RefreshCw className="w-5 h-5 mr-2" />
        Nova Análise
      </Button>
    </div>
  );
}
