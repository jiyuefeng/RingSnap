/**
 * 规则存储模块
 * 使用 Tauri 的应用数据目录来存储规则，确保所有窗口共享同一份数据
 * 默认规则从 public/config.json 读取（编译时嵌入）
 */

use std::fs;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

/// 编译时嵌入默认配置文件内容
const DEFAULT_CONFIG_JSON: &str = include_str!("../../public/config.json");

/// URL 规则结构
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UrlRule {
    pub name: String,
    pub pattern: String,
    pub url: String,
    pub icon: String,
    #[serde(default = "default_enabled")]
    pub enabled: bool,
    #[serde(default = "default_icon_source_index", rename = "iconSourceIndex")]
    pub icon_source_index: u32,
}

fn default_enabled() -> bool {
    true
}

fn default_icon_source_index() -> u32 {
    0
}

/// 规则配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RulesConfig {
    pub rules: Vec<UrlRule>,
}

/// 从嵌入的配置文件获取默认规则
fn get_default_rules() -> Vec<UrlRule> {
    // 解析编译时嵌入的默认配置
    match serde_json::from_str::<RulesConfig>(DEFAULT_CONFIG_JSON) {
        Ok(config) => config.rules,
        Err(e) => {
            eprintln!("解析默认配置失败: {}, 使用空规则列表", e);
            Vec::new()
        }
    }
}

/// 获取规则文件路径
fn get_rules_path(app_handle: &AppHandle) -> Result<PathBuf, String> {
    let app_dir = app_handle
        .path_resolver()
        .app_data_dir()
        .ok_or("无法获取应用数据目录")?;
    
    // 确保目录存在
    if !app_dir.exists() {
        fs::create_dir_all(&app_dir).map_err(|e| format!("创建目录失败: {}", e))?;
    }
    
    Ok(app_dir.join("rules.json"))
}

/// 加载规则
#[tauri::command]
pub fn load_rules(app_handle: AppHandle) -> Result<Vec<UrlRule>, String> {
    let rules_path = get_rules_path(&app_handle)?;
    
    if rules_path.exists() {
        let content = fs::read_to_string(&rules_path)
            .map_err(|e| format!("读取规则文件失败: {}", e))?;
        
        let config: RulesConfig = serde_json::from_str(&content)
            .map_err(|e| format!("解析规则文件失败: {}", e))?;
        
        Ok(config.rules)
    } else {
        // 返回默认规则
        let default_rules = get_default_rules();
        // 保存默认规则到文件
        let _ = save_rules_internal(&app_handle, &default_rules);
        Ok(default_rules)
    }
}

/// 保存规则（内部函数）
fn save_rules_internal(app_handle: &AppHandle, rules: &[UrlRule]) -> Result<(), String> {
    let rules_path = get_rules_path(app_handle)?;
    
    let config = RulesConfig {
        rules: rules.to_vec(),
    };
    
    let content = serde_json::to_string_pretty(&config)
        .map_err(|e| format!("序列化规则失败: {}", e))?;
    
    fs::write(&rules_path, content)
        .map_err(|e| format!("写入规则文件失败: {}", e))?;
    
    Ok(())
}

/// 保存规则（Tauri 命令）
#[tauri::command]
pub fn save_rules(app_handle: AppHandle, rules: Vec<UrlRule>) -> Result<(), String> {
    save_rules_internal(&app_handle, &rules)?;
    
    // 通知所有窗口规则已更新
    let _ = app_handle.emit_all("rules-updated", ());
    
    Ok(())
}

/// 获取规则文件路径（供前端显示）
#[tauri::command]
pub fn get_rules_file_path(app_handle: AppHandle) -> Result<String, String> {
    let path = get_rules_path(&app_handle)?;
    Ok(path.to_string_lossy().to_string())
}