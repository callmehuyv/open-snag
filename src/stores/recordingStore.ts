import { create } from 'zustand';

type RecordingState = 'idle' | 'recording' | 'paused';

interface RecordingStoreState {
  recordingState: RecordingState;
  durationSecs: number;
  outputPath: string | null;
  setRecordingState: (state: RecordingState) => void;
  setDurationSecs: (secs: number) => void;
  setOutputPath: (path: string | null) => void;
  reset: () => void;
}

export const useRecordingStore = create<RecordingStoreState>((set) => ({
  recordingState: 'idle',
  durationSecs: 0,
  outputPath: null,
  setRecordingState: (state) => set({ recordingState: state }),
  setDurationSecs: (secs) => set({ durationSecs: secs }),
  setOutputPath: (path) => set({ outputPath: path }),
  reset: () => set({ recordingState: 'idle', durationSecs: 0, outputPath: null }),
}));
