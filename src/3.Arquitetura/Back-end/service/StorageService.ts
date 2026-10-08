import type { UploadImagemDTO } from '../dto/UploadImagemDTO';
import { validateUploadImagem } from '../utils/FileValidator';

export type StorageValidationResult =
  | { ok: true }
  | { ok: false; error: string };

export type ParseUploadResult =
  | { ok: true; data: UploadImagemDTO }
  | { ok: false; error: string; status: 400 };

export class StorageService {
  constructor(private readonly bucket?: R2Bucket) {}

  async salvarImagem(upload: UploadImagemDTO): Promise<string> {
    if (!this.bucket) throw new Error('Armazenamento de imagens não configurado');
    const validation = await this.validarUpload(upload);
    if (!validation.ok) throw new Error(validation.error);
    const bytes = Uint8Array.from(atob(upload.imageBase64), (character) => character.charCodeAt(0));
    const key = `diagnosticos/${crypto.randomUUID()}`;
    await this.bucket.put(key, bytes, { httpMetadata: { contentType: upload.mimeType } });
    return key;
  }

  async excluirImagem(key: string): Promise<void> {
    if (!this.bucket) throw new Error('Armazenamento de imagens não configurado');
    await this.bucket.delete(key);
  }
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
    const validation = validateUploadImagem(upload);
    if (!validation.valid) return { ok: false, error: validation.error ?? 'Upload inválido' };
    return { ok: true };
  }
}
