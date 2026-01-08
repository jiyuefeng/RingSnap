# RingSnap - 项目结构设计

## 项目概述
一个跨平台文本选择工具，支持macOS、Windows和Linux（Ubuntu）。当用户在系统任意位置选择文本后，通过快捷键触发圆环菜单，显示匹配的URL规则，点击后跳转到相应地址。

## 技术栈
- **框架**: Tauri (Rust + Vue.js)
- **语言**: Rust, TypeScript, Vue.js
- **构建工具**: Vite
- **UI框架**: Element Plus

## 目录结构
```
text-selection-tool/
├── src/                  # 前端代码
│   ├── components/       # Vue组件
│   │   ├── RingMenu.vue  # 圆环菜单组件
│   │   ├── MenuItem.vue  # 菜单项组件
│   │   └── IconLoader.vue # 图标加载组件
│   ├── stores/          # 状态管理
│   │   ├── config.js    # 配置管理
│   │   └── icon.js      # 图标管理
│   ├── utils/          # 工具函数
│   │   ├── matcher.js  # URL匹配
│   │   └── browser.js  # 浏览器操作
│   ├── App.vue         # 主应用组件
│   └── main.js         # 入口文件
├── src-tauri/          # Rust后端代码
│   ├── src/
│   │   ├── main.rs     # 主程序
│   │   ├── hotkey.rs   # 热键管理
│   │   ├── clipboard.rs # 剪贴板管理
│   │   └── window.rs   # 窗口管理
│   └── Cargo.toml      # Rust依赖
├── public/             # 静态资源
│   └── config.json     # 配置文件
├── index.html          # HTML入口
├── package.json        # Node.js依赖
└── vite.config.js      # Vite配置
```

## 核心功能模块

### 1. 文本选择监听模块
- 系统级剪贴板监听
- 全局快捷键支持 (Ctrl+Shift+C/Cmd+Shift+C)
- 文本处理（去除多余空格、换行等）

### 2. 圆环菜单UI组件
- 圆形布局，半透明毛玻璃效果
- 支持鼠标点击和键盘快捷键
- 图标+文字显示
- 响应式设计

### 3. URL匹配引擎
- 正则表达式匹配
- 智能参数提取
- 多规则支持
- 热重载配置

### 4. 图标管理系统
- Google favicon服务
- 自动调整大小
- 内存+磁盘缓存
- 加载状态显示

### 5. 浏览器集成
- 系统默认浏览器支持
- 跨平台兼容
- 错误处理

## 配置文件示例
```json
{
  "rules": [
    {
      "name": "GitHub",
      "pattern": "github\\.com\\/([^\\/]+)\\/([^\\/]+)",
      "url": "https://github.com/{1}/{2}",
      "icon": "github.com"
    },
    {
      "name": "Baidu",
      "pattern": "baidu\\.com\\/s\\?wd=([^&]+)",
      "url": "https://www.baidu.com/s?wd={1}",
      "icon": "baidu.com"
    }
  ]
}
```

## 跨平台支持
- **Windows**: 使用WinAPI监听剪贴板和快捷键
- **macOS**: 使用Cocoa框架
- **Linux**: 使用X11或Wayland

## 开发计划
1. 搭建Tauri项目基础结构
2. 实现文本选择监听
3. 开发圆环菜单UI
4. 实现URL匹配引擎
5. 集成图标管理
6. 实现浏览器集成
7. 测试和优化

## 构建和发布
```bash
# 开发模式
npm run tauri dev

# 构建发布
npm run tauri build
```

这个项目结构支持所有需求功能，并具有良好的可扩展性和维护性。