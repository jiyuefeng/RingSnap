/**
 * 图标管理 Store
 * 管理图标缓存
 */

import { defineStore } from 'pinia';
import { ref } from 'vue';

interface IconCacheEntry {
  url: string;
  timestamp: number;
}

// 缓存过期时间：7 天
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000;

export const useIconStore = defineStore('icon', () => {
  // 内存缓存
  const iconCache = ref<Map<string, IconCacheEntry>>(new Map());
  
  // 加载中的图标
  const loadingIcons = ref<Set<string>>(new Set());
  
  // 加载失败的图标
  const failedIcons = ref<Set<string>>(new Set());

  /**
   * 获取图标 URL
   * @param domain - 域名
   * @param size - 图标大小
   * @returns 图标 URL
   */
  function getIconUrl(domain: string, size: number = 32): string {
    // 使用 Google Favicon 服务
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
  }

  /**
   * 检查图标是否在缓存中
   */
  function isIconCached(domain: string): boolean {
    const entry = iconCache.value.get(domain);
    if (!entry) return false;
    
    // 检查是否过期
    if (Date.now() - entry.timestamp > CACHE_EXPIRY) {
      iconCache.value.delete(domain);
      return false;
    }
    
    return true;
  }

  /**
   * 缓存图标
   */
  function cacheIcon(domain: string, url: string): void {
    iconCache.value.set(domain, {
      url,
      timestamp: Date.now(),
    });
  }

  /**
   * 获取缓存的图标 URL
   */
  function getCachedIconUrl(domain: string): string | null {
    const entry = iconCache.value.get(domain);
    return entry ? entry.url : null;
  }

  /**
   * 标记图标正在加载
   */
  function setIconLoading(domain: string, loading: boolean): void {
    if (loading) {
      loadingIcons.value.add(domain);
    } else {
      loadingIcons.value.delete(domain);
    }
  }

  /**
   * 检查图标是否正在加载
   */
  function isIconLoading(domain: string): boolean {
    return loadingIcons.value.has(domain);
  }

  /**
   * 标记图标加载失败
   */
  function setIconFailed(domain: string): void {
    failedIcons.value.add(domain);
    loadingIcons.value.delete(domain);
  }

  /**
   * 检查图标是否加载失败
   */
  function isIconFailed(domain: string): boolean {
    return failedIcons.value.has(domain);
  }

  /**
   * 清除缓存
   */
  function clearCache(): void {
    iconCache.value.clear();
    loadingIcons.value.clear();
    failedIcons.value.clear();
  }

  /**
   * 清除过期缓存
   */
  function clearExpiredCache(): void {
    const now = Date.now();
    for (const [domain, entry] of iconCache.value) {
      if (now - entry.timestamp > CACHE_EXPIRY) {
        iconCache.value.delete(domain);
      }
    }
  }

  return {
    // 状态
    iconCache,
    loadingIcons,
    failedIcons,
    // 方法
    getIconUrl,
    isIconCached,
    cacheIcon,
    getCachedIconUrl,
    setIconLoading,
    isIconLoading,
    setIconFailed,
    isIconFailed,
    clearCache,
    clearExpiredCache,
  };
});
