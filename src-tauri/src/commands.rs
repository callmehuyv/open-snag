use base64::Engine as _;
use base64::engine::general_purpose::STANDARD as BASE64;
use serde::Serialize;

use crate::capture::screenshot;
use crate::recording::recorder::{RecordingStatus, ScreenRecorder};
use crate::storage::database::{CaptureRecord, Database};
use crate::storage::filesystem;

/// Wrapper for ScreenRecorder so it can be used as Tauri managed state.
pub struct RecorderState(pub ScreenRecorder);

#[derive(Debug, Serialize, Clone)]
pub struct CaptureResult {
    pub base64_image: String,
    pub width: u32,
    pub height: u32,
}

#[derive(Debug, Serialize, Clone)]
pub struct MonitorInfo {
    pub id: u32,
    pub name: String,
    pub width: u32,
    pub height: u32,
    pub x: i32,
    pub y: i32,
    pub is_primary: bool,
}

#[derive(Debug, Serialize, Clone)]
pub struct WindowInfo {
    pub id: u32,
    pub title: String,
    pub app_name: String,
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
}

#[tauri::command]
pub async fn check_screen_permission() -> Result<bool, String> {
    #[cfg(target_os = "macos")]
    {
        // On macOS, try to capture a tiny test — if permission is denied, CGDisplayStream
        // or ScreenCaptureKit will fail. A simpler check: CGPreflightScreenCaptureAccess
        // is available on macOS 10.15+.
        // We use a quick test capture via xcap. If it returns a 0x0 or all-black image,
        // permission is likely denied.
        match xcap::Monitor::all() {
            Ok(monitors) => {
                if let Some(monitor) = monitors.first() {
                    match monitor.capture_image() {
                        Ok(img) => {
                            // If we got an image with actual dimensions, permission is granted
                            Ok(img.width() > 0 && img.height() > 0)
                        }
                        Err(_) => Ok(false),
                    }
                } else {
                    Ok(false)
                }
            }
            Err(_) => Ok(false),
        }
    }
    #[cfg(not(target_os = "macos"))]
    {
        // On Windows/Linux, screen capture generally doesn't need special permission
        Ok(true)
    }
}

#[tauri::command]
pub async fn open_screen_permission_settings() -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        std::process::Command::new("open")
            .arg("x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture")
            .spawn()
            .map_err(|e| format!("Failed to open settings: {}", e))?;
    }
    Ok(())
}

#[tauri::command]
pub async fn capture_fullscreen(monitor_index: usize) -> Result<CaptureResult, String> {
    let output = screenshot::capture_full_screen(monitor_index)?;
    Ok(CaptureResult {
        base64_image: output.base64_image,
        width: output.width,
        height: output.height,
    })
}

#[tauri::command]
pub async fn capture_region(
    x: i32,
    y: i32,
    width: u32,
    height: u32,
) -> Result<CaptureResult, String> {
    let output = screenshot::capture_region(x, y, width, height)?;
    Ok(CaptureResult {
        base64_image: output.base64_image,
        width: output.width,
        height: output.height,
    })
}

#[tauri::command]
pub async fn list_monitors() -> Result<Vec<MonitorInfo>, String> {
    let monitors = screenshot::list_monitors()?;
    Ok(monitors
        .into_iter()
        .map(|m| MonitorInfo {
            id: m.id,
            name: m.name,
            width: m.width,
            height: m.height,
            x: m.x,
            y: m.y,
            is_primary: m.is_primary,
        })
        .collect())
}

#[tauri::command]
pub async fn list_windows() -> Result<Vec<WindowInfo>, String> {
    let windows = screenshot::list_windows()?;
    Ok(windows
        .into_iter()
        .map(|w| WindowInfo {
            id: w.id,
            title: w.title,
            app_name: w.app_name,
            x: w.x,
            y: w.y,
            width: w.width,
            height: w.height,
        })
        .collect())
}

