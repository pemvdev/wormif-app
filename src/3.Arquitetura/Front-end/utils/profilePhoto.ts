export function readProfilePhoto(file: File): Promise<string> {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
    return Promise.reject(new Error('Envie uma imagem PNG, JPG ou WebP.'));
  }
  if (file.size > 240 * 1024) {
    return Promise.reject(new Error('A foto deve ter no máximo 240 KB.'));
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Formato de imagem inválido.'));
    };
    reader.onerror = () => reject(new Error('Não foi possível ler a imagem.'));
    reader.readAsDataURL(file);
  });
}
