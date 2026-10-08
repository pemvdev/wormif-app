import type {
  AuthResponseDTO,
  AuthUsuarioDTO,
  LoginUsuarioDTO,
  PerfilResponseDTO,
  UpdatePerfilDTO,
  RegisterUsuarioDTO
} from '../dto/AuthDTO';
import { z } from 'zod';
import { Usuario } from '../model/Usuario';
import { SessaoRepository } from '../repository/SessaoRepository';
import { UsuarioRepository } from '../repository/UsuarioRepository';
import { createSalt, hashPassword, verifyPassword } from '../utils/password';

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const IMAGE_DATA_URL_PATTERN = /^data:image\/(png|jpeg|jpg|webp);base64,[A-Za-z0-9+/=]+$/;
const perfilSchema = z.object({
  nome: z.string().trim().min(1, 'Informe seu nome.'),
  email: z.string().trim().toLowerCase().email('E-mail inválido.'),
  profissao: z.string().trim().nullable().optional().transform((value) => value || null),
  linkedin: z.string().trim().nullable().optional().refine((value) => {
    if (!value) return true;
    try {
      const url = new URL(value);
      return url.protocol === 'https:' && (url.hostname === 'linkedin.com' || url.hostname.endsWith('.linkedin.com'));
    } catch {
      return false;
    }
  }, 'Informe um LinkedIn válido.').transform((value) => value || null),
  fotoPerfilUrl: z.string().trim().nullable().optional().refine(
    (value) => !value || (value.length <= 350_000 && IMAGE_DATA_URL_PATTERN.test(value)),
    'Envie uma foto de perfil válida.'
  ).transform((value) => value || null),
  intuitoUso: z.enum(['ANALISAR_OUTRAS_PESSOAS', 'CURIOSIDADE'], {
    errorMap: () => ({ message: 'Informe o intuito de uso da aplicação.' })
  }),
  permiteAnalisePorTerceiros: z.boolean({
    required_error: 'Informe se outras pessoas podem analisar suas análises.',
    invalid_type_error: 'Informe se outras pessoas podem analisar suas análises.'
  })
}).superRefine((perfil, context) => {
  if (perfil.intuitoUso !== 'ANALISAR_OUTRAS_PESSOAS') return;
  if (!perfil.profissao) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['profissao'], message: 'Informe sua profissão.' });
  }
  if (!perfil.linkedin) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ['linkedin'], message: 'Informe um LinkedIn válido.' });
  }
});

export type SessaoValida = {
  token: string;
  usuarioId: string;
};

export class AuthService {
  private usuarioRepository: UsuarioRepository;
  private sessaoRepository: SessaoRepository;

  constructor(database: D1Database) {
    this.usuarioRepository = new UsuarioRepository(database);
    this.sessaoRepository = new SessaoRepository(database);
  }

  async registrar(dto: RegisterUsuarioDTO): Promise<AuthResponseDTO> {
    const perfil = perfilSchema.safeParse(dto);
    if (!perfil.success) {
      return { success: false, error: perfil.error.issues[0].message };
    }
    if (typeof dto.senha !== 'string' || dto.senha.length < 6) {
      return { success: false, error: 'A senha deve ter pelo menos 6 caracteres.' };
    }
    const existing = await this.usuarioRepository.buscarPorEmail(perfil.data.email);
    if (existing) {
      return { success: false, error: 'E-mail já cadastrado.' };
    }

    const salt = createSalt();
    const senhaHash = await hashPassword(dto.senha, salt);
    const usuario = new Usuario(
      crypto.randomUUID(),
      perfil.data.nome,
      perfil.data.email,
      senhaHash,
      salt,
      perfil.data.profissao,
      perfil.data.fotoPerfilUrl,
      perfil.data.linkedin,
      perfil.data.intuitoUso,
      perfil.data.permiteAnalisePorTerceiros,
      new Date().toISOString()
    );

    await this.usuarioRepository.criar(usuario);
    return this.criarSessao(usuario);
  }

  async atualizarPerfil(usuarioId: string, dto: UpdatePerfilDTO): Promise<PerfilResponseDTO> {
    const perfil = perfilSchema.safeParse(dto);
    if (!perfil.success) return { success: false, error: perfil.error.issues[0].message };
    const usuario = await this.usuarioRepository.buscarPorId(usuarioId);
    if (!usuario) return { success: false, error: 'Usuário não encontrado.' };
    const existing = await this.usuarioRepository.buscarPorEmail(perfil.data.email);
    if (existing && existing.id !== usuarioId) {
      return { success: false, error: 'E-mail já cadastrado.' };
    }
    Object.assign(usuario, perfil.data);
    const atualizado = await this.usuarioRepository.atualizarPerfil(usuario);
    if (!atualizado) return { success: false, error: 'E-mail já cadastrado.' };
    return { success: true, data: this.toAuthUsuarioDTO(usuario) };
  }

  async login(dto: LoginUsuarioDTO): Promise<AuthResponseDTO> {
    const usuario = await this.usuarioRepository.buscarPorEmail(dto.email);
    if (!usuario) {
      return { success: false, error: 'E-mail ou senha inválidos.' };
    }

    const valid = await verifyPassword(dto.senha, usuario.senhaSalt, usuario.senhaHash);
    if (!valid) {
      return { success: false, error: 'E-mail ou senha inválidos.' };
    }

    return this.criarSessao(usuario);
  }

  async logout(token: string): Promise<void> {
    await this.sessaoRepository.excluir(token);
  }

  async resolverSessao(authorizationHeader?: string): Promise<SessaoValida | null> {
    const token = this.extractBearerToken(authorizationHeader);
    if (!token) return null;

    await this.sessaoRepository.excluirExpiradas();
    const sessao = await this.sessaoRepository.buscarPorToken(token);
    if (!sessao) return null;

    if (new Date(sessao.expires_at).getTime() <= Date.now()) {
      await this.sessaoRepository.excluir(token);
      return null;
    }

    return { token, usuarioId: sessao.usuario_id };
  }

  private extractBearerToken(authorizationHeader?: string): string | null {
    if (!authorizationHeader?.startsWith('Bearer ')) return null;
    const token = authorizationHeader.slice('Bearer '.length).trim();
    return token.length > 0 ? token : null;
  }

  private async criarSessao(usuario: Usuario): Promise<AuthResponseDTO> {
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
    await this.sessaoRepository.criar(token, usuario.id, expiresAt);

    return {
      success: true,
      data: {
        token,
        usuario: this.toAuthUsuarioDTO(usuario)
      }
    };
  }

  private toAuthUsuarioDTO(usuario: Usuario): AuthUsuarioDTO {
    return {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      profissao: usuario.profissao,
      fotoPerfilUrl: usuario.fotoPerfilUrl,
      linkedin: usuario.linkedin,
      intuitoUso: usuario.intuitoUso,
      permiteAnalisePorTerceiros: usuario.permiteAnalisePorTerceiros
    };
  }
}
