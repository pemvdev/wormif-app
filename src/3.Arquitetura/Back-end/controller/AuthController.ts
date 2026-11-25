import { Hono } from 'hono';
import type { AlterarSenhaDTO, LoginUsuarioDTO, RegisterUsuarioDTO, UpdatePerfilDTO, SolicitarRedefinicaoSenhaDTO, RedefinirSenhaDTO } from '../dto/AuthDTO';
import { authMiddleware } from '../middleware/authMiddleware';
import { ServiceContainer } from '../config/ServiceContainer';

const authController = new Hono<{ Bindings: Env; Variables: { sessao?: { token: string; usuarioId: string } } }>();
authController.use('/profile', authMiddleware);
authController.use('/password', authMiddleware);

authController.post('/password-reset/request', async (c) => {
  try {
    const body = await c.req.json<SolicitarRedefinicaoSenhaDTO>();
    const result = await ServiceContainer.createAuthService(c.env).solicitarRedefinicaoSenha(body);
    return c.json(result, result.success ? 200 : 400);
  } catch (error) {
    console.error('Erro ao solicitar redefinição de senha:', error);
    return c.json({ success: false, error: 'Não foi possível solicitar a recuperação. Tente novamente.' }, 500);
  }
});

authController.post('/password-reset/confirm', async (c) => {
  try {
    const body = await c.req.json<RedefinirSenhaDTO>();
    const result = await ServiceContainer.createAuthService(c.env).redefinirSenha(body);
    return c.json(result, result.success ? 200 : 400);
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    return c.json({ success: false, error: 'Não foi possível redefinir a senha. Tente novamente.' }, 500);
  }
});

authController.put('/profile', async (c) => {
  const authService = ServiceContainer.createAuthService(c.env);
  const sessao = c.get('sessao');
  if (!sessao) return c.json({ success: false, error: 'Faça login para editar seu perfil.' }, 401);
  let body: UpdatePerfilDTO;
  try {
    body = await c.req.json<UpdatePerfilDTO>();
  } catch {
    return c.json({ success: false, error: 'Dados inválidos.' }, 400);
  }
  try {
    const resultado = await authService.atualizarPerfil(sessao.usuarioId, body);
    return c.json(resultado, resultado.success ? 200 : 400);
  } catch {
    return c.json({ success: false, error: 'Não foi possível atualizar o perfil.' }, 500);
  }
});

authController.put('/password', async (c) => {
  const sessao = c.get('sessao');
  if (!sessao) return c.json({ success: false, error: 'Faça login para alterar sua senha.' }, 401);
  let body: AlterarSenhaDTO;
  try {
    body = await c.req.json<AlterarSenhaDTO>();
  } catch {
    return c.json({ success: false, error: 'Dados inválidos.' }, 400);
  }
  try {
    const resultado = await ServiceContainer.createAuthService(c.env).alterarSenha(sessao.usuarioId, body);
    return c.json(resultado, resultado.success ? 200 : 400);
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    return c.json({ success: false, error: 'Não foi possível alterar a senha.' }, 500);
  }
});

authController.post('/register', async (c) => {
  try {
    const body = await c.req.json<RegisterUsuarioDTO>();
    const authService = ServiceContainer.createAuthService(c.env);
    const resultado = await authService.registrar(body);
    return c.json(resultado, resultado.success ? 201 : 400);
  } catch (error) {
    console.error('Erro no cadastro:', error);
    return c.json({ success: false, error: 'Erro ao cadastrar usuário' }, 500);
  }
});

authController.post('/login', async (c) => {
  try {
    const body = await c.req.json<LoginUsuarioDTO>();
    const authService = ServiceContainer.createAuthService(c.env);
    const resultado = await authService.login(body);
    return c.json(resultado, resultado.success ? 200 : 401);
  } catch (error) {
    console.error('Erro no login:', error);
    return c.json({ success: false, error: 'Erro ao autenticar usuário' }, 500);
  }
});

authController.post('/logout', async (c) => {
  try {
    const authService = ServiceContainer.createAuthService(c.env);
    const sessao = await authService.resolverSessao(c.req.header('Authorization'));
    if (sessao) {
      await authService.logout(sessao.token);
    }
    return c.json({ success: true });
  } catch (error) {
    console.error('Erro no logout:', error);
    return c.json({ success: false, error: 'Erro ao encerrar sessão' }, 500);
  }
});

export { authController };
