<template>
  <div class="icon-loader" :class="{ loading: isLoading, error: hasError }">
    <img
      v-if="!hasError"
      :src="currentIconSrc"
      :alt="alt"
      @load="onLoad"
      @error="onError"
      :style="{ width: size + 'px', height: size + 'px' }"
    />
    <div v-else class="fallback-icon" :style="{ width: size + 'px', height: size + 'px' }">
      <span>{{ fallbackText }}</span>
    </div>
    <div v-if="isLoading" class="loading-spinner" :style="{ width: size + 'px', height: size + 'px' }"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';

const props = withDefaults(defineProps<{
  domain: string;
  size?: number;
  alt?: string;
}>(), {
  size: 32,
  alt: 'icon'
});

const isLoading = ref(true);
const hasError = ref(false);
const currentSourceIndex = ref(0);

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
    // 直接获取网站高清图标
    `https://${domain}/apple-touch-icon.png`,
    `https://${domain}/favicon-32x32.png`,
    `https://${domain}/favicon.ico`,
  ];
});

// 当前使用的图标源
const currentIconSrc = computed(() => {
  if (iconSources.value.length === 0) return '';
  return iconSources.value[currentSourceIndex.value] || '';
});

// 备用文字（取域名首字母）
const fallbackText = computed(() => {
  const domain = cleanDomain.value;
  if (!domain) return '?';
  const parts = domain.split('.');
  const mainPart = parts.length > 1 ? parts[parts.length - 2] : parts[0];
  return mainPart.charAt(0).toUpperCase();
});

const onLoad = () => {
  isLoading.value = false;
  hasError.value = false;
};

const onError = () => {
  if (currentSourceIndex.value < iconSources.value.length - 1) {
    currentSourceIndex.value++;
  } else {
    isLoading.value = false;
    hasError.value = true;
  }
};

watch(() => props.domain, () => {
  isLoading.value = true;
  hasError.value = false;
  currentSourceIndex.value = 0;
});
</script>

<style scoped>
.icon-loader {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
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

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>