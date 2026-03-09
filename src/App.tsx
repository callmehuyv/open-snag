import { useEffect } from 'react';
import { useCaptureStore } from './stores/captureStore';
import { useCapture } from './hooks/useCapture';
import Editor from './components/editor/Editor';
import Library from './components/library/Library';
import Settings from './components/settings/Settings';
import {
  Monitor,
  Square,
  AppWindow,
  FolderOpen,
  Settings as SettingsIcon,
  Camera,
} from 'lucide-react';
import './App.css';

function Home() {
  const { setCurrentView } = useCaptureStore();
  const { captureFullscreen } = useCapture();

  return (
    <div className="flex flex-col h-screen bg-zinc-900 text-zinc-100">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-zinc-800 border-b border-zinc-700">
        <div className="flex items-center gap-3">
          <Camera size={28} className="text-blue-400" />
          <div>
            <h1 className="text-xl font-bold tracking-tight">OpenSnag</h1>
            <p className="text-xs text-zinc-400">Screen capture tool</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentView('library')}
            title="Library"
            className="p-2 rounded text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
          >
            <FolderOpen size={20} />
          </button>
          <button
            onClick={() => setCurrentView('settings')}
            title="Settings"
            className="p-2 rounded text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
          >
            <SettingsIcon size={20} />
          </button>
        </div>
      </div>

      {/* Capture modes */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-zinc-200 mb-1">Choose capture mode</h2>
          <p className="text-sm text-zinc-500">Select how you want to capture your screen</p>
        </div>

        <div className="grid grid-cols-3 gap-4 w-full max-w-lg">
          {/* Fullscreen */}
          <button
            onClick={() => captureFullscreen(0)}
            className="flex flex-col items-center gap-3 p-6 rounded-xl bg-zinc-800 border border-zinc-700 hover:border-blue-500 hover:bg-zinc-750 transition-all group"
          >
            <Monitor size={32} className="text-zinc-400 group-hover:text-blue-400 transition-colors" />
            <div className="text-center">
              <p className="text-sm font-medium text-zinc-200">Fullscreen</p>
              <p className="text-xs text-zinc-500 mt-0.5">Cmd+Shift+3</p>
            </div>
          </button>

          {/* Region */}
          <button
            onClick={() => console.log('Region capture - requires overlay window')}
            className="flex flex-col items-center gap-3 p-6 rounded-xl bg-zinc-800 border border-zinc-700 hover:border-blue-500 hover:bg-zinc-750 transition-all group"
          >
            <Square size={32} className="text-zinc-400 group-hover:text-blue-400 transition-colors" />
            <div className="text-center">
              <p className="text-sm font-medium text-zinc-200">Region</p>
              <p className="text-xs text-zinc-500 mt-0.5">Cmd+Shift+4</p>
            </div>
          </button>

          {/* Window */}
          <button
            onClick={() => console.log('Window capture - requires window picker')}
            className="flex flex-col items-center gap-3 p-6 rounded-xl bg-zinc-800 border border-zinc-700 hover:border-blue-500 hover:bg-zinc-750 transition-all group"
          >
            <AppWindow size={32} className="text-zinc-400 group-hover:text-blue-400 transition-colors" />
            <div className="text-center">
              <p className="text-sm font-medium text-zinc-200">Window</p>
              <p className="text-xs text-zinc-500 mt-0.5">Cmd+Shift+5</p>
            </div>
          </button>
        </div>
      </div>

      {/* Recent Captures */}
      <div className="px-6 pb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-zinc-400">Recent Captures</h3>
          <button
            onClick={() => setCurrentView('library')}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            View all
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="aspect-video rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center"
            >
              <span className="text-xs text-zinc-600">Empty</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function App() {
  const { currentView } = useCaptureStore();

  useEffect(() => {
    // Listen for Tauri tray events in the future
    // const unlisten = listen('tray-capture', () => { ... });
    // return () => { unlisten.then(fn => fn()); };
  }, []);

  switch (currentView) {
    case 'editor':
      return <Editor />;
    case 'library':
      return <Library />;
    case 'settings':
      return <Settings />;
    default:
      return <Home />;
  }
}

export default App;
