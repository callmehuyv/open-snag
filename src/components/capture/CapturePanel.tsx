import { useState } from 'react';
import { useCaptureStore } from '../../stores/captureStore';
import { useRecording } from '../../hooks/useRecording';
import { getCurrentWindow } from '@tauri-apps/api/window';
import * as api from '../../lib/tauri-api';
import ToggleSwitch from '../ui/ToggleSwitch';
import PermissionDialog from './PermissionDialog';
import {
  Crosshair,
  Camera,
  Video,
  Settings,
  PenLine,
} from 'lucide-react';

type TabMode = 'all-in-one' | 'image' | 'video';

const tabs: { mode: TabMode; label: string; icon: typeof Crosshair }[] = [
  { mode: 'all-in-one', label: 'All-in-One', icon: Crosshair },
  { mode: 'image', label: 'Image', icon: Camera },
  { mode: 'video', label: 'Video', icon: Video },
];

function SelectDropdown({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] text-gray-500 w-[58px] text-right shrink-0">{label}:</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-[11px] bg-white border border-gray-300 rounded px-2 py-1 text-gray-700 min-w-[110px] focus:outline-none focus:border-blue-400 cursor-pointer"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function ImageSettings() {
  const {
    selectionType,
    setSelectionType,
    effectsPreset,
    setEffectsPreset,
    shareDestination,
    setShareDestination,
    previewInEditor,
    setPreviewInEditor,
    copyToClipboard,
    setCopyToClipboard,
    captureCursor,
    setCaptureCursor,
    timeDelay,
    setTimeDelay,
  } = useCaptureStore();

  return (
    <div className="flex flex-1 gap-6 px-4 py-3">
      {/* Dropdowns column */}
      <div className="flex flex-col gap-2 justify-center">
        <SelectDropdown
          label="Selection"
          value={selectionType}
          options={[
            { value: 'region', label: 'Region' },
            { value: 'window', label: 'Window' },
            { value: 'fullscreen', label: 'Fullscreen' },
            { value: 'scrolling', label: 'Scrolling' },
          ]}
          onChange={(v) => setSelectionType(v as 'region' | 'window' | 'fullscreen' | 'scrolling')}
        />
        <SelectDropdown
          label="Effects"
          value={effectsPreset}
          options={[
            { value: 'none', label: 'None' },
            { value: 'border', label: 'Border' },
            { value: 'shadow', label: 'Shadow' },
            { value: 'perspective', label: 'Perspective' },
          ]}
          onChange={setEffectsPreset}
        />
        <SelectDropdown
          label="Share"
          value={shareDestination}
          options={[
            { value: 'none', label: 'None' },
            { value: 'clipboard', label: 'Clipboard' },
            { value: 'file', label: 'File' },
          ]}
          onChange={setShareDestination}
        />
      </div>

      {/* Toggles column */}
      <div className="flex flex-col gap-[6px] justify-center border-l border-gray-200 pl-5">
        <ToggleSwitch
          checked={previewInEditor}
          onChange={setPreviewInEditor}
          label="Preview in Editor"
        />
        <ToggleSwitch
          checked={copyToClipboard}
          onChange={setCopyToClipboard}
          label="Copy to Clipboard"
        />
        <ToggleSwitch
          checked={captureCursor}
          onChange={setCaptureCursor}
          label="Capture Cursor"
        />
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-gray-500 w-[32px]" />
          <span className="text-[11px] text-gray-600">
            Time Delay:{' '}
            <button
              onClick={() => setTimeDelay(timeDelay === 0 ? 3 : timeDelay === 3 ? 5 : 0)}
              className="text-blue-500 hover:text-blue-600"
            >
              {timeDelay === 0 ? 'Off' : `${timeDelay}s`}
            </button>
          </span>
        </div>
      </div>
    </div>
  );
}

function AllInOneSettings() {
  const {
    selectionType,
    setSelectionType,
    shareDestination,
    setShareDestination,
    previewInEditor,
    setPreviewInEditor,
    captureCursor,
    setCaptureCursor,
    recordMicrophone,
    setRecordMicrophone,
    recordSystemAudio,
    setRecordSystemAudio,
    recordWebcam,
    setRecordWebcam,
  } = useCaptureStore();

  return (
    <div className="flex flex-1 gap-6 px-4 py-3">
      <div className="flex flex-col gap-2 justify-center">
        <SelectDropdown
          label="Selection"
          value={selectionType}
          options={[
            { value: 'region', label: 'Region' },
            { value: 'window', label: 'Window' },
            { value: 'fullscreen', label: 'Fullscreen' },
          ]}
          onChange={(v) => setSelectionType(v as 'region' | 'window' | 'fullscreen')}
        />
        <SelectDropdown
          label="Share"
          value={shareDestination}
          options={[
            { value: 'none', label: 'None' },
            { value: 'clipboard', label: 'Clipboard' },
            { value: 'file', label: 'File' },
          ]}
          onChange={setShareDestination}
        />
        <ToggleSwitch
          checked={recordWebcam}
          onChange={setRecordWebcam}
          label="Record Webcam"
        />
      </div>

      <div className="flex flex-col gap-[6px] justify-center border-l border-gray-200 pl-5">
        <ToggleSwitch
          checked={previewInEditor}
          onChange={setPreviewInEditor}
          label="Preview in Editor"
        />
        <ToggleSwitch
          checked={captureCursor}
          onChange={setCaptureCursor}
          label="Capture Cursor"
        />
        <ToggleSwitch
          checked={recordMicrophone}
          onChange={setRecordMicrophone}
          label="Record Microphone"
        />
        <ToggleSwitch
          checked={recordSystemAudio}
          onChange={setRecordSystemAudio}
          label="Record System Audio"
        />
      </div>
    </div>
  );
}

function VideoSettings() {
  const {
    selectionType,
    setSelectionType,
    shareDestination,
    setShareDestination,
    captureCursor,
    setCaptureCursor,
    recordMicrophone,
    setRecordMicrophone,
    recordSystemAudio,
    setRecordSystemAudio,
    recordWebcam,
    setRecordWebcam,
  } = useCaptureStore();

  return (
    <div className="flex flex-1 gap-6 px-4 py-3">
      <div className="flex flex-col gap-2 justify-center">
        <SelectDropdown
          label="Selection"
          value={selectionType}
          options={[
            { value: 'region', label: 'Region' },
            { value: 'window', label: 'Window' },
            { value: 'fullscreen', label: 'Fullscreen' },
          ]}
          onChange={(v) => setSelectionType(v as 'region' | 'window' | 'fullscreen')}
        />
        <SelectDropdown
          label="Share"
          value={shareDestination}
          options={[
            { value: 'none', label: 'None' },
            { value: 'file', label: 'File' },
          ]}
          onChange={setShareDestination}
        />
        <ToggleSwitch
          checked={recordWebcam}
          onChange={setRecordWebcam}
          label="Record Webcam"
        />
      </div>

      <div className="flex flex-col gap-[6px] justify-center border-l border-gray-200 pl-5">
        <ToggleSwitch
          checked={captureCursor}
          onChange={setCaptureCursor}
          label="Capture Cursor"
        />
        <ToggleSwitch
          checked={recordMicrophone}
          onChange={setRecordMicrophone}
          label="Record Microphone"
        />
        <ToggleSwitch
          checked={recordSystemAudio}
          onChange={setRecordSystemAudio}
          label="Record System Audio"
        />
      </div>
    </div>
  );
}

export default function CapturePanel() {
  const {
    captureTabMode,
    setCaptureTabMode,
    setCurrentView,
  } = useCaptureStore();

  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const { startRecording } = useRecording();

  const doCapture = async () => {
    const win = getCurrentWindow();

    try {
      console.log('[OpenSnag] Step 1: Hiding window...');
      await win.hide();
      await new Promise((r) => setTimeout(r, 300));

      console.log('[OpenSnag] Step 2: Capturing fullscreen...');
      const result = await api.captureFullscreen(0);
      console.log('[OpenSnag] Step 3: Capture result:', result ? `${result.width}x${result.height}, data length: ${result.base64_image?.length}` : 'null');

      if (result && result.base64_image) {
        console.log('[OpenSnag] Step 4: Entering selection mode...');
        useCaptureStore.getState().enterSelectionMode(
          result.base64_image,
          result.width,
          result.height
        );
        console.log('[OpenSnag] Step 5: Going fullscreen...');
        await win.setDecorations(false);
        await win.setFullscreen(true);
        await win.setAlwaysOnTop(true);
        await win.show();
        console.log('[OpenSnag] Step 6: Window shown in fullscreen');
      } else {
        console.error('[OpenSnag] No capture result or empty image');
        await win.show();
      }
    } catch (error) {
      console.error('[OpenSnag] Capture failed:', error);
      await win.show();
    }
  };

  const handleCapture = async () => {
    console.log('[OpenSnag] handleCapture called, mode:', captureTabMode);

    if (captureTabMode === 'video') {
      try {
        await startRecording();
        setCurrentView('recording');
      } catch (error) {
        console.error('Failed to start recording:', error);
      }
      return;
    }

    // Check screen recording permission first
    try {
      console.log('[OpenSnag] Checking permission...');
      const hasPermission = await api.checkScreenPermission();
      console.log('[OpenSnag] Permission result:', hasPermission);
      if (!hasPermission) {
        setShowPermissionDialog(true);
        return;
      }
    } catch {
      // If check fails, try to capture anyway
    }

    await doCapture();
  };

  return (
    <div className="flex flex-col h-screen bg-white select-none" style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Main content area */}
      <div className="flex flex-1 min-h-0">
        {/* Left sidebar tabs */}
        <div className="w-[80px] bg-[#f0f0f0] border-r border-gray-200 flex flex-col">
          {tabs.map(({ mode, label, icon: Icon }) => {
            const isActive = captureTabMode === mode;
            return (
              <button
                key={mode}
                onClick={() => setCaptureTabMode(mode)}
                className={`flex flex-col items-center justify-center gap-1 py-3 px-1 text-center transition-colors relative ${
                  isActive
                    ? 'bg-white text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-[#e8e8e8]'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1 bottom-1 w-[3px] bg-blue-500 rounded-r" />
                )}
                <Icon size={18} strokeWidth={isActive ? 2 : 1.5} />
                <span className="text-[10px] font-medium leading-tight">{label}</span>
              </button>
            );
          })}
        </div>

        {/* Center settings area */}
        {captureTabMode === 'image' && <ImageSettings />}
        {captureTabMode === 'all-in-one' && <AllInOneSettings />}
        {captureTabMode === 'video' && <VideoSettings />}

        {/* Right capture button area */}
        <div className="w-[120px] flex flex-col items-center justify-center border-l border-gray-200 bg-[#fafafa]">
          <button
            onClick={handleCapture}
            className="w-[64px] h-[64px] rounded-full bg-gradient-to-b from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 active:from-red-600 active:to-red-700 shadow-lg hover:shadow-xl transition-all flex items-center justify-center group"
            title="Capture"
          >
            <div className="w-[58px] h-[58px] rounded-full border-[2px] border-red-400/50 flex items-center justify-center">
              <span className="text-white text-[10px] font-bold tracking-wide uppercase">
                {captureTabMode === 'video' ? 'Record' : 'Capture'}
              </span>
            </div>
          </button>
          <span className="text-[9px] text-gray-400 mt-2">Print Screen</span>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="flex items-center justify-between px-4 py-[6px] border-t border-gray-200 bg-[#fafafa]">
        <button className="flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-gray-700 transition-colors">
          <Settings size={12} />
          <span>Presets</span>
        </button>
        <button
          onClick={() => setCurrentView('editor')}
          className="flex items-center gap-1.5 text-[11px] text-gray-500 hover:text-gray-700 transition-colors"
        >
          <PenLine size={12} />
          <span>Open Editor</span>
        </button>
      </div>

      {/* Permission dialog */}
      {showPermissionDialog && (
        <PermissionDialog
          onGranted={() => {
            setShowPermissionDialog(false);
            doCapture();
          }}
          onCancel={() => setShowPermissionDialog(false)}
        />
      )}
    </div>
  );
}
