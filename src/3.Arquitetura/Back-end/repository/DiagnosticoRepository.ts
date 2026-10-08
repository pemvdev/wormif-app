import { Diagnostico, type DiagnosticoBack, type StatusDiagnostico } from '../model/Diagnostico';

type DiagnosticoRow = {
  id: number;
  diagnostic_date: string;
  status: StatusDiagnostico;
  confidence_level: number;
  life_stage: DiagnosticoBack;
  validated_by_specialist: number;
  species: string;
  common_name: string;
  description: string;
  characteristics_json: string;
  habitat: string;
  user_id: string | null;
  imagem_key: string | null;
};

export const EXTERNAL_ACCESS_FROM = `
  FROM diagnosticos d
  JOIN usuarios autor ON autor.id = d.user_id
  JOIN usuarios leitor ON leitor.id = ?
  WHERE leitor.intuito_uso = 'ANALISAR_OUTRAS_PESSOAS'
    AND autor.permite_analise_por_terceiros = 1
    AND d.user_id <> leitor.id AND d.status = 'concluido'
`;

const EXTERNAL_SELECT = `
  SELECT d.id, d.diagnostic_date, d.status, d.confidence_level, d.life_stage,
    d.validated_by_specialist, d.species, d.common_name, d.description,
    d.characteristics_json, d.habitat, d.user_id, d.imagem_key, autor.nome AS autor_nome
  ${EXTERNAL_ACCESS_FROM}
`;

type AnaliseExternaRow = DiagnosticoRow & { autor_nome: string };

function parseCharacteristics(value: string): string[] {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => (typeof item === 'string' ? item.trim() : String(item)))
      .filter((item) => item.length > 0);
  } catch {
    return [];
  }
}

export class DiagnosticoRepository {
  constructor(private readonly database: D1Database) {}

  async listarExternas(userId: string, query: string, limit: number, offset: number) {
    const result = await this.database.prepare(`${EXTERNAL_SELECT}
      AND (instr(lower(d.species), lower(?)) > 0 OR instr(lower(d.common_name), lower(?)) > 0)
      ORDER BY d.diagnostic_date DESC, d.id DESC LIMIT ? OFFSET ?
    `).bind(userId, query, query, limit, offset).all<AnaliseExternaRow>();
    return result.results.map((row) => ({ diagnostico: this.mapRow(row), autorNome: row.autor_nome }));
  }

  async buscarExterna(id: number, userId: string) {
    const row = await this.database.prepare(`${EXTERNAL_SELECT} AND d.id = ?`)
      .bind(userId, id).first<AnaliseExternaRow>();
    return row ? { diagnostico: this.mapRow(row), autorNome: row.autor_nome } : null;
  }

  async salvar(diagnostico: Diagnostico): Promise<Diagnostico> {
    const result = await this.database
      .prepare(
        `
        INSERT INTO diagnosticos (
          diagnostic_date,
          status,
          confidence_level,
          life_stage,
          validated_by_specialist,
          species,
          common_name,
          description,
          characteristics_json,
          habitat,
          source,
          user_id,
          imagem_key
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
      )
      .bind(
        diagnostico.data,
        diagnostico.status,
        diagnostico.nivelConfianca,
        diagnostico.diagnosticoBack,
        diagnostico.validadoPorEspecialista ? 1 : 0,
        diagnostico.especie,
        diagnostico.nomeComum,
        diagnostico.descricao,
        JSON.stringify(diagnostico.caracteristicas),
        diagnostico.habitat,
        'application',
        diagnostico.userId,
        diagnostico.imagemKey
      )
      .run();

    if (!result.success) {
      throw new Error('Falha ao salvar diagnostico no banco de dados');
    }

    diagnostico.id = result.meta.last_row_id;
    return diagnostico;
  }

  async listarPorUsuario(userId: string): Promise<Diagnostico[]> {
    const result = await this.database
      .prepare(
        `
        SELECT
          id,
          diagnostic_date,
          status,
          confidence_level,
          life_stage,
          validated_by_specialist,
          species,
          common_name,
          description,
          characteristics_json,
          habitat,
          user_id,
          imagem_key
        FROM diagnosticos
        WHERE user_id = ?
        ORDER BY diagnostic_date DESC
        `
      )
      .bind(userId)
      .all<DiagnosticoRow>();

    return result.results.map((row) => this.mapRow(row));
  }

  async buscarPorId(id: number, userId: string): Promise<Diagnostico | null> {
    const row = await this.database
      .prepare(
        `
        SELECT
          id,
          diagnostic_date,
          status,
          confidence_level,
          life_stage,
          validated_by_specialist,
          species,
          common_name,
          description,
          characteristics_json,
          habitat,
          user_id,
          imagem_key
        FROM diagnosticos
        WHERE id = ? AND user_id = ?
        `
      )
      .bind(id, userId)
      .first<DiagnosticoRow>();

    return row ? this.mapRow(row) : null;
  }

  async excluir(id: number, userId: string): Promise<boolean> {
    const result = await this.database
      .prepare('DELETE FROM diagnosticos WHERE id = ? AND user_id = ?')
      .bind(id, userId)
      .run();

    return result.success && (result.meta.changes ?? 0) > 0;
  }

  private mapRow(row: DiagnosticoRow): Diagnostico {
    return new Diagnostico(
      row.id,
      row.diagnostic_date,
      row.status,
      row.confidence_level,
      row.life_stage,
      row.validated_by_specialist === 1,
      row.species,
      row.common_name,
      row.description,
      parseCharacteristics(row.characteristics_json),
      row.habitat,
      row.user_id,
      row.imagem_key
    );
  }
}
