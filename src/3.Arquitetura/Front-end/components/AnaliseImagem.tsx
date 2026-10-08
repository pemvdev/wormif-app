import { useEffect, useState } from 'react';
import { ImageOff, Loader2, Maximize2, RefreshCw } from 'lucide-react';
import { DiagnosticoService } from '@Front-end/service/DiagnosticoService';
import { Button } from '@Front-end/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@Front-end/components/ui/dialog';
import { cn } from '@Front-end/lib/utils';

const service = new DiagnosticoService();

export function AnaliseImagem({ id, temImagem, thumbnail = false }: { id: number; temImagem: boolean; thumbnail?: boolean }) {
  const [src, setSrc] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    let objectUrl: string | null = null;
    setSrc(null);
    setError(false);
    if (temImagem) {
      service.buscarImagem(id).then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setSrc(objectUrl);
      }).catch(() => { if (active) setError(true); });
    }
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [id, temImagem, reload]);

  return <>
    <div className={cn('relative flex items-center justify-center bg-muted overflow-hidden',
      thumbnail ? 'aspect-[4/3] w-full sm:w-40 shrink-0' : 'aspect-[4/3] w-full max-h-[32rem]')}>
      {!temImagem ? <div className="text-center text-muted-foreground text-sm p-4">
        <ImageOff className="mx-auto mb-2 h-6 w-6" aria-hidden />Imagem não disponível
      </div> : error ? <div className="text-center text-sm p-3">
        <p>Não foi possível carregar a foto.</p>
        <Button variant="ghost" size="icon" title="Recarregar foto" aria-label="Recarregar foto" onClick={() => setReload((value) => value + 1)}>
          <RefreshCw className="h-4 w-4" aria-hidden />
        </Button>
      </div> : src ? <>
        <img src={src} alt="Foto utilizada na análise" className="absolute inset-0 h-full w-full object-contain" onError={() => setError(true)} />
        <Button type="button" size="icon" variant="outline" className="absolute bottom-2 right-2"
          title="Ampliar imagem" aria-label="Ampliar imagem" onClick={() => setExpanded(true)}>
          <Maximize2 className="h-4 w-4" aria-hidden />
        </Button>
      </> : <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-label="Carregando foto" />}
    </div>
    <Dialog open={expanded} onOpenChange={setExpanded}>
      <DialogContent className="max-w-5xl" aria-describedby={undefined}>
        <DialogHeader><DialogTitle>Foto utilizada na análise</DialogTitle></DialogHeader>
        {src && <img src={src} alt="Foto utilizada na análise ampliada" className="max-h-[80vh] w-full object-contain" />}
      </DialogContent>
    </Dialog>
  </>;
}
