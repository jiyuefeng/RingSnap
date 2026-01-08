<template>
  <!-- 独立窗口模式 -->
  <div v-if="standalone" class="rule-editor-standalone">
    <header class="editor-header">
      <h2>⚙️ 规则配置</h2>
      <div class="header-hint">RingSnap 设置</div>
      <button class="close-btn" @click="$emit('close')">×</button>
    </header>

    <div class="editor-content">
      <!-- 规则列表 -->
      <div class="rules-list">
        <div class="list-header">
          <span>已配置规则 ({{ rules.length }})</span>
          <button class="add-btn" @click="startAddRule">+ 添加规则</button>
        </div>
        
        <div class="rules-container">
          <div 
            v-for="(rule, index) in rules" 
            :key="index"
            class="rule-item"
            :class="{ active: editingIndex === index, disabled: rule.enabled === false }"
            @click="startEditRule(index)"
          >
            <div class="rule-icon-wrapper">
              <IconLoader :domain="rule.icon" :size="28" :initial-source-index="rule.iconSourceIndex || 0" />
            </div>
            <div class="rule-info">
              <span class="rule-name">{{ rule.name }}</span>
              <span class="rule-pattern">{{ rule.pattern }}</span>
            </div>
            <label class="enable-toggle" @click.stop>
              <input 
                type="checkbox" 
                :checked="rule.enabled !== false"
                @change="toggleRule(index)"
              />
              <span class="toggle-slider"></span>
            </label>
            <button class="delete-btn" @click.stop="deleteRule(index)">🗑</button>
          </div>
        </div>
      </div>

      <!-- 编辑表单 -->
      <div class="rule-form" v-if="isEditing">
        <h3>{{ editingIndex === -1 ? '添加新规则' : '编辑规则' }}</h3>
        
        <div class="form-group">
          <label>规则名称</label>
          <input 
            v-model="formData.name" 
            placeholder="例如：网易号视频"
            class="form-input"
          />
        </div>

        <div class="form-group">
          <label>匹配模式 (正则表达式)</label>
          <input 
            v-model="formData.pattern" 
            placeholder="例如：^[A-Z0-9]+$ 或 .* (匹配所有)"
            class="form-input mono"
          />
          <span class="form-hint">
            使用 <code>.*</code> 匹配任意文本，或使用正则捕获组 <code>(.*)</code>
          </span>
        </div>

        <div class="form-group">
          <label>目标 URL 模板</label>
          <input 
            v-model="formData.url" 
            placeholder="例如：https://www.163.com/v/video/{text}.html"
            class="form-input mono"
          />
          <span class="form-hint">
            <code>{text}</code> = 选中的原文本，<code>{1}</code> <code>{2}</code> = 正则捕获组
          </span>
        </div>

        <div class="form-group">
          <label>图标域名</label>
          <div class="icon-input-group">
            <input 
              v-model="formData.icon" 
              placeholder="例如：163.com"
              class="form-input"
            />
            <div class="icon-preview" title="点击图标可切换服务商">
              <IconLoader 
                v-if="formData.icon" 
                :domain="formData.icon" 
                :size="36" 
                :allow-switch="true"
                :initial-source-index="formData.iconSourceIndex || 0"
                @switch="onIconSwitch"
              />
            </div>
          </div>
          <span class="form-hint">💡 点击图标可切换不同的图标服务商</span>
        </div>

        <!-- 测试区域 -->
        <div class="test-section">
          <label>测试匹配</label>
          <div class="test-input-group">
            <input 
              v-model="testText" 
              placeholder="输入测试文本..."
              class="form-input"
            />
            <button class="test-btn" @click="runTest">测试</button>
          </div>
          <div v-if="testResult" class="test-result" :class="{ success: testResult.success }">
            <template v-if="testResult.success">
              ✅ 匹配成功 → <a :href="testResult.url" target="_blank">{{ testResult.url }}</a>
            </template>
            <template v-else>
              ❌ {{ testResult.message }}
            </template>
          </div>
        </div>

        <div class="form-actions">
          <button class="cancel-btn" @click="cancelEdit">取消</button>
          <button class="save-btn" @click="saveRule" :disabled="!isFormValid">
            {{ editingIndex === -1 ? '添加' : '保存' }}
          </button>
        </div>
      </div>

      <!-- 空状态 -->
      <div class="empty-form" v-else>
        <div class="empty-content">
          <span class="empty-icon">📝</span>
          <p>选择一个规则进行编辑</p>
          <p>或点击"添加规则"创建新规则</p>
        </div>
      </div>
    </div>
  </div>

  <!-- 弹窗模式（保留兼容） -->
  <div v-else class="rule-editor-overlay" @click.self="$emit('close')">
    <div 
      class="rule-editor" 
      ref="editorRef"
      :style="editorStyle"
    >
      <header 
        class="editor-header"
        @mousedown="startDrag"
      >
        <h2>⚙️ 规则配置</h2>
        <div class="header-hint">可拖拽移动</div>
        <button class="close-btn" @click="$emit('close')">×</button>
      </header>

      <div class="editor-content">
        <!-- 规则列表 -->
        <div class="rules-list">
          <div class="list-header">
            <span>已配置规则 ({{ rules.length }})</span>
            <button class="add-btn" @click="startAddRule">+ 添加规则</button>
          </div>
          
          <div class="rules-container">
            <div 
              v-for="(rule, index) in rules" 
              :key="index"
              class="rule-item"
              :class="{ active: editingIndex === index }"
              @click="startEditRule(index)"
            >
              <IconLoader :domain="rule.icon" :size="28" />
              <div class="rule-info">
                <span class="rule-name">{{ rule.name }}</span>
                <span class="rule-pattern">{{ rule.pattern }}</span>
              </div>
              <button class="delete-btn" @click.stop="deleteRule(index)">🗑</button>
            </div>
          </div>
        </div>

        <!-- 编辑表单 -->
        <div class="rule-form" v-if="isEditing">
          <h3>{{ editingIndex === -1 ? '添加新规则' : '编辑规则' }}</h3>
          
          <div class="form-group">
            <label>规则名称</label>
            <input 
              v-model="formData.name" 
              placeholder="例如：网易号视频"
              class="form-input"
            />
          </div>

          <div class="form-group">
            <label>匹配模式 (正则表达式)</label>
            <input 
              v-model="formData.pattern" 
              placeholder="例如：^[A-Z0-9]+$ 或 .* (匹配所有)"
              class="form-input mono"
            />
            <span class="form-hint">
              使用 <code>.*</code> 匹配任意文本，或使用正则捕获组 <code>(.*)</code>
            </span>
          </div>

          <div class="form-group">
            <label>目标 URL 模板</label>
            <input 
              v-model="formData.url" 
              placeholder="例如：https://www.163.com/v/video/{text}.html"
              class="form-input mono"
            />
            <span class="form-hint">
              <code>{text}</code> = 选中的原文本，<code>{1}</code> <code>{2}</code> = 正则捕获组
            </span>
          </div>

          <div class="form-group">
            <label>图标域名</label>
            <div class="icon-input-group">
              <input 
                v-model="formData.icon" 
                placeholder="例如：163.com"
                class="form-input"
              />
              <div class="icon-preview">
                <IconLoader v-if="formData.icon" :domain="formData.icon" :size="36" />
              </div>
            </div>
          </div>

          <!-- 测试区域 -->
          <div class="test-section">
            <label>测试匹配</label>
            <div class="test-input-group">
              <input 
                v-model="testText" 
                placeholder="输入测试文本..."
                class="form-input"
              />
              <button class="test-btn" @click="runTest">测试</button>
            </div>
            <div v-if="testResult" class="test-result" :class="{ success: testResult.success }">
              <template v-if="testResult.success">
                ✅ 匹配成功 → <a :href="testResult.url" target="_blank">{{ testResult.url }}</a>
              </template>
              <template v-else>
                ❌ {{ testResult.message }}
              </template>
            </div>
          </div>

          <div class="form-actions">
            <button class="cancel-btn" @click="cancelEdit">取消</button>
            <button class="save-btn" @click="saveRule" :disabled="!isFormValid">
              {{ editingIndex === -1 ? '添加' : '保存' }}
            </button>
          </div>
        </div>

        <!-- 空状态 -->
        <div class="empty-form" v-else>
          <div class="empty-content">
            <span class="empty-icon">�</span>
            <p>选择一个规则进行编辑</p>
            <p>或点击"添加规则"创建新规则</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted, onUnmounted } from 'vue';
