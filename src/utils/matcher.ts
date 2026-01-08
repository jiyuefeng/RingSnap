/**
 * URL 匹配引擎
 * 支持正则表达式匹配和参数提取
 */

import type { UrlRule, MatchResult } from '@/types';

/**
 * 匹配单个规则
 * @param text - 输入文本
 * @param rule - URL 规则
 * @returns 匹配结果或 null
 */
export function matchRule(text: string, rule: UrlRule): MatchResult | null {
  try {
    const regex = new RegExp(rule.pattern, 'i');
    const match = text.match(regex);
    
    if (!match) {
      return null;
    }
    
    // 生成目标 URL
    let targetUrl = rule.url;
    
    // 替换 URL 模板中的占位符 {1}, {2}, ...
    for (let i = 1; i < match.length; i++) {
      const placeholder = `{${i}}`;
      const value = match[i] || '';
      targetUrl = targetUrl.replace(placeholder, encodeURIComponent(value));
    }
    
    // 如果没有捕获组，将整个匹配作为 {0} 或 {1}
    if (match.length === 1) {
      targetUrl = targetUrl.replace('{0}', encodeURIComponent(match[0]));
      targetUrl = targetUrl.replace('{1}', encodeURIComponent(match[0]));
    }
    
    // 同时支持 {text} 占位符，替换为整个输入文本
    targetUrl = targetUrl.replace('{text}', encodeURIComponent(text));
    
    return {
      rule,
      targetUrl,
      matchedText: match[0],
    };
  } catch (error) {
    console.error(`规则 "${rule.name}" 匹配失败:`, error);
    return null;
  }
}

/**
 * 匹配所有规则
 * @param text - 输入文本
 * @param rules - URL 规则列表
 * @returns 匹配结果列表
 */
export function matchAllRules(text: string, rules: UrlRule[]): MatchResult[] {
  if (!text || !rules || rules.length === 0) {
    return [];
  }
  
  const results: MatchResult[] = [];
  
  for (const rule of rules) {
    // 只匹配启用的规则（enabled 为 true 或未定义时默认启用）
    if (rule.enabled === false) {
      continue;
    }
    
    const result = matchRule(text, rule);
    if (result) {
      results.push(result);
    }
  }
  
  return results;
}

/**
 * 处理文本
 * 去除多余的空格、换行等
 * @param text - 原始文本
 * @returns 处理后的文本
 */
export function processText(text: string): string {
  return text
    .trim()
    .split('\n')
    .map(line => line.trim())
    .join(' ')
    .replace(/\s+/g, ' ');
}

/**
 * 检测文本是否为 URL
 * @param text - 输入文本
 * @returns 是否为 URL
 */
export function isUrl(text: string): boolean {
  try {
    // 简单的 URL 检测
    const urlPattern = /^(https?:\/\/|www\.)[^\s]+$/i;
    return urlPattern.test(text.trim());
  } catch {
    return false;
  }
}

/**
 * 提取 URL 中的域名
 * @param url - URL 字符串
 * @returns 域名或 null
 */
export function extractDomain(url: string): string | null {
  try {
    // 处理没有协议的 URL
    let fullUrl = url.trim();
    if (!fullUrl.startsWith('http://') && !fullUrl.startsWith('https://')) {
      fullUrl = 'https://' + fullUrl;
    }
    
    const urlObj = new URL(fullUrl);
    return urlObj.hostname;
  } catch {
    return null;
  }
}

/**
 * 创建通用搜索规则
 * 为没有特定匹配的文本提供默认搜索选项
 * @param text - 输入文本
 * @returns 默认的搜索规则结果
 */
export function createDefaultSearchRules(text: string): MatchResult[] {
  const defaultSearchEngines: UrlRule[] = [
    {
      name: 'Google',
      pattern: '.*',
      url: 'https://www.google.com/search?q={text}',
      icon: 'google.com',
    },
    {
      name: 'Baidu',
      pattern: '.*',
      url: 'https://www.baidu.com/s?wd={text}',
      icon: 'baidu.com',
    },
    {
      name: 'Bing',
      pattern: '.*',
      url: 'https://www.bing.com/search?q={text}',
      icon: 'bing.com',
    },
  ];
  
  return defaultSearchEngines.map(rule => ({
    rule,
    targetUrl: rule.url.replace('{text}', encodeURIComponent(text)),
    matchedText: text,
  }));
}
