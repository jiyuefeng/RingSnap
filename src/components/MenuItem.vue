<template>
  <div
    class="menu-item"
    :class="{ 'is-hovered': isHovered }"
    :style="itemStyle"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    @click="handleClick"
  >
    <div class="item-content">
      <IconLoader :domain="iconDomain" :size="32" :alt="label" />
      <span class="item-label">{{ label }}</span>
      <span class="item-index">{{ index + 1 }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import IconLoader from './IconLoader.vue';

const props = defineProps<{
  label: string;
  iconDomain: string;
  targetUrl: string;
  angle: number;
  index: number;
  radius: number;
}>();

const emit = defineEmits<{
  (e: 'click', url: string): void;
}>();

const isHovered = ref(false);

// 计算菜单项位置
const itemStyle = computed(() => {
  // 将角度转换为弧度，从顶部开始（-90度偏移）
  const angleRad = ((props.angle - 90) * Math.PI) / 180;
  const x = Math.cos(angleRad) * props.radius;
  const y = Math.sin(angleRad) * props.radius;
  
  return {
    transform: `translate(${x}px, ${y}px)`,
    '--hover-scale': isHovered.value ? 1.1 : 1,
  };
});

const handleClick = () => {
  emit('click', props.targetUrl);
};
</script>

<style scoped>
.menu-item {
  position: absolute;
  top: 50%;
  left: 50%;
  margin-left: -40px;
  margin-top: -40px;
  width: 80px;
  height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease-out;
  z-index: 10;
}

.item-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 8px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  transition: all 0.2s ease-out;
  min-width: 70px;
}

.menu-item.is-hovered .item-content {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
}

.item-label {
  margin-top: 4px;
  font-size: 11px;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 60px;
}

.item-index {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(102, 126, 234, 0.8);
  border-radius: 50%;
  font-size: 10px;
  color: white;
  font-weight: bold;
}
</style>
