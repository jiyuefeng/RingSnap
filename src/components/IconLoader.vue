<template>
  <div 
    class="icon-loader" 
    :class="{ loading: isLoading, error: hasError, clickable: allowSwitch }"
    @click="handleClick"
    :title="allowSwitch ? `点击切换图标服务 (${currentSourceIndex + 1}/${iconSources.length})` : ''"
  >
    <img
      v-if="!hasError"
      :src="displaySrc"
      :alt="alt"
      @load="onLoad"
      @error="onError"
      :style="{ width: size + 'px', height: size + 'px' }"
    />
    <div v-else class="fallback-icon" :style="{ width: size + 'px', height: size + 'px' }">
      <span>{{ fallbackText }}</span>
    </div>
    <div v-if="isLoading" class="loading-spinner" :style="{ width: size + 'px', height: size + 'px' }"></div>
    
    <!-- 切换指示器 -->
    <div v-if="allowSwitch && !isLoading && !hasError" class="switch-indicator">
      <span class="switch-dot" v-for="(_, idx) in iconSources" :key="idx" :class="{ active: idx === currentSourceIndex }"></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { getCachedIcon, cacheIcon } from '@/services/iconCache';

const props = withDefaults(defineProps<{
  domain: string;
  size?: number;
  alt?: string;
  allowSwitch?: boolean;  // 是否允许用户手动切换图标服务
  initialSourceIndex?: number;  // 初始图标服务索引
}>(), {
  size: 32,
  alt: 'icon',
  allowSwitch: false,
  initialSourceIndex: 0
});

const emit = defineEmits<{
  (e: 'switch', sourceIndex: number): void;
}>();

const isLoading = ref(true);
const hasError = ref(false);
const currentSourceIndex = ref(0);
const cachedSrc = ref<string | null>(null);

// 提取域名（处理 URL 或纯域名）
const cleanDomain = computed(() => {
  if (!props.domain) return '';
  try {
    if (props.domain.includes('://')) {
      return new URL(props.domain).hostname;
    }
    return props.domain.split('/')[0];
  } catch {
    return props.domain;
  }
});

// 高清图标源列表 - 始终请求128px大图，显示时缩小以获得清晰效果
const iconSources = computed(() => {
  const domain = cleanDomain.value;
  if (!domain) return [];
  
  return [
    // icon.horse 服务 - 高质量图标聚合服务
    `https://icon.horse/icon/${domain}`,
    // Google 128px 高分辨率
    `https://www.google.com/s2/favicons?sz=128&domain=${domain}`,
    // DuckDuckGo 图标服务
    `https://icons.duckduckgo.com/ip3/${domain}.ico`,
    // Favicon.im 服务
    `https://favicon.im/${domain}`,
    // 直接获取网站高清图标
    `https://${domain}/apple-touch-icon.png`,
    `https://${domain}/favicon-32x32.png`,
    `https://${domain}/favicon.ico`,
  ];
});

// 当前使用的图标源 URL
const currentIconSrc = computed(() => {
  if (iconSources.value.length === 0) return '';
  return iconSources.value[currentSourceIndex.value] || '';
});

// 实际显示的图片源（优先使用缓存）
const displaySrc = computed(() => {
  return cachedSrc.value || currentIconSrc.value;
});

// 备用文字（取域名首字母）
const fallbackText = computed(() => {
  const domain = cleanDomain.value;
  if (!domain) return '?';
  const parts = domain.split('.');
  const mainPart = parts.length > 1 ? parts[parts.length - 2] : parts[0];
  return mainPart.charAt(0).toUpperCase();
});

// 尝试从缓存加载
const tryLoadFromCache = () => {
  const domain = cleanDomain.value;
  if (!domain) return false;
  
  const cached = getCachedIcon(domain, currentSourceIndex.value);
  if (cached) {
    cachedSrc.value = cached;
    isLoading.value = false;
    hasError.value = false;
    return true;
  }
  return false;
};

const onLoad = async () => {
  isLoading.value = false;
  hasError.value = false;
  
  // 加载成功后缓存图标
  if (!cachedSrc.value && currentIconSrc.value) {
    const domain = cleanDomain.value;
    if (domain) {
      const cached = await cacheIcon(domain, currentSourceIndex.value, currentIconSrc.value);
      if (cached) {
        cachedSrc.value = cached;
      }
    }
  }
};

const onError = () => {
  // 清除当前缓存尝试
  cachedSrc.value = null;
  
  if (currentSourceIndex.value < iconSources.value.length - 1) {
    currentSourceIndex.value++;
    // 尝试从缓存加载下一个源
    if (!tryLoadFromCache()) {
      isLoading.value = true;
    }
  } else {
    isLoading.value = false;
    hasError.value = true;
  }
};

// 手动切换到下一个图标服务
const handleClick = (e: MouseEvent) => {
  if (!props.allowSwitch) return;
  
  e.stopPropagation();
  
  // 切换到下一个服务
  const nextIndex = (currentSourceIndex.value + 1) % iconSources.value.length;
  currentSourceIndex.value = nextIndex;
  cachedSrc.value = null;
  isLoading.value = true;
  hasError.value = false;
  
  // 尝试从缓存加载
  if (!tryLoadFromCache()) {
    isLoading.value = true;
  }
  
  emit('switch', nextIndex);
};

// 初始化时尝试从缓存加载
onMounted(() => {
  currentSourceIndex.value = props.initialSourceIndex || 0;
  if (!tryLoadFromCache()) {
    isLoading.value = true;
  }
});

// 监听域名变化，重置状态
watch(() => props.domain, () => {
  cachedSrc.value = null;
  hasError.value = false;
  currentSourceIndex.value = props.initialSourceIndex || 0;
  
  if (!tryLoadFromCache()) {
    isLoading.value = true;
  }
});

// 监听初始索引变化
watch(() => props.initialSourceIndex, (newIndex) => {
  if (newIndex !== undefined && newIndex !== currentSourceIndex.value) {
    currentSourceIndex.value = newIndex;
    cachedSrc.value = null;
    hasError.value = false;
    
    if (!tryLoadFromCache()) {
      isLoading.value = true;
    }
  }
});
</script>

<style scoped>
.icon-loader {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.icon-loader.clickable {
  cursor: pointer;
  transition: transform 0.15s ease;
}

.icon-loader.clickable:hover {
  transform: scale(1.08);
}

.icon-loader.clickable:active {
  transform: scale(0.95);
}

.icon-loader img {
  border-radius: 6px;
  object-fit: contain;
  /* 高清渲染 */
  image-rendering: -webkit-optimize-contrast;
  image-rendering: high-quality;
}

.fallback-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 6px;
  color: white;
  font-weight: bold;
  font-size: 14px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.loading-spinner {
  position: absolute;
  top: 0;
  left: 0;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-top-color: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

.icon-loader.loading img {
  opacity: 0;
}

/* 切换指示器 - 小点点 */
.switch-indicator {
  position: absolute;
  bottom: -6px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.icon-loader.clickable:hover .switch-indicator {
  opacity: 1;
}

.switch-dot {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  transition: background 0.2s ease;
}

.switch-dot.active {
  background: rgba(100, 200, 255, 0.8);
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>