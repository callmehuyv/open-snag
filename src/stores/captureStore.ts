import { create } from 'zustand';

type CaptureMode = 'fullscreen' | 'region' | 'window';
type CaptureTabMode = 'all-in-one' | 'image' | 'video';
type SelectionType = 'region' | 'window' | 'fullscreen' | 'scrolling';
type AppView = 'home' | 'editor' | 'library' | 'settings' | 'recording';

interface CaptureState {
  captureMode: CaptureMode;
  captureTabMode: CaptureTabMode;
  selectionType: SelectionType;
  currentCapture: string | null;
  captureWidth: number;
  captureHeight: number;
  isCapturing: boolean;
  currentView: AppView;

  // Region selection mode
  isSelectingRegion: boolean;
  screenshotForSelection: string | null;
  screenshotWidth: number;
  screenshotHeight: number;

  // Image toggles
  previewInEditor: boolean;
  copyToClipboard: boolean;
  captureCursor: boolean;
  timeDelay: number;

  // Video toggles
  recordMicrophone: boolean;
  recordSystemAudio: boolean;
  recordWebcam: boolean;

  // Effects & Share
  effectsPreset: string;
  shareDestination: string;

  // Actions
  setCaptureMode: (mode: CaptureMode) => void;
  setCaptureTabMode: (mode: CaptureTabMode) => void;
  setSelectionType: (type: SelectionType) => void;
  setCurrentCapture: (data: string | null, width?: number, height?: number) => void;
  setIsCapturing: (capturing: boolean) => void;
  setCurrentView: (view: AppView) => void;
  clearCapture: () => void;

  enterSelectionMode: (screenshot: string, width: number, height: number) => void;
  exitSelectionMode: () => void;

  setPreviewInEditor: (value: boolean) => void;
  setCopyToClipboard: (value: boolean) => void;
  setCaptureCursor: (value: boolean) => void;
  setTimeDelay: (value: number) => void;

  setRecordMicrophone: (value: boolean) => void;
  setRecordSystemAudio: (value: boolean) => void;
  setRecordWebcam: (value: boolean) => void;

  setEffectsPreset: (value: string) => void;
  setShareDestination: (value: string) => void;
}

export const useCaptureStore = create<CaptureState>((set) => ({
  captureMode: 'fullscreen',
  captureTabMode: 'image',
  selectionType: 'region',
  currentCapture: null,
  captureWidth: 0,
  captureHeight: 0,
  isCapturing: false,
  currentView: 'home',

  isSelectingRegion: false,
  screenshotForSelection: null,
  screenshotWidth: 0,
  screenshotHeight: 0,

  previewInEditor: true,
  copyToClipboard: false,
  captureCursor: false,
  timeDelay: 0,

  recordMicrophone: false,
  recordSystemAudio: false,
  recordWebcam: false,

  effectsPreset: 'none',
  shareDestination: 'none',

  setCaptureMode: (mode) => set({ captureMode: mode }),
  setCaptureTabMode: (mode) => set({ captureTabMode: mode }),
  setSelectionType: (type) => set({ selectionType: type }),
  setCurrentCapture: (data, width = 0, height = 0) =>
    set({ currentCapture: data, captureWidth: width, captureHeight: height }),
  setIsCapturing: (capturing) => set({ isCapturing: capturing }),
  setCurrentView: (view) => set({ currentView: view }),
  clearCapture: () => set({ currentCapture: null, captureWidth: 0, captureHeight: 0 }),

  enterSelectionMode: (screenshot, width, height) =>
    set({
      isSelectingRegion: true,
      screenshotForSelection: screenshot,
      screenshotWidth: width,
      screenshotHeight: height,
    }),
  exitSelectionMode: () =>
    set({
      isSelectingRegion: false,
      screenshotForSelection: null,
      screenshotWidth: 0,
      screenshotHeight: 0,
    }),

  setPreviewInEditor: (value) => set({ previewInEditor: value }),
  setCopyToClipboard: (value) => set({ copyToClipboard: value }),
  setCaptureCursor: (value) => set({ captureCursor: value }),
  setTimeDelay: (value) => set({ timeDelay: value }),

  setRecordMicrophone: (value) => set({ recordMicrophone: value }),
  setRecordSystemAudio: (value) => set({ recordSystemAudio: value }),
  setRecordWebcam: (value) => set({ recordWebcam: value }),

  setEffectsPreset: (value) => set({ effectsPreset: value }),
  setShareDestination: (value) => set({ shareDestination: value }),
}));
