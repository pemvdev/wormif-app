import { useEffect, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { DiagnosticoService } from '@Front-end/service/DiagnosticoService';
import type { PalpiteDTO } from '@Front-end/dto/PalpiteDTO';
import { PalpitesList } from './PalpitesList';
import { Button } from './ui/button';

const service = new DiagnosticoService();

export function PalpitesRecebidos({ id }: { id: number }) {
  const [palpites, setPalpites] = useState<PalpiteDTO[] | null>(null);
  const [error, setError] = useState(false);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    let active = true;
    setPalpites(null);
    setError(false);
    service.listarPalpitesRecebidos(id).then((result) => { if (active) setPalpites(result); })
      .catch(() => { if (active) setError(true); });
    return () => { active = false; };
  }, [id, reload]);
  return <section className="mt-8 border-t border-border pt-6">
    <h2 className="text-base font-semibold mb-4">Palpites recebidos</h2>
    {error ? <div className="space-y-3">
      <p role="alert">Não foi possível carregar os palpites.</p>
      <Button variant="outline" onClick={() => setReload((value) => value + 1)}><RefreshCw className="mr-2 h-4 w-4" aria-hidden />Tentar novamente</Button>
    </div> : palpites ? <PalpitesList palpites={palpites} /> : <p role="status">Carregando palpites...</p>}
  </section>;
}
