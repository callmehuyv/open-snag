import { useCallback, useEffect, useRef } from 'react';
import { useRecordingStore } from '../stores/recordingStore';
import * as api from '../lib/tauri-api';

export function formatDuration(secs: number): string {
  const minutes = Math.floor(secs / 60);
  const seconds = secs % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function useRecording() {
  const {
    recordingState,
    durationSecs,
    outputPath,
    setRecordingState,
    setDurationSecs,
    setOutputPath,
    reset,
  } = useRecordingStore();

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startTimer = useCallback(() => {
    clearTimer();
    timerRef.current = setInterval(() => {
      setDurationSecs(useRecordingStore.getState().durationSecs + 1);
    }, 1000);
  }, [clearTimer, setDurationSecs]);

  const startRecording = useCallback(async (outputDir?: string, fps?: number) => {
    try {
      await api.startRecording(outputDir, fps);
      reset();
      setRecordingState('recording');
      startTimer();
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }, [reset, setRecordingState, startTimer]);

  const stopRecording = useCallback(async (): Promise<string> => {
    try {
      const path = await api.stopRecording();
      clearTimer();
      setOutputPath(path);
      setRecordingState('idle');
      return path;
    } catch (error) {
      console.error('Failed to stop recording:', error);
      clearTimer();
      setRecordingState('idle');
      throw error;
    }
  }, [clearTimer, setOutputPath, setRecordingState]);

  const pauseRecording = useCallback(async () => {
    try {
      await api.pauseRecording();
      clearTimer();
      setRecordingState('paused');
    } catch (error) {
      console.error('Failed to pause recording:', error);
      throw error;
    }
  }, [clearTimer, setRecordingState]);

  const resumeRecording = useCallback(async () => {
    try {
      await api.resumeRecording();
      setRecordingState('recording');
      startTimer();
    } catch (error) {
      console.error('Failed to resume recording:', error);
      throw error;
    }
  }, [setRecordingState, startTimer]);

  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, [clearTimer]);

  return {
    recordingState,
    durationSecs,
    outputPath,
    startRecording,
    stopRecording,
    pauseRecording,
    resumeRecording,
    formatDuration,
  };
}
