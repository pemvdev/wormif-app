import type { MiddlewareHandler } from 'hono';
import type { UploadImagemDTO } from '../dto/UploadImagemDTO';
import { validateUploadImagem } from '../utils/FileValidator';

export const uploadMiddleware: MiddlewareHandler<{
  Bindings: Env;
  Variables: { uploadDto: UploadImagemDTO };
}> = async (c, next) => {
  let body: UploadImagemDTO;
  try {
    body = await c.req.json<UploadImagemDTO>();
  } catch {
    return c.json({ success: false, error: 'Corpo da requisição inválido' }, 400);
  }

  const validation = validateUploadImagem(body);
  if (!validation.valid) {
    return c.json({ success: false, error: validation.error ?? 'Upload inválido' }, 400);
  }

  c.set('uploadDto', body);
  await next();
};
