import { z } from 'zod';
import type { DiagnosticoBack } from '../model/Diagnostico';

export const palpiteSchema = z.object({
  especie: z.string().trim().min(1, 'Informe a espécie do seu palpite.').max(200, 'Use até 200 caracteres para a espécie.'),
  estagio: z.enum(['ovo', 'larva', 'ninfa', 'pupa', 'juvenil', 'subadulto', 'adulto', 'desconhecido']),
  comentario: z.string().trim().max(2000, 'Use até 2000 caracteres no comentário.').default('')
});

export type SalvarPalpiteDTO = z.infer<typeof palpiteSchema>;

export interface PalpiteDTO {
  id: string;
  autorNome: string;
  especie: string;
  estagio: DiagnosticoBack;
  comentario: string;
  atualizadoEm: string;
}
