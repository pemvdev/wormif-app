import { useEffect, useState, type FormEvent } from 'react';
import { ChevronDown, ChevronRight, MessageSquareReply, RefreshCw, Send, X } from 'lucide-react';
import type { ComentarioDiscussaoDTO } from '@Front-end/dto/PalpiteDTO';
import { diagnosticoFrontLabels } from '@Front-end/model/Diagnostico';
import { DiagnosticoService } from '@Front-end/service/DiagnosticoService';
import { PerfilPublicoDialog } from './PerfilPublicoDialog';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';

const service = new DiagnosticoService();

function ordenarDiscussao(items: ComentarioDiscussaoDTO[], collapsed: Set<string>) {
  const children = new Map<string | null, ComentarioDiscussaoDTO[]>();
  for (const item of items) {
    const siblings = children.get(item.parentId) ?? [];
    siblings.push(item);
    children.set(item.parentId, siblings);
  }
  const stack = (children.get(null) ?? []).slice().reverse().map((item) => ({ item, depth: 0 }));
  const result: { item: ComentarioDiscussaoDTO; depth: number; hasReplies: boolean }[] = [];
  while (stack.length) {
    const current = stack.pop();
    if (!current) break;
    const replies = children.get(current.item.id) ?? [];
    result.push({ ...current, hasReplies: replies.length > 0 });
    if (!collapsed.has(current.item.id)) {
      for (let index = replies.length - 1; index >= 0; index--) {
        stack.push({ item: replies[index], depth: current.depth + 1 });
      }
    }
  }
  return result;
}

function RespostaForm({ analiseId, parent, onSaved, onCancel }: {
  analiseId: number; parent: ComentarioDiscussaoDTO; onSaved: () => void; onCancel: () => void;
}) {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    if (!text.trim()) { setError('Escreva sua resposta.'); return; }
    setSaving(true);
    setError(null);
    try {
      await service.responder(analiseId, { parentId: parent.id, comentario: text.trim() });
      onSaved();
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Não foi possível publicar sua resposta.');
      setSaving(false);
    }
  }
  return <form onSubmit={submit} className="space-y-2 pt-2">
    <label htmlFor={`resposta-${parent.id}`} className="block text-sm">Responder a {parent.autor.nome}</label>
    <Textarea id={`resposta-${parent.id}`} value={text} onChange={(event) => setText(event.target.value)}
      maxLength={2000} rows={3} disabled={saving} aria-invalid={Boolean(error)} aria-describedby={error ? `erro-${parent.id}` : undefined} />
    {error && <p role="alert" id={`erro-${parent.id}`} className="text-destructive text-sm">{error}</p>}
    <div className="flex flex-wrap gap-2">
      <Button type="submit" disabled={saving}><Send className="size-4 mr-2" aria-hidden />{saving ? 'Publicando...' : 'Publicar resposta'}</Button>
      <Button type="button" variant="ghost" disabled={saving} onClick={onCancel}><X className="size-4 mr-2" aria-hidden />Cancelar</Button>
    </div>
  </form>;
}

export function PalpitesList({ analiseId }: { analiseId: number }) {
  const [items, setItems] = useState<ComentarioDiscussaoDTO[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reload, setReload] = useState(0);
  const [loadAll, setLoadAll] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    async function load() {
      const first = await service.listarDiscussao(analiseId);
      const comments = [...first.items];
      let cursor = first.nextCursor;
      // After posting, include the new reply even when it falls beyond the first page.
      while (active && loadAll && cursor !== null) {
        const page = await service.listarDiscussao(analiseId, cursor);
        comments.push(...page.items);
        cursor = page.nextCursor;
      }
      if (active) { setItems(comments); setNextCursor(cursor); }
    }
    load().catch((error: unknown) => {
      if (active) { setItems([]); setNextCursor(null); setError(error instanceof Error ? error.message : 'Não foi possível carregar a discussão.'); }
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [analiseId, reload, loadAll]);

  async function loadMore() {
    if (nextCursor === null || loadingMore) return;
    setLoadingMore(true);
    setError(null);
    try {
      const page = await service.listarDiscussao(analiseId, nextCursor);
      setItems((current) => [...current, ...page.items]);
      setNextCursor(page.nextCursor);
    } catch (error: unknown) {
      setError(error instanceof Error ? error.message : 'Não foi possível carregar mais comentários.');
    } finally { setLoadingMore(false); }
  }

  if (loading) return <p role="status">Carregando discussão...</p>;
  const commentsById = new Map(items.map((item) => [item.id, item]));
  const indent = ['ml-0', 'ml-3 sm:ml-6', 'ml-6 sm:ml-12', 'ml-9 sm:ml-18'];
  return <div>
    {error && <div className="space-y-2 mb-4">
      <p role="alert" className="text-destructive text-sm">{error}</p>
      <Button variant="outline" onClick={() => nextCursor !== null ? void loadMore() : setReload((value) => value + 1)} disabled={loadingMore}>
        <RefreshCw className="size-4 mr-2" aria-hidden />Tentar novamente
      </Button>
    </div>}
    {!error && items.length === 0 && <p className="text-muted-foreground text-sm">Ainda não há palpites nesta análise.</p>}
    <ul>{ordenarDiscussao(items, collapsed).map(({ item, depth, hasReplies }) => <li key={item.id}
      data-testid={`comentario-${item.id}`} className={`${indent[Math.min(depth, 3)]} border-l border-border pl-3 py-4 text-sm min-w-0 break-words`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <PerfilPublicoDialog autor={item.autor} />
        <time className="text-xs text-muted-foreground" dateTime={item.atualizadoEm}>{new Date(item.atualizadoEm).toLocaleString('pt-BR')}</time>
      </div>
      {item.parentId && <p className="text-xs text-muted-foreground mt-2">Em resposta a {commentsById.get(item.parentId)?.autor.nome}</p>}
      {item.especie && item.estagio && <p className="mt-2"><span className="italic">{item.especie}</span> · {diagnosticoFrontLabels[item.estagio]}</p>}
      {item.comentario && <p className="whitespace-pre-wrap mt-2">{item.comentario}</p>}
      <div className="flex gap-2 mt-2">
        <Button variant="ghost" size="sm" onClick={() => setReplyTo(item.id)}><MessageSquareReply className="size-4 mr-2" aria-hidden />Responder</Button>
        {hasReplies && <Button variant="ghost" size="icon" aria-label={collapsed.has(item.id) ? 'Expandir respostas' : 'Recolher respostas'}
          aria-expanded={!collapsed.has(item.id)}
          title={collapsed.has(item.id) ? 'Expandir respostas' : 'Recolher respostas'} onClick={() => setCollapsed((current) => {
            const next = new Set(current);
            if (next.has(item.id)) next.delete(item.id); else next.add(item.id);
            return next;
          })}>
          {collapsed.has(item.id) ? <ChevronRight className="size-4" aria-hidden /> : <ChevronDown className="size-4" aria-hidden />}
        </Button>}
      </div>
      {replyTo === item.id && <RespostaForm key={item.id} analiseId={analiseId} parent={item} onCancel={() => setReplyTo(null)} onSaved={() => {
        setReplyTo(null); setCollapsed(new Set()); setLoadAll(true); setReload((value) => value + 1);
      }} />}
    </li>)}</ul>
    {nextCursor !== null && <Button variant="outline" className="mt-4" disabled={loadingMore} onClick={() => void loadMore()}>
      <ChevronDown className="size-4 mr-2" aria-hidden />{loadingMore ? 'Carregando...' : 'Carregar mais comentários'}
    </Button>}
  </div>;
}
