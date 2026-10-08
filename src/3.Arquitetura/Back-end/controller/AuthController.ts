import { Hono } from 'hono';
import type { LoginUsuarioDTO, RegisterUsuarioDTO, UpdatePerfilDTO } from '../dto/AuthDTO';
import { AuthService } from '../service/AuthService';

const authController = new Hono<{ Bindings: Env }>();

authController.put('/profile', async (c) => {
  const authService = new AuthService(c.env.DB);
  const sessao = await authService.resolverSessao(c.req.header('Authorization'));
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

authController.post('/register', async (c) => {
  try {
    const body = await c.req.json<RegisterUsuarioDTO>();
    const authService = new AuthService(c.env.DB);
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
    const authService = new AuthService(c.env.DB);
    const resultado = await authService.login(body);
    return c.json(resultado, resultado.success ? 200 : 401);
  } catch (error) {
    console.error('Erro no login:', error);
    return c.json({ success: false, error: 'Erro ao autenticar usuário' }, 500);
  }
});

authController.post('/logout', async (c) => {
  try {
    const authService = new AuthService(c.env.DB);
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
