import type { UploadImagemDTO } from '../dto/UploadImagemDTO';
import { validateBase64PayloadSize, validateMimeType, validateUploadImagem } from '../utils/FileValidator';

export type StorageValidationResult =
  | { ok: true }
  | { ok: false; error: string };

export type ParseUploadResult =
  | { ok: true; data: UploadImagemDTO }
  | { ok: false; error: string; status: 400 };

export class StorageService {
  async parsearUpload(request: Request): Promise<ParseUploadResult> {
    let body: UploadImagemDTO;
    try {
      body = await request.json<UploadImagemDTO>();
    } catch {
      return { ok: false, error: 'Corpo da requisição inválido', status: 400 };
    }

    const validation = validateUploadImagem(body);
    if (!validation.valid) {
      return { ok: false, error: validation.error ?? 'Upload inválido', status: 400 };
    }

    return { ok: true, data: body };
  }

  async validarUpload(upload: UploadImagemDTO): Promise<StorageValidationResult> {
    const mime = validateMimeType(upload.mimeType);
    if (!mime.valid) {
      return { ok: false, error: mime.error ?? 'MIME inválido' };
    }
    const size = validateBase64PayloadSize(upload.imageBase64);
    if (!size.valid) {
      return { ok: false, error: size.error ?? 'Tamanho inválido' };
    }
    return { ok: true };
  }
}
