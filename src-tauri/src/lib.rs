mod capture;
mod commands;
mod storage;
mod tray;

use storage::database::Database;
use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .invoke_handler(tauri::generate_handler![
            commands::capture_fullscreen,
            commands::capture_region,
            commands::list_monitors,
            commands::list_windows,
            commands::capture_window,
            commands::save_capture,
            commands::get_captures,
            commands::delete_capture,
            commands::copy_to_clipboard,
        ])
        .setup(|app| {
            // Initialize database
            let app_data_dir = app
                .path()
                .app_data_dir()
                .expect("Failed to get app data directory");

            let db = Database::init(&app_data_dir)
                .expect("Failed to initialize database");
            app.manage(db);

            // Create system tray
            tray::create_tray(app).expect("Failed to create system tray");

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
