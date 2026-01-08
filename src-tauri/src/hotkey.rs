//! 热键管理模块
//! 提供全局快捷键注册和管理功能

use tauri::{AppHandle, Manager, GlobalShortcutManager};

/// 默认的触发快捷键
/// macOS: Cmd+Shift+R
/// Windows/Linux: Ctrl+Shift+R
#[cfg(target_os = "macos")]
pub const DEFAULT_SHORTCUT: &str = "Cmd+Shift+R";

#[cfg(not(target_os = "macos"))]
pub const DEFAULT_SHORTCUT: &str = "Ctrl+Shift+R";

/// 注册全局快捷键
/// 
/// # Arguments
/// - `app_handle` - Tauri 应用句柄
/// - `shortcut` - 快捷键字符串，如 "Ctrl+Shift+Space"
pub fn register_shortcut(app_handle: &AppHandle, shortcut: &str) -> Result<(), String> {
    let mut shortcut_manager = app_handle.global_shortcut_manager();
    
    // 先尝试注销已存在的快捷键
    let _ = shortcut_manager.unregister(shortcut);
    
    let handle = app_handle.clone();
    shortcut_manager
        .register(shortcut, move || {
            // 触发快捷键时，发送事件到前端
            if let Some(window) = handle.get_window("main") {
                let _ = window.emit("shortcut-triggered", ());
            }
        })
        .map_err(|e| format!("注册快捷键失败: {}", e))
}

/// 注销全局快捷键
/// 
/// # Arguments
/// - `app_handle` - Tauri 应用句柄
/// - `shortcut` - 快捷键字符串
pub fn unregister_shortcut(app_handle: &AppHandle, shortcut: &str) -> Result<(), String> {
    let mut shortcut_manager = app_handle.global_shortcut_manager();
    shortcut_manager
        .unregister(shortcut)
        .map_err(|e| format!("注销快捷键失败: {}", e))
}

/// 注销所有全局快捷键
/// 
/// # Arguments
/// - `app_handle` - Tauri 应用句柄
pub fn unregister_all_shortcuts(app_handle: &AppHandle) -> Result<(), String> {
    let mut shortcut_manager = app_handle.global_shortcut_manager();
    shortcut_manager
        .unregister_all()
        .map_err(|e| format!("注销所有快捷键失败: {}", e))
}

/// 检查快捷键是否已注册
/// 
/// # Arguments
/// - `app_handle` - Tauri 应用句柄
/// - `shortcut` - 快捷键字符串
pub fn is_shortcut_registered(app_handle: &AppHandle, shortcut: &str) -> Result<bool, String> {
    let shortcut_manager = app_handle.global_shortcut_manager();
    shortcut_manager
        .is_registered(shortcut)
        .map_err(|e| format!("检查快捷键失败: {}", e))
}

/// Tauri 命令：更改快捷键
#[tauri::command]
pub fn change_shortcut(app_handle: AppHandle, new_shortcut: String) -> Result<(), String> {
    // 先注销所有快捷键
    unregister_all_shortcuts(&app_handle)?;
    
    // 注册新快捷键
    register_shortcut(&app_handle, &new_shortcut)
}

/// Tauri 命令：获取当前快捷键
#[tauri::command]
pub fn get_default_shortcut() -> String {
    DEFAULT_SHORTCUT.to_string()
}
