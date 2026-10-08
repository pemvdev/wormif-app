import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, ArrowRight, Eye, Loader2, RefreshCw, Search, Users } from 'lucide-react';
import { PageContainer } from '@Front-end/components/layout/PageContainer';
import { PageHeader } from '@Front-end/components/layout/PageHeader';
import { Button } from '@Front-end/components/ui/button';
import { Input } from '@Front-end/components/ui/input';
import { Badge } from '@Front-end/components/ui/badge';
import { useApp } from '@Front-end/context/AppContext';
import { DiagnosticoService } from '@Front-end/service/DiagnosticoService';
import type { AnaliseExternaDetalhesDTO, AnalisesExternasPaginaDTO } from '@Front-end/dto/AnaliseExternaDTO';
import { AnaliseImagem } from '@Front-end/components/AnaliseImagem';
import { PalpiteForm } from '@Front-end/components/PalpiteForm';
import { PalpitesList } from '@Front-end/components/PalpitesList';
import { diagnosticoFrontLabels } from '@Front-end/model/Diagnostico';

const service = new DiagnosticoService();

function Loading() {
  return <p role="status" className="flex items-center gap-2 py-8 text-muted-foreground">
    <Loader2 className="h-5 w-5 animate-spin" aria-hidden />Carregando análises...
  </p>;
}

function LoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div className="py-8 space-y-4">
    <p role="alert" className="text-destructive">{message}</p>
    <Button variant="outline" onClick={onRetry}>
      <RefreshCw className="mr-2 h-4 w-4" aria-hidden />Tentar novamente
    </Button>
  </div>;
}

