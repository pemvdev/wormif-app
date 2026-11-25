import { createMiddleware } from 'hono/factory';
import { ServiceContainer } from '../config/ServiceContainer';

export const authMiddleware = createMiddleware<{
  Bindings: Env;
  Variables: {
    sessao?: { token: string; usuarioId: string };
  };
}>(async (c, next) => {
  const authService = ServiceContainer.createAuthService(c.env);
  const sessao = await authService.resolverSessao(c.req.header('Authorization'));
  if (!sessao) {
    return c.json({ success: false, error: 'Não autenticado' }, 401);
  }
  c.set('sessao', sessao);
  await next();
});
