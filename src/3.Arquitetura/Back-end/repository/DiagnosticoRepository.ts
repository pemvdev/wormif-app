import { drizzle } from 'drizzle-orm/d1';
import { eq, and, desc, sql } from 'drizzle-orm';
import { diagnosticos } from '../db/schema';
import { Diagnostico, type StatusDiagnostico } from '../model/Diagnostico';
import type { EstagioDiagnostico } from '../../shared/EstagioDiagnostico';

export const EXTERNAL_ACCESS_FROM = `
  FROM diagnosticos d
  JOIN usuarios autor ON autor.id = d.user_id
  JOIN usuarios leitor ON leitor.id = ?
  WHERE leitor.intuito_uso = 'ANALISAR_OUTRAS_PESSOAS'
    AND autor.permite_analise_por_terceiros = 1
    AND d.user_id <> leitor.id AND d.status = 'concluido'
`;


type DiagnosticoRow = {
  id: number; diagnostic_date: string; status: StatusDiagnostico; confidence_level: number;
  life_stage: EstagioDiagnostico; species: string; common_name: string;
  description: string; characteristics_json: string; habitat: string; user_id: string | null; imagem_key: string | null;
  latitude: number | null; longitude: number | null; localizacao_label: string | null;
};

type AnaliseExternaRow = DiagnosticoRow & { autor_nome: string };

function parseCharacteristics(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.map((item) => (typeof item === 'string' ? item.trim() : String(item))).filter((item) => item.length > 0);
  } catch { return []; }
}

export class DiagnosticoRepository {
  private readonly db;
  constructor(database: D1Database) {
    this.db = drizzle(database);
  }

  async listarExternas(userId: string, query: string, limit: number, offset: number) {
    const rows = await this.db.all<AnaliseExternaRow>(sql`
      SELECT d.id, d.diagnostic_date, d.status, d.confidence_level, d.life_stage,
        d.species, d.common_name, d.description,
        d.characteristics_json, d.habitat, d.user_id, d.imagem_key, d.latitude, d.longitude, d.localizacao_label, autor.nome AS autor_nome
      FROM diagnosticos d
      JOIN usuarios autor ON autor.id = d.user_id
      JOIN usuarios leitor ON leitor.id = ${userId}
      WHERE leitor.intuito_uso = 'ANALISAR_OUTRAS_PESSOAS'
        AND autor.permite_analise_por_terceiros = 1
        AND d.user_id <> leitor.id AND d.status = 'concluido'
        AND (instr(lower(d.species), lower(${query})) > 0 OR instr(lower(d.common_name), lower(${query})) > 0)
      ORDER BY d.diagnostic_date DESC, d.id DESC LIMIT ${limit} OFFSET ${offset}
    `);
    return rows.map((row) => ({ diagnostico: this.mapRow(row), autorNome: row.autor_nome }));
  }

  async buscarExterna(id: number, userId: string) {
    const row = await this.db.get<AnaliseExternaRow>(sql`
      SELECT d.id, d.diagnostic_date, d.status, d.confidence_level, d.life_stage,
        d.species, d.common_name, d.description,
        d.characteristics_json, d.habitat, d.user_id, d.imagem_key, d.latitude, d.longitude, d.localizacao_label, autor.nome AS autor_nome
      FROM diagnosticos d
      JOIN usuarios autor ON autor.id = d.user_id
      JOIN usuarios leitor ON leitor.id = ${userId}
      WHERE leitor.intuito_uso = 'ANALISAR_OUTRAS_PESSOAS'
        AND autor.permite_analise_por_terceiros = 1
        AND d.user_id <> leitor.id AND d.status = 'concluido'
        AND d.id = ${id}
    `);
    return row ? { diagnostico: this.mapRow(row), autorNome: row.autor_nome } : null;
  }

