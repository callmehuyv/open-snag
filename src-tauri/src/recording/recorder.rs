use serde::Serialize;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use std::time::Instant;

#[derive(Debug, Clone, PartialEq, Serialize)]
#[serde(rename_all = "lowercase")]
pub enum RecordingState {
    Idle,
    Recording,
    Paused,
}

#[derive(Debug, Clone, Serialize)]
pub struct RecordingStatus {
    pub state: String,
    pub duration_secs: f64,
    pub output_path: Option<String>,
}

/// Optional recording region (x, y, width, height).
#[derive(Debug, Clone, Copy)]
pub struct RecordingRegion {
    pub x: i32,
    pub y: i32,
    pub width: u32,
    pub height: u32,
}

/// Internal state shared across threads.
struct RecorderInner {
    state: RecordingState,
    output_path: Option<PathBuf>,
    /// When recording started (reset on resume after pause).
    started_at: Option<Instant>,
    /// Accumulated duration from previous recording segments (before pauses).
    accumulated_secs: f64,
    /// Optional region to record.
    region: Option<RecordingRegion>,
    /// Handle to the macOS screencapture child process.
    #[cfg(target_os = "macos")]
    child_process: Option<std::process::Child>,
    /// Handle to the frame-capture background task (non-macOS).
    #[cfg(not(target_os = "macos"))]
    cancel_flag: Option<Arc<std::sync::atomic::AtomicBool>>,
    /// Temp directory for frame-capture fallback.
    #[cfg(not(target_os = "macos"))]
    frames_dir: Option<PathBuf>,
    /// FPS for frame-capture fallback.
    #[cfg(not(target_os = "macos"))]
    fps: u32,
}

impl RecorderInner {
    fn new() -> Self {
        Self {
            state: RecordingState::Idle,
            output_path: None,
            started_at: None,
            accumulated_secs: 0.0,
            region: None,
            #[cfg(target_os = "macos")]
            child_process: None,
            #[cfg(not(target_os = "macos"))]
            cancel_flag: None,
            #[cfg(not(target_os = "macos"))]
            frames_dir: None,
            #[cfg(not(target_os = "macos"))]
            fps: 10,
        }
    }

    fn elapsed_secs(&self) -> f64 {
        let current = match self.started_at {
            Some(t) => t.elapsed().as_secs_f64(),
            None => 0.0,
        };
        self.accumulated_secs + current
    }
}

/// Thread-safe screen recorder that can be used as Tauri managed state.
pub struct ScreenRecorder {
    inner: Arc<Mutex<RecorderInner>>,
}

impl ScreenRecorder {
    pub fn new() -> Self {
        Self {
            inner: Arc::new(Mutex::new(RecorderInner::new())),
        }
    }

    pub fn get_status(&self) -> Result<RecordingStatus, String> {
        let inner = self.inner.lock().map_err(|e| format!("Lock poisoned: {}", e))?;
        let state_str = match inner.state {
            RecordingState::Idle => "idle",
            RecordingState::Recording => "recording",
            RecordingState::Paused => "paused",
        };
        Ok(RecordingStatus {
            state: state_str.to_string(),
            duration_secs: inner.elapsed_secs(),
            output_path: inner.output_path.as_ref().map(|p| p.to_string_lossy().to_string()),
        })
    }

    // -----------------------------------------------------------------------
    // macOS implementation: uses the native `screencapture -v` command
    // -----------------------------------------------------------------------

    #[cfg(target_os = "macos")]
    pub fn start_recording(
        &self,
        output_dir: Option<String>,
        _fps: Option<u32>,
        region: Option<RecordingRegion>,
    ) -> Result<(), String> {
        let mut inner = self.inner.lock().map_err(|e| format!("Lock poisoned: {}", e))?;

        if inner.state != RecordingState::Idle {
            return Err("Recording is already in progress".into());
        }

        let dir = match output_dir {
            Some(d) => PathBuf::from(d),
            None => std::env::temp_dir().join("opensnag_recordings"),
        };
        std::fs::create_dir_all(&dir)
            .map_err(|e| format!("Failed to create output directory: {}", e))?;

        let timestamp = chrono::Local::now().format("%Y%m%d_%H%M%S");
        let output_file = dir.join(format!("recording_{}.mov", timestamp));

        // Launch screencapture -v (video mode). It records until the process is
        // terminated. If a region is specified, use -R to limit the capture area.
        let mut cmd = std::process::Command::new("screencapture");
        cmd.arg("-v");

        if let Some(r) = &region {
            cmd.arg("-R").arg(format!("{},{},{},{}", r.x, r.y, r.width, r.height));
        }

        cmd.arg(output_file.to_string_lossy().to_string());

        let child = cmd
            .spawn()
            .map_err(|e| format!("Failed to start screencapture: {}", e))?;

        inner.child_process = Some(child);
        inner.output_path = Some(output_file);
        inner.region = region;
        inner.state = RecordingState::Recording;
        inner.started_at = Some(Instant::now());
        inner.accumulated_secs = 0.0;

        Ok(())
    }

