import { Pause, Play, Square } from 'lucide-react';
import { useRecording, formatDuration } from '../../hooks/useRecording';

interface RecordingControlsProps {
  onStop: (outputPath: string) => void;
}

export default function RecordingControls({ onStop }: RecordingControlsProps) {
  const {
    recordingState,
    durationSecs,
    stopRecording,
    pauseRecording,
    resumeRecording,
  } = useRecording();

  const handleStop = async () => {
    try {
      const path = await stopRecording();
      onStop(path);
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  };

  const handleTogglePause = async () => {
    try {
      if (recordingState === 'paused') {
        await resumeRecording();
      } else {
        await pauseRecording();
      }
    } catch (error) {
      console.error('Failed to toggle pause:', error);
    }
  };

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-3 px-4 py-2 rounded-full bg-zinc-900/90 border border-zinc-700 shadow-lg backdrop-blur-sm">
        {/* Recording indicator */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-block w-2.5 h-2.5 rounded-full ${
              recordingState === 'paused'
                ? 'bg-yellow-500'
                : 'bg-red-500 animate-pulse'
            }`}
          />
          <span className="text-sm font-mono text-zinc-200 min-w-[3.5rem] text-center">
            {formatDuration(durationSecs)}
          </span>
        </div>

        {/* Divider */}
        <div className="w-px h-5 bg-zinc-700" />

        {/* Controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={handleTogglePause}
            title={recordingState === 'paused' ? 'Resume' : 'Pause'}
            className="p-1.5 rounded-lg text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
          >
            {recordingState === 'paused' ? <Play size={16} /> : <Pause size={16} />}
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
