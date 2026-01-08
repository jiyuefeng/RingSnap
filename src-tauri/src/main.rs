// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

mod clipboard;
mod hotkey;
mod rules;
mod window;

use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .setup(|app| {
            // 注册默认快捷键
            let app_handle = app.handle();
            if let Err(e) = hotkey::register_shortcut(&app_handle, hotkey::DEFAULT_SHORTCUT) {
                eprintln!("注册快捷键失败: {}", e);
            }

            // 在开发模式下打开开发者工具
            #[cfg(debug_assertions)]
            {
                if let Some(window) = app.get_window("main") {
                    window.open_devtools();
                }
            }

            Ok(())
        })
        .on_window_event(|event| {
            // 只有主窗口（圆环菜单）在失去焦点时隐藏
            // 设置窗口不应该自动隐藏
            if let tauri::WindowEvent::Focused(focused) = event.event() {
                if !focused && event.window().label() == "main" {
                    let _ = event.window().hide();
                }
            }
        })
        .invoke_handler(tauri::generate_handler![
            // 剪贴板命令
            clipboard::get_clipboard_text,
            clipboard::set_clipboard_text,
            clipboard::simulate_copy,
            clipboard::copy_and_get_text,
            // 窗口命令
            window::show_ring_menu,
            window::show_ring_menu_at,
            window::hide_ring_menu,
            window::set_always_on_top,
            window::is_window_visible,
            window::open_settings_window,
            window::close_settings_window,
            // 热键命令
            hotkey::change_shortcut,
            hotkey::get_default_shortcut,
            // 规则命令
            rules::load_rules,
            rules::save_rules,
            rules::get_rules_file_path,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
