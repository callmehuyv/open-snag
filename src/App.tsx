import { useEffect, useCallback, useState, useRef } from 'react';
import { useCaptureStore } from './stores/captureStore';
import { useRecording } from './hooks/useRecording';
import { listen } from '@tauri-apps/api/event';
import { getCurrentWindow, LogicalSize } from '@tauri-apps/api/window';
import Editor from './components/editor/Editor';
import Library from './components/library/Library';
import Settings from './components/settings/Settings';
import RecordingControls from './components/capture/RecordingControls';
import CapturePanel from './components/capture/CapturePanel';
import RegionSelector from './components/capture/RegionSelector';
import { cropBase64Image } from './lib/image-utils';
import * as api from './lib/tauri-api';
import { Video } from 'lucide-react';
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

function RecordingView() {
  const { setCurrentView } = useCaptureStore();
  const [completedPath, setCompletedPath] = useState<string | null>(null);

  const handleStop = (outputPath: string) => {
    setCompletedPath(outputPath);
  };

  if (completedPath) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-zinc-900 text-zinc-100 gap-4 px-6">
        <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
          <Video size={24} className="text-green-400" />
        </div>
        <h2 className="text-lg font-semibold">Recording saved</h2>
        <p className="text-sm text-zinc-400 text-center break-all max-w-md">{completedPath}</p>
        <button
          onClick={() => setCurrentView('home')}
          className="mt-4 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm transition-colors"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-zinc-900 text-zinc-100">
      <RecordingControls onStop={handleStop} />
      <p className="text-sm text-zinc-500">Recording in progress...</p>
    </div>
  );
}

function App() {
  const { currentView, isSelectingRegion, screenshotForSelection, screenshotWidth, screenshotHeight } = useCaptureStore();
  const { startRecording } = useRecording();
  const startRecordingRef = useRef(startRecording);
  startRecordingRef.current = startRecording;

  // Resize window when switching views
  useEffect(() => {
    if (isSelectingRegion) return; // Don't resize when in selection mode
    if (currentView === 'home') {
      resizeWindow(PANEL_SIZE.width, PANEL_SIZE.height, false, true, true);
    } else if (currentView === 'editor' || currentView === 'library') {
      resizeWindow(EDITOR_SIZE.width, EDITOR_SIZE.height, true, false, false);
    }
  }, [currentView, isSelectingRegion]);

  // Fullscreen for region selection is handled in CapturePanel.tsx

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
        // Start recording with the selected region
        try {
          await startRecordingRef.current(undefined, undefined, {
            regionX: Math.round(x),
            regionY: Math.round(y),
            regionWidth: Math.round(width),
            regionHeight: Math.round(height),
          });
          store.setCurrentView('recording');
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
          store.setCurrentCapture(cropped, width, height);
          store.setCurrentView('editor');
        } else {
          await api.saveCapture(cropped);
          // Restore panel size
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
    case 'editor':
      return <Editor />;
    case 'library':
      return <Library />;
    case 'settings':
      return <Settings />;
    case 'recording':
      return <RecordingView />;
    default:
      return <CapturePanel />;
  }
}

export default App;
