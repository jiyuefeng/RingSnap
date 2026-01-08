/**
 * 配置管理 Store
 * 管理 URL 规则和应用配置
 * 使用 Tauri 文件存储确保所有窗口共享同一份数据
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';
import type { AppConfig, UrlRule } from '@/types';

// 默认配置（仅作为后备）
const DEFAULT_CONFIG: AppConfig = {
  rules: [],
  shortcut: undefined,
};

export const useConfigStore = defineStore('config', () => {
  // 状态
  const config = ref<AppConfig>(DEFAULT_CONFIG);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // 计算属性
  const rules = computed(() => config.value.rules);
  const shortcut = computed(() => config.value.shortcut);

  /**
   * 从 Tauri 后端加载规则
   */
  async function loadConfig(): Promise<void> {
    isLoading.value = true;
    error.value = null;
    
    try {
      // 从 Tauri 后端加载规则
      const loadedRules = await invoke<UrlRule[]>('load_rules');
      config.value.rules = loadedRules;
      console.log('规则已加载:', loadedRules.length, '条');
    } catch (e) {
      console.error('加载规则失败:', e);
      error.value = String(e);
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * 保存规则到 Tauri 后端
   */
  async function saveConfig(): Promise<void> {
    try {
      await invoke('save_rules', { rules: config.value.rules });
      console.log('规则已保存');
    } catch (e) {
      console.error('保存规则失败:', e);
      error.value = String(e);
    }
  }

  /**
   * 添加规则
   */
  function addRule(rule: UrlRule): void {
    // 新规则默认启用
    const newRule = { ...rule, enabled: rule.enabled !== false };
    config.value.rules.push(newRule);
  }

  /**
   * 删除规则
   */
  function removeRule(index: number): void {
    config.value.rules.splice(index, 1);
  }

  /**
   * 更新规则
   */
  function updateRule(index: number, rule: UrlRule): void {
    if (index >= 0 && index < config.value.rules.length) {
      config.value.rules[index] = rule;
    }
  }

  /**
   * 设置快捷键
   */
  function setShortcut(newShortcut: string): void {
    config.value.shortcut = newShortcut;
  }

  /**
   * 重置为默认配置
   */
  async function resetConfig(): Promise<void> {
    // 清空规则后重新加载默认规则
    config.value.rules = [];
    await loadConfig();
  }

  /**
   * 监听规则更新事件
   */
  async function setupRulesListener(): Promise<void> {
    try {
      await listen('rules-updated', async () => {
        console.log('收到规则更新通知，重新加载...');
        await loadConfig();
      });
    } catch (e) {
      console.error('设置规则监听器失败:', e);
    }
  }

  return {
    // 状态
    config,
    isLoading,
    error,
    // 计算属性
    rules,
    shortcut,
    // 方法
    loadConfig,
    saveConfig,
    addRule,
    removeRule,
    updateRule,
    setShortcut,
    resetConfig,
    setupRulesListener,
  };
});