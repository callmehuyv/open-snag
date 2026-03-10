import { useEffect, useCallback, useRef } from 'react';
import { useCaptureStore } from './stores/captureStore';
import { useRecording } from './hooks/useRecording';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWindow, LogicalSize } from '@tauri-apps/api/window';
import Library from './components/library/Library';
import Settings from './components/settings/Settings';
import CapturePanel from './components/capture/CapturePanel';
import RegionSelector from './components/capture/RegionSelector';
import { cropBase64Image } from './lib/image-utils';
import { openEditorWindow, openRecordingWindow } from './lib/window-utils';
import * as api from './lib/tauri-api';
import './App.css';

const PANEL_SIZE = { width: 720, height: 240 };
const EDITOR_SIZE = { width: 1200, height: 800 };

async function resizeWindow(width: number, height: number, resizable: boolean, alwaysOnTop: boolean, decorations = true) {
  const win = getCurrentWindow();
  await win.setFullscreen(false);
  await win.setDecorations(decorations);
  await win.setAlwaysOnTop(alwaysOnTop);
  await win.setResizable(resizable);
  await win.setSize(new LogicalSize(width, height));
  await win.center();
}

function App() {
  const { currentView, isSelectingRegion, screenshotForSelection, screenshotWidth, screenshotHeight } = useCaptureStore();
  const { startRecording } = useRecording();
  const startRecordingRef = useRef(startRecording);
  startRecordingRef.current = startRecording;

  // Resize window when switching views
  useEffect(() => {
    if (isSelectingRegion) return;
    if (currentView === 'home') {
      resizeWindow(PANEL_SIZE.width, PANEL_SIZE.height, false, true, true);
    } else if (currentView === 'library') {
      resizeWindow(EDITOR_SIZE.width, EDITOR_SIZE.height, true, false, true);
    }
  }, [currentView, isSelectingRegion]);

  // When currentView changes to 'editor', open a separate editor window and reset to home
  useEffect(() => {
    if (currentView === 'editor') {
      const store = useCaptureStore.getState();
      const capture = store.currentCapture;
      if (capture) {
        openEditorWindow(capture, store.captureWidth, store.captureHeight);
      }
      // Reset main window back to home
      store.setCurrentView('home');
    } else if (currentView === 'recording') {
      openRecordingWindow();
      // Reset main window back to home
      useCaptureStore.getState().setCurrentView('home');
    }
  }, [currentView]);

  const handleSelectionConfirm = useCallback(
    async (x: number, y: number, width: number, height: number) => {
      const store = useCaptureStore.getState();
      const screenshot = store.screenshotForSelection;
      const isForVideo = store.isSelectingForVideo;
      if (!screenshot) return;

      // Exit selection mode first
      store.exitSelectionMode();

      // Restore window from fullscreen
      const win = getCurrentWindow();
      await win.setFullscreen(false);
      await win.setDecorations(true);

      if (isForVideo) {
        // Start recording with the selected region, open recording window
        try {
          await startRecordingRef.current(undefined, undefined, {
            regionX: Math.round(x),
            regionY: Math.round(y),
            regionWidth: Math.round(width),
            regionHeight: Math.round(height),
          });
          await openRecordingWindow();
          await resizeWindow(PANEL_SIZE.width, PANEL_SIZE.height, false, true);
        } catch (error) {
          console.error('Failed to start region recording:', error);
          await resizeWindow(PANEL_SIZE.width, PANEL_SIZE.height, false, true);
        }
        return;
      }

      // Screenshot flow
      try {
        const cropped = await cropBase64Image(
          screenshot,
          x,
          y,
          width,
          height,
          store.screenshotWidth,
          store.screenshotHeight
        );

        // Copy to clipboard if enabled
        if (store.copyToClipboard) {
          await api.copyToClipboard(cropped).catch(console.error);
        }

        // Show in editor if enabled, otherwise save directly
        if (store.previewInEditor) {
          await openEditorWindow(cropped, width, height);
          await resizeWindow(PANEL_SIZE.width, PANEL_SIZE.height, false, true);
        } else {
          await api.saveCapture(cropped);
          await resizeWindow(PANEL_SIZE.width, PANEL_SIZE.height, false, true);
        }
      } catch (error) {
        console.error('Crop failed:', error);
        await resizeWindow(PANEL_SIZE.width, PANEL_SIZE.height, false, true);
      }
    },
    []
  );

  const handleSelectionCancel = useCallback(async () => {
    useCaptureStore.getState().exitSelectionMode();
    const win = getCurrentWindow();
    await win.setFullscreen(false);
    await win.setDecorations(true);
    await resizeWindow(PANEL_SIZE.width, PANEL_SIZE.height, false, true);
  }, []);

  useEffect(() => {
    const unlisten = listen('tray-open-library', () => {
      useCaptureStore.getState().setCurrentView('library');
    });
    return () => {
      unlisten.then((fn) => fn());
    };
  }, []);

  // Region selection overlay takes over the entire screen
  if (isSelectingRegion && screenshotForSelection) {
    return (
      <RegionSelector
        screenshotData={screenshotForSelection}
        screenshotWidth={screenshotWidth}
        screenshotHeight={screenshotHeight}
        onConfirm={handleSelectionConfirm}
        onCancel={handleSelectionCancel}
      />
    );
  }

  switch (currentView) {
    case 'library':
      return <Library />;
    case 'settings':
      return <Settings />;
    default:
      return <CapturePanel />;
  }
}

export default App;
