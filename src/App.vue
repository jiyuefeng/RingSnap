<template>
  <!-- 设置窗口模式 -->
  <div v-if="isSettingsMode" class="settings-container">
    <RuleEditor :standalone="true" @close="closeSettingsWindow" />
  </div>
  
  <!-- 主圆环菜单模式 -->
  <div v-else class="app-container" @click.self="hideMenu">
    <RingMenu
      :visible="isMenuVisible"
      :selected-text="selectedText"
      :menu-items="matchedResults"
      @close="hideMenu"
      @select="handleSelect"
      @openSettings="openSettings"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { invoke } from '@tauri-apps/api/tauri';
import { listen, type UnlistenFn } from '@tauri-apps/api/event';
import RingMenu from '@/components/RingMenu.vue';
import RuleEditor from '@/components/RuleEditor.vue';
import { useConfigStore } from '@/stores/config';
import { matchAllRules, processText } from '@/utils/matcher';
import { openInBrowser } from '@/utils/browser';
import type { MatchResult } from '@/types';

// 检查是否是设置窗口模式
const isSettingsMode = computed(() => {
  return window.location.search.includes('settings=true');
});

// Store
const configStore = useConfigStore();

// 状态
const isMenuVisible = ref(false);
const selectedText = ref('');
const matchedResults = ref<MatchResult[]>([]);

// 事件监听器
let unlistenShortcut: UnlistenFn | null = null;

/**
 * 显示菜单
 */
async function showMenu() {
  try {
    // 先模拟复制操作，获取当前选中的文本
    const clipboardText = await invoke<string>('copy_and_get_text');
    
    if (clipboardText && clipboardText.trim()) {
      // 处理文本
      selectedText.value = processText(clipboardText);
      
      // 匹配规则
      matchedResults.value = matchAllRules(selectedText.value, configStore.rules);
      
      // 显示窗口
      await invoke('show_ring_menu');
      isMenuVisible.value = true;
    } else {
      console.log('无选中文本或剪贴板为空');
    }
  } catch (error) {
    console.error('显示菜单失败:', error);
  }
}

/**
 * 隐藏菜单
 */
async function hideMenu() {
  isMenuVisible.value = false;
  try {
    await invoke('hide_ring_menu');
  } catch (error) {
    console.error('隐藏菜单失败:', error);
  }
}

/**
 * 处理菜单项选择
 */
async function handleSelect(url: string) {
  try {
    // 先隐藏菜单
    await hideMenu();
    
    // 打开浏览器
    await openInBrowser(url);
  } catch (error) {
    console.error('打开链接失败:', error);
  }
}

/**
 * 打开设置 - 创建独立窗口
 */
async function openSettings() {
  try {
    await invoke('open_settings_window');
  } catch (error) {
    console.error('打开设置失败:', error);
  }
}

/**
 * 关闭设置窗口
 */
async function closeSettingsWindow() {
  try {
    await invoke('close_settings_window');
  } catch (error) {
    console.error('关闭设置窗口失败:', error);
  }
}

/**
 * 初始化
 */
onMounted(async () => {
  // 从 Tauri 后端加载规则配置
  await configStore.loadConfig();
  
  // 设置规则更新监听器（两个窗口都需要监听）
  await configStore.setupRulesListener();
  
  // 只在主窗口模式下监听快捷键
  if (!isSettingsMode.value) {
    unlistenShortcut = await listen('shortcut-triggered', () => {
      showMenu();
    });
  }
  
  console.log('RingSnap 已启动', isSettingsMode.value ? '(设置模式)' : '(主窗口)');
});

/**
 * 清理
 */
onUnmounted(() => {
  if (unlistenShortcut) {
    unlistenShortcut();
  }
});
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  width: 100%;
  height: 100%;
  background: transparent !important;
  overflow: hidden;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.app-container {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent !important;
}

.settings-container {
  width: 100%;
  height: 100%;
  background: #1a1b1e;
}
</style>