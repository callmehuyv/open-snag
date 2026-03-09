import { useCaptureStore } from '../../stores/captureStore';
import { ArrowLeft, ImageOff } from 'lucide-react';

export default function Library() {
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
        <h1 className="text-lg font-semibold">Capture Library</h1>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="text-center text-zinc-500">
          <ImageOff size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-1">No captures yet</p>
          <p className="text-sm">Your screenshots will appear here after you capture them.</p>
        </div>
      </div>
    </div>
  );
}
