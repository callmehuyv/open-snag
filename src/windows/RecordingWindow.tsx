import { useState } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import RecordingControls from '../components/capture/RecordingControls';
import { Video } from 'lucide-react';
import '../App.css';

export default function RecordingWindow() {
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
          onClick={() => getCurrentWindow().close()}
          className="mt-4 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm transition-colors"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-zinc-900 text-zinc-100">
      <RecordingControls onStop={handleStop} />
      <p className="text-sm text-zinc-500 mt-4">Recording in progress...</p>
    </div>
  );
}
