import type { DiagnosticoFront } from '../model/Diagnostico';

export interface SalvarPalpiteDTO {
  especie: string;
  estagio: DiagnosticoFront;
  comentario: string;
}

export interface PerfilPublicoDTO {
  id: string;
  nome: string;
  profissao: string | null;
  fotoPerfilUrl: string | null;
  linkedin: string | null;
}

export interface ComentarioDiscussaoDTO {
  id: string;
  sequencia: number;
  parentId: string | null;
  autorNome: string;
  autor: PerfilPublicoDTO;
  especie: string | null;
  estagio: DiagnosticoFront | null;
  comentario: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface PalpiteDTO extends ComentarioDiscussaoDTO {
  parentId: null;
  especie: string;
  estagio: DiagnosticoFront;
}

export interface DiscussaoPaginaDTO {
  items: ComentarioDiscussaoDTO[];
  nextCursor: number | null;
}

export interface SalvarRespostaDTO {
  parentId: string;
  comentario: string;
}