    #[cfg(target_os = "macos")]
    pub fn stop_recording(&self) -> Result<String, String> {
        let mut inner = self.inner.lock().map_err(|e| format!("Lock poisoned: {}", e))?;

        if inner.state == RecordingState::Idle {
            return Err("No recording in progress".into());
        }

        // Kill the screencapture process to finalize the video file.
        if let Some(ref mut child) = inner.child_process {
            // Send SIGINT via the kill command for a clean stop so the file
            // is properly finalized by screencapture.
            let pid = child.id();
            let _ = std::process::Command::new("kill")
                .arg("-INT")
                .arg(pid.to_string())
                .status();

            // Give screencapture a moment to finalize the file.
            std::thread::sleep(std::time::Duration::from_millis(500));

            // Fallback: if the process is still alive, kill it.
            let _ = child.kill();
            let _ = child.wait();
        }

        let output_path = inner
            .output_path
            .as_ref()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_default();

        // Reset state
        inner.child_process = None;
        inner.state = RecordingState::Idle;
        inner.started_at = None;
        inner.accumulated_secs = 0.0;

        Ok(output_path)
    }

    #[cfg(target_os = "macos")]
    pub fn pause_recording(&self) -> Result<(), String> {
        let mut inner = self.inner.lock().map_err(|e| format!("Lock poisoned: {}", e))?;

        if inner.state != RecordingState::Recording {
            return Err("Not currently recording".into());
        }

        // macOS screencapture doesn't support pause natively.
        // We accumulate the elapsed time and stop timing.
        if let Some(started) = inner.started_at.take() {
            inner.accumulated_secs += started.elapsed().as_secs_f64();
        }
        inner.state = RecordingState::Paused;
        Ok(())
    }

    #[cfg(target_os = "macos")]
    pub fn resume_recording(&self) -> Result<(), String> {
        let mut inner = self.inner.lock().map_err(|e| format!("Lock poisoned: {}", e))?;

        if inner.state != RecordingState::Paused {
            return Err("Recording is not paused".into());
        }

        inner.started_at = Some(Instant::now());
        inner.state = RecordingState::Recording;
        Ok(())
    }

    // -----------------------------------------------------------------------
    // Cross-platform fallback: frame-by-frame capture with xcap
    // -----------------------------------------------------------------------

    #[cfg(not(target_os = "macos"))]
    pub fn start_recording(
        &self,
        output_dir: Option<String>,
        fps: Option<u32>,
        region: Option<RecordingRegion>,
    ) -> Result<(), String> {
        let mut inner = self.inner.lock().map_err(|e| format!("Lock poisoned: {}", e))?;

        if inner.state != RecordingState::Idle {
            return Err("Recording is already in progress".into());
        }

        let fps = fps.unwrap_or(10).clamp(1, 30);
        let dir = match output_dir {
            Some(d) => PathBuf::from(d),
            None => std::env::temp_dir().join("opensnag_recordings"),
        };
        std::fs::create_dir_all(&dir)
            .map_err(|e| format!("Failed to create output directory: {}", e))?;

        let timestamp = chrono::Local::now().format("%Y%m%d_%H%M%S");
        let frames_dir = dir.join(format!("frames_{}", timestamp));
        std::fs::create_dir_all(&frames_dir)
            .map_err(|e| format!("Failed to create frames directory: {}", e))?;

        let cancel = Arc::new(std::sync::atomic::AtomicBool::new(false));
        let cancel_clone = cancel.clone();
        let frames_dir_clone = frames_dir.clone();

        // Spawn a background thread that captures frames at the requested FPS.
        std::thread::spawn(move || {
            use xcap::Monitor;
            let monitors = match Monitor::all() {
                Ok(m) => m,
                Err(_) => return,
            };
            let monitor = match monitors.into_iter().next() {
                Some(m) => m,
                None => return,
            };
            let interval = std::time::Duration::from_millis(1000 / fps as u64);
            let mut frame_num: u64 = 0;

            while !cancel_clone.load(std::sync::atomic::Ordering::Relaxed) {
                if let Ok(img) = monitor.capture_image() {
                    // Crop to region if specified
                    let frame = if let Some(r) = &region {
                        let x = r.x.max(0) as u32;
                        let y = r.y.max(0) as u32;
                        let w = r.width.min(img.width().saturating_sub(x));
                        let h = r.height.min(img.height().saturating_sub(y));
                        image::DynamicImage::ImageRgba8(img).crop_imm(x, y, w, h)
                    } else {
                        image::DynamicImage::ImageRgba8(img)
                    };
                    let path = frames_dir_clone.join(format!("frame_{:08}.webp", frame_num));
                    let _ = frame.save(&path);
                    frame_num += 1;
                }
                std::thread::sleep(interval);
            }
        });

        inner.cancel_flag = Some(cancel);
        inner.frames_dir = Some(frames_dir.clone());
        inner.output_path = Some(frames_dir);
        inner.fps = fps;
        inner.region = region;
        inner.state = RecordingState::Recording;
        inner.started_at = Some(Instant::now());
        inner.accumulated_secs = 0.0;

        Ok(())
    }

