import { z } from 'zod';
import type { DiagnosticoBack } from '../model/Diagnostico';

export const palpiteSchema = z.object({
  especie: z.string().trim().min(1, 'Informe a espécie do seu palpite.').max(200, 'Use até 200 caracteres para a espécie.'),
  estagio: z.enum(['ovo', 'larva', 'ninfa', 'pupa', 'juvenil', 'subadulto', 'adulto', 'desconhecido']),
  comentario: z.string().trim().max(2000, 'Use até 2000 caracteres no comentário.').default('')
});

export type SalvarPalpiteDTO = z.infer<typeof palpiteSchema>;

export const respostaSchema = z.object({
  parentId: z.string().uuid('Comentário de origem inválido.'),
  comentario: z.string().trim().min(1, 'Escreva sua resposta.').max(2000, 'Use até 2000 caracteres na resposta.')
});

export type SalvarRespostaDTO = z.infer<typeof respostaSchema>;

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
  estagio: DiagnosticoBack | null;
  comentario: string;
  criadoEm: string;
  atualizadoEm: string;
}

export interface PalpiteDTO extends ComentarioDiscussaoDTO {
  parentId: null;
  especie: string;
  estagio: DiagnosticoBack;
}

export interface DiscussaoPaginaDTO {
  items: ComentarioDiscussaoDTO[];
  nextCursor: number | null;
}
