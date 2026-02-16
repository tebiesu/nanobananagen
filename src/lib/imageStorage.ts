// IndexedDB 存储工具 - 用于持久化图片历史记录

const DB_NAME = 'nanobanana-db';
const DB_VERSION = 1;
const STORE_NAME = 'images';

export interface StoredImage {
  id: string;
  url: string;
  prompt: string;
  negativePrompt?: string;
  params: {
    aspectRatio: string;
    resolution: string;
    model: string;
    steps: number;
    guidance: number;
    seed: number | null;
  };
  timestamp: number;
  favorite: boolean;
}

let dbInstance: IDBDatabase | null = null;

// 初始化数据库
function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('favorite', 'favorite', { unique: false });
      }
    };
  });
}

// 保存图片
export async function saveImage(image: Omit<StoredImage, 'id' | 'favorite'>): Promise<string> {
  const db = await initDB();
  const id = `img_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const storedImage: StoredImage = {
    ...image,
    id,
    favorite: false,
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(storedImage);

    request.onsuccess = () => resolve(id);
    request.onerror = () => reject(request.error);
  });
}

// 获取所有图片
export async function getAllImages(): Promise<StoredImage[]> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('timestamp');
    const request = index.openCursor(null, 'prev'); // 按时间倒序

    const images: StoredImage[] = [];

    request.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
      if (cursor) {
        images.push(cursor.value);
        cursor.continue();
      } else {
        resolve(images);
      }
    };

    request.onerror = () => reject(request.error);
  });
}

// 删除图片
export async function deleteImage(id: string): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// 切换收藏状态
export async function toggleFavorite(id: string): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const getRequest = store.get(id);

    getRequest.onsuccess = () => {
      const image = getRequest.result;
      if (image) {
        image.favorite = !image.favorite;
        const putRequest = store.put(image);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(putRequest.error);
      } else {
        resolve();
      }
    };

    getRequest.onerror = () => reject(getRequest.error);
  });
}

// 清空所有图片
export async function clearAllImages(): Promise<void> {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// 获取存储统计
export async function getStorageStats(): Promise<{ count: number; oldestTimestamp: number | null }> {
  const images = await getAllImages();
  return {
    count: images.length,
    oldestTimestamp: images.length > 0 ? images[images.length - 1].timestamp : null,
  };
}
