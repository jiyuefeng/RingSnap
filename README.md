# RingSnap

一个跨平台的文本选择工具，当用户在系统任意位置选择文本后，通过快捷键触发圆环菜单，显示匹配的URL规则，点击后跳转到相应地址。

## 功能特性

- 🎯 **全局快捷键触发** - macOS: `Cmd+Shift+R` / Windows/Linux: `Ctrl+Shift+R`
- 🔗 **智能URL匹配** - 支持正则表达式匹配和参数提取
- 🎨 **毛玻璃圆环菜单** - 美观的半透明UI设计
- 🌐 **跨平台支持** - 支持 macOS、Windows 和 Linux
- ⚡ **快速响应** - 基于 Tauri 的轻量级架构
- 🔧 **可配置规则** - 通过 JSON 文件自定义匹配规则

## 技术栈

- **框架**: Tauri (Rust + Vue.js)
- **前端**: Vue 3 + TypeScript + Vite
- **状态管理**: Pinia
- **UI 组件**: Element Plus
- **后端**: Rust

## 安装依赖

### 前置要求

- Node.js >= 18
- Rust >= 1.70
- 系统特定依赖:
  - **macOS**: Xcode Command Line Tools
  - **Windows**: Visual Studio Build Tools
  - **Linux**: 参考 [Tauri Prerequisites](https://tauri.app/v1/guides/getting-started/prerequisites)

### 安装步骤

```bash
# 克隆项目
git clone https://github.com/jiyuefeng/RingSnap.git
cd RingSnap

# 安装 Node.js 依赖
npm install
```

## 开发

```bash
# 启动开发模式
npm run tauri dev
```

## 构建

```bash
# 构建发布版本
npm run tauri build
```

## 使用方法

1. 启动应用后，程序将在后台运行
2. 在任意应用中选择并复制文本（Cmd/Ctrl+C）
3. 按下快捷键 `Cmd+Shift+R`（macOS）或 `Ctrl+Shift+R`（Windows/Linux）
4. 圆环菜单将显示匹配的规则
5. 点击菜单项或按数字键 1-9 选择，将在浏览器中打开对应链接

## 配置规则

编辑 `public/config.json` 文件来自定义匹配规则：

```json
{
  "rules": [
    {
      "name": "GitHub仓库",
      "pattern": "github\\.com\\/([^\\/]+)\\/([^\\/]+)",
      "url": "https://github.com/{1}/{2}",
      "icon": "github.com"
    },
    {
      "name": "Google搜索",
      "pattern": ".*",
      "url": "https://www.google.com/search?q={text}",
      "icon": "google.com"
    }
  ]
}
```

### 规则说明

- `name`: 规则名称，显示在菜单中
- `pattern`: 正则表达式模式
- `url`: 目标 URL 模板
  - `{1}`, `{2}`, ... : 正则捕获组
  - `{text}`: 完整的输入文本
- `icon`: 图标域名（使用 Google Favicon 服务获取）

## 项目结构

```
ringsnap/
├── src/                  # 前端代码
│   ├── components/       # Vue 组件
│   │   ├── RingMenu.vue  # 圆环菜单组件
│   │   ├── MenuItem.vue  # 菜单项组件
│   │   └── IconLoader.vue # 图标加载组件
│   ├── stores/           # 状态管理
│   │   ├── config.ts     # 配置管理
│   │   └── icon.ts       # 图标管理
│   ├── utils/            # 工具函数
│   │   ├── matcher.ts    # URL 匹配引擎
│   │   └── browser.ts    # 浏览器操作
│   ├── types/            # TypeScript 类型定义
│   ├── App.vue           # 主应用组件
│   └── main.ts           # 入口文件
├── src-tauri/            # Rust 后端
│   └── src/
│       ├── main.rs       # 主程序
│       ├── hotkey.rs     # 热键管理
│       ├── clipboard.rs  # 剪贴板管理
│       └── window.rs     # 窗口管理
├── public/               # 静态资源
│   └── config.json       # 配置文件
└── docs/                 # 文档
```

## 安装说明

### macOS

下载 `.dmg` 文件后，如果出现 **"xxx已损坏，无法打开"** 的提示，这是因为应用没有经过 Apple 签名。请在终端执行以下命令解除限制：

```bash
# 解除应用的隔离属性
sudo xattr -rd com.apple.quarantine /Applications/RingSnap.app
```

或者在 **系统设置 > 隐私与安全性** 中点击"仍要打开"。

### Windows

下载 `.msi` 或 `.exe` 安装包，双击安装即可。

### Linux

- **Ubuntu/Debian**: 下载 `.deb` 文件，使用 `sudo dpkg -i RingSnap_x.x.x_amd64.deb` 安装
- **其他发行版**: 下载 `.AppImage` 文件，添加执行权限后运行

## 许可证

MIT License
