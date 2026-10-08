import type { UploadImagemDTO } from '../dto/UploadImagemDTO';

async function imageRequest<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const database = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('wormif_guest_images', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('imagens');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error('Não foi possível acessar as fotos pendentes.'));
  });
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = database.transaction('imagens', mode);
      const request = action(transaction.objectStore('imagens'));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = () => reject(new Error('Não foi possível guardar a foto pendente.'));
      transaction.onabort = () => reject(new Error('Não foi possível guardar a foto pendente.'));
    });
  } finally {
    database.close();
  }
}

export async function saveGuestImage(id: string, image: UploadImagemDTO): Promise<void> {
  await imageRequest('readwrite', (store) => store.put(image, id));
}

export async function readGuestImage(id: string): Promise<UploadImagemDTO | undefined> {
  const value: unknown = await imageRequest('readonly', (store) => store.get(id));
  if (!value || typeof value !== 'object' || !('imageBase64' in value) || typeof value.imageBase64 !== 'string'
    || !('mimeType' in value) || typeof value.mimeType !== 'string'
    || !('fileName' in value) || typeof value.fileName !== 'string') return undefined;
  return { imageBase64: value.imageBase64, mimeType: value.mimeType, fileName: value.fileName };
}

export async function deleteGuestImage(id: string): Promise<void> {
  await imageRequest('readwrite', (store) => store.delete(id));
}
