import type { DiagnosticoResponseDTO } from '@Front-end/dto/DiagnosticoResponseDTO';
import type { AnalysisHistoryItem } from '@Front-end/context/AppContext';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const mockCatalog: DiagnosticoResponseDTO[] = [
  {
    success: true,
    data: {
      especie: 'Tenebrio molitor',
      nomeComum: 'Bicho-da-farinha',
      estagioVida: 'larva',
      nivelConfianca: 0.92,
      descricao:
        'Larva de coleóptero com corpo segmentado, coloração amarelada e exoesqueleto rígido.',
      caracteristicas: ['Corpo alongado', 'Capítulo escuro', 'Atividade noturna'],
      habitat: 'Ambientes com farinha, grãos e materiais orgânicos armazenados.',
      cicloDeVida: 'Ovo → larva → pupa → adulto.',
      proximoEstagio: 'Pupa'
    }
  },
  {
    success: true,
    data: {
      especie: 'Spodoptera frugiperda',
      nomeComum: 'Lagarta-do-cartucho',
      estagioVida: 'larva',
      nivelConfianca: 0.88,
      descricao: 'Lagarta com listras longitudinais e hábito de alimentar-se do cartucho do milho.',
      caracteristicas: ['Máculas dorsais', 'Alto potencial de dano em culturas'],
      habitat: 'Culturas de milho, sorgo e pastagens em regiões tropicais.',
      cicloDeVida: 'Ovo → larva → pupa (solo) → mariposa adulta.',
      proximoEstagio: 'Pupa'
    }
  }
];

export async function mockAnalisarImagem(_fileName?: string): Promise<DiagnosticoResponseDTO> {
  await delay(1600);
  const index = Math.floor(Math.random() * mockCatalog.length);
  return structuredClone(mockCatalog[index]) as DiagnosticoResponseDTO;
}

export function historyItemToResultado(item: AnalysisHistoryItem): DiagnosticoResponseDTO {
  return {
    success: true,
    data: {
      especie: item.especie,
      nomeComum: item.nomeComum,
      estagioVida: item.estagioVida,
      nivelConfianca: item.nivelConfianca,
      descricao: `Análise registrada em ${new Date(item.createdAt).toLocaleString('pt-BR')}. Espécime identificado como ${item.nomeComum}.`,
      caracteristicas: [
        'Registro recuperado do histórico local',
        `Estágio: ${item.estagioVida}`,
        `Confiança da IA: ${Math.round(item.nivelConfianca * 100)}%`
      ],
      habitat: item.localizacao
        ? `Coletado em campo próximo a ${item.localizacao.label}.`
        : 'Localização não registrada nesta análise.',
      cicloDeVida: 'Consulte a ficha completa para o ciclo de vida da espécie.',
      proximoEstagio: undefined
    }
  };
}

/** PNG 1x1 válido em base64 para demo de upload */
export const SAMPLE_IMAGE_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
