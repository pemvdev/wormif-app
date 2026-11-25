import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

export const usuarios = sqliteTable('usuarios', {
  id: text('id').primaryKey(),
  nome: text('nome').notNull(),
  email: text('email').notNull().unique(),
  senhaHash: text('senha_hash').notNull(),
  senhaSalt: text('senha_salt').notNull(),
  ocupacao: text('ocupacao'),
  fotoPerfilUrl: text('foto_perfil_url'),
  linkedin: text('linkedin'),
  intuitoUso: text('intuito_uso'),
  permiteAnalisePorTerceiros: integer('permite_analise_por_terceiros'),
  dataCadastro: text('data_cadastro').notNull(),
});

export const sessoes = sqliteTable('sessoes', {
  token: text('token').primaryKey(),
  usuarioId: text('usuario_id').notNull(),
  expiresAt: text('expires_at').notNull(),
});

export const tokensRedefinicaoSenha = sqliteTable('tokens_redefinicao_senha', {
  tokenHash: text('token_hash').primaryKey(),
  usuarioId: text('usuario_id').notNull(),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull(),
});

export const diagnosticos = sqliteTable('diagnosticos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  diagnosticDate: text('diagnostic_date').notNull(),
  status: text('status').notNull(),
  confidenceLevel: real('confidence_level').notNull(),
  lifeStage: text('life_stage').notNull(),
  species: text('species').notNull(),
  commonName: text('common_name').notNull(),
  description: text('description').notNull(),
  characteristicsJson: text('characteristics_json').notNull(),
  habitat: text('habitat').notNull(),
  source: text('source').notNull().default('application'),
  userId: text('user_id'),
  imagemKey: text('imagem_key'),
  latitude: real('latitude'),
  longitude: real('longitude'),
  localizacaoLabel: text('localizacao_label'),
  createdAt: text('created_at').notNull(),
  updatedAt: text('updated_at').notNull(),
});

export const diagnosticoDiscussao = sqliteTable('diagnostico_discussao', {
  id: text('id').primaryKey(),
  sequencia: integer('sequencia'),
  parentId: text('parent_id'),
  diagnosticoId: integer('diagnostico_id').notNull(),
  usuarioId: text('usuario_id').notNull(),
  especie: text('especie'),
  estagio: text('estagio'),
  comentario: text('comentario').notNull(),
  criadoEm: text('criado_em').notNull(),
  atualizadoEm: text('atualizado_em').notNull(),
});
