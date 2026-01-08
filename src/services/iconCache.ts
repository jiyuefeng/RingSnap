/**
 * 图标缓存服务
 * 使用内存缓存 + localStorage 持久化，减少图标重复加载
 */

interface CacheEntry {
  data: string;        // Base64 图片数据
  timestamp: number;   // 缓存时间
  sourceIndex: number; // 图标源索引
}

// 缓存过期时间：7天
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000;
const CACHE_PREFIX = 'ringsnap_icon_';

// 内存缓存
const memoryCache = new Map<string, string>();

/**
 * 生成缓存键
 */
function getCacheKey(domain: string, sourceIndex: number): string {
  return `${CACHE_PREFIX}${domain}_${sourceIndex}`;
}

/**
 * 从 localStorage 获取缓存
 */
function getFromStorage(key: string): string | null {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return null;

    const entry: CacheEntry = JSON.parse(stored);
    
    // 检查是否过期
    if (Date.now() - entry.timestamp > CACHE_EXPIRY) {
      localStorage.removeItem(key);
      return null;
    }

    return entry.data;
  } catch {
    return null;
  }
}

/**
 * 保存到 localStorage
 */
function saveToStorage(key: string, data: string, sourceIndex: number): void {
  try {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      sourceIndex
    };
    localStorage.setItem(key, JSON.stringify(entry));
  } catch (e) {
    // localStorage 可能已满，清理旧缓存
    console.warn('Icon cache storage failed:', e);
    cleanupOldCache();
  }
}

/**
 * 清理过期缓存
 */
function cleanupOldCache(): void {
  try {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith(CACHE_PREFIX)) {
        const stored = localStorage.getItem(key);
        if (stored) {
          try {
            const entry: CacheEntry = JSON.parse(stored);
            if (Date.now() - entry.timestamp > CACHE_EXPIRY) {
              localStorage.removeItem(key);
            }
          } catch {
            localStorage.removeItem(key);
          }
        }
      }
    }
  } catch (e) {
    console.warn('Cache cleanup failed:', e);
  }
}

/**
 * 将图片 URL 转换为 Base64
 */
async function fetchAsBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }
        
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl);
      } catch (e) {
        // 跨域图片可能无法转换，直接使用 URL
        reject(e);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}

/**
 * 获取缓存的图标
 * @param domain 域名
 * @param sourceIndex 图标源索引
 * @returns 缓存的 Base64 数据或 null
 */
export function getCachedIcon(domain: string, sourceIndex: number): string | null {
  const key = getCacheKey(domain, sourceIndex);
  
  // 先查内存缓存
  if (memoryCache.has(key)) {
    return memoryCache.get(key)!;
  }
  
  // 再查 localStorage
  const stored = getFromStorage(key);
  if (stored) {
    // 加载到内存缓存
    memoryCache.set(key, stored);
    return stored;
  }
  
  return null;
}

/**
 * 缓存图标
 * @param domain 域名
 * @param sourceIndex 图标源索引
 * @param imageUrl 图片 URL 或 Base64 数据
 */
export async function cacheIcon(
  domain: string, 
  sourceIndex: number, 
  imageUrl: string
): Promise<string | null> {
  const key = getCacheKey(domain, sourceIndex);
  
  // 如果已经是 Base64，直接缓存
  if (imageUrl.startsWith('data:')) {
    memoryCache.set(key, imageUrl);
    saveToStorage(key, imageUrl, sourceIndex);
    return imageUrl;
  }
  
  // 尝试将 URL 转换为 Base64
  try {
    const base64 = await fetchAsBase64(imageUrl);
    memoryCache.set(key, base64);
    saveToStorage(key, base64, sourceIndex);
    return base64;
  } catch {
    // 转换失败，直接缓存 URL（不持久化，因为下次可能无法访问）
    memoryCache.set(key, imageUrl);
    return imageUrl;
  }
}

/**
 * 清除特定域名的缓存
 */
export function clearIconCache(domain: string): void {
  // 清除内存缓存
  const keysToDelete: string[] = [];
  memoryCache.forEach((_, key) => {
    if (key.includes(`_${domain}_`)) {
      keysToDelete.push(key);
    }
  });
  keysToDelete.forEach(key => memoryCache.delete(key));
  
  // 清除 localStorage
  try {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith(CACHE_PREFIX) && key.includes(`_${domain}_`)) {
        localStorage.removeItem(key);
      }
    }
  } catch (e) {
    console.warn('Failed to clear cache:', e);
  }
}

/**
 * 更新特定域名的首选图标源
 * 用于用户手动切换图标后更新缓存
 */
export function updatePreferredIcon(
  domain: string, 
  sourceIndex: number, 
  imageUrl: string
): Promise<string | null> {
  return cacheIcon(domain, sourceIndex, imageUrl);
}

// 初始化时清理过期缓存
cleanupOldCache();