  async salvar(diagnostico: Diagnostico): Promise<Diagnostico> {
    const result = await this.db.insert(diagnosticos).values({
      diagnosticDate: diagnostico.data,
      status: diagnostico.status,
      confidenceLevel: diagnostico.nivelConfianca,
      lifeStage: diagnostico.diagnosticoBack,
      species: diagnostico.especie,
      commonName: diagnostico.nomeComum,
      description: diagnostico.descricao,
      characteristicsJson: JSON.stringify(diagnostico.caracteristicas),
      habitat: diagnostico.habitat,
      source: 'application',
      userId: diagnostico.userId,
      imagemKey: diagnostico.imagemKey,
      latitude: diagnostico.latitude,
      longitude: diagnostico.longitude,
      localizacaoLabel: diagnostico.localizacaoLabel,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }).run();
    if (!result.success) throw new Error('Falha ao salvar diagnostico no banco de dados');
    return new Diagnostico(
      result.meta.last_row_id,
      diagnostico.data,
      diagnostico.status,
      diagnostico.nivelConfianca,
      diagnostico.diagnosticoBack,
      diagnostico.especie,
      diagnostico.nomeComum,
      diagnostico.descricao,
      diagnostico.caracteristicas,
      diagnostico.habitat,
      diagnostico.userId,
      diagnostico.imagemKey,
      diagnostico.latitude,
      diagnostico.longitude,
      diagnostico.localizacaoLabel
    );
  }

  async listarPorUsuario(userId: string) {
    const rows = await this.db.select({
      id: diagnosticos.id,
      diagnosticDate: diagnosticos.diagnosticDate,
      status: diagnosticos.status,
      confidenceLevel: diagnosticos.confidenceLevel,
      lifeStage: diagnosticos.lifeStage,
      species: diagnosticos.species,
      commonName: diagnosticos.commonName,
      description: diagnosticos.description,
      characteristicsJson: diagnosticos.characteristicsJson,
      habitat: diagnosticos.habitat,
      userId: diagnosticos.userId,
      imagemKey: diagnosticos.imagemKey,
      latitude: diagnosticos.latitude,
      longitude: diagnosticos.longitude,
      localizacaoLabel: diagnosticos.localizacaoLabel,
      totalRespostas: sql<number>`(SELECT COUNT(*) FROM diagnostico_discussao resposta WHERE resposta.diagnostico_id = ${diagnosticos.id} AND resposta.usuario_id <> ${diagnosticos.userId})`,
    }).from(diagnosticos).where(eq(diagnosticos.userId, userId)).orderBy(desc(diagnosticos.diagnosticDate), desc(diagnosticos.id)).all();
    return rows.map((row) => ({ diagnostico: this.mapRow({
      id: row.id, diagnostic_date: row.diagnosticDate, status: row.status as StatusDiagnostico, confidence_level: row.confidenceLevel,
      life_stage: row.lifeStage as EstagioDiagnostico, species: row.species,
      common_name: row.commonName, description: row.description, characteristics_json: row.characteristicsJson,
      habitat: row.habitat, user_id: row.userId, imagem_key: row.imagemKey,
      latitude: row.latitude, longitude: row.longitude, localizacao_label: row.localizacaoLabel,
    }), totalRespostas: row.totalRespostas }));
  }

  async buscarPorId(id: number, userId: string) {
    const row = await this.db.select().from(diagnosticos).where(and(eq(diagnosticos.id, id), eq(diagnosticos.userId, userId))).get();
    if (!row) return null;
    return this.mapRow({
      id: row.id, diagnostic_date: row.diagnosticDate, status: row.status as StatusDiagnostico, confidence_level: row.confidenceLevel,
      life_stage: row.lifeStage as EstagioDiagnostico, species: row.species,
      common_name: row.commonName, description: row.description, characteristics_json: row.characteristicsJson,
      habitat: row.habitat, user_id: row.userId, imagem_key: row.imagemKey,
      latitude: row.latitude, longitude: row.longitude, localizacao_label: row.localizacaoLabel,
    });
  }

  async excluir(id: number, userId: string): Promise<boolean> {
    const result = await this.db.delete(diagnosticos).where(and(eq(diagnosticos.id, id), eq(diagnosticos.userId, userId))).run();
    return (result.meta?.changes ?? 0) > 0;
  }

  async atualizarLocalizacao(id: number, userId: string, latitude: number, longitude: number, label: string): Promise<boolean> {
    const result = await this.db.update(diagnosticos).set({ latitude, longitude, localizacaoLabel: label, updatedAt: new Date().toISOString() })
      .where(and(eq(diagnosticos.id, id), eq(diagnosticos.userId, userId))).run();
    return (result.meta?.changes ?? 0) > 0;
  }

  private mapRow(row: DiagnosticoRow): Diagnostico {
    return new Diagnostico(row.id, row.diagnostic_date, row.status, row.confidence_level, row.life_stage, row.species, row.common_name, row.description, parseCharacteristics(row.characteristics_json), row.habitat, row.user_id, row.imagem_key, row.latitude, row.longitude, row.localizacao_label);
  }
}
