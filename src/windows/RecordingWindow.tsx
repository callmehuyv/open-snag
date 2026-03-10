import { useState, useEffect, useRef, useCallback } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Pause, Play, Square, Video } from 'lucide-react';
import * as api from '../lib/tauri-api';
import '../App.css';

function formatDuration(secs: number): string {
  const minutes = Math.floor(secs / 60);
  const seconds = secs % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export default function RecordingWindow() {
  const [state, setState] = useState<'recording' | 'paused' | 'stopped'>('recording');
  const [durationSecs, setDurationSecs] = useState(0);
  const [completedPath, setCompletedPath] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start timer on mount (recording is already in progress from main window)
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setDurationSecs((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleStop = useCallback(async () => {
    try {
      if (timerRef.current) clearInterval(timerRef.current);
      const path = await api.stopRecording();
      setState('stopped');
      setCompletedPath(path);
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  }, []);

  const handleTogglePause = useCallback(async () => {
    try {
      if (state === 'paused') {
        await api.resumeRecording();
        setState('recording');
        timerRef.current = setInterval(() => {
          setDurationSecs((prev) => prev + 1);
        }, 1000);
      } else {
        await api.pauseRecording();
        setState('paused');
        if (timerRef.current) clearInterval(timerRef.current);
      }
    } catch (error) {
      console.error('Failed to toggle pause:', error);
    }
  }, [state]);

  if (completedPath) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-zinc-900 text-zinc-100 gap-3 px-4">
        <Video size={20} className="text-green-400" />
        <h2 className="text-sm font-semibold">Recording saved</h2>
        <p className="text-[11px] text-zinc-400 text-center break-all max-w-[280px]">{completedPath}</p>
        <button
          onClick={() => getCurrentWindow().close()}
          className="mt-2 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs transition-colors"
        >
          Close
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen bg-zinc-900 text-zinc-100">
      <div className="flex items-center gap-3 px-4 py-2">
        {/* Recording indicator */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-block w-2.5 h-2.5 rounded-full ${
              state === 'paused'
                ? 'bg-yellow-500'
                : 'bg-red-500 animate-pulse'
            }`}
          />
          <span className="text-sm font-mono text-zinc-200 min-w-[3.5rem] text-center">
            {formatDuration(durationSecs)}
          </span>
        </div>

        <div className="w-px h-5 bg-zinc-700" />

        {/* Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleTogglePause}
            title={state === 'paused' ? 'Resume' : 'Pause'}
            className="p-1.5 rounded-lg text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
          >
            {state === 'paused' ? <Play size={16} /> : <Pause size={16} />}
          </button>
          <button
            onClick={handleStop}
            title="Stop recording"
            className="p-1.5 rounded-lg text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors"
          >
            <Square size={16} fill="currentColor" />
          </button>
        </div>
      </div>
    </div>
  );
}
