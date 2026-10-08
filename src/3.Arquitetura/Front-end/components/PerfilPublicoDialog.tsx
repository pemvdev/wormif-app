import { Linkedin } from 'lucide-react';
import type { PerfilPublicoDTO } from '@Front-end/dto/PalpiteDTO';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';

function FotoPerfil({ autor, grande = false }: { autor: PerfilPublicoDTO; grande?: boolean }) {
  return <Avatar className={grande ? 'size-20' : 'size-10'}>
    {autor.fotoPerfilUrl && <AvatarImage src={autor.fotoPerfilUrl} alt={`Foto de ${autor.nome}`} />}
    <AvatarFallback>{autor.nome.trim().slice(0, 2).toUpperCase()}</AvatarFallback>
  </Avatar>;
}

export function PerfilPublicoDialog({ autor }: { autor: PerfilPublicoDTO }) {
  return <Dialog>
    <DialogTrigger asChild>
      <button type="button" aria-label={`Ver perfil de ${autor.nome}`}
        className="flex min-w-0 items-center gap-3 text-left rounded-md focus-visible:outline-2 focus-visible:outline-ring hover:underline">
        <FotoPerfil autor={autor} />
        <span className="min-w-0 break-words">
          <span className="block font-medium">{autor.nome}</span>
          <span className="block text-xs text-muted-foreground">{autor.profissao || 'Profissão não informada'}</span>
        </span>
      </button>
    </DialogTrigger>
    <DialogContent className="rounded-lg break-words">
      <DialogHeader>
        <FotoPerfil autor={autor} grande />
        <DialogTitle className="pr-8 leading-normal">{autor.nome}</DialogTitle>
        <DialogDescription>{autor.profissao || 'Profissão não informada'}</DialogDescription>
      </DialogHeader>
      {autor.linkedin ? <a href={autor.linkedin} target="_blank" rel="noopener noreferrer"
        className="flex items-center gap-2 underline underline-offset-4">
        <Linkedin className="size-4 shrink-0" aria-hidden />LinkedIn
      </a> : <p className="text-muted-foreground">LinkedIn não informado</p>}
    </DialogContent>
  </Dialog>;
}
