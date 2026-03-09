import { create } from 'zustand';

type CaptureMode = 'fullscreen' | 'region' | 'window';
type AppView = 'home' | 'editor' | 'library' | 'settings' | 'recording';

interface CaptureState {
  captureMode: CaptureMode;
  currentCapture: string | null; // base64 image data
  captureWidth: number;
  captureHeight: number;
  isCapturing: boolean;
  currentView: AppView;
  setCaptureMode: (mode: CaptureMode) => void;
  setCurrentCapture: (data: string | null, width?: number, height?: number) => void;
  setIsCapturing: (capturing: boolean) => void;
  setCurrentView: (view: AppView) => void;
  clearCapture: () => void;
}

export const useCaptureStore = create<CaptureState>((set) => ({
  captureMode: 'fullscreen',
  currentCapture: null,
  captureWidth: 0,
  captureHeight: 0,
  isCapturing: false,
  currentView: 'home',
  setCaptureMode: (mode) => set({ captureMode: mode }),
  setCurrentCapture: (data, width = 0, height = 0) =>
    set({ currentCapture: data, captureWidth: width, captureHeight: height }),
  setIsCapturing: (capturing) => set({ isCapturing: capturing }),
  setCurrentView: (view) => set({ currentView: view }),
  clearCapture: () => set({ currentCapture: null, captureWidth: 0, captureHeight: 0 }),
}));