import { useConfigStore } from '@/stores/config';
import IconLoader from './IconLoader.vue';
import type { UrlRule } from '@/types';

// Props
defineProps<{
  standalone?: boolean;
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const configStore = useConfigStore();
const rules = computed(() => configStore.rules);

// 拖拽相关
const editorRef = ref<HTMLElement | null>(null);
const isDragging = ref(false);
const dragOffset = ref({ x: 0, y: 0 });
const position = ref({ x: 0, y: 0 });
const hasBeenDragged = ref(false);

const editorStyle = computed(() => {
  if (!hasBeenDragged.value) {
    return {}; // 使用 CSS 居中
  }
  return {
    position: 'fixed' as const,
    left: `${position.value.x}px`,
    top: `${position.value.y}px`,
    transform: 'none'
  };
});

function startDrag(e: MouseEvent) {
  if ((e.target as HTMLElement).closest('.close-btn')) return;
  
  isDragging.value = true;
  const rect = editorRef.value?.getBoundingClientRect();
  if (rect) {
    dragOffset.value = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    if (!hasBeenDragged.value) {
      position.value = { x: rect.left, y: rect.top };
      hasBeenDragged.value = true;
    }
  }
  
  document.addEventListener('mousemove', onDrag);
  document.addEventListener('mouseup', stopDrag);
}

function onDrag(e: MouseEvent) {
  if (!isDragging.value) return;
  
  position.value = {
    x: e.clientX - dragOffset.value.x,
    y: e.clientY - dragOffset.value.y
  };
}

function stopDrag() {
  isDragging.value = false;
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
}

// 编辑状态
const isEditing = ref(false);
const editingIndex = ref(-1); // -1 表示新增
const formData = reactive<UrlRule>({
  name: '',
  pattern: '',
  url: '',
  icon: '',
  iconSourceIndex: 0,
});

// 测试状态
const testText = ref('');
const testResult = ref<{ success: boolean; url?: string; message?: string } | null>(null);

// 表单验证
const isFormValid = computed(() => {
  return formData.name.trim() && 
         formData.pattern.trim() && 
         formData.url.trim() && 
         formData.icon.trim();
});

// 开始添加规则
function startAddRule() {
  isEditing.value = true;
  editingIndex.value = -1;
  Object.assign(formData, { name: '', pattern: '.*', url: '', icon: '' });
  testResult.value = null;
  testText.value = '';
}

// 开始编辑规则
function startEditRule(index: number) {
  isEditing.value = true;
  editingIndex.value = index;
  const rule = rules.value[index];
  Object.assign(formData, { ...rule });
  testResult.value = null;
  testText.value = '';
}

// 取消编辑
function cancelEdit() {
  isEditing.value = false;
  editingIndex.value = -1;
  testResult.value = null;
}

// 保存规则
async function saveRule() {
  if (!isFormValid.value) return;

  const newRule: UrlRule = { ...formData, enabled: formData.enabled !== false };
  
  if (editingIndex.value === -1) {
    configStore.addRule(newRule);
  } else {
    configStore.updateRule(editingIndex.value, newRule);
  }
  
  // 保存到 Tauri 后端（会自动通知其他窗口）
  await configStore.saveConfig();
  
  cancelEdit();
}

// 删除规则
async function deleteRule(index: number) {
  if (confirm(`确定要删除规则"${rules.value[index].name}"吗？`)) {
    configStore.removeRule(index);
    await configStore.saveConfig();
    if (editingIndex.value === index) {
      cancelEdit();
    }
  }
}

// 切换规则启用状态
async function toggleRule(index: number) {
  const rule = rules.value[index];
  const newEnabled = rule.enabled === false ? true : false;
  configStore.updateRule(index, { ...rule, enabled: newEnabled });
  await configStore.saveConfig();
}

// 图标服务切换处理
function onIconSwitch(sourceIndex: number) {
  formData.iconSourceIndex = sourceIndex;
}

// 运行测试
function runTest() {
  if (!testText.value.trim()) {
    testResult.value = { success: false, message: '请输入测试文本' };
    return;
  }

  try {
    const regex = new RegExp(formData.pattern);
    const match = testText.value.match(regex);
    
    if (match) {
      let url = formData.url.replace('{text}', encodeURIComponent(testText.value));
      // 替换捕获组
      match.forEach((group, i) => {
        if (i > 0 && group) {
          url = url.replace(`{${i}}`, encodeURIComponent(group));
        }
      });
      testResult.value = { success: true, url };
    } else {
      testResult.value = { success: false, message: '正则表达式不匹配' };
    }
  } catch (e) {
    testResult.value = { success: false, message: `正则表达式错误: ${e}` };
  }
}

// 注意：规则的加载和保存现在通过 Tauri 后端进行
// configStore.loadConfig() 会从文件系统加载规则
// configStore.saveConfig() 会保存规则并通知其他窗口

onUnmounted(() => {
  document.removeEventListener('mousemove', onDrag);
  document.removeEventListener('mouseup', stopDrag);
});
</script>

<style scoped>
/* 自定义滚动条样式 */
::-webkit-scrollbar {
  width: 6px;
  height: 6px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.25);
}

