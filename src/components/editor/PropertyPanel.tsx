import { useEditorStore, ToolType } from '../../stores/editorStore';
import { Bold, Italic, PanelRightClose, PanelRightOpen } from 'lucide-react';
import ColorPicker from './ColorPicker';

const FONT_FAMILIES = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Courier New',
  'Georgia',
  'Verdana',
];

function shouldShowStrokeColor(tool: ToolType): boolean {
  return ['arrow', 'line', 'text', 'rectangle', 'ellipse', 'freehand', 'step-number'].includes(tool);
}

function shouldShowStrokeWidth(tool: ToolType): boolean {
  return ['arrow', 'line', 'rectangle', 'ellipse', 'freehand'].includes(tool);
}

function shouldShowFill(tool: ToolType): boolean {
  return ['rectangle', 'ellipse'].includes(tool);
}

function shouldShowText(tool: ToolType): boolean {
  return ['text'].includes(tool);
}

function shouldShowFontSize(tool: ToolType): boolean {
  return ['text', 'step-number'].includes(tool);
}

function shouldShowOpacity(tool: ToolType): boolean {
  return ['highlight'].includes(tool);
}

export default function PropertyPanel() {
  const {
    activeTool,
    strokeColor,
    fillColor,
    strokeWidth,
    fontSize,
    fontFamily,
    opacity,
    isBold,
    isItalic,
    showPropertyPanel,
    setStrokeColor,
    setFillColor,
    setStrokeWidth,
    setFontSize,
    setFontFamily,
    setOpacity,
    setIsBold,
    setIsItalic,
    togglePropertyPanel,
  } = useEditorStore();

  if (!showPropertyPanel) {
    return (
      <button
        onClick={togglePropertyPanel}
        className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 bg-zinc-800 border border-zinc-700 rounded-l text-zinc-400 hover:text-white transition-colors"
        title="Open properties"
      >
        <PanelRightOpen size={16} />
      </button>
    );
  }

  const isSelect = activeTool === 'select';
  const isBlur = activeTool === 'blur';
  const showStrokeColor = shouldShowStrokeColor(activeTool);
  const showStrokeWidth = shouldShowStrokeWidth(activeTool);
  const showFill = shouldShowFill(activeTool);
  const showText = shouldShowText(activeTool);
  const showFontSize = shouldShowFontSize(activeTool);
  const showOpacity = shouldShowOpacity(activeTool);

  const hasFillEnabled = fillColor !== 'transparent';

  return (
    <div className="w-60 h-full bg-zinc-800 border-l border-zinc-700 flex flex-col overflow-y-auto shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-700">
        <span className="text-xs font-medium text-zinc-300 uppercase tracking-wide">
          Properties
        </span>
        <button
          onClick={togglePropertyPanel}
          className="p-1 text-zinc-400 hover:text-white transition-colors rounded"
          title="Close properties"
        >
          <PanelRightClose size={14} />
        </button>
      </div>

      <div className="p-3 flex flex-col gap-4">
        {/* Tool label */}
        <div className="text-sm text-zinc-300 font-medium capitalize">
          {activeTool === 'step-number' ? 'Step Number' : activeTool}
        </div>

        {/* Select tool: no properties */}
        {isSelect && (
          <p className="text-xs text-zinc-500">
            Selection tool active. Click an annotation to edit it.
          </p>
        )}

        {/* Blur tool: fixed settings */}
        {isBlur && (
          <p className="text-xs text-zinc-500">
            Blur uses fixed settings. Draw over the area to blur.
          </p>
        )}

        {/* Stroke color */}
        {showStrokeColor && (
          <ColorPicker
            value={strokeColor}
            onChange={setStrokeColor}
            label={activeTool === 'text' ? 'Text Color' : activeTool === 'step-number' ? 'Circle Color' : 'Stroke Color'}
          />
        )}

        {/* Stroke width */}
        {showStrokeWidth && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">Stroke Width</span>
              <span className="text-xs text-zinc-500 tabular-nums">{strokeWidth}px</span>
            </div>
            <input
              type="range"
              min={1}
              max={20}
              step={1}
              value={strokeWidth}
              onChange={(e) => setStrokeWidth(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        )}

        {/* Fill color (shapes) */}
        {showFill && (
          <div className="flex flex-col gap-1.5">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hasFillEnabled}
                onChange={(e) =>
                  setFillColor(e.target.checked ? '#ff0000' : 'transparent')
                }
                className="w-3.5 h-3.5 rounded bg-zinc-700 border-zinc-600 text-blue-500 focus:ring-0 focus:ring-offset-0 accent-blue-500"
              />
              <span className="text-xs text-zinc-400">Fill</span>
            </label>
            {hasFillEnabled && (
              <ColorPicker
                value={fillColor}
                onChange={setFillColor}
                label="Fill Color"
              />
            )}
          </div>
        )}

        {/* Font size */}
        {showFontSize && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">Font Size</span>
              <span className="text-xs text-zinc-500 tabular-nums">{fontSize}px</span>
            </div>
            <input
              type="range"
              min={8}
              max={72}
              step={1}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        )}

        {/* Font family */}
        {showText && (
          <>
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-zinc-400">Font Family</span>
              <select
                value={fontFamily}
                onChange={(e) => setFontFamily(e.target.value)}
                className="w-full px-2 py-1 text-xs bg-zinc-700 border border-zinc-600 rounded text-zinc-200 focus:outline-none focus:border-blue-500"
              >
                {FONT_FAMILIES.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            {/* Bold / Italic */}
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-zinc-400">Style</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setIsBold(!isBold)}
                  className={`flex items-center justify-center w-8 h-8 rounded border transition-colors ${
                    isBold
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-zinc-700 border-zinc-600 text-zinc-400 hover:text-white'
                  }`}
                  title="Bold"
                >
                  <Bold size={14} />
                </button>
                <button
                  onClick={() => setIsItalic(!isItalic)}
                  className={`flex items-center justify-center w-8 h-8 rounded border transition-colors ${
                    isItalic
                      ? 'bg-blue-600 border-blue-500 text-white'
                      : 'bg-zinc-700 border-zinc-600 text-zinc-400 hover:text-white'
                  }`}
                  title="Italic"
                >
                  <Italic size={14} />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Opacity (highlight) */}
        {showOpacity && (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-400">Opacity</span>
              <span className="text-xs text-zinc-500 tabular-nums">
                {Math.round(opacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0.1}
              max={1.0}
              step={0.05}
              value={opacity}
              onChange={(e) => setOpacity(Number(e.target.value))}
              className="w-full h-1.5 bg-zinc-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        )}
      </div>
    </div>
  );
}
