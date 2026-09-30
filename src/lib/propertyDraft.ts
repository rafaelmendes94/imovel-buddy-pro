const DB_NAME = "mv-connect-property-drafts";
const STORE_NAME = "files";
const DB_VERSION = 1;

export type PropertyDraft<TForm, TPhotoRef> = {
  version: 1;
  savedAt: string;
  form: TForm;
  selectedBrokerId: string;
  existingImages: string[];
  photoOrder: TPhotoRef[];
};

const openDraftDb = () =>
  new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

export async function savePropertyDraftFiles(key: string, files: File[]) {
  const db = await openDraftDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(files, key);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
}

export async function loadPropertyDraftFiles(key: string): Promise<File[]> {
  const db = await openDraftDb();
  const files = await new Promise<File[]>((resolve, reject) => {
    const request = db.transaction(STORE_NAME, "readonly").objectStore(STORE_NAME).get(key);
    request.onsuccess = () => resolve(Array.isArray(request.result) ? request.result : []);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return files;
}

export async function clearPropertyDraft(key: string) {
  localStorage.removeItem(key);
  const db = await openDraftDb();
  await new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).delete(key);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  db.close();
}

export const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