#[tauri::command]
pub async fn capture_window(window_id: u32) -> Result<CaptureResult, String> {
    let output = screenshot::capture_window(window_id)?;
    Ok(CaptureResult {
        base64_image: output.base64_image,
        width: output.width,
        height: output.height,
    })
}

#[tauri::command]
pub async fn save_capture(
    db: tauri::State<'_, Database>,
    image_data: String,
    filename: Option<String>,
) -> Result<String, String> {
    let image_bytes = BASE64
        .decode(&image_data)
        .map_err(|e| format!("Failed to decode base64: {}", e))?;

    let fname = filename.unwrap_or_else(|| filesystem::generate_filename("capture"));
    let filepath = filesystem::save_capture(&image_bytes, &fname)?;

    // Try to create a thumbnail
    let _ = filesystem::create_thumbnail(&filepath);

    // Try to get image dimensions
    let (width, height) = image::image_dimensions(&filepath).unwrap_or((0, 0));

    let record = CaptureRecord {
        id: uuid::Uuid::new_v4().to_string(),
        filename: fname.clone(),
        filepath: filepath.to_string_lossy().to_string(),
        capture_type: "screenshot".to_string(),
        width: width as i64,
        height: height as i64,
        file_size: image_bytes.len() as i64,
        created_at: chrono::Local::now().to_rfc3339(),
        tags: String::new(),
    };

    db.insert_capture(&record)?;

    Ok(filepath.to_string_lossy().to_string())
}

#[tauri::command]
pub async fn get_captures(db: tauri::State<'_, Database>) -> Result<Vec<CaptureRecord>, String> {
    db.get_captures()
}

#[tauri::command]
pub async fn delete_capture(db: tauri::State<'_, Database>, id: String) -> Result<(), String> {
    db.delete_capture(&id)
}

#[tauri::command]
pub async fn copy_to_clipboard(
    app: tauri::AppHandle,
    image_data: String,
) -> Result<(), String> {
    use tauri_plugin_clipboard_manager::ClipboardExt;

    let image_bytes = BASE64
        .decode(&image_data)
        .map_err(|e| format!("Failed to decode base64: {}", e))?;

    // Write to a temp file and read as image for clipboard
    let temp_dir = std::env::temp_dir();
    let temp_path = temp_dir.join("opensnag_clipboard.png");
    std::fs::write(&temp_path, &image_bytes)
        .map_err(|e| format!("Failed to write temp file: {}", e))?;

    let img = tauri::image::Image::from_bytes(&image_bytes)
        .map_err(|e| format!("Failed to create image: {}", e))?;

    app.clipboard()
        .write_image(&img)
        .map_err(|e| format!("Failed to copy to clipboard: {}", e))?;

    // Clean up temp file
    let _ = std::fs::remove_file(&temp_path);

    Ok(())
}

// ---------------------------------------------------------------------------
// Recording commands
// ---------------------------------------------------------------------------

#[tauri::command]
pub async fn start_recording(
    state: tauri::State<'_, RecorderState>,
    output_dir: Option<String>,
    fps: Option<u32>,
) -> Result<(), String> {
    state.0.start_recording(output_dir, fps)
}

#[tauri::command]
pub async fn stop_recording(
    state: tauri::State<'_, RecorderState>,
) -> Result<String, String> {
    state.0.stop_recording()
}

#[tauri::command]
pub async fn pause_recording(
    state: tauri::State<'_, RecorderState>,
) -> Result<(), String> {
    state.0.pause_recording()
}

#[tauri::command]
pub async fn resume_recording(
    state: tauri::State<'_, RecorderState>,
) -> Result<(), String> {
    state.0.resume_recording()
}

#[tauri::command]
pub async fn get_recording_status(
    state: tauri::State<'_, RecorderState>,
) -> Result<RecordingStatus, String> {
    state.0.get_status()
}
