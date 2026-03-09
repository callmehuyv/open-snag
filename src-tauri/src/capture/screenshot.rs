use base64::Engine as _;
use base64::engine::general_purpose::STANDARD as BASE64;
use image::ImageEncoder;
use serde::Serialize;
use std::io::Cursor;
use xcap::Monitor;
#[cfg(target_os = "windows")]
use xcap::Window;

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

#[derive(Debug, Serialize, Clone)]
pub struct CaptureOutput {
    pub base64_image: String,
    pub width: u32,
    pub height: u32,
}

fn image_to_base64_png(img: &image::RgbaImage) -> Result<String, String> {
    let mut buf = Cursor::new(Vec::new());
    let encoder = image::codecs::png::PngEncoder::new(&mut buf);
    encoder
        .write_image(
            img.as_raw(),
            img.width(),
            img.height(),
            image::ExtendedColorType::Rgba8,
        )
        .map_err(|e| format!("Failed to encode PNG: {}", e))?;
    Ok(BASE64.encode(buf.into_inner()))
}

pub fn capture_full_screen(monitor_index: usize) -> Result<CaptureOutput, String> {
    let monitors = Monitor::all().map_err(|e| format!("Failed to list monitors: {}", e))?;
    let monitor = monitors
        .get(monitor_index)
        .ok_or_else(|| format!("Monitor index {} out of range (found {})", monitor_index, monitors.len()))?;

    let img = monitor
        .capture_image()
        .map_err(|e| format!("Failed to capture screen: {}", e))?;

    let base64_image = image_to_base64_png(&img)?;
    Ok(CaptureOutput {
        width: img.width(),
        height: img.height(),
        base64_image,
    })
}

pub fn capture_region(x: i32, y: i32, width: u32, height: u32) -> Result<CaptureOutput, String> {
    // Capture the primary monitor and crop the region
    let monitors = Monitor::all().map_err(|e| format!("Failed to list monitors: {}", e))?;

    // Find the monitor that contains the region
    let monitor = monitors
        .first()
        .ok_or_else(|| "No monitors found".to_string())?;

    let full_img = monitor
        .capture_image()
        .map_err(|e| format!("Failed to capture screen: {}", e))?;

    // Calculate crop coordinates relative to the monitor
    let monitor_x = monitor.x();
    let monitor_y = monitor.y();
    let crop_x = (x - monitor_x).max(0) as u32;
    let crop_y = (y - monitor_y).max(0) as u32;

    let cropped = image::imageops::crop_imm(&full_img, crop_x, crop_y, width, height).to_image();

    let base64_image = image_to_base64_png(&cropped)?;
    Ok(CaptureOutput {
        width: cropped.width(),
        height: cropped.height(),
        base64_image,
    })
}

pub fn list_monitors() -> Result<Vec<MonitorInfo>, String> {
    let monitors = Monitor::all().map_err(|e| format!("Failed to list monitors: {}", e))?;
    let mut result = Vec::new();

    for (i, monitor) in monitors.iter().enumerate() {
        result.push(MonitorInfo {
            id: i as u32,
            name: monitor.name().to_string(),
            width: monitor.width(),
            height: monitor.height(),
            x: monitor.x(),
            y: monitor.y(),
            is_primary: monitor.is_primary(),
        });
    }

    Ok(result)
}

pub fn list_windows() -> Result<Vec<WindowInfo>, String> {
    #[cfg(target_os = "windows")]
    {
        let windows = Window::all().map_err(|e| format!("Failed to list windows: {}", e))?;
        let mut result = Vec::new();
        for window in windows {
            let title = window.title().to_string();
            if title.is_empty() {
                continue;
            }
            result.push(WindowInfo {
                id: window.id(),
                title,
                app_name: window.app_name().to_string(),
                x: window.x(),
                y: window.y(),
                width: window.width(),
                height: window.height(),
            });
        }
        Ok(result)
    }

    #[cfg(target_os = "macos")]
    {
        use xcap::Window;
        let windows = Window::all().map_err(|e| format!("Failed to list windows: {}", e))?;
        let mut result = Vec::new();
        for window in windows {
            let title = window.title().to_string();
            if title.is_empty() {
                continue;
            }
            result.push(WindowInfo {
                id: window.id(),
                title,
                app_name: window.app_name().to_string(),
                x: window.x(),
                y: window.y(),
                width: window.width(),
                height: window.height(),
            });
        }
        Ok(result)
    }

    #[cfg(target_os = "linux")]
    {
        use xcap::Window;
        let windows = Window::all().map_err(|e| format!("Failed to list windows: {}", e))?;
        let mut result = Vec::new();
        for window in windows {
            let title = window.title().to_string();
            if title.is_empty() {
                continue;
            }
            result.push(WindowInfo {
                id: window.id(),
                title,
                app_name: window.app_name().to_string(),
                x: window.x(),
                y: window.y(),
                width: window.width(),
                height: window.height(),
            });
        }
        Ok(result)
    }
}

pub fn capture_window(window_id: u32) -> Result<CaptureOutput, String> {
    #[cfg(any(target_os = "macos", target_os = "linux", target_os = "windows"))]
    {
        use xcap::Window;
        let windows = Window::all().map_err(|e| format!("Failed to list windows: {}", e))?;
        let window = windows
            .into_iter()
            .find(|w| w.id() == window_id)
            .ok_or_else(|| format!("Window with id {} not found", window_id))?;

        let img = window
            .capture_image()
            .map_err(|e| format!("Failed to capture window: {}", e))?;

        let base64_image = image_to_base64_png(&img)?;
        Ok(CaptureOutput {
            width: img.width(),
            height: img.height(),
            base64_image,
        })
    }
}
