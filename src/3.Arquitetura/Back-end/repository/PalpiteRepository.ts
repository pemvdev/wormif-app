import type { PalpiteDTO, SalvarPalpiteDTO } from '../dto/PalpiteDTO';
import { EXTERNAL_ACCESS_FROM } from './DiagnosticoRepository';

export class PalpiteRepository {
  constructor(private readonly database: D1Database) {}

  async salvar(id: number, userId: string, dto: SalvarPalpiteDTO): Promise<boolean> {
    const result = await this.database.prepare(`
      INSERT INTO diagnostico_palpites (id, diagnostico_id, usuario_id, especie, estagio, comentario, atualizado_em)
      SELECT ?, d.id, leitor.id, ?, ?, ?, ? ${EXTERNAL_ACCESS_FROM} AND d.id = ?
      ON CONFLICT (diagnostico_id, usuario_id) DO UPDATE SET
        especie = excluded.especie, estagio = excluded.estagio,
        comentario = excluded.comentario, atualizado_em = excluded.atualizado_em
    `).bind(crypto.randomUUID(), dto.especie, dto.estagio, dto.comentario, new Date().toISOString(), userId, id).run();
    if (!result.success) throw new Error('Falha ao salvar palpite');
    return result.meta.changes > 0;
  }

  async listar(id: number, userId: string, apenasMeu = false): Promise<PalpiteDTO[]> {
    const result = await this.database.prepare(`
      SELECT p.id, colaborador.nome AS autorNome, p.especie, p.estagio, p.comentario, p.atualizado_em AS atualizadoEm
      FROM diagnostico_palpites p JOIN usuarios colaborador ON colaborador.id = p.usuario_id
      WHERE p.diagnostico_id = ? AND EXISTS (
        SELECT 1 ${EXTERNAL_ACCESS_FROM} AND d.id = p.diagnostico_id
      ) ${apenasMeu ? 'AND p.usuario_id = ?' : ''}
      ORDER BY p.atualizado_em DESC, p.usuario_id LIMIT 20
    `).bind(...(apenasMeu ? [id, userId, userId] : [id, userId])).all<PalpiteDTO>();
    return result.results;
  }

  async listarRecebidos(id: number, autorId: string): Promise<PalpiteDTO[]> {
    const result = await this.database.prepare(`
      SELECT p.id, colaborador.nome AS autorNome, p.especie, p.estagio, p.comentario, p.atualizado_em AS atualizadoEm
      FROM diagnostico_palpites p JOIN usuarios colaborador ON colaborador.id = p.usuario_id
      JOIN diagnosticos d ON d.id = p.diagnostico_id
      WHERE d.id = ? AND d.user_id = ?
      ORDER BY p.atualizado_em DESC, p.usuario_id LIMIT 20
    `).bind(id, autorId).all<PalpiteDTO>();
    return result.results;
  }
}
