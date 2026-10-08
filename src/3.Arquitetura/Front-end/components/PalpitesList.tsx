import type { PalpiteDTO } from '@Front-end/dto/PalpiteDTO';
import { diagnosticoFrontLabels } from '@Front-end/model/Diagnostico';

export function PalpitesList({ palpites }: { palpites: PalpiteDTO[] }) {
  if (palpites.length === 0) return <p className="text-muted-foreground text-sm">Ainda não há palpites nesta análise.</p>;
  return <ul className="divide-y divide-border">{palpites.map((palpite) => <li key={palpite.id} className="py-4 space-y-2 text-sm break-words">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="font-medium">{palpite.autorNome}</p>
      <time className="text-xs text-muted-foreground" dateTime={palpite.atualizadoEm}>{new Date(palpite.atualizadoEm).toLocaleString('pt-BR')}</time>
    </div>
    <p><span className="italic">{palpite.especie}</span> · {diagnosticoFrontLabels[palpite.estagio]}</p>
    {palpite.comentario && <p className="whitespace-pre-wrap">{palpite.comentario}</p>}
  </li>)}</ul>;
}
