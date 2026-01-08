/**
 * URL 匹配规则
 */
export interface UrlRule {
  /** 规则名称 */
  name: string;
  /** 正则表达式模式 */
  pattern: string;
  /** 目标 URL 模板 */
  url: string;
  /** 图标域名 */
  icon: string;
  /** 是否启用 */
  enabled?: boolean;
}

/**
 * 匹配结果
 */
export interface MatchResult {
  /** 规则信息 */
  rule: UrlRule;
  /** 生成的目标 URL */
  targetUrl: string;
  /** 匹配的文本 */
  matchedText: string;
}

/**
 * 配置文件结构
 */
export interface AppConfig {
  /** URL 规则列表 */
  rules: UrlRule[];
  /** 快捷键配置 */
  shortcut?: string;
}

/**
 * 菜单项属性
 */
export interface MenuItemProps {
  /** 菜单项标签 */
  label: string;
  /** 图标 URL */
  iconUrl: string;
  /** 目标链接 */
  targetUrl: string;
  /** 角度位置（0-360） */
  angle: number;
  /** 索引 */
  index: number;
}
