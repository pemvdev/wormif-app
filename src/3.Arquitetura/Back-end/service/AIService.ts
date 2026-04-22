import OpenAI from 'openai';
import type { AIConfig } from '../config/AIConfig';
import type { DiagnosticoResponseDTO } from '../dto/DiagnosticoResponseDTO';
import type { EstagioVida } from '../model/Diagnostico';

const UNKNOWN_SPECIES = new Set(
  [
    'desconhecido',
    'desconhecida',
    'unknown',
    'n/a',
    'na',
    'não identificado',
    'não identificada',
    'nao identificado',
    'nao identificada',
    'indeterminado',
    'indeterminada',
    'não identificável',
    'nao identificavel',
  ].map((s) => s.toLowerCase())
);

function isPlaceholderSpeciesName(value: string): boolean {
  const t = value.trim().toLowerCase();
  if (t.length === 0) return true;
  return UNKNOWN_SPECIES.has(t);
}

function parseJsonObject(raw: string): Record<string, unknown> | null {
  let s = raw.trim();
  const fence = s.match(/^```(?:json)?\s*([\s\S]*?)```$/im);
  if (fence) s = fence[1].trim();
  try {
    const parsed: unknown = JSON.parse(s);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
  } catch {
    const m = s.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        const parsed: unknown = JSON.parse(m[0]);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed as Record<string, unknown>;
        }
      } catch {
        return null;
      }
    }
  }
  return null;
}

function unwrapNested(obj: Record<string, unknown>): Record<string, unknown> {
  const next = { ...obj };
  for (const key of ['data', 'result', 'diagnostico', 'response'] as const) {
    const inner = next[key];
    if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
      Object.assign(next, inner as Record<string, unknown>);
      break;
    }
  }
  return next;
}

const KEY_ALIASES: [string, keyof NormalizedShape][] = [
  ['species', 'especie'],
  ['scientific_name', 'especie'],
  ['nome_cientifico', 'especie'],
  ['nomeCientifico', 'especie'],
  ['common_name', 'nomeComum'],
  ['commonName', 'nomeComum'],
  ['nome_popular', 'nomeComum'],
  ['nomePopular', 'nomeComum'],
  ['life_stage', 'estagioVida'],
  ['lifeStage', 'estagioVida'],
  ['estágioVida', 'estagioVida'],
  ['confidence', 'nivelConfianca'],
  ['confidence_level', 'nivelConfianca'],
  ['nivel_confianca', 'nivelConfianca'],
  ['description', 'descricao'],
  ['traits', 'caracteristicas'],
  ['characteristics', 'caracteristicas'],
  ['habitat_natural', 'habitat'],
  ['life_cycle', 'cicloDeVida'],
  ['lifeCycle', 'cicloDeVida'],
  ['ciclo_de_vida', 'cicloDeVida'],
  ['next_stage', 'proximoEstagio'],
  ['nextStage', 'proximoEstagio'],
];

type NormalizedShape = {
  especie?: unknown;
  nomeComum?: unknown;
  estagioVida?: unknown;
  nivelConfianca?: unknown;
  descricao?: unknown;
  caracteristicas?: unknown;
  habitat?: unknown;
  cicloDeVida?: unknown;
  proximoEstagio?: unknown;
};

function collectCanonicalFields(flat: Record<string, unknown>): NormalizedShape {
  const out: NormalizedShape = {
    especie: flat.especie,
    nomeComum: flat.nomeComum,
    estagioVida: flat.estagioVida,
    nivelConfianca: flat.nivelConfianca,
    descricao: flat.descricao,
    caracteristicas: flat.caracteristicas,
    habitat: flat.habitat,
    cicloDeVida: flat.cicloDeVida,
    proximoEstagio: flat.proximoEstagio,
  };
  for (const [alias, canonical] of KEY_ALIASES) {
    if (out[canonical] === undefined || out[canonical] === null || out[canonical] === '') {
      const v = flat[alias];
      if (v !== undefined && v !== null && v !== '') {
        out[canonical] = v;
      }
    }
  }
  return out;
}

