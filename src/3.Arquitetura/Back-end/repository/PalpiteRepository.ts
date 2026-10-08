import type { ComentarioDiscussaoDTO, PalpiteDTO, SalvarPalpiteDTO, SalvarRespostaDTO } from '../dto/PalpiteDTO';
import type { DiagnosticoBack } from '../model/Diagnostico';
import { EXTERNAL_ACCESS_FROM } from './DiagnosticoRepository';

type ComentarioRow = {
  id: string;
  sequencia: number;
  parent_id: string | null;
  usuario_id: string;
  nome: string;
  ocupacao: string | null;
  foto_perfil_url: string | null;
  linkedin: string | null;
  especie: string | null;
  estagio: DiagnosticoBack | null;
  comentario: string;
  criado_em: string;
  atualizado_em: string;
};

const COMMENT_SELECT = `
  SELECT p.id, p.sequencia, p.parent_id, p.usuario_id, u.nome, u.ocupacao,
    u.foto_perfil_url, u.linkedin, p.especie, p.estagio, p.comentario, p.criado_em, p.atualizado_em
  FROM diagnostico_discussao p JOIN usuarios u ON u.id = p.usuario_id
`;

const DISCUSSION_ACCESS_FROM = `
  FROM diagnosticos d JOIN usuarios autor ON autor.id = d.user_id
  JOIN usuarios leitor ON leitor.id = ?
  WHERE d.status = 'concluido' AND (
    d.user_id = leitor.id OR (leitor.intuito_uso = 'ANALISAR_OUTRAS_PESSOAS'
      AND autor.permite_analise_por_terceiros = 1)
  )
`;

function mapComment(row: ComentarioRow): ComentarioDiscussaoDTO {
  return {
    id: row.id, sequencia: row.sequencia, parentId: row.parent_id,
    autorNome: row.nome,
    autor: { id: row.usuario_id, nome: row.nome, profissao: row.ocupacao,
      fotoPerfilUrl: row.foto_perfil_url, linkedin: row.linkedin },
    especie: row.especie, estagio: row.estagio, comentario: row.comentario,
    criadoEm: row.criado_em, atualizadoEm: row.atualizado_em
  };
}

function isPalpite(item: ComentarioDiscussaoDTO): item is PalpiteDTO {
  return item.parentId === null && item.especie !== null && item.estagio !== null;
}

export class PalpiteRepository {
  constructor(private readonly database: D1Database) {}

  async salvar(id: number, userId: string, dto: SalvarPalpiteDTO): Promise<boolean> {
    const now = new Date().toISOString();
    const result = await this.database.prepare(`
      INSERT INTO diagnostico_discussao (id, diagnostico_id, usuario_id, especie, estagio, comentario, criado_em, atualizado_em)
      SELECT ?, d.id, leitor.id, ?, ?, ?, ?, ? ${EXTERNAL_ACCESS_FROM} AND d.id = ?
      ON CONFLICT (diagnostico_id, usuario_id) WHERE parent_id IS NULL DO UPDATE SET
        especie = excluded.especie, estagio = excluded.estagio,
        comentario = excluded.comentario, atualizado_em = excluded.atualizado_em
    `).bind(crypto.randomUUID(), dto.especie, dto.estagio, dto.comentario, now, now, userId, id).run();
    if (!result.success) throw new Error('Falha ao salvar palpite');
    return result.meta.changes > 0;
  }

  async listar(id: number, userId: string, apenasMeu = false): Promise<PalpiteDTO[]> {
    const result = await this.database.prepare(`${COMMENT_SELECT}
      WHERE p.diagnostico_id = ? AND p.parent_id IS NULL AND EXISTS (
        SELECT 1 ${EXTERNAL_ACCESS_FROM} AND d.id = p.diagnostico_id
      ) ${apenasMeu ? 'AND p.usuario_id = ?' : ''}
      ORDER BY p.atualizado_em DESC, p.usuario_id LIMIT 20
    `).bind(...(apenasMeu ? [id, userId, userId] : [id, userId])).all<ComentarioRow>();
    return result.results.map(mapComment).filter(isPalpite);
  }

  async listarRecebidos(id: number, autorId: string): Promise<PalpiteDTO[]> {
    const result = await this.database.prepare(`${COMMENT_SELECT}
      WHERE p.diagnostico_id = ? AND p.parent_id IS NULL AND EXISTS (
        SELECT 1 FROM diagnosticos d WHERE d.id = p.diagnostico_id AND d.user_id = ?
      ) ORDER BY p.atualizado_em DESC, p.usuario_id LIMIT 20
    `).bind(id, autorId).all<ComentarioRow>();
    return result.results.map(mapComment).filter(isPalpite);
  }

  async listarDiscussao(id: number, userId: string, cursor: number, limit: number): Promise<ComentarioDiscussaoDTO[]> {
    const result = await this.database.prepare(`${COMMENT_SELECT}
      WHERE p.diagnostico_id = ? AND p.sequencia > ? AND EXISTS (
        SELECT 1 ${DISCUSSION_ACCESS_FROM} AND d.id = p.diagnostico_id
      ) ORDER BY p.sequencia LIMIT ?
    `).bind(id, cursor, userId, limit).all<ComentarioRow>();
    return result.results.map(mapComment);
  }

  async responder(id: number, userId: string, dto: SalvarRespostaDTO): Promise<boolean> {
    const now = new Date().toISOString();
    const result = await this.database.prepare(`
      INSERT INTO diagnostico_discussao (id, diagnostico_id, usuario_id, parent_id, comentario, criado_em, atualizado_em)
      SELECT ?, d.id, leitor.id, ?, ?, ?, ? ${DISCUSSION_ACCESS_FROM} AND d.id = ?
        AND EXISTS (SELECT 1 FROM diagnostico_discussao pai WHERE pai.id = ? AND pai.diagnostico_id = d.id)
    `).bind(crypto.randomUUID(), dto.parentId, dto.comentario, now, now, userId, id, dto.parentId).run();
    if (!result.success) throw new Error('Falha ao salvar resposta');
    return result.meta.changes > 0;
  }
}
