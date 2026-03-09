import { create } from 'zustand';

export type ToolType =
  | 'select' | 'arrow' | 'text' | 'rectangle' | 'ellipse'
  | 'line' | 'freehand' | 'highlight' | 'blur' | 'step-number'
  | 'stamp' | 'crop';

const MAX_UNDO_STACK = 50;

interface EditorState {
  activeTool: ToolType;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  fontSize: number;
  fontFamily: string;
  opacity: number;
  stepCounter: number;
  isBold: boolean;
  isItalic: boolean;
  showPropertyPanel: boolean;

  // Undo/redo
  undoStack: string[];
  redoStack: string[];
  canUndo: boolean;
  canRedo: boolean;

  setActiveTool: (tool: ToolType) => void;
  setStrokeColor: (color: string) => void;
  setFillColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  setFontSize: (size: number) => void;
  setFontFamily: (family: string) => void;
  setOpacity: (opacity: number) => void;
  incrementStep: () => number;
  resetStepCounter: () => void;
  setIsBold: (bold: boolean) => void;
  setIsItalic: (italic: boolean) => void;
  setShowPropertyPanel: (show: boolean) => void;
  togglePropertyPanel: () => void;
  pushUndoState: (state: string) => void;
  undo: () => string | null;
  redo: () => string | null;
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
  isBold: false,
  isItalic: false,
  showPropertyPanel: true,

  undoStack: [],
  redoStack: [],
  canUndo: false,
  canRedo: false,

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
  setIsBold: (bold) => set({ isBold: bold }),
  setIsItalic: (italic) => set({ isItalic: italic }),
  setShowPropertyPanel: (show) => set({ showPropertyPanel: show }),
  togglePropertyPanel: () => set((s) => ({ showPropertyPanel: !s.showPropertyPanel })),

  pushUndoState: (state) => {
    const { undoStack } = get();
    const newStack = [...undoStack, state];
    if (newStack.length > MAX_UNDO_STACK) {
      newStack.shift();
    }
    set({ undoStack: newStack, redoStack: [], canUndo: true, canRedo: false });
  },

  undo: () => {
    const { undoStack, redoStack } = get();
    if (undoStack.length === 0) return null;
    const newUndo = [...undoStack];
    const stateToRestore = newUndo.pop()!;
    set({
      undoStack: newUndo,
      redoStack: [...redoStack, stateToRestore],
      canUndo: newUndo.length > 0,
      canRedo: true,
    });
    return stateToRestore;
  },

  redo: () => {
    const { undoStack, redoStack } = get();
    if (redoStack.length === 0) return null;
    const newRedo = [...redoStack];
    const stateToRestore = newRedo.pop()!;
    set({
      undoStack: [...undoStack, stateToRestore],
      redoStack: newRedo,
      canUndo: true,
      canRedo: newRedo.length > 0,
    });
    return stateToRestore;
  },
}));
