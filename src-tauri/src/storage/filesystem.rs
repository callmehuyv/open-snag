use chrono::Local;
use image::imageops::FilterType;
use image::ImageEncoder;
use std::fs;
use std::io::Cursor;
use std::path::{Path, PathBuf};

pub fn get_captures_dir() -> Result<PathBuf, String> {
    let home = dirs::home_dir().ok_or_else(|| "Could not find home directory".to_string())?;
    let captures_dir = home.join("OpenSnag").join("Captures");
    fs::create_dir_all(&captures_dir)
        .map_err(|e| format!("Failed to create captures directory: {}", e))?;
    Ok(captures_dir)
}

pub fn get_thumbnail_dir() -> Result<PathBuf, String> {
    let home = dirs::home_dir().ok_or_else(|| "Could not find home directory".to_string())?;
    let thumb_dir = home.join("OpenSnag").join("Thumbnails");
    fs::create_dir_all(&thumb_dir)
        .map_err(|e| format!("Failed to create thumbnails directory: {}", e))?;
    Ok(thumb_dir)
}

pub fn generate_filename(prefix: &str) -> String {
    let timestamp = Local::now().format("%Y%m%d_%H%M%S");
    format!("{}_{}.webp", prefix, timestamp)
}

pub fn save_capture(image_data: &[u8], filename: &str) -> Result<PathBuf, String> {
    let captures_dir = get_captures_dir()?;
    let filepath = captures_dir.join(filename);
    fs::write(&filepath, image_data)
        .map_err(|e| format!("Failed to save capture: {}", e))?;
    Ok(filepath)
}

pub fn create_thumbnail(image_path: &Path) -> Result<PathBuf, String> {
    let img = image::open(image_path)
        .map_err(|e| format!("Failed to open image for thumbnail: {}", e))?;

    let thumb_width = 200u32;
    let aspect_ratio = img.height() as f64 / img.width() as f64;
    let thumb_height = (thumb_width as f64 * aspect_ratio) as u32;

    let thumbnail = img.resize(thumb_width, thumb_height, FilterType::Lanczos3);

    let thumb_dir = get_thumbnail_dir()?;
    let stem = image_path
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("thumb");
    let thumb_filename = format!("{}_thumb.jpg", stem);
    let thumb_path = thumb_dir.join(&thumb_filename);

    let rgba_img = thumbnail.to_rgba8();
    let mut buf = Cursor::new(Vec::new());
    let encoder = image::codecs::jpeg::JpegEncoder::new_with_quality(&mut buf, 80);
    encoder
        .write_image(
            rgba_img.as_raw(),
            rgba_img.width(),
            rgba_img.height(),
            image::ExtendedColorType::Rgba8,
        )
        .map_err(|e| format!("Failed to encode thumbnail: {}", e))?;

    fs::write(&thumb_path, buf.into_inner())
        .map_err(|e| format!("Failed to save thumbnail: {}", e))?;

    Ok(thumb_path)
}
