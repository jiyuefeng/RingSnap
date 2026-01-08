<template>
  <Transition name="ring-menu">
    <div v-if="visible" class="ring-menu-container" @click.self="handleClose">
      <div class="ring-menu">
        <!-- 毛玻璃背景层 -->
        <div class="glass-background" :style="{ width: `${outerRadius * 2 + 20}px`, height: `${outerRadius * 2 + 20}px` }">
          <div class="glass-circle"></div>
        </div>
        
        <!-- SVG 扇形菜单 -->
        <svg 
          :width="outerRadius * 2 + 20" 
          :height="outerRadius * 2 + 20" 
          :viewBox="`0 0 ${outerRadius * 2 + 20} ${outerRadius * 2 + 20}`"
          class="pie-menu"
        >
          <defs>
            <linearGradient id="indexGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:#667eea"/>
              <stop offset="100%" style="stop-color:#764ba2"/>
            </linearGradient>
            <linearGradient id="borderGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style="stop-color:rgba(255,255,255,0.4)"/>
              <stop offset="50%" style="stop-color:rgba(255,255,255,0.1)"/>
              <stop offset="100%" style="stop-color:rgba(255,255,255,0.3)"/>
            </linearGradient>
          </defs>
          
          <g :transform="`translate(${outerRadius + 10}, ${outerRadius + 10})`">
            <!-- 外圈 -->
            <circle 
              :r="outerRadius" 
              fill="transparent"
              stroke="url(#borderGradient)"
              stroke-width="1.5"
            />
            
            <!-- 扇形分区 -->
            <g v-for="(item, index) in menuItems" :key="index">
              <path
                :d="getSectorPath(index)"
                :fill="hoveredIndex === index ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.03)'"
                stroke="rgba(255, 255, 255, 0.15)"
                stroke-width="1"
                class="sector-path"
                @mouseenter="hoveredIndex = index"
                @mouseleave="hoveredIndex = -1"
                @click="handleItemClick(item.targetUrl)"
              />
              
              <!-- 扇区内的文字 -->
              <g 
                :transform="getLabelTransform(index)"
                class="sector-label-group"
                @mouseenter="hoveredIndex = index"
                @mouseleave="hoveredIndex = -1"
                @click="handleItemClick(item.targetUrl)"
              >
                <text 
                  y="22"
                  text-anchor="middle" 
                  fill="rgba(255, 255, 255, 0.95)"
                  font-size="12"
                  font-weight="500"
                  class="sector-text"
                >
                  {{ item.rule.name }}
                </text>
              </g>
            </g>
            
            <!-- 分隔线 -->
            <line
              v-for="(_, index) in menuItems"
              :key="'line-' + index"
              :x1="innerRadius * Math.cos(getAngle(index))"
              :y1="innerRadius * Math.sin(getAngle(index))"
              :x2="outerRadius * Math.cos(getAngle(index))"
              :y2="outerRadius * Math.sin(getAngle(index))"
              stroke="rgba(255, 255, 255, 0.2)"
              stroke-width="1"
            />
            
            <!-- 内圈 -->
            <circle 
              :r="innerRadius" 
              fill="rgba(255, 255, 255, 0.08)"
              stroke="rgba(255, 255, 255, 0.3)"
              stroke-width="1.5"
            />
            
            <!-- 中心文字 -->
            <text 
              y="-5"
              text-anchor="middle" 
              fill="rgba(255, 255, 255, 0.95)"
              font-size="13"
              font-weight="500"
            >
              {{ truncatedText }}
            </text>
            
            <!-- 设置按钮 -->
            <g 
              class="settings-btn"
              @click.stop="handleSettingsClick"
              style="cursor: pointer;"
            >
              <circle 
                r="18" 
                cy="28"
                fill="rgba(255, 255, 255, 0.1)"
                stroke="rgba(255, 255, 255, 0.2)"
                stroke-width="1"
                class="settings-bg"
              />
              <text 
                y="33"
                text-anchor="middle" 
                fill="rgba(255, 255, 255, 0.7)"
                font-size="14"
                class="settings-icon"
              >⚙️</text>
            </g>
          </g>
        </svg>
        
        <!-- 图标层 -->
        <div class="icons-layer" :style="{ width: `${outerRadius * 2 + 20}px`, height: `${outerRadius * 2 + 20}px` }">
          <div
            v-for="(item, index) in menuItems"
            :key="'icon-' + index"
            class="floating-icon"
            :class="{ 'is-hovered': hoveredIndex === index }"
            :style="getIconPosition(index)"
            @mouseenter="hoveredIndex = index"
            @mouseleave="hoveredIndex = -1"
            @click="handleItemClick(item.targetUrl)"
          >
            <IconLoader :domain="item.rule.icon" :size="36" :alt="item.rule.name" :initial-source-index="item.rule.iconSourceIndex || 0" />
            <span class="icon-index">{{ index + 1 }}</span>
          </div>
        </div>
        
        <!-- 无匹配提示 -->
        <div v-if="menuItems.length === 0" class="no-match">
          <span>无匹配规则</span>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, onUnmounted } from 'vue';
import IconLoader from './IconLoader.vue';
import type { MatchResult } from '@/types';

const props = withDefaults(defineProps<{
  visible: boolean;
  selectedText: string;
  menuItems: MatchResult[];
}>(), {
});

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'select', url: string): void;
  (e: 'openSettings'): void;
}>();

const hoveredIndex = ref(-1);

// 尺寸配置
const outerRadius = 160;
const innerRadius = 55;

// 截断显示的文本
const truncatedText = computed(() => {
  const maxLength = 8;
  if (props.selectedText.length > maxLength) {
    return props.selectedText.substring(0, maxLength) + '...';
  }
  return props.selectedText || '执行';
});

