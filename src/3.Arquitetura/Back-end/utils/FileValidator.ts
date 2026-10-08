import type { UploadImagemDTO } from '../dto/UploadImagemDTO';

export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
];

export const MAX_FILE_SIZE = 10 * 1024 * 1024;

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateMimeType(mimeType: string): ValidationResult {
  if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
    return {
      valid: false,
      error: 'Formato não suportado. Use JPEG, PNG, WebP ou GIF.'
    };
  }
  return { valid: true };
}

export function validateBase64PayloadSize(imageBase64: string): ValidationResult {
  const approxBytes = (imageBase64.length * 3) / 4;
  if (approxBytes > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: 'Imagem muito grande. Máximo 10MB.'
    };
  }
  return { valid: true };
}

export function validateUploadImagem(dto: UploadImagemDTO): ValidationResult {
  if (!dto || typeof dto.imageBase64 !== 'string' || !dto.imageBase64 || typeof dto.mimeType !== 'string') {
    return { valid: false, error: 'Dados de imagem inválidos' };
  }
  if (dto.imageBase64.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(dto.imageBase64)) {
    return { valid: false, error: 'Dados de imagem inválidos' };
  }
  const mime = validateMimeType(dto.mimeType);
  if (!mime.valid) return mime;
  return validateBase64PayloadSize(dto.imageBase64);
}