.rule-editor-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.rule-editor {
  width: 960px;
  height: 680px;
  max-width: 95vw;
  max-height: 90vh;
  background: rgba(30, 32, 38, 0.98);
  border-radius: 16px;
  box-shadow: 
    0 25px 80px rgba(0, 0, 0, 0.6),
    0 0 0 1px rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-header {
  display: flex;
  align-items: center;
  padding: 18px 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  cursor: move;
  user-select: none;
  background: rgba(255, 255, 255, 0.02);
}

.editor-header h2 {
  margin: 0;
  font-size: 18px;
  color: #fff;
  font-weight: 600;
}

.header-hint {
  margin-left: 16px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.3);
  padding: 4px 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.close-btn {
  margin-left: auto;
  width: 36px;
  height: 36px;
  border: none;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 10px;
  color: #888;
  font-size: 22px;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  background: rgba(255, 100, 100, 0.25);
  color: #ff6b6b;
}

.editor-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.rules-list {
  width: 320px;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
  display: flex;
  flex-direction: column;
  background: rgba(0, 0, 0, 0.15);
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  color: #888;
  font-size: 12px;
}

.add-btn {
  padding: 6px 12px;
  border: none;
  background: rgba(100, 200, 100, 0.2);
  color: #8f8;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.add-btn:hover {
  background: rgba(100, 200, 100, 0.35);
}

.rules-container {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.rule-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  margin-bottom: 4px;
}

.rule-item:hover {
  background: rgba(255, 255, 255, 0.06);
}

.rule-item.active {
  background: rgba(100, 150, 255, 0.18);
  box-shadow: inset 0 0 0 1px rgba(100, 150, 255, 0.3);
}

.rule-info {
  flex: 1;
  min-width: 0;
}

.rule-name {
  display: block;
  color: #fff;
  font-size: 13px;
  margin-bottom: 3px;
  font-weight: 500;
}

.rule-pattern {
  display: block;
  color: #666;
  font-size: 11px;
  font-family: 'SF Mono', Monaco, monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.delete-btn {
  opacity: 0;
  padding: 6px 10px;
  border: none;
  background: transparent;
  cursor: pointer;
  transition: opacity 0.2s;
  font-size: 16px;
}

.rule-item:hover .delete-btn {
  opacity: 1;
}

/* 图标包装器 - 增加与文字的间距 */
.rule-icon-wrapper {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 4px;
}

/* 禁用状态的规则项 */
.rule-item.disabled {
  opacity: 0.5;
}

.rule-item.disabled .rule-name {
  color: #888;
}

/* 启用开关样式 */
.enable-toggle {
  position: relative;
  display: inline-block;
  width: 36px;
  height: 20px;
  flex-shrink: 0;
  cursor: pointer;
}

.enable-toggle input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.15);
  border-radius: 20px;
  transition: all 0.3s ease;
}

