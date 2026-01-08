//! 窗口管理模块
//! 提供窗口显示、隐藏、定位等功能

use tauri::{AppHandle, Manager, Window, PhysicalPosition, WindowBuilder, WindowUrl};

/// 显示窗口并将其定位到鼠标位置附近
/// 
/// # Arguments
/// - `window` - Tauri 窗口实例
#[tauri::command]
pub fn show_ring_menu(window: Window) -> Result<(), String> {
    // 获取鼠标位置（如果可能）
    // 注意：Tauri 1.x 不直接提供鼠标位置 API，需要从前端传递
    // 这里先将窗口居中显示
    window.center().map_err(|e| e.to_string())?;
    window.show().map_err(|e| e.to_string())?;
    window.set_focus().map_err(|e| e.to_string())?;
    Ok(())
}

/// 在指定位置显示窗口
/// 
/// # Arguments
/// - `window` - Tauri 窗口实例
/// - `x` - X 坐标
/// - `y` - Y 坐标
#[tauri::command]
pub fn show_ring_menu_at(window: Window, x: i32, y: i32) -> Result<(), String> {
    // 获取窗口大小以便居中显示
    let size = window.outer_size().map_err(|e| e.to_string())?;
    let offset_x = (size.width / 2) as i32;
    let offset_y = (size.height / 2) as i32;
    
    // 将窗口定位到鼠标位置（居中）
    let position = PhysicalPosition::new(x - offset_x, y - offset_y);
    window.set_position(position).map_err(|e| e.to_string())?;
    
    window.show().map_err(|e| e.to_string())?;
    window.set_focus().map_err(|e| e.to_string())?;
    Ok(())
}

/// 隐藏圆环菜单窗口
/// 
/// # Arguments
/// - `window` - Tauri 窗口实例
#[tauri::command]
pub fn hide_ring_menu(window: Window) -> Result<(), String> {
    window.hide().map_err(|e| e.to_string())
}

/// 设置窗口始终置顶
/// 
/// # Arguments
/// - `window` - Tauri 窗口实例
/// - `always_on_top` - 是否置顶
#[tauri::command]
pub fn set_always_on_top(window: Window, always_on_top: bool) -> Result<(), String> {
    window.set_always_on_top(always_on_top).map_err(|e| e.to_string())
}

/// 获取窗口是否可见
/// 
/// # Arguments
/// - `window` - Tauri 窗口实例
#[tauri::command]
pub fn is_window_visible(window: Window) -> Result<bool, String> {
    window.is_visible().map_err(|e| e.to_string())
}

/// 打开设置窗口
/// 
/// # Arguments
/// - `app_handle` - Tauri 应用句柄
#[tauri::command]
pub fn open_settings_window(app_handle: AppHandle) -> Result<(), String> {
    // 检查窗口是否已存在
    if let Some(window) = app_handle.get_window("settings") {
        window.set_focus().map_err(|e| e.to_string())?;
        return Ok(());
    }
    
    // 创建新的设置窗口
    let settings_window = WindowBuilder::new(
        &app_handle,
        "settings",
        WindowUrl::App("index.html?settings=true".into())
    )
    .title("RingSnap 设置")
    .inner_size(1000.0, 720.0)
    .min_inner_size(800.0, 600.0)
    .resizable(true)
    .decorations(true)
    .center()
    .visible(true)
    .build()
    .map_err(|e| e.to_string())?;
    
    settings_window.set_focus().map_err(|e| e.to_string())?;
    
    Ok(())
}

/// 关闭设置窗口
#[tauri::command]
pub fn close_settings_window(app_handle: AppHandle) -> Result<(), String> {
    if let Some(window) = app_handle.get_window("settings") {
        window.close().map_err(|e| e.to_string())?;
    }
    Ok(())
}