function parseConfidence(value: unknown): number {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    if (value > 1) return Math.min(1, value / 100);
    return Math.min(1, Math.max(0, value));
  }
  if (typeof value === 'string') {
    const m = value.trim().match(/^(\d+(?:[.,]\d+)?)\s*%?$/);
    if (m) {
      const n = parseFloat(m[1].replace(',', '.'));
      if (!Number.isNaN(n)) {
        return n > 1 ? Math.min(1, n / 100) : Math.min(1, Math.max(0, n));
      }
    }
  }
  return 0;
}

function asNonEmptyString(value: unknown): string {
  if (typeof value !== 'string') return '';
  return value.trim();
}

function normalizeEstagio(raw: unknown): EstagioVida {
  const valid: EstagioVida[] = [
    'ovo',
    'larva',
    'ninfa',
    'pupa',
    'juvenil',
    'subadulto',
    'adulto',
    'desconhecido',
  ];
  const s = String(raw ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
  return valid.includes(s as EstagioVida) ? (s as EstagioVida) : 'desconhecido';
}

export class AIService {
  private openai: OpenAI;
  private aiConfig: AIConfig;

  constructor(apiKey: string, aiConfig: AIConfig) {
    this.openai = new OpenAI({
      apiKey,
      fetch: globalThis.fetch.bind(globalThis),
    });
    this.aiConfig = aiConfig;
  }

  async analisarImagem(imageBase64: string, mimeType: string): Promise<DiagnosticoResponseDTO> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: this.aiConfig.model,
        messages: [
          { role: 'system', content: this.aiConfig.systemInstruction },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analise a imagem em detalhe. Preencha TODAS as chaves do JSON (especie, nomeComum, estagioVida, nivelConfianca, descricao, caracteristicas, habitat, cicloDeVida, proximoEstagio). Siga as regras do sistema; responda só com o objeto JSON.',
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        temperature: this.aiConfig.temperature,
        max_tokens: this.aiConfig.maxOutputTokens,
        response_format: { type: 'json_object' },
      });

      const text = completion.choices[0]?.message?.content ?? '';
      const parsedRoot = parseJsonObject(text);
      if (!parsedRoot) {
        return {
          success: false,
          error: 'Não foi possível processar a resposta da IA',
        };
      }

      const flat = unwrapNested(parsedRoot);
      const n = collectCanonicalFields(flat);

      let especie = asNonEmptyString(n.especie);
      let nomeComum = asNonEmptyString(n.nomeComum);
      if (isPlaceholderSpeciesName(especie)) {
        especie = '';
      }
      if (isPlaceholderSpeciesName(nomeComum)) {
        nomeComum = '';
      }

      const estagioVida = normalizeEstagio(n.estagioVida);
      const nivelConfianca = parseConfidence(n.nivelConfianca);
      const descricao = asNonEmptyString(n.descricao);
      let habitat = asNonEmptyString(n.habitat);
      let cicloDeVida = asNonEmptyString(n.cicloDeVida);
      if (isPlaceholderSpeciesName(habitat)) {
        habitat = '';
      }
      if (isPlaceholderSpeciesName(cicloDeVida)) {
        cicloDeVida = '';
      }

      let caracteristicas: string[] = [];
      if (Array.isArray(n.caracteristicas)) {
        caracteristicas = n.caracteristicas
          .map((c) => (typeof c === 'string' ? c.trim() : String(c)))
          .filter((c) => c.length > 0);
      }

      const proximoRaw = asNonEmptyString(n.proximoEstagio);

      return {
        success: true,
        data: {
          especie: especie || 'Indeterminado (ver descrição)',
          nomeComum: nomeComum || 'Grupo ou estágio inferido pela morfologia',
          estagioVida,
          nivelConfianca,
          descricao,
          caracteristicas,
          habitat:
            habitat ||
            'Habitat típico não inferível só pela imagem; consulte a descrição e o grupo taxonómico sugerido.',
          cicloDeVida:
            cicloDeVida ||
            (estagioVida !== 'desconhecido'
              ? 'Ciclo completo depende do grupo: em insetos holometábolos típicos — ovo → larva → pupa → adulto; em hemimetábolos — ovo → ninfa → adulto. Ajuste ao grupo indicado na descrição.'
              : ''),
          proximoEstagio: proximoRaw || undefined,
        },
      };
    } catch (error) {
      console.error('Erro ao analisar imagem:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao processar imagem',
      };
    }
  }
}
