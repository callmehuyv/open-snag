import { invoke } from '@tauri-apps/api/core';

export interface CaptureResult {
  image_data: string; // base64 PNG
  width: number;
  height: number;
}

export interface MonitorInfo {
  id: number;
  name: string;
  width: number;
  height: number;
  is_primary: boolean;
}

export interface WindowInfo {
  id: number;
  title: string;
  app_name: string;
  width: number;
  height: number;
}

export interface CaptureRecord {
  id: string;
  filename: string;
  filepath: string;
  capture_type: string;
  width: number;
  height: number;
  file_size: number;
  created_at: string;
  tags: string;
  thumbnail_path: string;
}

export async function captureFullscreen(monitorIndex: number = 0): Promise<CaptureResult> {
  return invoke('capture_fullscreen', { monitorIndex });
}

export async function captureRegion(x: number, y: number, width: number, height: number): Promise<CaptureResult> {
  return invoke('capture_region', { x, y, width, height });
}

export async function listMonitors(): Promise<MonitorInfo[]> {
  return invoke('list_monitors');
}

export async function listWindows(): Promise<WindowInfo[]> {
  return invoke('list_windows');
}

export async function captureWindow(windowId: number): Promise<CaptureResult> {
  return invoke('capture_window', { windowId });
}

export async function saveCapture(imageData: string, filename?: string): Promise<string> {
  return invoke('save_capture', { imageData, filename });
}

export async function getCaptures(): Promise<CaptureRecord[]> {
  return invoke('get_captures');
}

export async function deleteCapture(id: string): Promise<void> {
  return invoke('delete_capture', { id });
}

export async function copyToClipboard(imageData: string): Promise<void> {
  return invoke('copy_to_clipboard', { imageData });
}
