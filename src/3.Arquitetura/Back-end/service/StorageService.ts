import type { UploadImagemDTO } from '../dto/UploadImagemDTO';
import { validateBase64PayloadSize, validateMimeType } from '../utils/FileValidator';

export type StorageValidationResult =
  | { ok: true }
  | { ok: false; error: string };

export class StorageService {
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
