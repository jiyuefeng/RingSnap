//! 剪贴板管理模块
//! 提供跨平台的剪贴板读取功能

use arboard::Clipboard;
use std::sync::Mutex;
use once_cell::sync::Lazy;
use enigo::{Enigo, Key, Keyboard, Settings};
use std::thread;
use std::time::Duration;

/// 全局剪贴板实例
static CLIPBOARD: Lazy<Mutex<Option<Clipboard>>> = Lazy::new(|| {
    Mutex::new(Clipboard::new().ok())
});

/// 获取剪贴板中的文本内容
/// 
/// # Returns
/// - `Ok(String)` - 剪贴板中的文本内容
/// - `Err(String)` - 错误信息
#[tauri::command]
pub fn get_clipboard_text() -> Result<String, String> {
    let mut clipboard_guard = CLIPBOARD.lock().map_err(|e| e.to_string())?;
    
    if let Some(ref mut clipboard) = *clipboard_guard {
        clipboard.get_text().map_err(|e| e.to_string())
    } else {
        // 尝试重新初始化剪贴板
        *clipboard_guard = Clipboard::new().ok();
        if let Some(ref mut clipboard) = *clipboard_guard {
            clipboard.get_text().map_err(|e| e.to_string())
        } else {
            Err("无法访问剪贴板".to_string())
        }
    }
}

/// 设置剪贴板中的文本内容
/// 
/// # Arguments
/// - `text` - 要设置的文本内容
/// 
/// # Returns
/// - `Ok(())` - 设置成功
/// - `Err(String)` - 错误信息
#[tauri::command]
pub fn set_clipboard_text(text: String) -> Result<(), String> {
    let mut clipboard_guard = CLIPBOARD.lock().map_err(|e| e.to_string())?;
    
    if let Some(ref mut clipboard) = *clipboard_guard {
        clipboard.set_text(text).map_err(|e| e.to_string())
    } else {
        // 尝试重新初始化剪贴板
        *clipboard_guard = Clipboard::new().ok();
        if let Some(ref mut clipboard) = *clipboard_guard {
            clipboard.set_text(text).map_err(|e| e.to_string())
        } else {
            Err("无法访问剪贴板".to_string())
        }
    }
}

/// 模拟复制操作（Cmd+C 或 Ctrl+C）
/// 这会复制当前选中的文本到剪贴板
/// 
/// # Returns
/// - `Ok(())` - 模拟成功
/// - `Err(String)` - 错误信息
#[tauri::command]
pub fn simulate_copy() -> Result<(), String> {
    let mut enigo = Enigo::new(&Settings::default())
        .map_err(|e| format!("初始化键盘模拟失败: {}", e))?;
    
    // 根据操作系统选择修饰键
    #[cfg(target_os = "macos")]
    let modifier = Key::Meta;
    
    #[cfg(not(target_os = "macos"))]
    let modifier = Key::Control;
    
    // 按下修饰键
    enigo.key(modifier, enigo::Direction::Press)
        .map_err(|e| format!("按下修饰键失败: {}", e))?;
    
    // 短暂延迟
    thread::sleep(Duration::from_millis(10));
    
    // 按下并释放 C 键
    enigo.key(Key::Unicode('c'), enigo::Direction::Click)
        .map_err(|e| format!("按下C键失败: {}", e))?;
    
    // 短暂延迟
    thread::sleep(Duration::from_millis(10));
    
    // 释放修饰键
    enigo.key(modifier, enigo::Direction::Release)
        .map_err(|e| format!("释放修饰键失败: {}", e))?;
    
    // 等待系统处理复制操作
    thread::sleep(Duration::from_millis(100));
    
    Ok(())
}

/// 模拟复制并获取剪贴板内容
/// 先执行 Cmd+C/Ctrl+C，然后读取剪贴板
/// 
/// # Returns
/// - `Ok(String)` - 复制后的文本内容
/// - `Err(String)` - 错误信息
#[tauri::command]
pub fn copy_and_get_text() -> Result<String, String> {
    // 先模拟复制
    simulate_copy()?;
    
    // 稍微等待一下让系统处理
    thread::sleep(Duration::from_millis(50));
    
    // 获取剪贴板内容
    get_clipboard_text()
}

/// 处理选中的文本
/// 去除多余的空格、换行等
/// 
/// # Arguments
/// - `text` - 原始文本
/// 
/// # Returns
/// - 处理后的文本
pub fn process_selected_text(text: &str) -> String {
    text.trim()
        .lines()
        .map(|line| line.trim())
        .collect::<Vec<&str>>()
        .join(" ")
        .split_whitespace()
        .collect::<Vec<&str>>()
        .join(" ")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_process_selected_text() {
        let text = "  hello  world  ";
        let result = text.trim()
            .lines()
            .map(|line| line.trim())
            .collect::<Vec<&str>>()
            .join(" ")
            .split_whitespace()
            .collect::<Vec<&str>>()
            .join(" ");
        assert_eq!(result, "hello world");
    }
}