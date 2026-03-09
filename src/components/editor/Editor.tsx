import { useCaptureStore } from '../../stores/captureStore';
import { useEditorStore, ToolType } from '../../stores/editorStore';
import * as api from '../../lib/tauri-api';
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

  const handleSave = async () => {
    if (!currentCapture) return;
    try {
      const path = await api.saveCapture(currentCapture);
      console.log('Saved to:', path);
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  const handleCopy = async () => {
    if (!currentCapture) return;
    try {
      await api.copyToClipboard(currentCapture);
    } catch (error) {
      console.error('Copy failed:', error);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-900 text-zinc-100">
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

      {/* Canvas area */}
      <div className="flex-1 overflow-auto flex items-center justify-center bg-zinc-950 p-4">
        {currentCapture ? (
          <img
            src={`data:image/png;base64,${currentCapture}`}
            alt="Captured screenshot"
            className="max-w-full max-h-full object-contain rounded shadow-lg"
          />
        ) : (
          <p className="text-zinc-500">No capture to display</p>
        )}
      </div>
    </div>
  );
}