.toggle-slider::before {
  position: absolute;
  content: "";
  height: 14px;
  width: 14px;
  left: 3px;
  bottom: 3px;
  background-color: #888;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.enable-toggle input:checked + .toggle-slider {
  background-color: rgba(100, 200, 100, 0.4);
}

.enable-toggle input:checked + .toggle-slider::before {
  transform: translateX(16px);
  background-color: #8f8;
}

.rule-form, .empty-form {
  flex: 1;
  padding: 24px;
  overflow-y: auto;
}

.empty-form {
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-content {
  text-align: center;
  color: #555;
}

.empty-icon {
  font-size: 40px;
  display: block;
  margin-bottom: 14px;
}

.empty-content p {
  margin: 5px 0;
  font-size: 13px;
}

.rule-form h3 {
  margin: 0 0 20px 0;
  color: #fff;
  font-size: 16px;
  font-weight: 600;
}

.form-group {
  margin-bottom: 18px;
}

.form-group label {
  display: block;
  color: #aaa;
  font-size: 12px;
  margin-bottom: 8px;
  font-weight: 500;
}

.form-input {
  width: 100%;
  padding: 10px 14px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(0, 0, 0, 0.35);
  border-radius: 8px;
  color: #fff;
  font-size: 13px;
  outline: none;
  transition: all 0.2s;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: rgba(100, 150, 255, 0.5);
  background: rgba(0, 0, 0, 0.45);
  box-shadow: 0 0 0 3px rgba(100, 150, 255, 0.1);
}

.form-input.mono {
  font-family: 'SF Mono', Monaco, monospace;
  font-size: 12px;
}

.form-hint {
  display: block;
  color: #666;
  font-size: 11px;
  margin-top: 6px;
}

.form-hint code {
  background: rgba(255, 255, 255, 0.08);
  padding: 2px 6px;
  border-radius: 4px;
  color: #8af;
  font-size: 11px;
}

.icon-input-group {
  display: flex;
  gap: 12px;
  align-items: center;
}

.icon-input-group .form-input {
  flex: 1;
}

.icon-preview {
  width: 44px;
  height: 44px;
  background: rgba(0, 0, 0, 0.35);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.test-section {
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.test-section label {
  display: block;
  color: #aaa;
  font-size: 12px;
  margin-bottom: 8px;
  font-weight: 500;
}

.test-input-group {
  display: flex;
  gap: 10px;
}

.test-input-group .form-input {
  flex: 1;
}

.test-btn {
  padding: 10px 20px;
  border: none;
  background: rgba(100, 150, 255, 0.25);
  color: #8cf;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
  font-size: 13px;
}

.test-btn:hover {
  background: rgba(100, 150, 255, 0.4);
}

.test-result {
  margin-top: 12px;
  padding: 10px 14px;
  background: rgba(255, 100, 100, 0.1);
  border-radius: 8px;
  color: #f88;
  font-size: 12px;
  border: 1px solid rgba(255, 100, 100, 0.2);
}

.test-result.success {
  background: rgba(100, 255, 100, 0.08);
  color: #8f8;
  border-color: rgba(100, 255, 100, 0.2);
}

.test-result a {
  color: #8cf;
  word-break: break-all;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 18px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
}

.cancel-btn, .save-btn {
  padding: 10px 22px;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.cancel-btn {
  background: rgba(255, 255, 255, 0.08);
  color: #aaa;
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.15);
}

.save-btn {
  background: rgba(100, 200, 100, 0.25);
  color: #8f8;
}

.save-btn:hover:not(:disabled) {
  background: rgba(100, 200, 100, 0.4);
}

.save-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 独立窗口模式样式 */
.rule-editor-standalone {
  width: 100%;
  height: 100%;
  background: #1a1b1e;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.rule-editor-standalone .editor-header {
  cursor: default;
  -webkit-app-region: drag;
}

.rule-editor-standalone .close-btn {
  -webkit-app-region: no-drag;
}
</style>
