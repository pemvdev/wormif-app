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
};

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
          user_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        diagnostico.userId
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
          user_id
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
          user_id
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
      row.user_id
    );
  }
}