function ExternalList() {
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<AnalisesExternasPaginaDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setData(null);
    setError(null);
    service.listarExternas(query, page).then((result) => {
      if (active) setData(result);
    }).catch((error: unknown) => {
      if (active) setError(error instanceof Error ? error.message : 'Não foi possível carregar as análises.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [query, page, reload]);

  const handleSearch = (event: FormEvent) => {
    event.preventDefault();
    setPage(1);
    setQuery(search.trim());
    setReload((value) => value + 1);
  };

  return <PageContainer>
    <PageHeader title="Análises externas" />
    <form onSubmit={handleSearch} className="flex gap-2 mb-6">
      <Input type="search" aria-label="Buscar análises externas" placeholder="Buscar por espécie ou nome comum"
        maxLength={200} value={search} onChange={(event) => setSearch(event.target.value)} className="min-w-0" />
      <Button type="submit" variant="outline" size="icon" aria-label="Buscar" title="Buscar">
        <Search className="h-4 w-4" aria-hidden />
      </Button>
      <Button type="button" variant="outline" size="icon" aria-label="Atualizar análises" title="Atualizar análises"
        disabled={loading} onClick={() => setReload((value) => value + 1)}>
        <RefreshCw className="h-4 w-4" aria-hidden />
      </Button>
    </form>
    {loading ? <Loading /> : error ? <LoadError message={error} onRetry={() => setReload((value) => value + 1)} /> : data && <>
      {data.items.length === 0 ? <div className="py-10 text-center text-muted-foreground">
        <Users className="mx-auto mb-3 h-8 w-8" aria-hidden />
        <p>{query ? 'Nenhuma análise encontrada para esta busca.' : 'Nenhuma análise compartilhada disponível.'}</p>
      </div> : <ul className="divide-y divide-border border-y border-border">
        {data.items.map((item) => <li key={item.id} className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
          <AnaliseImagem id={item.id} temImagem={item.temImagem} thumbnail />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-semibold italic break-words">{item.especie}</h2>
              <Badge variant="secondary">{diagnosticoFrontLabels[item.diagnosticoBack]}</Badge>
            </div>
            <p className="text-sm break-words">{item.nomeComum}</p>
            <p className="text-sm text-muted-foreground break-words">Autor: {item.autorNome}</p>
            <p className="text-xs text-muted-foreground">{new Date(item.data).toLocaleString('pt-BR')} · Confiança da IA: {Math.round(item.nivelConfianca * 100)}%</p>
          </div>
          <Button asChild variant="outline" className="shrink-0">
            <Link to={`/analises-externas/${item.id}`}><Eye className="mr-2 h-4 w-4" aria-hidden />Ver análise</Link>
          </Button>
        </li>)}
      </ul>}
      {(page > 1 || data.hasMore) && <nav aria-label="Paginação de análises externas" className="mt-6 flex items-center justify-between gap-3">
        <Button variant="outline" disabled={page === 1} onClick={() => setPage((value) => value - 1)}>
          <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />Anterior
        </Button>
        <span className="text-sm">Página {page}</span>
        <Button variant="outline" disabled={!data.hasMore} onClick={() => setPage((value) => value + 1)}>
          Próxima<ArrowRight className="ml-2 h-4 w-4" aria-hidden />
        </Button>
      </nav>}
    </>}
  </PageContainer>;
}

function ExternalDetails({ id }: { id: string }) {
  const [data, setData] = useState<AnaliseExternaDetalhesDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    setData(null);
    setLoading(true);
    setError(null);
    service.buscarExterna(Number(id)).then((result) => {
      if (active) setData(result);
    }).catch((error: unknown) => {
      if (active) setError(error instanceof Error ? error.message : 'Não foi possível carregar a análise.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [id, reload]);

  return <PageContainer width="form">
    <Button asChild variant="outline" className="mb-6">
      <Link to="/analises-externas"><ArrowLeft className="mr-2 h-4 w-4" aria-hidden />Voltar às análises</Link>
    </Button>
    <PageHeader title="Análise externa" />
    {loading ? <Loading /> : error ? <LoadError message={error} onRetry={() => setReload((value) => value + 1)} /> : data && <article className="space-y-6 break-words">
      <AnaliseImagem id={data.id} temImagem={data.temImagem} />
      <section className="border-b border-border pb-6 space-y-3">
        <h2 className="text-base font-semibold">Resultado da IA</h2>
        <h2 className="text-xl font-semibold italic">{data.especie}</h2>
        <p>{data.nomeComum}</p>
        <Badge variant="secondary">{diagnosticoFrontLabels[data.diagnosticoBack]}</Badge>
        <dl className="grid gap-4 sm:grid-cols-3 text-sm">
          <div><dt className="text-muted-foreground">Autor</dt><dd>{data.autorNome}</dd></div>
          <div><dt className="text-muted-foreground">Data</dt><dd>{new Date(data.data).toLocaleString('pt-BR')}</dd></div>
          <div><dt className="text-muted-foreground">Confiança da IA</dt><dd>{Math.round(data.nivelConfianca * 100)}%</dd></div>
        </dl>
      </section>
      <section><h2 className="text-base font-semibold mb-2">Descrição</h2><p className="leading-relaxed">{data.descricao || 'Não informada.'}</p></section>
      {data.caracteristicas.length > 0 && <section>
        <h2 className="text-base font-semibold mb-2">Características identificadas</h2>
        <ul className="list-disc pl-5 space-y-2">{data.caracteristicas.map((value, index) => <li key={`${index}-${value}`}>{value}</li>)}</ul>
      </section>}
      {data.habitat && <section><h2 className="text-base font-semibold mb-2">Habitat</h2><p>{data.habitat}</p></section>}
      <section className="border-t border-border pt-6">
        <PalpiteForm data={data} onSaved={() => setReload((value) => value + 1)} />
      </section>
      <section className="border-t border-border pt-6">
        <h2 className="text-base font-semibold mb-4">Discussão</h2>
        <PalpitesList key={data.id} analiseId={data.id} />
      </section>
    </article>}
  </PageContainer>;
}

export default function AnalisesExternasView() {
  const { user } = useApp();
  const { id } = useParams();
  if (user?.intuitoUso !== 'ANALISAR_OUTRAS_PESSOAS') {
    return <PageContainer>
      <PageHeader title="Análises externas" />
      <p role="alert" className="mb-4">Esta área está disponível para quem escolheu ajudar nas análises de outras pessoas.</p>
      <Button asChild variant="outline"><Link to="/perfil">Meu perfil</Link></Button>
    </PageContainer>;
  }
  return id ? <ExternalDetails id={id} /> : <ExternalList />;
}
