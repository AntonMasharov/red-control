import { Platform, Linking } from 'react-native';
import * as Picker from 'expo-document-picker';
import * as FS from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { randomUUID } from 'expo-crypto';
import type { Material } from '../data/model';

function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('red-control-files', 1);
    request.onupgradeneeded = () => request.result.createObjectStore('files');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
async function saveBlob(key: string, blob: Blob) {
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('files', 'readwrite');
      tx.objectStore('files').put(blob, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
async function loadBlob(key: string): Promise<Blob> {
  const db = await database();
  try {
    return await new Promise<Blob>((resolve, reject) => {
      const req = db.transaction('files').objectStore('files').get(key);
      req.onsuccess = () =>
        req.result ? resolve(req.result) : reject(new Error('Файл не найден на устройстве.'));
      req.onerror = () => reject(req.error);
    });
  } finally {
    db.close();
  }
}
export async function importMaterial(existingId?: string): Promise<Material | null> {
  const result = await Picker.getDocumentAsync({
    type: [
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/gif',
      'video/mp4',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ],
    copyToCacheDirectory: true,
  });
  if (result.canceled) return null;
  const file = result.assets[0];
  const mimeByExtension: Record<string, string> = {
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    webp: 'image/webp',
    gif: 'image/gif',
    mp4: 'video/mp4',
    txt: 'text/plain',
  };
  const mime = mimeByExtension[file.name.split('.').at(-1)?.toLowerCase() || ''];
  if (!mime) throw new Error('Поддерживаются PDF, DOCX, PNG, JPG, WEBP, GIF, MP4 и TXT.');
  if ((file.size || 0) > 100 * 1024 * 1024)
    throw new Error('Для этой версии выберите файл до 100 МБ.');
  const key = randomUUID();
  const name = file.name.replace(/[\\/:*?"<>|]/g, '_');
  let uri = key;
  if (Platform.OS === 'web') await saveBlob(key, file.file!);
  else {
    const folder = FS.documentDirectory + 'materials/';
    await FS.makeDirectoryAsync(folder, { intermediates: true });
    uri = folder + key + '-' + name;
    await FS.copyAsync({ from: file.uri, to: uri });
  }
  return {
    id: existingId || key,
    title: name,
    name,
    uri,
    mime,
  };
}
export async function openMaterial(file: Material) {
  if (Platform.OS === 'web') {
    const blob = await loadBlob(file.uri);
    const url = URL.createObjectURL(new Blob([blob], { type: file.mime }));
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener';
    if (!/^(image\/|video\/|application\/pdf|text\/)/.test(file.mime)) a.download = file.name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
  } else
    await Sharing.shareAsync(file.uri, {
      mimeType: file.mime,
      dialogTitle: 'Открыть исходный файл',
    });
}
