/**
 * 浏览器操作工具
 * 提供跨平台的浏览器打开功能
 */

import { open } from '@tauri-apps/api/shell';

/**
 * 在系统默认浏览器中打开 URL
 * @param url - 要打开的 URL
 * @returns Promise
 */
export async function openInBrowser(url: string): Promise<void> {
  try {
    // 验证 URL 格式
    if (!isValidUrl(url)) {
      throw new Error('无效的 URL 格式');
    }
    
    // 使用 Tauri 的 shell open API
    await open(url);
  } catch (error) {
    console.error('打开浏览器失败:', error);
    throw error;
  }
}

/**
 * 验证 URL 是否有效
 * @param url - URL 字符串
 * @returns 是否有效
 */
export function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * 确保 URL 有协议前缀
 * @param url - URL 字符串
 * @returns 完整的 URL
 */
export function ensureProtocol(url: string): string {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    return 'https://' + url;
  }
  return url;
}

/**
 * 获取 URL 的域名
 * @param url - URL 字符串
 * @returns 域名或 null
 */
export function getDomain(url: string): string | null {
  try {
    const fullUrl = ensureProtocol(url);
    const urlObj = new URL(fullUrl);
    return urlObj.hostname;
  } catch {
    return null;
  }
}

/**
 * 获取 favicon URL
 * @param domain - 域名
 * @param size - 图标大小
 * @returns favicon URL
 */
export function getFaviconUrl(domain: string, size: number = 32): string {
  // 使用 Google Favicon 服务
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`;
}

/**
 * 备用的 favicon 服务列表
 */
export const FAVICON_SERVICES = [
  (domain: string, size: number) => 
    `https://www.google.com/s2/favicons?domain=${domain}&sz=${size}`,
  (domain: string) => 
    `https://icons.duckduckgo.com/ip3/${domain}.ico`,
  (domain: string) => 
    `https://${domain}/favicon.ico`,
];
