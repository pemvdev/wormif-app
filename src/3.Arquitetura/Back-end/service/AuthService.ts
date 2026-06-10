import type {
  AuthResponseDTO,
  AuthUsuarioDTO,
  LoginUsuarioDTO,
  RegisterUsuarioDTO
} from '../dto/AuthDTO';
import { Usuario } from '../model/Usuario';
import { SessaoRepository } from '../repository/SessaoRepository';
import { UsuarioRepository } from '../repository/UsuarioRepository';
import { createSalt, hashPassword, verifyPassword } from '../utils/password';

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

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
    if (!dto.nome.trim()) {
      return { success: false, error: 'Informe seu nome.' };
    }
    if (!dto.email.includes('@')) {
      return { success: false, error: 'E-mail inválido.' };
    }
    if (dto.senha.length < 6) {
      return { success: false, error: 'A senha deve ter pelo menos 6 caracteres.' };
    }

    const existing = await this.usuarioRepository.buscarPorEmail(dto.email);
    if (existing) {
      return { success: false, error: 'E-mail já cadastrado.' };
    }

    const salt = createSalt();
    const senhaHash = await hashPassword(dto.senha, salt);
    const usuario = new Usuario(
      crypto.randomUUID(),
      dto.nome.trim(),
      dto.email.toLowerCase(),
      senhaHash,
      salt,
      dto.ocupacao?.trim() || null,
      new Date().toISOString()
    );

    await this.usuarioRepository.criar(usuario);
    return this.criarSessao(usuario);
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
      email: usuario.email
    };
  }
}
