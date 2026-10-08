import type { DiagnosticoHistoricoDTO } from './DiagnosticoHistoricoDTO';
import type { PalpiteDTO } from './PalpiteDTO';

export interface AnaliseExternaDTO extends DiagnosticoHistoricoDTO {
  autorNome: string;
  temImagem: boolean;
}

export interface AnaliseExternaDetalhesDTO extends AnaliseExternaDTO {
  palpites: PalpiteDTO[];
  meuPalpite: PalpiteDTO | null;
}

export interface AnalisesExternasPaginaDTO {
  items: AnaliseExternaDTO[];
  hasMore: boolean;
}
