// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::fs;
use std::sync::Mutex;
use std::result::Result;
use serde::{Deserialize, Serialize};
use tauri::Manager;

#[derive(Serialize, Deserialize, Clone, Debug)]
struct Settings {
    multi_sound_enabled: bool,
    repeat_sound_enabled: bool,
    always_on_top: bool,
    volume: f32,
}

#[derive(Serialize, Deserialize, Clone, Debug, Default)]
struct HotkeyMap(std::collections::HashMap<String, String>);

impl Default for Settings {
    fn default() -> Self {
        Settings {
            multi_sound_enabled: true,
            repeat_sound_enabled: false,
            always_on_top: false,
            volume: 1.0,
        }
    }
}

struct AppState {
    settings: Mutex<Settings>,
    hotkeys: Mutex<HotkeyMap>,
}

#[tauri::command]
async fn load_settings(state: tauri::State<'_, AppState>) -> Result<Settings, String> {
    let settings = state.settings.lock().map_err(|e| e.to_string())?;
    Ok(settings.clone())
}

#[tauri::command]
async fn save_settings(
    settings: Settings,
    state: tauri::State<'_, AppState>,
    window: tauri::Window,
) -> Result<(), String> {
    {
        let mut current_settings = state.settings.lock().map_err(|e| e.to_string())?;
        *current_settings = settings.clone();
    }
    
    window.set_always_on_top(settings.always_on_top).map_err(|e| e.to_string())?;
    
    let app_local_data = window
    .app_handle()
    .path()
    .app_local_data_dir()
    .map_err(|e| e.to_string())?;
    fs::create_dir_all(&app_local_data).map_err(|e| e.to_string())?;
    
    let settings_path = app_local_data.join("settings.json");
    let settings_json = serde_json::to_string_pretty(&settings).map_err(|e| e.to_string())?;
    fs::write(settings_path, settings_json).map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
async fn load_hotkeys(state: tauri::State<'_, AppState>) -> Result<HotkeyMap, String> {
    let hotkeys = state.hotkeys.lock().map_err(|e| e.to_string())?;
    Ok(hotkeys.clone())
}

#[tauri::command]
async fn save_hotkeys(
    hotkeys: HotkeyMap,
    state: tauri::State<'_, AppState>,
    window: tauri::Window,
) -> Result<(), String> {
    {
        let mut current_hotkeys = state.hotkeys.lock().map_err(|e| e.to_string())?;
        *current_hotkeys = hotkeys.clone();
    }
    
    let app_local_data = window
    .app_handle()
    .path()
    .app_local_data_dir()
    .map_err(|e| e.to_string())?;
    fs::create_dir_all(&app_local_data).map_err(|e| e.to_string())?;
    
    let hotkeys_path = app_local_data.join("hotkeys.json");
    let hotkeys_json = serde_json::to_string_pretty(&hotkeys).map_err(|e| e.to_string())?;
    fs::write(hotkeys_path, hotkeys_json).map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
async fn toggle_always_on_top(
    enabled: bool,
    state: tauri::State<'_, AppState>,
    window: tauri::Window,
) -> Result<(), String> {
    {
        let mut settings = state.settings.lock().map_err(|e| e.to_string())?;
        settings.always_on_top = enabled;
    }
    window.set_always_on_top(enabled).map_err(|e| e.to_string())?;
    Ok(())
}

fn main() {
    let app_state = AppState {
        settings: Mutex::new(Settings::default()),
        hotkeys: Mutex::new(HotkeyMap::default()),
    };
    
    tauri::Builder::default()
    .manage(app_state)
    .setup(|app| {
        let app_handle = app.handle();
        let app_local_data = app_handle
            .path()
            .app_local_data_dir()
            .map_err(|e| e.to_string())?;

            fs::create_dir_all(&app_local_data).map_err(|e| e.to_string())?;

            let state: tauri::State<'_, AppState> = app.state();

            let settings_path = app_local_data.join("settings.json");
            if settings_path.exists() {
                if let Ok(settings_data) = fs::read_to_string(&settings_path) {
                    if let Ok(settings) = serde_json::from_str(&settings_data) {
                        *state.settings.lock().unwrap() = settings;
                    }
                }
            }
            
            let hotkeys_path = app_local_data.join("hotkeys.json");
            if hotkeys_path.exists() {
                if let Ok(hotkeys_data) = fs::read_to_string(&hotkeys_path) {
                    if let Ok(hotkeys) = serde_json::from_str(&hotkeys_data) {
                        *state.hotkeys.lock().unwrap() = hotkeys;
                    }
                }
            }

            let window = app.get_webview_window("main").unwrap();
            let settings = state.settings.lock().unwrap();
            window.set_always_on_top(settings.always_on_top).unwrap();

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            load_settings,
            save_settings,
            load_hotkeys,
            save_hotkeys,
            toggle_always_on_top,
        ])
        .plugin(tauri_plugin_log::Builder::default().build())
        .build(tauri::generate_context!())
        .expect("error while running tauri application");
}
