import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { MapPin, Trash2, Bug, Search, Eye, BarChart3, Calendar, Filter, Loader2, ImageOff } from 'lucide-react';
import { PageHeader } from '@Front-end/components/layout/PageHeader';
import { PageContainer } from '@Front-end/components/layout/PageContainer';
import { PageStatsRow } from '@Front-end/components/layout/PageStatsRow';
import { PageInfoGrid } from '@Front-end/components/layout/PageInfoGrid';
import { useApp } from '@Front-end/context/AppContext';
import { useAnalysisFlow } from '@Front-end/context/AnalysisFlowContext';
import { historicoToResultado } from '@Front-end/utils/diagnosticoAdapter';
import { DiagnosticoService } from '@Front-end/service/DiagnosticoService';
import { estagioDiagnosticoLabels } from '@/3.Arquitetura/Front-end/model/Diagnostico';
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

const diagnosticoService = new DiagnosticoService();

function HistoricoImagem({ diagnosticoId, temImagem }: { diagnosticoId: number; temImagem: boolean }) {
  const [src, setSrc] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!temImagem) return;
    let active = true;
    let objectUrl: string | null = null;
    setFailed(false);
    void diagnosticoService.buscarImagem(diagnosticoId).then((blob) => {
      if (!active) return;
      objectUrl = URL.createObjectURL(blob);
      setSrc(objectUrl);
    }).catch(() => {
      if (active) setFailed(true);
    });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [diagnosticoId, temImagem]);

  return (
    <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-muted flex items-center justify-center sm:h-28 sm:w-28">
      {src ? (
        <img src={src} alt="Imagem usada nesta análise" loading="lazy" className="h-full w-full object-cover" />
      ) : temImagem && !failed ? (
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Carregando imagem" />
      ) : (
        <ImageOff className="h-6 w-6 text-muted-foreground" aria-label="Sem imagem salva" />
      )}
    </div>
  );
}

export default function HistoricoView() {
  const navigate = useNavigate();
  const { history, historyLoading, removeAnalysis, refreshHistory, showToast } = useApp();
  const { setResultado, setImagemResultado, setLocation } = useAnalysisFlow();
  const [query, setQuery] = useState('');
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    void refreshHistory();
    let refreshing = false;
    const refreshSilently = async () => {
      if (refreshing || document.visibilityState !== 'visible') return;
      refreshing = true;
      try { await refreshHistory({ silent: true }); }
      finally { refreshing = false; }
    };
    const interval = window.setInterval(() => void refreshSilently(), 30_000);
    window.addEventListener('focus', refreshSilently);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', refreshSilently);
    };
  }, [refreshHistory]);

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
      estagioDiagnosticoLabels[item.diagnosticoBack].toLowerCase().includes(q)
    );
  });

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      await removeAnalysis(deleteId);
      setDeleteId(null);
    } catch {
      showToast('error', 'Não foi possível excluir a análise.');
    } finally {
      setDeleting(false);
    }
  };

  const handleViewDetails = (id: number) => {
    const item = history.find((h) => h.id === id);
    if (!item) return;
    setResultado(
      historicoToResultado({
        id: item.id,
        data: item.createdAt,
        status: 'concluido',
        nivelConfianca: item.nivelConfianca,
        diagnosticoBack: item.diagnosticoBack,
        especie: item.especie,
        nomeComum: item.nomeComum,
        descricao: item.descricao ?? '',
        caracteristicas: item.caracteristicas ?? [],
        habitat: item.habitat ?? '',
      })
    );
    setImagemResultado(null);
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

      {historyLoading ? (
        <Card className="p-10 text-center border-dashed">
          <Loader2 className="w-10 h-10 mx-auto text-muted-foreground animate-spin mb-4" aria-hidden />
          <p className="text-muted-foreground">Carregando histórico...</p>
        </Card>
      ) : filtered.length === 0 ? (
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
                  <div className="flex min-w-0 flex-1 gap-4">
                    <HistoricoImagem diagnosticoId={item.id} temImagem={item.temImagem ?? false} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h2 className="text-lg font-semibold italic truncate">{item.especie}</h2>
                        <Badge variant="secondary">
                          {estagioDiagnosticoLabels[item.diagnosticoBack]}
                        </Badge>
                        {(item.totalRespostas ?? 0) > 0 && <button type="button"
                          data-testid={`respostas-${item.id}`}
                          title={`${item.totalRespostas} ${item.totalRespostas === 1 ? 'resposta recebida' : 'respostas recebidas'}`}
                          aria-label={`${item.totalRespostas} ${item.totalRespostas === 1 ? 'resposta recebida' : 'respostas recebidas'}`}
                          onClick={() => handleViewDetails(item.id)}
                          className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-destructive text-destructive-foreground text-xs font-semibold tabular-nums focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2">
                          {(item.totalRespostas ?? 0) > 99 ? '99+' : item.totalRespostas}
                        </button>}
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
                          <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => void handleDelete()}
                            disabled={deleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            {deleting ? 'Excluindo...' : 'Excluir'}
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
