import type {
  AuthResponseDTO,
  AuthUsuarioDTO,
  AlterarSenhaDTO,
  LoginUsuarioDTO,
  OperacaoAuthDTO,
  PerfilResponseDTO,
  UpdatePerfilDTO,
  RegisterUsuarioDTO,
  SolicitarRedefinicaoSenhaDTO,
  RedefinirSenhaDTO
} from '../dto/AuthDTO';
import { z } from 'zod';
import { Usuario } from '../model/Usuario';
import { SessaoRepository } from '../repository/SessaoRepository';
import { UsuarioRepository } from '../repository/UsuarioRepository';
import { PasswordResetRepository } from '../repository/PasswordResetRepository';
import type { EmailSender } from './EmailSender';
import { createSalt, hashPassword, verifyPasswordWithUpgrade } from '../utils/password';

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000;
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
const alterarSenhaSchema = z.object({
  senhaAtual: z.string().min(1, 'Informe sua senha atual.'),
  novaSenha: z.string().min(6, 'A nova senha deve ter pelo menos 6 caracteres.'),
  confirmacaoNovaSenha: z.string().min(1, 'Confirme a nova senha.')
}).refine((dados) => dados.novaSenha === dados.confirmacaoNovaSenha, {
  path: ['confirmacaoNovaSenha'],
  message: 'A confirmação não corresponde à nova senha.'
}).refine((dados) => dados.novaSenha !== dados.senhaAtual, {
  path: ['novaSenha'],
  message: 'A nova senha deve ser diferente da senha atual.'
});
const solicitarRedefinicaoSchema = z.object({ email: z.string().trim().toLowerCase().email('Informe um e-mail válido.') });
const redefinirSenhaSchema = z.object({
  token: z.string().min(20),
  novaSenha: z.string().min(6, 'A nova senha deve ter pelo menos 6 caracteres.'),
  confirmacaoNovaSenha: z.string().min(1, 'Confirme a nova senha.')
}).refine((dados) => dados.novaSenha === dados.confirmacaoNovaSenha, {
  path: ['confirmacaoNovaSenha'], message: 'A confirmação não corresponde à nova senha.'
});

async function sha256(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export type SessaoValida = {
  token: string;
  usuarioId: string;
};

export class AuthService {
  private usuarioRepository: UsuarioRepository;
  private sessaoRepository: SessaoRepository;
  private passwordResetRepository: PasswordResetRepository;

  constructor(
    database: D1Database,
    private readonly appUrl?: string,
    private readonly emailSender: EmailSender | null = null
  ) {
    this.usuarioRepository = new UsuarioRepository(database);
    this.sessaoRepository = new SessaoRepository(database);
    this.passwordResetRepository = new PasswordResetRepository(database);
  }

  async solicitarRedefinicaoSenha(dto: SolicitarRedefinicaoSenhaDTO): Promise<OperacaoAuthDTO> {
    const parsed = solicitarRedefinicaoSchema.safeParse(dto);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
    if (!this.emailSender || !this.appUrl) {
      console.error('Recuperação de senha não está configurada.');
      return { success: false, error: 'O envio de e-mail está temporariamente indisponível.' };
    }
    try {
      const appUrl = new URL(this.appUrl);
      if (!['http:', 'https:'].includes(appUrl.protocol) || appUrl.username || appUrl.password) throw new Error('APP_URL inválida.');
    }
    catch { return { success: false, error: 'O envio de e-mail está temporariamente indisponível.' }; }

    const usuario = await this.usuarioRepository.buscarPorEmail(parsed.data.email);
    if (!usuario) return { success: true };

    const bytes = crypto.getRandomValues(new Uint8Array(32));
    const token = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
    const tokenHash = await sha256(token);
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS).toISOString();
    const created = await this.passwordResetRepository.criar(tokenHash, usuario.id, expiresAt);
    if (!created) return { success: true };

    const resetUrl = new URL('/redefinir-senha', this.appUrl);
    resetUrl.searchParams.set('token', token);
    try {
      await this.emailSender.sendPasswordReset({
        recipient: usuario.email,
        recipientName: usuario.nome,
        resetUrl: resetUrl.toString(),
        expiresInMinutes: PASSWORD_RESET_TTL_MS / 60_000
      });
    } catch (error) {
      console.error('Falha no envio do e-mail de recuperação:', error);
    }
    // Keep the hashed token during the cooldown even if delivery fails, so repeated requests cannot spam the provider.
    return { success: true };
  }

  async redefinirSenha(dto: RedefinirSenhaDTO): Promise<OperacaoAuthDTO> {
    const parsed = redefinirSenhaSchema.safeParse(dto);
    if (!parsed.success) return { success: false, error: parsed.error.issues[0].message };
    const tokenHash = await sha256(parsed.data.token);
    const senhaSalt = createSalt();
    const senhaHash = await hashPassword(parsed.data.novaSenha, senhaSalt);
    const usuarioId = await this.passwordResetRepository.consumirValido(tokenHash);
    if (!usuarioId) return { success: false, error: 'Link inválido ou expirado. Solicite uma nova recuperação.' };
    await this.usuarioRepository.atualizarCredenciais(usuarioId, senhaHash, senhaSalt);
    await this.passwordResetRepository.excluirDoUsuario(usuarioId);
    await this.sessaoRepository.excluirDoUsuario(usuarioId);
    return { success: true };
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
    usuario.atualizarPerfil(perfil.data);
    const atualizado = await this.usuarioRepository.atualizarPerfil(usuario);
    if (!atualizado) return { success: false, error: 'E-mail já cadastrado.' };
    return { success: true, data: this.toAuthUsuarioDTO(usuario) };
  }

  async alterarSenha(usuarioId: string, dto: AlterarSenhaDTO): Promise<OperacaoAuthDTO> {
    const dados = alterarSenhaSchema.safeParse(dto);
    if (!dados.success) return { success: false, error: dados.error.issues[0].message };

    const usuario = await this.usuarioRepository.buscarPorId(usuarioId);
    if (!usuario) return { success: false, error: 'Usuário não encontrado.' };

    const senhaAtualValida = await verifyPasswordWithUpgrade(
      dados.data.senhaAtual,
      usuario.senhaSalt,
      usuario.senhaHash
    );
    if (!senhaAtualValida.valid) {
      return { success: false, error: 'A senha atual está incorreta.' };
    }

    const senhaSalt = createSalt();
    const senhaHash = await hashPassword(dados.data.novaSenha, senhaSalt);
    usuario.alterarCredenciais(senhaSalt, senhaHash);
    await this.usuarioRepository.atualizarCredenciais(usuario.id, senhaHash, senhaSalt);
    return { success: true };
  }

  async login(dto: LoginUsuarioDTO): Promise<AuthResponseDTO> {
    const usuario = await this.usuarioRepository.buscarPorEmail(dto.email);
    if (!usuario) {
      return { success: false, error: 'E-mail ou senha inválidos.' };
    }

    const verification = await verifyPasswordWithUpgrade(dto.senha, usuario.senhaSalt, usuario.senhaHash);
    if (!verification.valid) {
      return { success: false, error: 'E-mail ou senha inválidos.' };
    }

    if (verification.needsRehash) {
      const senhaHash = await hashPassword(dto.senha, usuario.senhaSalt);
      usuario.atualizarSenhaHash(senhaHash);
      await this.usuarioRepository.atualizarCredenciais(usuario.id, senhaHash, usuario.senhaSalt);
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
