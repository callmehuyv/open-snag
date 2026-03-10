import { useCallback } from 'react';
import { useCaptureStore } from '../stores/captureStore';
import * as api from '../lib/tauri-api';

export function useCapture() {
  const { setCaptureMode, setCurrentCapture, setIsCapturing, setCurrentView } = useCaptureStore();

  const captureFullscreen = useCallback(async (monitorIndex = 0) => {
    try {
      setIsCapturing(true);
      const result = await api.captureFullscreen(monitorIndex);
      setCurrentCapture(result.base64_image, result.width, result.height);
      setCurrentView('editor');
    } catch (error) {
      console.error('Fullscreen capture failed:', error);
    } finally {
      setIsCapturing(false);
    }
  }, [setIsCapturing, setCurrentCapture, setCurrentView]);

  const captureRegion = useCallback(async (x: number, y: number, width: number, height: number) => {
    try {
      setIsCapturing(true);
      const result = await api.captureRegion(x, y, width, height);
      setCurrentCapture(result.base64_image, result.width, result.height);
      setCurrentView('editor');
    } catch (error) {
      console.error('Region capture failed:', error);
    } finally {
      setIsCapturing(false);
    }
  }, [setIsCapturing, setCurrentCapture, setCurrentView]);

  const captureWindow = useCallback(async (windowId: number) => {
    try {
      setIsCapturing(true);
      const result = await api.captureWindow(windowId);
      setCurrentCapture(result.base64_image, result.width, result.height);
      setCurrentView('editor');
    } catch (error) {
      console.error('Window capture failed:', error);
    } finally {
      setIsCapturing(false);
    }
  }, [setIsCapturing, setCurrentCapture, setCurrentView]);

  return { captureFullscreen, captureRegion, captureWindow, setCaptureMode };
}
