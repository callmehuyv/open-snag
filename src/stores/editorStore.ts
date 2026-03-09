import { create } from 'zustand';

export type ToolType =
  | 'select' | 'arrow' | 'text' | 'rectangle' | 'ellipse'
  | 'line' | 'freehand' | 'highlight' | 'blur' | 'step-number'
  | 'stamp' | 'crop';

interface EditorState {
  activeTool: ToolType;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  fontSize: number;
  fontFamily: string;
  opacity: number;
  stepCounter: number;
  setActiveTool: (tool: ToolType) => void;
  setStrokeColor: (color: string) => void;
  setFillColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  setFontSize: (size: number) => void;
  setFontFamily: (family: string) => void;
  setOpacity: (opacity: number) => void;
  incrementStep: () => number;
  resetStepCounter: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  activeTool: 'select',
  strokeColor: '#ff0000',
  fillColor: 'transparent',
  strokeWidth: 2,
  fontSize: 16,
  fontFamily: 'Arial',
  opacity: 1,
  stepCounter: 0,
  setActiveTool: (tool) => set({ activeTool: tool }),
  setStrokeColor: (color) => set({ strokeColor: color }),
  setFillColor: (color) => set({ fillColor: color }),
  setStrokeWidth: (width) => set({ strokeWidth: width }),
  setFontSize: (size) => set({ fontSize: size }),
  setFontFamily: (family) => set({ fontFamily: family }),
  setOpacity: (opacity) => set({ opacity: opacity }),
  incrementStep: () => {
    const next = get().stepCounter + 1;
    set({ stepCounter: next });
    return next;
  },
  resetStepCounter: () => set({ stepCounter: 0 }),
}));
