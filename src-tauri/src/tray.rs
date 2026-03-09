use tauri::{
    menu::{Menu, MenuItem, PredefinedMenuItem},
    tray::TrayIconBuilder,
    Emitter,
};

pub fn create_tray(app: &tauri::App) -> Result<(), String> {
    let capture_screen =
        MenuItem::with_id(app, "capture_screen", "Capture Screen", true, Some("CmdOrCtrl+Shift+S"))
            .map_err(|e| format!("Failed to create menu item: {}", e))?;
    let capture_region =
        MenuItem::with_id(app, "capture_region", "Capture Region", true, Some("CmdOrCtrl+Shift+R"))
            .map_err(|e| format!("Failed to create menu item: {}", e))?;
    let capture_window =
        MenuItem::with_id(app, "capture_window", "Capture Window", true, Some("CmdOrCtrl+Shift+W"))
            .map_err(|e| format!("Failed to create menu item: {}", e))?;

    let separator1 = PredefinedMenuItem::separator(app)
        .map_err(|e| format!("Failed to create separator: {}", e))?;

    let open_library = MenuItem::with_id(app, "open_library", "Open Library", true, None::<&str>)
        .map_err(|e| format!("Failed to create menu item: {}", e))?;
    let settings = MenuItem::with_id(app, "settings", "Settings", true, None::<&str>)
        .map_err(|e| format!("Failed to create menu item: {}", e))?;

    let separator2 = PredefinedMenuItem::separator(app)
        .map_err(|e| format!("Failed to create separator: {}", e))?;

    let quit = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)
        .map_err(|e| format!("Failed to create menu item: {}", e))?;

    let menu = Menu::with_items(
        app,
        &[
            &capture_screen,
            &capture_region,
            &capture_window,
            &separator1,
            &open_library,
            &settings,
            &separator2,
            &quit,
        ],
    )
    .map_err(|e| format!("Failed to create menu: {}", e))?;

    TrayIconBuilder::new()
        .icon(app.default_window_icon().cloned().unwrap_or_else(|| {
            tauri::image::Image::new(&[], 0, 0)
        }))
        .menu(&menu)
        .on_menu_event(|app, event| match event.id.as_ref() {
            "capture_screen" => {
                let _ = app.emit("tray-capture-screen", ());
            }
            "capture_region" => {
                let _ = app.emit("tray-capture-region", ());
            }
            "capture_window" => {
                let _ = app.emit("tray-capture-window", ());
            }
            "open_library" => {
                let _ = app.emit("tray-open-library", ());
            }
            "settings" => {
                let _ = app.emit("tray-settings", ());
            }
            "quit" => {
                app.exit(0);
            }
            _ => {}
        })
        .build(app)
        .map_err(|e| format!("Failed to build tray icon: {}", e))?;

    Ok(())
}