    #[cfg(not(target_os = "macos"))]
    pub fn stop_recording(&self) -> Result<String, String> {
        let mut inner = self.inner.lock().map_err(|e| format!("Lock poisoned: {}", e))?;

        if inner.state == RecordingState::Idle {
            return Err("No recording in progress".into());
        }

        // Signal the capture thread to stop.
        if let Some(ref flag) = inner.cancel_flag {
            flag.store(true, std::sync::atomic::Ordering::Relaxed);
        }

        let output_path = inner
            .output_path
            .as_ref()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_default();

        // Reset state
        inner.cancel_flag = None;
        inner.frames_dir = None;
        inner.state = RecordingState::Idle;
        inner.started_at = None;
        inner.accumulated_secs = 0.0;

        Ok(output_path)
    }

    #[cfg(not(target_os = "macos"))]
    pub fn pause_recording(&self) -> Result<(), String> {
        let mut inner = self.inner.lock().map_err(|e| format!("Lock poisoned: {}", e))?;

        if inner.state != RecordingState::Recording {
            return Err("Not currently recording".into());
        }

        // Signal capture thread to stop temporarily.
        if let Some(ref flag) = inner.cancel_flag {
            flag.store(true, std::sync::atomic::Ordering::Relaxed);
        }

        if let Some(started) = inner.started_at.take() {
            inner.accumulated_secs += started.elapsed().as_secs_f64();
        }
        inner.state = RecordingState::Paused;
        Ok(())
    }

    #[cfg(not(target_os = "macos"))]
    pub fn resume_recording(&self) -> Result<(), String> {
        let mut inner = self.inner.lock().map_err(|e| format!("Lock poisoned: {}", e))?;

        if inner.state != RecordingState::Paused {
            return Err("Recording is not paused".into());
        }

        let fps = inner.fps;
        let region = inner.region;
        let cancel = Arc::new(std::sync::atomic::AtomicBool::new(false));
        let cancel_clone = cancel.clone();
        let frames_dir_clone = inner.frames_dir.clone().ok_or("No frames directory")?;

        // Count existing frames to continue numbering.
        let existing_count = std::fs::read_dir(&frames_dir_clone)
            .map(|rd| rd.count() as u64)
            .unwrap_or(0);

        std::thread::spawn(move || {
            use xcap::Monitor;
            let monitors = match Monitor::all() {
                Ok(m) => m,
                Err(_) => return,
            };
            let monitor = match monitors.into_iter().next() {
                Some(m) => m,
                None => return,
            };
            let interval = std::time::Duration::from_millis(1000 / fps as u64);
            let mut frame_num: u64 = existing_count;

            while !cancel_clone.load(std::sync::atomic::Ordering::Relaxed) {
                if let Ok(img) = monitor.capture_image() {
                    let frame = if let Some(r) = &region {
                        let x = r.x.max(0) as u32;
                        let y = r.y.max(0) as u32;
                        let w = r.width.min(img.width().saturating_sub(x));
                        let h = r.height.min(img.height().saturating_sub(y));
                        image::DynamicImage::ImageRgba8(img).crop_imm(x, y, w, h)
                    } else {
                        image::DynamicImage::ImageRgba8(img)
                    };
                    let path = frames_dir_clone.join(format!("frame_{:08}.webp", frame_num));
                    let _ = frame.save(&path);
                    frame_num += 1;
                }
                std::thread::sleep(interval);
            }
        });

        inner.cancel_flag = Some(cancel);
        inner.started_at = Some(Instant::now());
        inner.state = RecordingState::Recording;
        Ok(())
    }

    /// Force-stop any active recording. Does nothing if idle. Used during app shutdown.
    pub fn force_stop(&self) {
        let _ = self.stop_recording();
    }
}
