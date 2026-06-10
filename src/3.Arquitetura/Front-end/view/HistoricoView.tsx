import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { MapPin, Trash2, Bug, Search, Eye, BarChart3, Calendar, Filter } from 'lucide-react';
import { PageHeader } from '@Front-end/components/layout/PageHeader';
import { PageContainer } from '@Front-end/components/layout/PageContainer';
import { PageStatsRow } from '@Front-end/components/layout/PageStatsRow';
import { PageInfoGrid } from '@Front-end/components/layout/PageInfoGrid';
import { useApp } from '@Front-end/context/AppContext';
import { useAnalysisFlow } from '@Front-end/context/AnalysisFlowContext';
import { historyItemToResultado } from '@Front-end/service/MockDiagnosticoService';
import { diagnosticoFrontLabels } from '@/3.Arquitetura/Front-end/model/Diagnostico';
import { Card } from '@Front-end/components/ui/card';
import { Button } from '@Front-end/components/ui/button';
import { Input } from '@Front-end/components/ui/input';
import { Badge } from '@Front-end/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@Front-end/components/ui/alert-dialog';

export default function HistoricoView() {
  const navigate = useNavigate();
  const { history, removeAnalysis } = useApp();
  const { setResultado, setLocation } = useAnalysisFlow();
  const [query, setQuery] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const withGeo = history.filter((h) => h.localizacao).length;
  const avgConfidence =
    history.length > 0
      ? Math.round(
          (history.reduce((sum, h) => sum + h.nivelConfianca, 0) / history.length) * 100
        )
      : 0;

  const filtered = history.filter((item) => {
    const q = query.toLowerCase();
    return (
      item.especie.toLowerCase().includes(q) ||
      item.nomeComum.toLowerCase().includes(q) ||
      diagnosticoFrontLabels[item.diagnosticoFront].toLowerCase().includes(q)
    );
  });

  const handleDelete = () => {
    if (deleteId) {
      removeAnalysis(deleteId);
      setDeleteId(null);
    }
  };

  const handleViewDetails = (id: string) => {
    const item = history.find((h) => h.id === id);
    if (!item) return;
    setResultado(historyItemToResultado(item));
    setLocation(item.localizacao ?? null);
    navigate('/resultado');
  };

  return (
    <PageContainer>
      <PageHeader
        title="Histórico de análises"
        description="Consulte identificações anteriores, com estágio, confiança da IA e localização em campo quando disponível. Busque por nome científico, comum ou estágio."
      />

      <PageStatsRow
        items={[
          { icon: Bug, label: 'Total', value: `${history.length} registros` },
          { icon: MapPin, label: 'Com GPS', value: `${withGeo} análises` },
          { icon: BarChart3, label: 'Confiança média', value: history.length ? `${avgConfidence}%` : '—' },
          { icon: Calendar, label: 'Período', value: history.length ? 'Últimos 30 dias' : 'Sem dados' }
        ]}
      />

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden />
        <Input
          type="search"
          placeholder="Buscar por espécie ou estágio..."
          className="pl-10"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          aria-label="Buscar no histórico"
        />
      </div>

      {filtered.length === 0 ? (
        <Card className="p-10 text-center border-dashed">
          <Bug className="w-12 h-12 mx-auto text-muted-foreground/50 mb-4" aria-hidden />
          <p className="font-medium text-foreground">Nenhuma análise encontrada</p>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto">
            {history.length === 0
              ? 'Envie uma imagem na tela de análise para começar seu histórico.'
              : 'Tente outro termo de busca.'}
          </p>
          <Button asChild className="mt-6" size="lg">
            <Link to="/upload">Nova análise</Link>
          </Button>
        </Card>
      ) : (
        <ul className="space-y-4" role="list">
          {filtered.map((item) => (
            <li key={item.id}>
              <Card className="p-5 border-border/80">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h2 className="text-lg font-semibold italic truncate">{item.especie}</h2>
                      <Badge variant="secondary">
                        {diagnosticoFrontLabels[item.diagnosticoFront]}
                      </Badge>
                    </div>
                    <p className="text-muted-foreground">{item.nomeComum}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {new Date(item.createdAt).toLocaleString('pt-BR')} · Confiança{' '}
                      {Math.round(item.nivelConfianca * 100)}%
                    </p>
                    {item.localizacao && (
                      <p className="text-sm text-primary mt-2 inline-flex items-center gap-1">
                        <MapPin className="w-4 h-4 shrink-0" aria-hidden />
                        {item.localizacao.label}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                    <Button
                      variant="default"
                      size="sm"
                      className="min-h-11"
                      onClick={() => handleViewDetails(item.id)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      Ver detalhes
                    </Button>

                    <AlertDialog
                      open={deleteId === item.id}
                      onOpenChange={(open) => !open && setDeleteId(null)}
                    >
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="min-h-11 text-destructive hover:text-destructive border-destructive/30"
                          onClick={() => setDeleteId(item.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir Análise
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir esta análise?</AlertDialogTitle>
                          <AlertDialogDescription>
                            A identificação de <strong>{item.nomeComum}</strong> será removida do
                            seu histórico. Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}

      <PageInfoGrid
        className="mt-10"
        title="Organize seu trabalho em campo"
        items={[
          {
            icon: Filter,
            title: 'Busca inteligente',
            description: 'Filtre por espécie ou estágio para encontrar coletas anteriores rapidamente.'
          },
          {
            icon: Eye,
            title: 'Ver detalhes',
            description: 'Reabra a ficha completa de qualquer análise salva, como se fosse um resultado novo.'
          },
          {
            icon: Trash2,
            title: 'Excluir com segurança',
            description: 'Remova registros incorretos; a confirmação evita exclusões acidentais.'
          }
        ]}
        columns={3}
      />
    </PageContainer>
  );
}
