import { useCaptureStore } from '../../stores/captureStore';
import { ArrowLeft } from 'lucide-react';

export default function Settings() {
  const { setCurrentView } = useCaptureStore();

  return (
    <div className="flex flex-col h-screen bg-zinc-900 text-zinc-100">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-zinc-800 border-b border-zinc-700">
        <button
          onClick={() => setCurrentView('home')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>
        <h1 className="text-lg font-semibold">Settings</h1>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 space-y-8">
        {/* General */}
        <section>
          <h2 className="text-base font-semibold text-zinc-200 mb-3 pb-2 border-b border-zinc-700">
            General
          </h2>
          <div className="space-y-4 text-sm text-zinc-400">
            <div className="flex items-center justify-between">
              <span>Launch at startup</span>
              <div className="w-10 h-5 bg-zinc-700 rounded-full" />
            </div>
            <div className="flex items-center justify-between">
              <span>Show in system tray</span>
              <div className="w-10 h-5 bg-zinc-700 rounded-full" />
            </div>
            <div className="flex items-center justify-between">
              <span>Play capture sound</span>
              <div className="w-10 h-5 bg-zinc-700 rounded-full" />
            </div>
          </div>
        </section>

        {/* Hotkeys */}
        <section>
          <h2 className="text-base font-semibold text-zinc-200 mb-3 pb-2 border-b border-zinc-700">
            Hotkeys
          </h2>
          <div className="space-y-4 text-sm text-zinc-400">
            <div className="flex items-center justify-between">
              <span>Fullscreen capture</span>
              <kbd className="px-2 py-1 bg-zinc-800 rounded border border-zinc-600 text-xs text-zinc-300">
                Cmd+Shift+3
              </kbd>
            </div>
            <div className="flex items-center justify-between">
              <span>Region capture</span>
              <kbd className="px-2 py-1 bg-zinc-800 rounded border border-zinc-600 text-xs text-zinc-300">
                Cmd+Shift+4
              </kbd>
            </div>
            <div className="flex items-center justify-between">
              <span>Window capture</span>
              <kbd className="px-2 py-1 bg-zinc-800 rounded border border-zinc-600 text-xs text-zinc-300">
                Cmd+Shift+5
              </kbd>
            </div>
          </div>
        </section>

        {/* Output */}
        <section>
          <h2 className="text-base font-semibold text-zinc-200 mb-3 pb-2 border-b border-zinc-700">
            Output
          </h2>
          <div className="space-y-4 text-sm text-zinc-400">
            <div className="flex items-center justify-between">
              <span>Default format</span>
              <span className="text-zinc-300">PNG</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Save location</span>
              <span className="text-zinc-300">~/Pictures/OpenSnag</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Auto-copy to clipboard</span>
              <div className="w-10 h-5 bg-zinc-700 rounded-full" />
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
