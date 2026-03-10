import { useRef, useEffect, useCallback } from 'react';
import { useCaptureStore } from '../../stores/captureStore';
import { useEditorStore, ToolType } from '../../stores/editorStore';
import * as api from '../../lib/tauri-api';
import AnnotationCanvas, { CanvasHandle } from './Canvas';
import PropertyPanel from './PropertyPanel';
import {
  MousePointer,
  MoveRight,
  Type,
  Square,
  Circle,
  Minus,
  Pencil,
  Highlighter,
  EyeOff,
  Hash,
  ArrowLeft,
  Save,
  Copy,
  Undo2,
  Redo2,
} from 'lucide-react';

const tools: { type: ToolType; icon: React.ReactNode; label: string }[] = [
  { type: 'select', icon: <MousePointer size={18} />, label: 'Select' },
  { type: 'arrow', icon: <MoveRight size={18} />, label: 'Arrow' },
  { type: 'text', icon: <Type size={18} />, label: 'Text' },
  { type: 'rectangle', icon: <Square size={18} />, label: 'Rectangle' },
  { type: 'ellipse', icon: <Circle size={18} />, label: 'Ellipse' },
  { type: 'line', icon: <Minus size={18} />, label: 'Line' },
  { type: 'freehand', icon: <Pencil size={18} />, label: 'Freehand' },
  { type: 'highlight', icon: <Highlighter size={18} />, label: 'Highlight' },
  { type: 'blur', icon: <EyeOff size={18} />, label: 'Blur' },
  { type: 'step-number', icon: <Hash size={18} />, label: 'Step' },
];

export default function Editor() {
  const { currentCapture, setCurrentView } = useCaptureStore();
  const { activeTool, setActiveTool } = useEditorStore();
  const canvasRef = useRef<CanvasHandle>(null);

  const handleSave = useCallback(async () => {
    if (!canvasRef.current) return;
    try {
      const imageData = await canvasRef.current.exportImage();
      if (imageData) {
        const path = await api.saveCapture(imageData);
        console.log('Saved to:', path);
      }
    } catch (error) {
      console.error('Save failed:', error);
    }
  }, []);

  const handleCopy = useCallback(async () => {
    if (!canvasRef.current) return;
    try {
      const imageData = await canvasRef.current.exportImage();
      if (imageData) {
        await api.copyToClipboard(imageData);
      }
    } catch (error) {
      console.error('Copy failed:', error);
    }
  }, []);

  const handleUndo = useCallback(() => {
    canvasRef.current?.undo();
  }, []);

  const handleRedo = useCallback(() => {
    canvasRef.current?.redo();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey;

      if (isMod && e.shiftKey && e.key === 'z') {
        e.preventDefault();
        handleRedo();
      } else if (isMod && e.key === 'z') {
        e.preventDefault();
        handleUndo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        // Only delete if not editing text
        const activeEl = document.activeElement;
        const isInput = activeEl instanceof HTMLInputElement || activeEl instanceof HTMLTextAreaElement;
        if (!isInput) {
          canvasRef.current?.deleteSelected();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  return (
    <div className="flex flex-col h-screen bg-zinc-900 text-zinc-100">
      {/* Draggable title bar */}
      <div
        data-tauri-drag-region
        className="flex items-center justify-between px-4 py-1.5 bg-zinc-900 border-b border-zinc-800 cursor-default select-none"
      >
        <span data-tauri-drag-region className="text-[11px] text-zinc-500 font-medium">OpenSnag Editor</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentView('home')}
            className="w-3 h-3 rounded-full bg-red-500 hover:bg-red-400 transition-colors"
            title="Close"
          />
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-1 px-3 py-2 bg-zinc-800 border-b border-zinc-700">
        <button
          onClick={() => setCurrentView('home')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <div className="w-px h-6 bg-zinc-700 mx-1" />

        {/* Undo/Redo */}
        <button
          onClick={handleUndo}
          title="Undo (Ctrl+Z)"
          className="p-2 rounded text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
        >
          <Undo2 size={18} />
        </button>
        <button
          onClick={handleRedo}
          title="Redo (Ctrl+Shift+Z)"
          className="p-2 rounded text-zinc-400 hover:bg-zinc-700 hover:text-white transition-colors"
        >
          <Redo2 size={18} />
        </button>

        <div className="w-px h-6 bg-zinc-700 mx-1" />

        {/* Drawing tools */}
        <div className="flex items-center gap-0.5">
          {tools.map((tool) => (
            <button
              key={tool.type}
              onClick={() => setActiveTool(tool.type)}
              title={tool.label}
              className={`p-2 rounded transition-colors ${
                activeTool === tool.type
                  ? 'bg-blue-600 text-white'
                  : 'text-zinc-400 hover:bg-zinc-700 hover:text-white'
              }`}
            >
              {tool.icon}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Action buttons */}
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
        >
          <Copy size={16} />
          Copy
        </button>
        <button
          onClick={handleSave}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-500 transition-colors"
        >
          <Save size={16} />
          Save
        </button>
      </div>

      {/* Canvas + Property Panel */}
      <div className="flex flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto flex items-center justify-center bg-zinc-950 p-4">
          {currentCapture ? (
            <AnnotationCanvas ref={canvasRef} />
          ) : (
            <p className="text-zinc-500">No capture to display</p>
          )}
        </div>
        <PropertyPanel />
      </div>
    </div>
  );
}