// 获取起始角度（弧度）
const getAngle = (index: number): number => {
  const count = props.menuItems.length;
  if (count === 0) return 0;
  const sectorAngle = (Math.PI * 2) / count;
  // 从顶部开始（-90度 = -PI/2）
  return sectorAngle * index - Math.PI / 2;
};

// 获取扇形的 SVG path
const getSectorPath = (index: number): string => {
  const count = props.menuItems.length;
  if (count === 0) return '';
  
  const sectorAngle = (Math.PI * 2) / count;
  const startAngle = getAngle(index);
  const endAngle = startAngle + sectorAngle;
  
  const innerStart = {
    x: innerRadius * Math.cos(startAngle),
    y: innerRadius * Math.sin(startAngle)
  };
  const innerEnd = {
    x: innerRadius * Math.cos(endAngle),
    y: innerRadius * Math.sin(endAngle)
  };
  const outerStart = {
    x: outerRadius * Math.cos(startAngle),
    y: outerRadius * Math.sin(startAngle)
  };
  const outerEnd = {
    x: outerRadius * Math.cos(endAngle),
    y: outerRadius * Math.sin(endAngle)
  };
  
  const largeArc = sectorAngle > Math.PI ? 1 : 0;
  
  return `
    M ${innerStart.x} ${innerStart.y}
    L ${outerStart.x} ${outerStart.y}
    A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}
    L ${innerEnd.x} ${innerEnd.y}
    A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}
    Z
  `;
};

// 获取标签位置变换
const getLabelTransform = (index: number): string => {
  const count = props.menuItems.length;
  const sectorAngle = (Math.PI * 2) / count;
  const midAngle = getAngle(index) + sectorAngle / 2;
  
  // 标签放在扇形中间位置
  const labelRadius = (innerRadius + outerRadius) / 2;
  const x = labelRadius * Math.cos(midAngle);
  const y = labelRadius * Math.sin(midAngle);
  
  return `translate(${x}, ${y})`;
};

// 获取图标的位置
const getIconPosition = (index: number) => {
  const count = props.menuItems.length;
  const sectorAngle = (Math.PI * 2) / count;
  const midAngle = getAngle(index) + sectorAngle / 2;
  
  const labelRadius = (innerRadius + outerRadius) / 2;
  const centerX = outerRadius + 10;
  const centerY = outerRadius + 10;
  
  const x = centerX + labelRadius * Math.cos(midAngle) - 14;
  const y = centerY + labelRadius * Math.sin(midAngle) - 28;
  
  return {
    left: `${x}px`,
    top: `${y}px`
  };
};

// 处理菜单项点击
const handleItemClick = (url: string) => {
  emit('select', url);
};

// 处理关闭
const handleClose = () => {
  emit('close');
};

// 处理设置按钮点击
const handleSettingsClick = () => {
  emit('openSettings');
};

// 键盘事件处理
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    handleClose();
    return;
  }
  
  const num = parseInt(e.key);
  if (num >= 1 && num <= 9 && num <= props.menuItems.length) {
    const item = props.menuItems[num - 1];
    if (item) {
      handleItemClick(item.targetUrl);
    }
  }
};

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown);
});
</script>

<style scoped>
.ring-menu-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
}

.ring-menu {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 毛玻璃背景层 */
.glass-background {
  position: absolute;
  top: 0;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.glass-circle {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: rgba(20, 25, 40, 0.75);
  backdrop-filter: blur(24px) saturate(180%);
  -webkit-backdrop-filter: blur(24px) saturate(180%);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.4),
    inset 0 0 80px rgba(255, 255, 255, 0.03),
    inset 0 0 4px rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.pie-menu {
  position: relative;
  z-index: 10;
  filter: drop-shadow(0 4px 20px rgba(0, 0, 0, 0.2));
}

.sector-path {
  cursor: pointer;
  transition: fill 0.25s ease;
}

.sector-path:hover {
  fill: rgba(255, 255, 255, 0.25);
}

.sector-label-group {
  cursor: pointer;
  pointer-events: all;
}

.sector-text {
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
  pointer-events: none;
  letter-spacing: 0.5px;
}

.icons-layer {
  position: absolute;
  top: 0;
  left: 0;
  pointer-events: none;
  z-index: 20;
}

.floating-icon {
  position: absolute;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: auto;
  cursor: pointer;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
}

.floating-icon.is-hovered {
  transform: scale(1.15) translateY(-3px);
  background: rgba(255, 255, 255, 0.22);
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.3);
  border-color: rgba(255, 255, 255, 0.35);
}

.icon-index {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  font-size: 11px;
  color: white;
  font-weight: bold;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.5);
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.no-match {
  position: absolute;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  white-space: nowrap;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  padding: 14px 28px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* 过渡动画 */
.ring-menu-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.ring-menu-leave-active {
  transition: all 0.25s ease-out;
}

.ring-menu-enter-from,
.ring-menu-leave-to {
  opacity: 0;
  transform: scale(0.6);
}

.ring-menu-enter-from .glass-circle {
  transform: scale(0.5);
  opacity: 0;
}

.ring-menu-enter-to,
.ring-menu-leave-from {
  opacity: 1;
  transform: scale(1);
}

/* 设置按钮 */
.settings-btn {
  cursor: pointer;
  transition: all 0.2s ease;
}

.settings-btn:hover .settings-bg {
  fill: rgba(255, 255, 255, 0.2);
}

.settings-btn:hover .settings-icon {
  fill: rgba(255, 255, 255, 0.95);
}
</style>
