import { Diagnostico, type EstagioVida, type StatusDiagnostico } from '../model/Diagnostico';

type DiagnosticoRow = {
  id: number;
  diagnostic_date: string;
  status: StatusDiagnostico;
  confidence_level: number;
  life_stage: EstagioVida;
  validated_by_specialist: number;
  species: string;
  common_name: string;
  description: string;
  characteristics_json: string;
  habitat: string;
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
          source
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
      )
      .bind(
        diagnostico.data,
        diagnostico.status,
        diagnostico.nivelConfianca,
        diagnostico.estagioVida,
        diagnostico.validadoPorEspecialista ? 1 : 0,
        diagnostico.especie,
        diagnostico.nomeComum,
        diagnostico.descricao,
        JSON.stringify(diagnostico.caracteristicas),
        diagnostico.habitat,
        'application'
      )
      .run();

    if (!result.success) {
      throw new Error('Falha ao salvar diagnostico no banco de dados');
    }

    diagnostico.id = result.meta.last_row_id;
    return diagnostico;
  }

  async listar(): Promise<Diagnostico[]> {
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
          habitat
        FROM diagnosticos
        ORDER BY diagnostic_date DESC
        `
      )
      .all<DiagnosticoRow>();

    return result.results.map(
      (row) =>
        new Diagnostico(
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
          row.habitat
        )
    );
  }
}
